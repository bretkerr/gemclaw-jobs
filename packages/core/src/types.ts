// ── JSON Resume v1.0.0 compatible profile ────────────────────────────────────

export interface UserProfile {
  basics: {
    name: string;
    label: string;
    email: string;
    phone: string;
    url: string;
    summary: string;
    location: {
      city: string;
      region: string;
      countryCode: string;
    };
    profiles: Array<{
      network: string;
      username: string;
      url: string;
    }>;
  };
  work: Array<{
    name: string;
    position: string;
    url: string;
    startDate: string;
    endDate: string;
    summary: string;
    highlights: string[];
  }>;
  education: Array<{
    institution: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate: string;
  }>;
  skills: Array<{
    name: string;
    keywords: string[];
  }>;
  certificates: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

// ── Greenhouse types ─────────────────────────────────────────────────────────

export interface JobListing {
  id: number;
  title: string;
  updatedAt: string;
  location: string;
  departments: string[];
  absoluteUrl: string;
  content: string;
  boardToken: string;
}

export type FormFieldType =
  | "input_text"
  | "input_file"
  | "textarea"
  | "multi_value_single_select"
  | "multi_value_multi_select";

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  values: Array<{ label: string; value: number }>;
}

export interface FormQuestion {
  label: string;
  fields: FormField[];
  required: boolean;
}

// ── Pipeline types ───────────────────────────────────────────────────────────

export interface FitAnalysis {
  score: number;
  reasoning: string;
  matchedSkills: string[];
  missingSkills: string[];
  keywordMatches: string[];
}

export interface TailoredResume {
  bullets: string[];
  summary: string;
  skillsEmphasis: string[];
}

export interface CoverLetter {
  text: string;
  tone: string;
}

export interface ReviewResult {
  qualityScore: number;
  suggestions: string[];
  concerns: string[];
  approved: boolean;
}

export interface FormAnswer {
  fieldName: string;
  value: string | number;
}

export interface PipelineResult {
  jobId: number;
  boardToken: string;
  fitAnalysis: FitAnalysis;
  tailoredResume: TailoredResume;
  coverLetter: CoverLetter;
  review: ReviewResult;
  formAnswers: FormAnswer[];
  resumePdf: Uint8Array;
  costUsd: number;
  durationMs: number;
}

export type ApplicationStatus =
  | "discovered"
  | "matched"
  | "tailoring"
  | "reviewing"
  | "ready"
  | "submitted"
  | "rejected"
  | "interview"
  | "error";

export interface ApplicationRecord {
  id: string;
  jobId: number;
  boardToken: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  fitScore: number;
  costUsd: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

// ── Pipeline errors ──────────────────────────────────────────────────────────

export type PipelineStage =
  | "discover"
  | "match"
  | "tailor"
  | "compose"
  | "review"
  | "map"
  | "answer"
  | "render"
  | "submit";

export interface PipelineError {
  stage: PipelineStage;
  message: string;
  cause?: Error;
  retryable: boolean;
}
