import { describe, it, expect } from "vitest";
import type { UserProfile } from "@repo/core";
import { renderResume } from "./render.js";

const testProfile: UserProfile = {
  basics: {
    name: "Jane Smith",
    label: "Software Engineer",
    email: "jane@example.com",
    phone: "555-0199",
    url: "https://janesmith.dev",
    summary: "Full-stack engineer with 6 years of experience building scalable web applications.",
    location: { city: "Boston", region: "MA", countryCode: "US" },
    profiles: [{ network: "GitHub", username: "janesmith", url: "https://github.com/janesmith" }],
  },
  work: [
    {
      name: "Acme Corp",
      position: "Senior Engineer",
      url: "https://acme.com",
      startDate: "2021-03",
      endDate: "2024-12",
      summary: "Led platform team",
      highlights: [
        "Reduced API response time by 45% through caching optimization",
        "Designed microservices architecture serving 2M daily users",
      ],
    },
  ],
  education: [
    {
      institution: "Stanford University",
      area: "Computer Science",
      studyType: "BS",
      startDate: "2014",
      endDate: "2018",
    },
  ],
  skills: [
    { name: "Languages", keywords: ["TypeScript", "Python", "Go"] },
    { name: "Frontend", keywords: ["React", "Next.js", "Tailwind"] },
  ],
  certificates: [
    { name: "AWS Solutions Architect", issuer: "Amazon", date: "2023" },
  ],
};

describe("renderResume", () => {
  it("renders standard template to non-empty PDF", async () => {
    const pdf = await renderResume({ profile: testProfile });
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(1000);
    // PDF files start with %PDF
    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");
  }, 30000);

  it("renders modern template to non-empty PDF", async () => {
    const pdf = await renderResume({ profile: testProfile, template: "modern" });
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(1000);
    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");
  }, 30000);

  it("renders with tailored bullets", async () => {
    const pdf = await renderResume({
      profile: testProfile,
      tailoredBullets: ["Custom bullet about specific achievement"],
      tailoredSummary: "Custom summary for targeted role",
    });
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(1000);
  }, 30000);
});
