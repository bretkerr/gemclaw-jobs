import React from "react";
import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { UserProfile } from "@repo/core";
import { ATS_RULES } from "../ats-rules.js";

const styles = StyleSheet.create({
  page: {
    fontFamily: ATS_RULES.fontFamily,
    fontSize: ATS_RULES.fontSize.body,
    color: ATS_RULES.colors.primary,
    paddingTop: ATS_RULES.margin.top,
    paddingBottom: ATS_RULES.margin.bottom,
    paddingLeft: ATS_RULES.margin.left,
    paddingRight: ATS_RULES.margin.right,
  },
  name: {
    fontSize: ATS_RULES.fontSize.name,
    fontWeight: "bold",
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: ATS_RULES.fontSize.small,
    color: ATS_RULES.colors.secondary,
    marginBottom: 2,
  },
  link: {
    color: ATS_RULES.colors.accent,
    textDecoration: "none",
  },
  sectionHeading: {
    fontSize: ATS_RULES.fontSize.sectionHeading,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: ATS_RULES.colors.divider,
    paddingBottom: 3,
  },
  entry: {
    marginBottom: 8,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  entryTitle: {
    fontWeight: "bold",
    fontSize: ATS_RULES.fontSize.body,
  },
  entryDate: {
    fontSize: ATS_RULES.fontSize.small,
    color: ATS_RULES.colors.secondary,
  },
  entrySubtitle: {
    fontSize: ATS_RULES.fontSize.small,
    color: ATS_RULES.colors.secondary,
    marginBottom: 3,
  },
  bullet: {
    fontSize: ATS_RULES.fontSize.body,
    marginLeft: 12,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  summary: {
    fontSize: ATS_RULES.fontSize.body,
    lineHeight: 1.5,
    color: ATS_RULES.colors.secondary,
    marginBottom: 4,
  },
  skillsRow: {
    fontSize: ATS_RULES.fontSize.body,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  skillCategory: {
    fontWeight: "bold",
  },
  certEntry: {
    fontSize: ATS_RULES.fontSize.body,
    marginBottom: 2,
  },
});

interface StandardResumeProps {
  profile: UserProfile;
  tailoredBullets?: string[];
  tailoredSummary?: string;
}

export function StandardResume({ profile, tailoredBullets, tailoredSummary }: StandardResumeProps) {
  const contactParts = [
    profile.basics.email,
    profile.basics.phone,
    profile.basics.location.city && profile.basics.location.region
      ? `${profile.basics.location.city}, ${profile.basics.location.region}`
      : "",
  ].filter(Boolean);

  const summaryText = tailoredSummary ?? profile.basics.summary;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Name */}
        <Text style={styles.name}>{profile.basics.name}</Text>

        {/* Contact */}
        <Text style={styles.contactInfo}>{contactParts.join(" | ")}</Text>

        {/* Links */}
        {(profile.basics.url || profile.basics.profiles.length > 0) && (
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
            {profile.basics.url && (
              <Link src={profile.basics.url} style={[styles.contactInfo, styles.link]}>
                {profile.basics.url.replace(/^https?:\/\//, "")}
              </Link>
            )}
            {profile.basics.profiles.map((p) => (
              <Link key={p.network} src={p.url} style={[styles.contactInfo, styles.link]}>
                {p.network}
              </Link>
            ))}
          </View>
        )}

        {/* Professional Summary */}
        {summaryText && (
          <>
            <Text style={styles.sectionHeading}>Professional Summary</Text>
            <Text style={styles.summary}>{summaryText}</Text>
          </>
        )}

        {/* Work Experience */}
        {profile.work.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Work Experience</Text>
            {profile.work.map((job, jobIdx) => {
              const bullets =
                tailoredBullets && jobIdx === 0
                  ? tailoredBullets
                  : job.highlights;

              return (
                <View key={`${job.name}-${job.startDate}`} style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{job.position}</Text>
                    <Text style={styles.entryDate}>
                      {job.startDate} — {job.endDate || "Present"}
                    </Text>
                  </View>
                  <Text style={styles.entrySubtitle}>{job.name}</Text>
                  {bullets.map((bullet, i) => (
                    <Text key={i} style={styles.bullet}>
                      {"• " + bullet}
                    </Text>
                  ))}
                </View>
              );
            })}
          </>
        )}

        {/* Education */}
        {profile.education.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Education</Text>
            {profile.education.map((edu) => (
              <View key={`${edu.institution}-${edu.startDate}`} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {edu.studyType} {edu.area && `in ${edu.area}`}
                  </Text>
                  <Text style={styles.entryDate}>
                    {edu.startDate} — {edu.endDate || "Present"}
                  </Text>
                </View>
                <Text style={styles.entrySubtitle}>{edu.institution}</Text>
              </View>
            ))}
          </>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Skills</Text>
            {profile.skills.map((group) => (
              <Text key={group.name} style={styles.skillsRow}>
                <Text style={styles.skillCategory}>{group.name}: </Text>
                {group.keywords.join(", ")}
              </Text>
            ))}
          </>
        )}

        {/* Certifications */}
        {profile.certificates.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Certifications</Text>
            {profile.certificates.map((cert) => (
              <Text key={cert.name} style={styles.certEntry}>
                {cert.name} — {cert.issuer} ({cert.date})
              </Text>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
