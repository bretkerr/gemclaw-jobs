import { describe, it, expect } from "vitest";
import { parseCSV } from "./parse.js";
import {
  transformToProfile,
  type LinkedInData,
  type ProfileRow,
  type PositionRow,
  type EducationRow,
  type SkillRow,
  type CertificationRow,
} from "./transform.js";

// ── Inline CSV fixtures ─────────────────────────────────────────────────────

const PROFILE_CSV = `First Name,Last Name,Headline,Summary,Email Address,Geo Location
Jane,Doe,Senior Engineer,Builds distributed systems,jane@example.com,San Francisco Bay Area`;

const POSITIONS_CSV = `Company Name,Title,Description,Location,Started On,Finished On
Acme Corp,Staff Engineer,Led platform team,San Francisco,Jan 2020,Mar 2023
StartupCo,Software Engineer,Full-stack work,Remote,Jun 2017,Dec 2019`;

const EDUCATION_CSV = `School Name,Degree Name,Notes,Start Date,End Date
MIT,BS,Computer Science,2013,2017`;

const SKILLS_CSV = `Skill
TypeScript
Python
Distributed Systems`;

const CERTIFICATIONS_CSV = `Name,Authority,Started On
AWS Solutions Architect,Amazon,Feb 2021`;

function buildLinkedInData(): LinkedInData {
  return {
    profiles: parseCSV<ProfileRow>(PROFILE_CSV),
    positions: parseCSV<PositionRow>(POSITIONS_CSV),
    educations: parseCSV<EducationRow>(EDUCATION_CSV),
    skills: parseCSV<SkillRow>(SKILLS_CSV),
    certifications: parseCSV<CertificationRow>(CERTIFICATIONS_CSV),
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("transformToProfile", () => {
  it("maps basics from Profile.csv", () => {
    const profile = transformToProfile(buildLinkedInData());

    expect(profile.basics.name).toBe("Jane Doe");
    expect(profile.basics.label).toBe("Senior Engineer");
    expect(profile.basics.email).toBe("jane@example.com");
    expect(profile.basics.summary).toBe("Builds distributed systems");
    expect(profile.basics.location.region).toBe("San Francisco Bay Area");
  });

  it("maps work experience from Positions.csv", () => {
    const profile = transformToProfile(buildLinkedInData());

    expect(profile.work).toHaveLength(2);
    expect(profile.work[0]).toMatchObject({
      name: "Acme Corp",
      position: "Staff Engineer",
      startDate: "2020-01-01",
      endDate: "2023-03-01",
      summary: "Led platform team",
    });
    expect(profile.work[1]).toMatchObject({
      name: "StartupCo",
      position: "Software Engineer",
      startDate: "2017-06-01",
      endDate: "2019-12-01",
    });
  });

  it("maps education from Education.csv", () => {
    const profile = transformToProfile(buildLinkedInData());

    expect(profile.education).toHaveLength(1);
    expect(profile.education[0]).toMatchObject({
      institution: "MIT",
      studyType: "BS",
      area: "Computer Science",
      startDate: "2013-01-01",
      endDate: "2017-01-01",
    });
  });

  it("maps skills from Skills.csv", () => {
    const profile = transformToProfile(buildLinkedInData());

    expect(profile.skills).toHaveLength(3);
    expect(profile.skills.map((s) => s.name)).toEqual([
      "TypeScript",
      "Python",
      "Distributed Systems",
    ]);
  });

  it("maps certificates from Certifications.csv", () => {
    const profile = transformToProfile(buildLinkedInData());

    expect(profile.certificates).toHaveLength(1);
    expect(profile.certificates[0]).toMatchObject({
      name: "AWS Solutions Architect",
      issuer: "Amazon",
      date: "2021-02-01",
    });
  });

  it("handles empty data gracefully", () => {
    const empty: LinkedInData = {
      profiles: [],
      positions: [],
      educations: [],
      skills: [],
      certifications: [],
    };

    const profile = transformToProfile(empty);

    expect(profile.basics.name).toBe("");
    expect(profile.work).toEqual([]);
    expect(profile.education).toEqual([]);
    expect(profile.skills).toEqual([]);
    expect(profile.certificates).toEqual([]);
  });

  it("normalises ISO date strings correctly", () => {
    const data = buildLinkedInData();
    data.positions = [
      {
        "Company Name": "Test",
        Title: "Dev",
        "Started On": "2022-06-15",
        "Finished On": "",
        Description: "",
      },
    ];

    const profile = transformToProfile(data);
    expect(profile.work[0]!.startDate).toBe("2022-06-15");
    expect(profile.work[0]!.endDate).toBe("");
  });
});
