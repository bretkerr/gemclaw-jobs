import type { TailoredResume, UserProfile } from "@repo/core";

export function buildCoverLetterPrompt(
  profile: UserProfile,
  jobDescription: string,
  tailoredResume: TailoredResume,
): string {
  return `You are a professional cover letter writer. Write a compelling cover letter for this application.

## Candidate
Name: ${profile.basics.name}
Title: ${profile.basics.label}
Summary: ${tailoredResume.summary}

Key Achievements:
${tailoredResume.bullets.map((b) => `- ${b}`).join("\n")}

## Target Job
${jobDescription}

## Instructions
Write a cover letter that:
1. Opens with a specific, compelling hook — not "I am writing to apply"
2. Connects 2-3 specific achievements to job requirements
3. Shows genuine interest in the company/role
4. Closes with a confident call to action
5. Keeps total length to 250-350 words
6. Professional but not stiff — conversational and direct

Return a JSON object with:
- text: string (the full cover letter text)
- tone: string (one of: "formal", "conversational", "technical")

Return ONLY valid JSON, no markdown fences.`;
}
