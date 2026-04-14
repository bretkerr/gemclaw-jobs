import type { FitAnalysis, UserProfile } from "@repo/core";

export function buildTailorPrompt(
  profile: UserProfile,
  jobDescription: string,
  fitAnalysis: FitAnalysis,
): string {
  const currentBullets = profile.work
    .flatMap((w) => w.highlights)
    .map((h, i) => `${i + 1}. ${h}`)
    .join("\n");

  return `You are an expert resume writer. Tailor this candidate's experience bullets to better match the target job.

## Target Job
${jobDescription}

## Fit Analysis
Score: ${fitAnalysis.score}/100
Matched Skills: ${fitAnalysis.matchedSkills.join(", ")}
Missing Skills: ${fitAnalysis.missingSkills.join(", ")}
Key Keywords: ${fitAnalysis.keywordMatches.join(", ")}

## Current Resume Bullets
${currentBullets}

## Candidate Summary
${profile.basics.summary}

## Instructions
Rewrite the resume bullets to:
1. Emphasize the matched skills and keywords
2. Quantify achievements where possible
3. Use action verbs that align with the job requirements
4. Keep each bullet under 120 characters
5. Maintain truthfulness — only rephrase, don't fabricate

Return a JSON object with:
- bullets: string[] (tailored bullet points, 6-10 total)
- summary: string (tailored 2-3 sentence professional summary)
- skillsEmphasis: string[] (skills to highlight on the resume)

Return ONLY valid JSON, no markdown fences.`;
}
