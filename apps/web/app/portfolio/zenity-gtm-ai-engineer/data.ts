/*
 * Page copy for the Zenity GTM AI Engineer work sample.
 * Company facts live in research.ts and are cited by id. Copy here is about the candidate,
 * the plan, or the simulations, all of which are the candidate's own claims.
 */

export const ROUTE = "/portfolio/zenity-gtm-ai-engineer";

export const PERSON = {
  name: "Bret Kerr",
  location: "Boston metro · remote or New York",
  email: "bret.kerr@gmail.com",
  linkedin: "https://www.linkedin.com/in/bretkerr",
  site: "https://www.contextjamming.com",
};

export const BUILD_TIME = "one day";

export const NAV = [
  { id: "overview", label: "Overview" },
  { id: "the-work", label: "The work" },
  { id: "who-i-am", label: "Who I am" },
  { id: "first-90-days", label: "First 90 days" },
  { id: "proof", label: "Proof" },
  { id: "annex", label: "Annex" },
] as const;

export const HERO = {
  kicker: "Work sample · GTM AI Engineer · Zenity",
  title: "Make Zenity's GTM its own first customer.",
  dek: "Three internal GTM systems for a company that sells the decision layer. Each one is inventoried, gated before it acts, and audited after, which is how Zenity tells customers to run their agents.",
};

export const PROOF_BAR = [
  { figure: "10 yrs", label: "Cybersecurity GTM at Mimecast, IPO through take-private" },
  { figure: "5 mo", label: "GTM work on securing the agentic workplace, for Proofpoint" },
  { figure: "Best in Show", label: "Red Hat Agent Build Day 2026, Lane 2" },
  { figure: "0/3 → 3/3", label: "Durable-fact retention, SkillMemoryBank eval" },
];

export const FORWARD = {
  credential:
    "ten years in cybersecurity go-to-market at Mimecast, then five months on the go-to-market side of securing the agentic workplace for Proofpoint.",
};

export const THESIS = {
  title: "Agents propose. Gates dispose.",
  body: [
    "On my own site, agents can propose changes, but they can't edit the checks that judge them. A failing run stays failed until the work is fixed.",
    'In my last GTM proof of concept, the most useful thing the acceptance gate did was say "not enough evidence" and hand the decision to a person. That\'s a fourth verdict next to allow, modify, and block.',
  ],
};

export type Capability = {
  capability: string;
  evidence: string;
  href?: string;
  conventionally: string;
};

export const FULL_STACK: Capability[] = [
  {
    capability: "Cybersecurity go-to-market",
    evidence:
      "Ten years at Mimecast with sales, product marketing, demand gen, and executives, through the IPO and the Permira take-private.",
    conventionally: "Senior marketing lead",
  },
  {
    capability: "Agent-security market context",
    evidence:
      "Dec 2025 to Apr 2026, paid by Proofpoint to turn product, threat, partner, and competitive inputs into recommendations for securing the agentic workplace.",
    conventionally: "Market intelligence analyst",
  },
  {
    capability: "GTM decision systems",
    evidence:
      "SignalGraph GTM proof of concept: event-ledger account model, adjudicated recommendation traces, and an acceptance gate. It led to a fractional AI GTM engagement now under review.",
    href: "https://www.contextjamming.com/SignalGraphConsults",
    conventionally: "RevOps analyst",
  },
  {
    capability: "Agent engineering",
    evidence:
      "contextjamming.com: Next.js and Cloudflare Workers, custom agent skills, MCP connectors, and verification gates agents can't edit.",
    href: "https://www.contextjamming.com",
    conventionally: "AI engineer",
  },
  {
    capability: "Evals and governance",
    evidence:
      "SkillMemoryBank: governed agent memory on a local open model, with a committed baseline and a measured delta.",
    href: "https://github.com/BretKerrAI/SkillMemoryBank",
    conventionally: "ML evaluation engineer",
  },
  {
    capability: "AI adoption inside a GTM org",
    evidence:
      "Mimecast AI Literacy Committee. Drove Cursor and You.com adoption, and introduced GPT-assisted analysis of customer interviews, packaged in Seismic for sales.",
    conventionally: "Enablement lead",
  },
  {
    capability: "Research with graded sources",
    evidence:
      "The claim ledger in this page's annex: every company fact graded, superseded claims kept and marked.",
    href: "#annex",
    conventionally: "Research analyst",
  },
  {
    capability: "Front-end engineering",
    evidence: "This page.",
    conventionally: "Web team",
  },
];

