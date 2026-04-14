// ATS compatibility constraints for resume PDF generation
export const ATS_RULES = {
  // Font must be standard, parseable by ATS
  fontFamily: "Helvetica",
  fontSize: {
    name: 18,
    sectionHeading: 12,
    body: 10,
    small: 9,
  },
  // Single column only — multi-column confuses ATS parsers
  layout: "single-column" as const,
  // Standard section headings that ATS recognizes
  sectionHeadings: [
    "Professional Summary",
    "Work Experience",
    "Education",
    "Skills",
    "Certifications",
  ] as const,
  // Margins in points
  margin: {
    top: 36,
    bottom: 36,
    left: 54,
    right: 54,
  },
  // No graphics, images, or text in headers/footers
  noGraphics: true,
  noHeaderFooterText: true,
  // Max pages
  maxPages: 2,
  // Colors — keep it simple for ATS
  colors: {
    primary: "#111111",
    secondary: "#444444",
    accent: "#1A3A5C", // Circuit Blue
    divider: "#CCCCCC",
  },
} as const;
