import { describe, it, expect } from "vitest";
import { mapProfileToFields } from "./mapper.js";
import type { UserProfile, FormField } from "@repo/core";

const profile: UserProfile = {
  basics: {
    name: "Jane Doe",
    label: "Software Engineer",
    email: "jane@example.com",
    phone: "+1-555-0100",
    url: "https://janedoe.dev",
    summary: "Experienced engineer",
    location: {
      city: "San Francisco",
      region: "CA",
      countryCode: "US",
    },
    profiles: [
      {
        network: "LinkedIn",
        username: "janedoe",
        url: "https://linkedin.com/in/janedoe",
      },
      {
        network: "GitHub",
        username: "janedoe",
        url: "https://github.com/janedoe",
      },
    ],
  },
  work: [
    {
      name: "Acme Corp",
      position: "Senior Engineer",
      url: "https://acme.com",
      startDate: "2020-01-01",
      endDate: "2024-01-01",
      summary: "Built things",
      highlights: ["Led team"],
    },
  ],
  education: [
    {
      institution: "MIT",
      area: "Computer Science",
      studyType: "BS",
      startDate: "2016-09-01",
      endDate: "2020-05-15",
    },
  ],
  skills: [{ name: "TypeScript", keywords: ["TS", "JavaScript"] }],
  certificates: [{ name: "AWS SAA", issuer: "Amazon", date: "2023-06-01" }],
};

function field(name: string, type = "input_text"): FormField {
  return {
    name,
    label: name,
    type: type as FormField["type"],
    required: true,
    values: [],
  };
}

describe("mapProfileToFields", () => {
  it("maps first_name and last_name", () => {
    const fields = [field("first_name"), field("last_name")];
    const result = mapProfileToFields(profile, fields);

    expect(result).toEqual([
      { name: "first_name", value: "Jane" },
      { name: "last_name", value: "Doe" },
    ]);
  });

  it("maps email and phone", () => {
    const fields = [field("email"), field("phone")];
    const result = mapProfileToFields(profile, fields);

    expect(result).toEqual([
      { name: "email", value: "jane@example.com" },
      { name: "phone", value: "+1-555-0100" },
    ]);
  });

  it("maps location", () => {
    const fields = [field("location")];
    const result = mapProfileToFields(profile, fields);

    expect(result).toEqual([{ name: "location", value: "San Francisco, CA, US" }]);
  });

  it("maps linkedin_profile_url", () => {
    const fields = [field("linkedin_profile_url")];
    const result = mapProfileToFields(profile, fields);

    expect(result).toEqual([
      { name: "linkedin_profile_url", value: "https://linkedin.com/in/janedoe" },
    ]);
  });

  it("maps website_url", () => {
    const fields = [field("website_url")];
    const result = mapProfileToFields(profile, fields);

    expect(result).toEqual([{ name: "website_url", value: "https://janedoe.dev" }]);
  });

  it("skips fields without matching profile data", () => {
    const fields = [field("resume", "input_file"), field("cover_letter", "input_file")];
    const result = mapProfileToFields(profile, fields);

    expect(result).toEqual([]);
  });

  it("only maps fields that are in the provided list", () => {
    const fields = [field("first_name")];
    const result = mapProfileToFields(profile, fields);

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("first_name");
  });

  it("handles single-word names", () => {
    const singleNameProfile = {
      ...profile,
      basics: { ...profile.basics, name: "Cher" },
    };
    const fields = [field("first_name"), field("last_name")];
    const result = mapProfileToFields(singleNameProfile, fields);

    expect(result).toEqual([{ name: "first_name", value: "Cher" }]);
  });

  it("handles multi-part last names", () => {
    const multiNameProfile = {
      ...profile,
      basics: { ...profile.basics, name: "Jean Claude Van Damme" },
    };
    const fields = [field("first_name"), field("last_name")];
    const result = mapProfileToFields(multiNameProfile, fields);

    expect(result).toEqual([
      { name: "first_name", value: "Jean" },
      { name: "last_name", value: "Claude Van Damme" },
    ]);
  });
});