export type ArchiveRow = {
  shipped: string;
  usedBy: string;
  brokeFirst: string;
};

export const ARCHIVE: ArchiveRow[] = [
  {
    shipped:
      "SkillMemoryBank: an Agent Skill and eval harness that compresses agent memory into procedures, constraints, and decisions on IBM Granite 4.1, locally.",
    usedBy: "Red Hat Agent Build Day judges. Public on GitHub under Apache 2.0.",
    brokeFirst:
      "The first Granite call took about 337 seconds to load 5GB into memory, far past the 120-second timeout. I raised the timeout, warmed the model before every eval, and documented a smaller fallback model.",
  },
  {
    shipped:
      "SignalGraph GTM proof of concept: account events in a ledger, recommendation traces a reviewer can adjudicate, and an acceptance gate.",
    usedBy:
      "Revenue-operations leadership at an AI-native software company, now reviewing a fractional engagement.",
    brokeFirst:
      'By design, the gate refused to recommend on thin evidence. Saying "not enough evidence" out loud built more trust than any confident score.',
  },
  {
    shipped: "Research-grounded work-sample pages on contextjamming.com, including this one.",
    usedBy: "Hiring teams, and the people who forward them.",
    brokeFirst:
      "A collapsed annex still loaded all its JavaScript, because React mounts children inside a closed disclosure. The fix was to render on first open. A measured diagram overlay also inflated its own container in a loop until I absolutely positioned it over a table.",
  },
];

export type Phase = {
  window: string;
  name: "Surface" | "Enforce" | "Protect";
  goal: string;
  moves: string[];
  ships: string;
};

export const PLAN: Phase[] = [
  {
    window: "Days 1–30",
    name: "Surface",
    goal: "Know what exists before automating anything.",
    moves: [
      "Interview people across Sales, Marketing, Field Engineering, and Partners. Shadow the work, not just the meeting.",
      "Inventory every GTM automation, Zap, Workato recipe, and agent: its owner, its trigger, and what it can write to.",
      "Turn the interviews into a ranked backlog and two short specs, agreed with the hiring manager and GTM leadership.",
    ],
    ships:
      "The inventory, the ranked backlog, and one small fix that saves someone time in week three.",
  },
  {
    window: "Days 31–60",
    name: "Enforce",
    goal: "Ship the first two projects with a gate in front of every write.",
    moves: [
      "Every workflow gets its own scoped credential. Nothing borrows an admin token.",
      "Writes to HubSpot, Slack, and email pass a decision gate: allow, modify, block, or decline and hand to a person.",
      "Outbound messages need a human confirmation and say who sent them.",
    ],
    ships: "Two projects in production, each with a named owner and a runbook.",
  },
  {
    window: "Days 61–90",
    name: "Protect",
    goal: "Make the systems better every week without me in the loop.",
    moves: [
      "Every gate decision lands in a log someone actually reads.",
      "A weekly review of what broke, each one turned into a sharper rule.",
      "Hand over documentation, then spec the next three projects.",
    ],
    ships: "A decision log, a what-broke review, and the next quarter's specs.",
  },
];

export const PROOF_LINKS = [
  {
    title: "contextjamming.com",
    note: "My publication and build log. Next.js on Cloudflare Workers, with agent skills, MCP connectors, and verification gates.",
    href: "https://www.contextjamming.com",
  },
  {
    title: "SkillMemoryBank",
    note: "Red Hat Agent Build Day 2026, Lane 2 Best in Show. Live demo and market validation.",
    href: "https://www.contextjamming.com/SkillMemoryBank",
  },
  {
    title: "SkillMemoryBank source",
    note: "Agent Skill, eval harness, and benchmark. Apache 2.0.",
    href: "https://github.com/BretKerrAI/SkillMemoryBank",
  },
  {
    title: "SignalGraph GTM proof of concept",
    note: "Event ledger, adjudicated recommendation traces, and an acceptance gate that declines on thin evidence.",
    href: "https://www.contextjamming.com/SignalGraphConsults",
  },
];
