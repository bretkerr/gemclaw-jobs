import type { FormField, UserProfile } from "@repo/core";

export interface FieldMapping {
  name: string;
  value: string;
}

/**
 * Maps a UserProfile to Greenhouse form field values.
 * Greenhouse standard field names: first_name, last_name, email, phone, resume, cover_letter, location, linkedin_profile_url
 */
export function mapProfileToFields(
  profile: UserProfile,
  fields: FormField[],
): FieldMapping[] {
  const nameParts = profile.basics.name.split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  const linkedin = profile.basics.profiles?.find(
    (p) => p.network.toLowerCase() === "linkedin",
  );
  const website = profile.basics.url;

  const location = profile.basics.location
    ? [
        profile.basics.location.city,
        profile.basics.location.region,
        profile.basics.location.countryCode,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const lookupMap: Record<string, string> = {
    first_name: firstName,
    last_name: lastName,
    email: profile.basics.email,
    phone: profile.basics.phone,
    location: location,
    linkedin_profile_url: linkedin?.url ?? "",
    website_url: website ?? "",
  };

  const mappings: FieldMapping[] = [];

  for (const field of fields) {
    const value = lookupMap[field.name];
    if (value !== undefined && value !== "") {
      mappings.push({ name: field.name, value });
    }
  }

  return mappings;
}
