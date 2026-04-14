export function buildReviewPrompt(
  tailoredBullets: string[],
  coverLetterText: string,
  jobDescription: string,
): string {
  return `You are a senior hiring manager reviewing an application package. Evaluate its quality.

## Resume Bullets
${tailoredBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

## Cover Letter
${coverLetterText}

## Job Description
${jobDescription}

## Instructions
Evaluate this application package on:
1. Relevance — do the bullets and cover letter address the job requirements?
2. Impact — are achievements quantified and compelling?
3. Authenticity — does it feel genuine or templated?
4. Professionalism — grammar, tone, formatting
5. ATS compatibility — will keywords match?

Return a JSON object with:
- qualityScore: number 0-100
- suggestions: string[] (specific improvements, max 5)
- concerns: string[] (red flags or issues, if any)
- approved: boolean (true if qualityScore >= 70)

Return ONLY valid JSON, no markdown fences.`;
}

export function buildAnswerPrompt(
  profileSummary: string,
  questions: Array<{ label: string; fieldName: string; type: string; required: boolean }>,
  jobDescription: string,
): string {
  const questionList = questions
    .map((q, i) => `${i + 1}. [${q.fieldName}] (${q.type}, ${q.required ? "required" : "optional"}): ${q.label}`)
    .join("\n");

  return `You are helping a job applicant answer application form questions.

## Candidate Summary
${profileSummary}

## Job Description
${jobDescription}

## Form Questions
${questionList}

## Instructions
Answer each question naturally and professionally. For:
- Text inputs: provide concise, relevant answers
- Textareas: provide 2-4 sentences
- Select fields: choose the most appropriate option value
- Skip optional questions you cannot answer meaningfully (return empty string)

Return a JSON object with:
- answers: Array<{ fieldName: string, value: string | number }>

Return ONLY valid JSON, no markdown fences.`;
}
