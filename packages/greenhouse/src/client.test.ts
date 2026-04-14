import { describe, it, expect, vi } from "vitest";
import { GreenhouseClient } from "./client.js";
import type { GhJobsResponse, GhJob, GhJobWithQuestions } from "./types.js";

const BOARD = "test_board";

const jobFixture: GhJob = {
  id: 123,
  title: "Software Engineer",
  updated_at: "2024-01-15T10:00:00Z",
  absolute_url: "https://boards.greenhouse.io/test/jobs/123",
  location: { name: "San Francisco, CA" },
  departments: [{ id: 1, name: "Engineering" }],
  offices: [{ id: 1, name: "SF Office", location: "San Francisco" }],
  content: "<p>Job description here</p>",
};

const jobsResponseFixture: GhJobsResponse = {
  jobs: [jobFixture],
};

const jobWithQuestionsFixture: GhJobWithQuestions = {
  ...jobFixture,
  questions: [
    {
      label: "First Name",
      required: true,
      fields: [{ name: "first_name", type: "input_text", values: [] }],
    },
    {
      label: "Resume",
      required: true,
      fields: [{ name: "resume", type: "input_file", values: [] }],
    },
    {
      label: "How did you hear about us?",
      required: false,
      fields: [
        {
          name: "source",
          type: "multi_value_single_select",
          values: [
            { label: "LinkedIn", value: 1 },
            { label: "Referral", value: 2 },
          ],
        },
      ],
    },
  ],
};

function mockFetch(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Not Found",
    json: () => Promise.resolve(data),
  });
}

describe("GreenhouseClient", () => {
  describe("listJobs", () => {
    it("fetches and maps jobs", async () => {
      const fetch = mockFetch(jobsResponseFixture);
      const client = new GreenhouseClient({ fetch });

      const result = await client.listJobs(BOARD);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toEqual({
        id: 123,
        title: "Software Engineer",
        updatedAt: "2024-01-15T10:00:00Z",
        location: "San Francisco, CA",
        departments: ["Engineering"],
        absoluteUrl: "https://boards.greenhouse.io/test/jobs/123",
        content: "<p>Job description here</p>",
        boardToken: BOARD,
      });
      expect(fetch).toHaveBeenCalledWith(
        `https://boards-api.greenhouse.io/v1/boards/${BOARD}/jobs?content=true`,
      );
    });

    it("returns err on HTTP error", async () => {
      const fetch = mockFetch(null, 404);
      const client = new GreenhouseClient({ fetch });

      const result = await client.listJobs(BOARD);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toContain("404");
    });

    it("returns err on network failure", async () => {
      const fetch = vi.fn().mockRejectedValue(new Error("Network error"));
      const client = new GreenhouseClient({ fetch });

      const result = await client.listJobs(BOARD);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toBe("Network error");
    });
  });

  describe("getJob", () => {
    it("fetches and maps a single job", async () => {
      const fetch = mockFetch(jobFixture);
      const client = new GreenhouseClient({ fetch });

      const result = await client.getJob(BOARD, 123);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.id).toBe(123);
      expect(result.value.title).toBe("Software Engineer");
      expect(fetch).toHaveBeenCalledWith(
        `https://boards-api.greenhouse.io/v1/boards/${BOARD}/jobs/123`,
      );
    });
  });

  describe("getJobWithQuestions", () => {
    it("fetches job and parses questions", async () => {
      const fetch = mockFetch(jobWithQuestionsFixture);
      const client = new GreenhouseClient({ fetch });

      const result = await client.getJobWithQuestions(BOARD, 123);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.job.id).toBe(123);
      expect(result.value.questions).toHaveLength(3);
      expect(result.value.questions[0]!.label).toBe("First Name");
      expect(result.value.questions[0]!.fields[0]!.type).toBe("input_text");
      expect(result.value.questions[2]!.fields[0]!.values).toHaveLength(2);
    });
  });

  describe("submitApplication", () => {
    it("requires an API key", async () => {
      const fetch = mockFetch({});
      const client = new GreenhouseClient({ fetch });

      const result = await client.submitApplication({
        boardToken: BOARD,
        jobId: 123,
        fields: { first_name: "Jane" },
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toContain("API key required");
    });

    it("submits with fields and auth header", async () => {
      const submitResponse = { id: 456, status: "received" };
      const fetch = mockFetch(submitResponse);
      const client = new GreenhouseClient({ apiKey: "test-key", fetch });

      const result = await client.submitApplication({
        boardToken: BOARD,
        jobId: 123,
        fields: { first_name: "Jane", last_name: "Doe" },
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toEqual(submitResponse);
      expect(fetch).toHaveBeenCalledWith(
        `https://boards-api.greenhouse.io/v1/boards/${BOARD}/jobs/123`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Basic ${btoa("test-key:")}`,
          }),
        }),
      );
    });
  });
});
