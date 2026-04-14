// ── Raw Greenhouse API response types ────────────────────────────────────────

export interface GhDepartment {
  id: number;
  name: string;
}

export interface GhOffice {
  id: number;
  name: string;
  location: string;
}

export interface GhLocation {
  name: string;
}

export interface GhJob {
  id: number;
  title: string;
  updated_at: string;
  absolute_url: string;
  location: GhLocation;
  departments: GhDepartment[];
  offices: GhOffice[];
  content: string;
}

export interface GhJobsResponse {
  jobs: GhJob[];
}

export interface GhFieldValue {
  label: string;
  value: number;
}

export interface GhField {
  name: string;
  type: string;
  values: GhFieldValue[];
}

export interface GhQuestion {
  label: string;
  required: boolean;
  fields: GhField[];
}

export interface GhJobWithQuestions extends GhJob {
  questions: GhQuestion[];
}

export interface GhSubmitResponse {
  id: number;
  status: string;
}
