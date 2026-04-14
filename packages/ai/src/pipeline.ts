import { generateText } from "ai";
import Bottleneck from "bottleneck";
import type {
  UserProfile,
  FitAnalysis,
  TailoredResume,
  CoverLetter,
  ReviewResult,
  FormAnswer,
  FormField,
  Result,
  PipelineError,
} from "@repo/core";
import { ok, err } from "@repo/core";
import { registry, models } from "./registry.js";
import { buildMatchPrompt } from "./prompts/match.js";
import { buildTailorPrompt } from "./prompts/tailor.js";
import { buildCoverLetterPrompt } from "./prompts/cover-letter.js";
import { buildReviewPrompt, buildAnswerPrompt } from "./prompts/review.js";

// Rate limiters
const geminiLimiter = new Bottleneck({ minTime: 1000, maxConcurrent: 1 });
const claudeLimiter = new Bottleneck({ minTime: 1200, maxConcurrent: 1 });

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as T;
}

type ModelId = `ollama:${string}` | `google:${string}` | `anthropic:${string}`;

async function generate(modelId: string, prompt: string, limiter?: Bottleneck): Promise<string> {
  const fn = async () => {
    const { text } = await generateText({
      model: registry.languageModel(modelId as ModelId),
      prompt,
      temperature: 0.3,
      maxTokens: 4096,
    });
    return text;
  };

  if (limiter) {
    return limiter.schedule(fn);
  }
  return fn();
}

export async function matchJob(
  profile: UserProfile,
  jobDescription: string,
): Promise<Result<FitAnalysis, PipelineError>> {
  try {
    const prompt = buildMatchPrompt(profile, jobDescription);
    let text: string;
    try {
      text = await generate(models.parse, prompt);
    } catch {
      // Ollama fallback to Gemini
      text = await generate(models.tailor, prompt, geminiLimiter);
    }
    const analysis = parseJSON<FitAnalysis>(text);
    return ok(analysis);
  } catch (e) {
    return err({
      stage: "match",
      message: `Job matching failed: ${e instanceof Error ? e.message : String(e)}`,
      cause: e instanceof Error ? e : undefined,
      retryable: true,
    });
  }
}

export async function tailorResume(
  profile: UserProfile,
  jobDescription: string,
  fitAnalysis: FitAnalysis,
): Promise<Result<TailoredResume, PipelineError>> {
  try {
    const prompt = buildTailorPrompt(profile, jobDescription, fitAnalysis);
    const text = await generate(models.tailor, prompt, geminiLimiter);
    const result = parseJSON<TailoredResume>(text);
    return ok(result);
  } catch (e) {
    return err({
      stage: "tailor",
      message: `Resume tailoring failed: ${e instanceof Error ? e.message : String(e)}`,
      cause: e instanceof Error ? e : undefined,
      retryable: true,
    });
  }
}

export async function generateCoverLetter(
  profile: UserProfile,
  jobDescription: string,
  tailoredResume: TailoredResume,
): Promise<Result<CoverLetter, PipelineError>> {
  try {
    const prompt = buildCoverLetterPrompt(profile, jobDescription, tailoredResume);
    const text = await generate(models.compose, prompt, geminiLimiter);
    const result = parseJSON<CoverLetter>(text);
    return ok(result);
  } catch (e) {
    return err({
      stage: "compose",
      message: `Cover letter generation failed: ${e instanceof Error ? e.message : String(e)}`,
      cause: e instanceof Error ? e : undefined,
      retryable: true,
    });
  }
}

export async function reviewApplication(
  tailoredResume: TailoredResume,
  coverLetter: CoverLetter,
  jobDescription: string,
): Promise<Result<ReviewResult, PipelineError>> {
  try {
    const prompt = buildReviewPrompt(tailoredResume.bullets, coverLetter.text, jobDescription);
    const text = await generate(models.review, prompt, claudeLimiter);
    const result = parseJSON<ReviewResult>(text);
    return ok(result);
  } catch (e) {
    return err({
      stage: "review",
      message: `Application review failed: ${e instanceof Error ? e.message : String(e)}`,
      cause: e instanceof Error ? e : undefined,
      retryable: true,
    });
  }
}

export async function answerFormQuestions(
  profile: UserProfile,
  questions: FormField[],
  jobDescription: string,
): Promise<Result<FormAnswer[], PipelineError>> {
  if (questions.length === 0) {
    return ok([]);
  }
  try {
    const questionData = questions.map((q) => ({
      label: q.label,
      fieldName: q.name,
      type: q.type,
      required: q.required,
    }));
    const prompt = buildAnswerPrompt(profile.basics.summary, questionData, jobDescription);
    const text = await generate(models.answer, prompt, claudeLimiter);
    const result = parseJSON<{ answers: FormAnswer[] }>(text);
    return ok(result.answers);
  } catch (e) {
    return err({
      stage: "answer",
      message: `Form answer generation failed: ${e instanceof Error ? e.message : String(e)}`,
      cause: e instanceof Error ? e : undefined,
      retryable: true,
    });
  }
}
