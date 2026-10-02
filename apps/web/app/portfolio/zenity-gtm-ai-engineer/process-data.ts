/*
 * Fixtures for the process-to-spec module. The interview lines are illustrative, written
 * before any real conversation. Week one replaces them.
 */

export type Heard = { who: string; said: string };

export type PipeStep = { step: string; tool: string; note: string; gated?: boolean };

export type Process = {
  id: string;
  label: string;
  heard: Heard[];
  owner: string;
  trigger: string;
  procedures: string[];
  constraints: string[];
  decisions: string[];
  metric: string;
  breaksFirst: string;
  system: PipeStep[];
};

export const STEPS = [
  { id: "heard", label: "What people said" },
  { id: "spec", label: "The spec" },
  { id: "system", label: "The system" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export const PROCESSES: Process[] = [
  {
    id: "summit",
    label: "Summit follow-up",
    heard: [
      {
        who: "Field marketing",
        said: "After an event we export the badge scans to a spreadsheet and clean them by hand. It takes a few days.",
      },
      { who: "SDR", said: "By the time I get the list, the hot ones have gone cold." },
      { who: "Account executive", said: "I never know which sessions my accounts sat in." },
      {
        who: "RevOps",
        said: "Half the rows don't match an account, so we get duplicate companies.",
      },
    ],
    owner: "Field marketing, with RevOps as data steward",
    trigger: "The badge-scan export lands, or 24 hours after the event closes",
    procedures: [
      "Match each scan to an existing HubSpot account before creating anything new.",
      "Attach the sessions attended to the contact.",
      "Score, then route: known accounts to their rep, new ones to SDRs by territory.",
      "Draft follow-up from the sessions attended. A person approves before it sends.",
    ],
    constraints: [
      "No duplicate companies. Match on domain first, name second.",
      "Survey free text is stored as data and never given to a model as instructions.",
      "No email goes out in a rep's name without that rep's click.",
    ],
    decisions: [
      "Speed beats completeness: route within 48 hours, enrich later. Because the SDR said the list arrives cold.",
      "A scan with no confident match goes to a review queue, not a guess.",
    ],
    metric: "Median hours from badge scan to first touch",
    breaksFirst: "Matching companies with subsidiaries. Staff the review queue in week one.",
    system: [
      {
        step: "Ingest",
        tool: "Workato",
        note: "Pull scans and session attendance from the event platform.",
      },
      {
        step: "Match",
        tool: "Claude Code service on AWS",
        note: "Domain-first matching. Low-confidence matches go to a queue.",
      },
      {
        step: "Write",
        tool: "HubSpot",
        note: "Scoped credential. Writes only matched or new records.",
        gated: true,
      },
      {
        step: "Draft",
        tool: "Claude",
        note: "Drafts from sessions attended. Untrusted text excluded.",
      },
      {
        step: "Send",
        tool: "HubSpot sequences",
        note: "The rep confirms. The sender is named.",
        gated: true,
      },
      { step: "Log", tool: "Decision log", note: "Every write and verdict, reviewed weekly." },
    ],
  },
  {
    id: "demo",
    label: "Demo environments",
    heard: [
      {
        who: "Solutions engineer",
        said: "Every evaluation needs a fresh tenant with sample agents, and I build it by hand.",
      },
      {
        who: "Account executive",
        said: "I can't promise a demo date because I don't know when the environment will be ready.",
      },
      { who: "Security", said: "Old demo environments stay up with credentials nobody rotates." },
    ],
    owner: "Field engineering lead",
    trigger: "A deal reaches the evaluation stage in HubSpot",
    procedures: [
      "Provision from a template for each agent platform on the deal.",
      "Seed sample agents and synthetic data.",
      "Hand the engineer a checklist and a link.",
      "Tear down when the evaluation closes.",
    ],
    constraints: [
      "Every environment has an expiry date.",
      "Credentials are per environment and rotate at teardown.",
      "No customer data in a demo tenant.",
    ],
    decisions: [
      "Templates over custom builds. Custom work goes through the engineer, because speed and repeatability matter more.",
      "Security reviews the template once, not every environment.",
    ],
    metric: "Days from evaluation request to a ready environment",
    breaksFirst:
      "Platform API changes that break a template without warning. Watch vendor changelogs.",
    system: [
      { step: "Trigger", tool: "HubSpot", note: "A deal-stage change fires a webhook." },
      {
        step: "Plan",
        tool: "Claude Code service",
        note: "Picks templates from the platforms named on the deal.",
      },
      {
        step: "Provision",
        tool: "AWS or Vercel",
        note: "Needs engineer approval. Every resource tagged with an expiry.",
        gated: true,
      },
      { step: "Seed", tool: "Scripts", note: "Sample agents and synthetic data only." },
      {
        step: "Teardown",
        tool: "Scheduler",
        note: "Confirms the evaluation closed, then rotates credentials.",
        gated: true,
      },
      { step: "Log", tool: "Decision log", note: "What exists, who owns it, when it expires." },
    ],
  },
  {
    id: "research",
    label: "Research to the field",
    heard: [
      {
        who: "Product marketing",
        said: "When Labs publishes, I write the talk track the same week, and it's always a scramble.",
      },
      { who: "Account executive", said: "Customers ask about the research before I've read it." },
      {
        who: "EMEA rep",
        said: "The examples are American. I rewrite them for GDPR conversations.",
      },
      { who: "Solutions engineer", said: "I need the technical one-pager, not the blog post." },
    ],
    owner: "Product marketing",
    trigger: "A Zenity Labs post is published",
    procedures: [
      "Draft a talk track, a battlecard update, and a customer email from the post.",
      "Write an EMEA version with regional framing.",
      "Route drafts to product marketing for approval.",
      "Post approved assets to the sales channel and the enablement library.",
    ],
    constraints: [
      "Only facts from the published post, and every claim links to its sentence.",
      "Nothing reaches a customer without product marketing's approval.",
      "Technical detail stays at the level the post disclosed.",
    ],
    decisions: [
      "One-day turnaround beats polish, because reps get asked the same week.",
      "EMEA versions are written for EMEA, not translated.",
    ],
    metric: "Hours from publication to approved field assets",
    breaksFirst:
      "Drafts that overstate the research. A sentence with no source in the post is cut.",
    system: [
      { step: "Trigger", tool: "Workato", note: "A new post appears on the Labs blog." },
      {
        step: "Draft",
        tool: "Claude",
        note: "Talk track, battlecard, email, EMEA version, each claim cited.",
      },
      {
        step: "Check",
        tool: "Citation gate",
        note: "Any sentence without a source in the post is cut.",
        gated: true,
      },
      {
        step: "Approve",
        tool: "Slack",
        note: "Product marketing approves before anything is published.",
        gated: true,
      },
      { step: "Publish", tool: "Enablement library", note: "Assets posted with the source link." },
      { step: "Log", tool: "Decision log", note: "What was cut, what was approved, by whom." },
    ],
  },
];
