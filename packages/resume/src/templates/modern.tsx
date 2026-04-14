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
  header: {
    borderBottomWidth: 2,
    borderBottomColor: ATS_RULES.colors.accent,
    paddingBottom: 8,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: ATS_RULES.colors.accent,
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    color: ATS_RULES.colors.secondary,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    gap: 12,
    fontSize: ATS_RULES.fontSize.small,
    color: ATS_RULES.colors.secondary,
  },
  link: {
    color: ATS_RULES.colors.accent,
    textDecoration: "none",
  },
  section: {
    marginTop: 10,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "bold",
    color: ATS_RULES.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  entry: {
    marginBottom: 8,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  entryTitle: {
    fontWeight: "bold",
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
    marginLeft: 10,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  summary: {
    fontSize: ATS_RULES.fontSize.body,
    lineHeight: 1.5,
    color: ATS_RULES.colors.secondary,
  },
  skillsRow: {
    fontSize: ATS_RULES.fontSize.body,
    marginBottom: 2,
  },
  skillCategory: {
    fontWeight: "bold",
  },
});

interface ModernResumeProps {
  profile: UserProfile;
  tailoredBullets?: string[];
  tailoredSummary?: string;
}

export function ModernResume({ profile, tailoredBullets, tailoredSummary }: ModernResumeProps) {
  const summaryText = tailoredSummary ?? profile.basics.summary;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{profile.basics.name}</Text>
          <Text style={styles.label}>{profile.basics.label}</Text>
          <View style={styles.contactRow}>
            <Text>{profile.basics.email}</Text>
            {profile.basics.phone && <Text>{profile.basics.phone}</Text>}
            {profile.basics.location.city && (
              <Text>
                {profile.basics.location.city}, {profile.basics.location.region}
              </Text>
            )}
            {profile.basics.url && (
              <Link src={profile.basics.url} style={styles.link}>
                {profile.basics.url.replace(/^https?:\/\//, "")}
              </Link>
            )}
          </View>
        </View>

        {summaryText && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Summary</Text>
            <Text style={styles.summary}>{summaryText}</Text>
          </View>
        )}

        {profile.work.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Experience</Text>
            {profile.work.map((job, jobIdx) => {
              const bullets = tailoredBullets && jobIdx === 0 ? tailoredBullets : job.highlights;
              return (
                <View key={`${job.name}-${job.startDate}`} style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{job.position}</Text>
                    <Text style={styles.entryDate}>{job.startDate} — {job.endDate || "Present"}</Text>
                  </View>
                  <Text style={styles.entrySubtitle}>{job.name}</Text>
                  {bullets.map((b, i) => (
                    <Text key={i} style={styles.bullet}>{"• " + b}</Text>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {profile.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Education</Text>
            {profile.education.map((edu) => (
              <View key={`${edu.institution}-${edu.startDate}`} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{edu.studyType} {edu.area && `in ${edu.area}`}</Text>
                  <Text style={styles.entryDate}>{edu.startDate} — {edu.endDate || "Present"}</Text>
                </View>
                <Text style={styles.entrySubtitle}>{edu.institution}</Text>
              </View>
            ))}
          </View>
        )}

        {profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Skills</Text>
            {profile.skills.map((group) => (
              <Text key={group.name} style={styles.skillsRow}>
                <Text style={styles.skillCategory}>{group.name}: </Text>
                {group.keywords.join(", ")}
              </Text>
            ))}
          </View>
        )}

        {profile.certificates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Certifications</Text>
            {profile.certificates.map((cert) => (
              <Text key={cert.name} style={{ marginBottom: 2 }}>
                {cert.name} — {cert.issuer} ({cert.date})
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
