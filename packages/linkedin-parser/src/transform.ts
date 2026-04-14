import type { UserProfile } from "@repo/core";

// ── LinkedIn CSV row shapes ─────────────────────────────────────────────────

export interface ProfileRow {
  "First Name"?: string;
  "Last Name"?: string;
  Headline?: string;
  Summary?: string;
  "Email Address"?: string;
  "Geo Location"?: string;
  "Zip Code"?: string;
  [key: string]: string | undefined;
}

export interface PositionRow {
  "Company Name"?: string;
  Title?: string;
  Description?: string;
  Location?: string;
  "Started On"?: string;
  "Finished On"?: string;
  [key: string]: string | undefined;
}

export interface EducationRow {
  "School Name"?: string;
  "Degree Name"?: string;
  Notes?: string;
  Activities?: string;
  "Start Date"?: string;
  "End Date"?: string;
  [key: string]: string | undefined;
}

export interface SkillRow {
  Skill?: string;
  [key: string]: string | undefined;
}

export interface CertificationRow {
  Name?: string;
  Authority?: string;
  "Started On"?: string;
  "Finished On"?: string;
  License?: string;
  [key: string]: string | undefined;
}

/** Bag of parsed LinkedIn CSV data. */
export interface LinkedInData {
  profiles: ProfileRow[];
  positions: PositionRow[];
  educations: EducationRow[];
  skills: SkillRow[];
  certifications: CertificationRow[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Normalise a LinkedIn date string (e.g. "Jan 2020" or "2020") to YYYY-MM-DD (best effort). */
function normaliseDate(raw: string | undefined): string {
  if (!raw || raw.trim() === "") return "";

  const trimmed = raw.trim();

  // Already ISO-ish (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // "Mon YYYY" — e.g. "Jan 2020"
  const monthYear = trimmed.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i,
  );
  if (monthYear) {
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04",
      may: "05", jun: "06", jul: "07", aug: "08",
      sep: "09", oct: "10", nov: "11", dec: "12",
    };
    const mm = months[monthYear[1]!.toLowerCase().slice(0, 3)]!;
    return `${monthYear[2]}-${mm}-01`;
  }

  // Bare year — "2020"
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;

  return trimmed;
}

function str(val: string | undefined): string {
  return val?.trim() ?? "";
}

// ── Transform ───────────────────────────────────────────────────────────────

export function transformToProfile(data: LinkedInData): UserProfile {
  const p = data.profiles[0];

  const name = [str(p?.["First Name"]), str(p?.["Last Name"])]
    .filter(Boolean)
    .join(" ");

  return {
    basics: {
      name,
      label: str(p?.Headline),
      email: str(p?.["Email Address"]),
      phone: "",
      url: "",
      summary: str(p?.Summary),
      location: {
        city: "",
        region: str(p?.["Geo Location"]),
        countryCode: "",
      },
      profiles: [],
    },

    work: data.positions.map((pos) => ({
      name: str(pos["Company Name"]),
      position: str(pos.Title),
      url: "",
      startDate: normaliseDate(pos["Started On"]),
      endDate: normaliseDate(pos["Finished On"]),
      summary: str(pos.Description),
      highlights: [],
    })),

    education: data.educations.map((edu) => ({
      institution: str(edu["School Name"]),
      area: str(edu.Notes),
      studyType: str(edu["Degree Name"]),
      startDate: normaliseDate(edu["Start Date"]),
      endDate: normaliseDate(edu["End Date"]),
    })),

    skills: data.skills.map((s) => ({
      name: str(s.Skill),
      keywords: [],
    })),

    certificates: data.certifications.map((c) => ({
      name: str(c.Name),
      issuer: str(c.Authority),
      date: normaliseDate(c["Started On"]),
    })),
  };
}
