import type { UserProfile } from "@repo/core";

export function buildMatchPrompt(profile: UserProfile, jobDescription: string): string {
  const skills = profile.skills.flatMap((s) => [s.name, ...s.keywords]).join(", ");
  const experience = profile.work
    .map((w) => `${w.position} at ${w.name}: ${w.highlights.join("; ")}`)
    .join("\n");

  return `You are a job fit analyzer. Score how well this candidate matches the job.

## Candidate Profile
Name: ${profile.basics.name}
Title: ${profile.basics.label}
Skills: ${skills}

Experience:
${experience}

## Job Description
${jobDescription}

## Instructions
Analyze the fit between this candidate and the job. Return a JSON object with:
- score: number 0-100 (how well the candidate matches)
- reasoning: string (2-3 sentence explanation)
- matchedSkills: string[] (skills the candidate has that match)
- missingSkills: string[] (required skills the candidate lacks)
- keywordMatches: string[] (important keywords found in both)

Return ONLY valid JSON, no markdown fences.`;
}
