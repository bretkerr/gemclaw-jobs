import { ok, err, type Result } from "@repo/core";
import type { JobListing, FormQuestion } from "@repo/core";
import type { GhJob, GhJobsResponse, GhJobWithQuestions, GhSubmitResponse } from "./types.js";
import { parseQuestions } from "./parser.js";

const BASE_URL = "https://boards-api.greenhouse.io";

export interface GreenhouseClientOptions {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
}

export interface SubmitApplicationParams {
  boardToken: string;
  jobId: number;
  fields: Record<string, string>;
  resumeFile?: { name: string; data: Blob };
  coverLetterFile?: { name: string; data: Blob };
}

function mapJob(job: GhJob, boardToken: string): JobListing {
  return {
    id: job.id,
    title: job.title,
    updatedAt: job.updated_at,
    location: job.location.name,
    departments: job.departments.map((d) => d.name),
    absoluteUrl: job.absolute_url,
    content: job.content ?? "",
    boardToken,
  };
}

export class GreenhouseClient {
  private readonly apiKey: string | undefined;
  private readonly fetch: typeof globalThis.fetch;

  constructor(options: GreenhouseClientOptions = {}) {
    this.apiKey = options.apiKey;
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  async listJobs(boardToken: string): Promise<Result<JobListing[], Error>> {
    try {
      const url = `${BASE_URL}/v1/boards/${boardToken}/jobs?content=true`;
      const res = await this.fetch(url);
      if (!res.ok) {
        return err(new Error(`Greenhouse API error: ${res.status} ${res.statusText}`));
      }
      const data = (await res.json()) as GhJobsResponse;
      return ok(data.jobs.map((j) => mapJob(j, boardToken)));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getJob(boardToken: string, jobId: number): Promise<Result<JobListing, Error>> {
    try {
      const url = `${BASE_URL}/v1/boards/${boardToken}/jobs/${jobId}`;
      const res = await this.fetch(url);
      if (!res.ok) {
        return err(new Error(`Greenhouse API error: ${res.status} ${res.statusText}`));
      }
      const data = (await res.json()) as GhJob;
      return ok(mapJob(data, boardToken));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getJobWithQuestions(
    boardToken: string,
    jobId: number,
  ): Promise<Result<{ job: JobListing; questions: FormQuestion[] }, Error>> {
    try {
      const url = `${BASE_URL}/v1/boards/${boardToken}/jobs/${jobId}?questions=true`;
      const res = await this.fetch(url);
      if (!res.ok) {
        return err(new Error(`Greenhouse API error: ${res.status} ${res.statusText}`));
      }
      const data = (await res.json()) as GhJobWithQuestions;
      return ok({
        job: mapJob(data, boardToken),
        questions: parseQuestions(data.questions ?? []),
      });
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async submitApplication(
    params: SubmitApplicationParams,
  ): Promise<Result<GhSubmitResponse, Error>> {
    try {
      if (!this.apiKey) {
        return err(new Error("API key required for application submission"));
      }

      const url = `${BASE_URL}/v1/boards/${params.boardToken}/jobs/${params.jobId}`;
      const form = new FormData();

      for (const [key, value] of Object.entries(params.fields)) {
        form.append(key, value);
      }

      if (params.resumeFile) {
        form.append("resume", params.resumeFile.data, params.resumeFile.name);
      }

      if (params.coverLetterFile) {
        form.append("cover_letter", params.coverLetterFile.data, params.coverLetterFile.name);
      }

      const credentials = btoa(`${this.apiKey}:`);
      const res = await this.fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        body: form,
      });

      if (!res.ok) {
        return err(new Error(`Greenhouse API error: ${res.status} ${res.statusText}`));
      }

      const data = (await res.json()) as GhSubmitResponse;
      return ok(data);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
