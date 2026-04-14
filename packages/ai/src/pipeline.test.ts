import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserProfile, FitAnalysis, TailoredResume } from "@repo/core";

// Mock the AI SDK before importing pipeline
vi.mock("ai", () => ({
  generateText: vi.fn(),
  experimental_createProviderRegistry: vi.fn(() => ({
    languageModel: vi.fn(() => ({})),
  })),
}));

vi.mock("@ai-sdk/anthropic", () => ({ anthropic: {} }));
vi.mock("@ai-sdk/google", () => ({ google: {} }));
vi.mock("ollama-ai-provider", () => ({ createOllama: vi.fn(() => ({})) }));

const mockProfile: UserProfile = {
  basics: {
    name: "Test User",
    label: "Software Engineer",
    email: "test@example.com",
    phone: "555-0100",
    url: "https://example.com",
    summary: "Experienced software engineer with 5 years of TypeScript and React.",
    location: { city: "Boston", region: "MA", countryCode: "US" },
    profiles: [{ network: "GitHub", username: "testuser", url: "https://github.com/testuser" }],
  },
  work: [
    {
      name: "TechCo",
      position: "Senior Engineer",
      url: "https://techco.com",
      startDate: "2020-01",
      endDate: "2024-01",
      summary: "Led frontend team",
      highlights: ["Built React dashboard reducing load time by 40%", "Mentored 3 junior developers"],
    },
  ],
  education: [
    {
      institution: "MIT",
      area: "Computer Science",
      studyType: "BS",
      startDate: "2014",
      endDate: "2018",
    },
  ],
  skills: [{ name: "Frontend", keywords: ["React", "TypeScript", "Next.js"] }],
  certificates: [],
};

describe("pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("matchJob returns ok result on valid response", async () => {
    const { generateText } = await import("ai");
    const mockResult: FitAnalysis = {
      score: 85,
      reasoning: "Strong match for frontend role",
      matchedSkills: ["React", "TypeScript"],
      missingSkills: ["GraphQL"],
      keywordMatches: ["React", "frontend"],
    };
    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify(mockResult),
      toolCalls: [],
      toolResults: [],
      finishReason: "stop",
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      rawResponse: undefined,
      warnings: [],
      response: { id: "test", timestamp: new Date(), modelId: "test", headers: {} },
      experimental_providerMetadata: undefined,
      logprobs: undefined,
      responseMessages: [],
      roundtrips: [],
      steps: [],
      request: { body: "" },
      providerMetadata: undefined,
      sources: [],
      files: [],
      reasoning: undefined,
      reasoningDetails: [],
    } as never);

    const { matchJob } = await import("./pipeline.js");
    const result = await matchJob(mockProfile, "We need a React developer");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.score).toBe(85);
      expect(result.value.matchedSkills).toContain("React");
    }
  });

  it("matchJob returns err on failure", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockRejectedValueOnce(new Error("API timeout"));
    // Also fail the fallback
    vi.mocked(generateText).mockRejectedValueOnce(new Error("API timeout"));

    const { matchJob } = await import("./pipeline.js");
    const result = await matchJob(mockProfile, "job description");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.stage).toBe("match");
      expect(result.error.retryable).toBe(true);
    }
  });
});
