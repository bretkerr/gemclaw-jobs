import type { UserProfile } from "@repo/core";
import { extractZip } from "./extract.js";
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

export { extractZip } from "./extract.js";
export { parseCSV } from "./parse.js";
export { transformToProfile } from "./transform.js";
export type {
  LinkedInData,
  ProfileRow,
  PositionRow,
  EducationRow,
  SkillRow,
  CertificationRow,
} from "./transform.js";

/**
 * End-to-end parser: extracts a LinkedIn data export ZIP, parses
 * each CSV, and returns a JSON-Resume-compatible UserProfile.
 */
export async function parseLinkedInExport(
  zipPath: string,
): Promise<UserProfile> {
  const files = extractZip(zipPath);

  const csv = (name: string): string => files.get(name) ?? "";

  const data: LinkedInData = {
    profiles: parseCSV<ProfileRow>(csv("Profile.csv")),
    positions: parseCSV<PositionRow>(csv("Positions.csv")),
    educations: parseCSV<EducationRow>(csv("Education.csv")),
    skills: parseCSV<SkillRow>(csv("Skills.csv")),
    certifications: parseCSV<CertificationRow>(csv("Certifications.csv")),
  };

  return transformToProfile(data);
}
