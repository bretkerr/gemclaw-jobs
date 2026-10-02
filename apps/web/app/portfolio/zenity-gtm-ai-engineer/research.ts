import "server-only";

/*
 * Claim ledger. Every company-specific assertion on the page is a row here.
 * Nothing about Zenity appears in page copy unless it cites a claim id from this file.
 * "hypothesis" rows never render as assertions: they render as discovery questions.
 * Research refreshed 2026-10-02. zenity.io could not be fetched directly from the
 * research environment, so primary-source rows were confirmed through search
 * excerpts of the primary page plus independent press coverage.
 */

export type ResearchStatus =
  | "verified-current" // primary source, still true
  | "verified-historical" // was true, may be superseded — say so in the caveat
  | "strong-inference" // multiple secondary sources agree
  | "single-source"
  | "hypothesis" // reasoning, not evidence — label it on the page
  | "superseded"
  | "unverified";

export type SourceAuthority = "primary" | "vendor" | "trade-press" | "community";
export type ClaimVisibility = "main-page" | "annex-only" | "discovery-question";

export interface Source {
  label: string;
  url: string;
}

export interface Claim {
  id: string;
  claim: string;
  status: ResearchStatus;
  authority: SourceAuthority;
  visibility: ClaimVisibility;
  asOf: string;
  sources: Source[];
  caveat?: string;
  implication: string;
  supersededBy?: string;
  question?: string;
}

export const LEDGER_AS_OF = "2026-10-02";

export const CLAIMS: Claim[] = [
  {
    id: "c01",
    claim:
      "On July 27, 2026, Zenity added Exposure Management and Runtime Boundaries and described the result as security at the decision layer: each AI action is evaluated before it becomes an enterprise action.",
    status: "verified-current",
    authority: "vendor",
    visibility: "main-page",
    asOf: "2026-07-27",
    sources: [
      {
        label: "Business Wire, Zenity release",
        url: "https://www.businesswire.com/news/home/20260727514033/en/",
      },
      {
        label: "Help Net Security",
        url: "https://www.helpnetsecurity.com/2026/07/27/zenity-exposure-management-runtime-boundaries/",
      },
    ],
    implication:
      "The page's governing idea, a gate before every write, is Zenity's own product thesis applied to its GTM stack.",
  },
  {
    id: "c02",
    claim:
      "Runtime Boundaries evaluate each decision against intent, identity, requested action, accessed data, tools, previous activity, and enterprise policy.",
    status: "verified-current",
    authority: "vendor",
    visibility: "main-page",
    asOf: "2026-07-27",
    sources: [
      {
        label: "Business Wire, Zenity release",
        url: "https://www.businesswire.com/news/home/20260727514033/en/",
      },
    ],
    caveat:
      "Describes Zenity's product. The lead gate on this page borrows the categories, not the implementation.",
    implication:
      "The lead gate's checks use the same categories so a Zenity reader recognizes the frame at a glance.",
  },
  {
    id: "c03",
    claim:
      "Zenity organizes the platform as three pillars built as one loop: Surface, Enforce, and Protect.",
    status: "verified-current",
    authority: "primary",
    visibility: "main-page",
    asOf: "2026-07-27",
    sources: [
      {
        label: "Zenity blog, the decision point",
        url: "https://zenity.io/blog/ai-security-decision-point",
      },
    ],
    implication:
      "The 90-day plan uses the same three words, so the plan reads as the platform applied to Zenity's own GTM.",
  },
  {
    id: "c04",
    claim:
      "Zenity organizes the platform as Observe, Govern, and Defend (AI observability, AISPM, AIDR).",
    status: "superseded",
    authority: "trade-press",
    visibility: "annex-only",
    asOf: "2026-07-27",
    sources: [{ label: "Akto, Zenity overview", url: "https://www.akto.io/blog/zenity-security" }],
    caveat: "Accurate before the July 2026 relaunch and still visible on some product pages.",
    implication:
      "Kept to show the ledger tracks change rather than quoting whichever page loads first.",
    supersededBy: "c03",
  },
  {
    id: "c05",
    claim:
      "Zenity enforces policy across Claude Code, Cursor, Microsoft Copilot, Salesforce Agentforce, ChatGPT Enterprise, Amazon Bedrock, Azure AI Foundry, and custom-built agents.",
    status: "verified-current",
    authority: "vendor",
    visibility: "annex-only",
    asOf: "2026-07-27",
    sources: [
      {
        label: "Business Wire, Zenity release",
        url: "https://www.businesswire.com/news/home/20260727514033/en/",
      },
    ],
    implication:
      "Claude Code is both a named tool in the posting and a surface Zenity secures, so internal builds can be governed by the product.",
  },
  {
    id: "c06",
    claim:
      "SalesBleed (Zenity Labs, September 24, 2026): a prompt injection submitted through Salesforce's public Web-to-Lead form stays dormant until an employee asks Agentforce about that lead. Two of the three flaws leaked CRM data over DNS when the agent rendered an image tag. The third let the agent send Slack messages under its own identity without confirmation or attribution.",
    status: "verified-current",
    authority: "primary",
    visibility: "main-page",
    asOf: "2026-09-24",
    sources: [
      {
        label: "Zenity Labs, SalesBleed",
        url: "https://labs.zenity.io/post/salesbleed-0-click-data-exfiltration-on-agentforce",
      },
      {
        label: "SecurityWeek",
        url: "https://www.securityweek.com/salesbleed-flaws-in-salesforce-agentforce-enabled-zero-click-data-exfiltration/",
      },
    ],
    implication:
      "Every GTM team runs a public form. Zenity's own inbound should treat free-text fields as hostile and never let an agent reply or render on their behalf unchecked.",
  },
  {
    id: "c07",
    claim:
      "Zenity Labs reported the SalesBleed flaws to Salesforce on June 1, 2026, and Salesforce shipped fixes for all three by August 19.",
    status: "verified-current",
    authority: "trade-press",
    visibility: "annex-only",
    asOf: "2026-09-24",
    sources: [
      {
        label: "SecurityWeek",
        url: "https://www.securityweek.com/salesbleed-flaws-in-salesforce-agentforce-enabled-zero-click-data-exfiltration/",
      },
    ],
    implication:
      "The pattern is fixed in Agentforce. The input surface still exists everywhere else, including HubSpot forms.",
  },
  {
    id: "c08",
    claim:
      "A Cloud Security Alliance survey commissioned by Zenity (April 16, 2026; 445 IT and security professionals) found 53% of organizations had AI agents exceed their intended permissions, and 47% had a security incident involving an AI agent in the past year.",
    status: "verified-current",
    authority: "primary",
    visibility: "main-page",
    asOf: "2026-04-16",
    sources: [
      {
        label: "Cloud Security Alliance press release",
        url: "https://cloudsecurityalliance.org/press-releases/2026/04/16/more-than-half-of-organizations-experience-ai-agent-scope-violations-cloud-security-alliance-study-finds",
      },
      {
        label: "Zenity newsroom",
        url: "https://zenity.io/company-overview/newsroom/company-news/csa-ai-agent-security-survey",
      },
    ],
    caveat: "Vendor-commissioned survey, run by an independent body.",
    implication:
      "Internal GTM agents are agents. Scope every credential per workflow from day one.",
  },
  {
    id: "c09",
    claim: "47% of organizations saw AI agents exceed their permissions (CSA, May 2026).",
    status: "superseded",
    authority: "community",
    visibility: "annex-only",
    asOf: "2026-10-02",
    sources: [],
    caveat:
      "My own earlier note conflated two figures and misdated the study. Corrected against the primary release (c08).",
    implication:
      "Kept on purpose. A ledger that never shows its own corrections isn't checking anything.",
    supersededBy: "c08",
  },
  {
    id: "c10",
    claim:
      "Zenity's integration with Microsoft Copilot Studio adds inline controls on tool invocations, including MCP servers. Announced September 2025; generally available November 2025.",
    status: "verified-historical",
    authority: "vendor",
    visibility: "annex-only",
    asOf: "2025-11-18",
    sources: [
      {
        label: "Business Wire, Nov 2025",
        url: "https://www.businesswire.com/news/home/20251118241747/en/",
      },
    ],
    caveat:
      "An earlier draft of my research dated this to August 2026. The primary releases are from 2025.",
    implication: "Inline enforcement on tool calls is shipped, not roadmap.",
  },
  {
    id: "c11",
    claim:
      "Zenity raised a $125M Series C led by Norwest in August 2026, bringing total funding to $185M.",
    status: "verified-current",
    authority: "vendor",
    visibility: "annex-only",
    asOf: "2026-08-04",
    sources: [
      {
        label: "Zenity blog",
        url: "https://zenity.io/blog/zenity-raises-125-million-secure-era-autonomous-ai",
      },
      {
        label: "SiliconANGLE",
        url: "https://siliconangle.com/2026/08/03/israeli-startup-zenity-bags-125m-funding-build-security-layer-ai-agents/",
      },
    ],
    implication: "Post-raise scaling is when undocumented GTM processes break first.",
  },
  {
    id: "c12",
    claim:
      "Zenity has more than 230 employees, with R&D in Tel Aviv and go-to-market and operations led from New York.",
    status: "verified-current",
    authority: "vendor",
    visibility: "annex-only",
    asOf: "2026-08-04",
    sources: [
      {
        label: "Zenity blog, Series C",
        url: "https://zenity.io/blog/zenity-raises-125-million-secure-era-autonomous-ai",
      },
    ],
    implication:
      "The GTM AI Engineer serves a New York GTM organization with an engineering culture an ocean away.",
  },
  {
    id: "c13",
    claim:
      "Gartner named Zenity a Market Shaper in its inaugural Emerging Market Quadrant for AI Application Security, Startup Vendors (September 23, 2026). Zenity says it was one of two Market Shapers among nearly 20 vendors.",
    status: "single-source",
    authority: "vendor",
    visibility: "annex-only",
    asOf: "2026-09-23",
    sources: [
      {
        label: "Zenity newsroom",
        url: "https://zenity.io/company-overview/newsroom/company-news/zenity-named-a-market-shaper-in-gartner-inaugural-emerging-market-quadrant-for-ai-application",
      },
    ],
    caveat: "Vendor characterization of a paywalled analyst report.",
    implication:
      "Analyst-driven demand produces evaluation requests that field engineering has to stand up quickly.",
  },
  {
    id: "c14",
    claim:
      "Zenity is hosting AI Agent Security Summits in London on October 8 and New York on October 21, 2026.",
    status: "verified-current",
    authority: "vendor",
    visibility: "main-page",
    asOf: "2026-09-23",
    sources: [
      {
        label: "Zenity blog, summits",
        url: "https://zenity.io/blog/ai-agent-security-summit-london-new-york",
      },
    ],
    implication:
      "Two events in one month produce a lead spike that a follow-up flow has to absorb.",
  },
  {
    id: "c15",
    claim:
      "The GTM AI Engineer owns AI projects end to end across Sales, Marketing, Field Engineering, and Partners, from requirements to production. The posting says this is not prototype-and-hand-off work.",
    status: "verified-current",
    authority: "primary",
    visibility: "main-page",
    asOf: "2026-10-02",
    sources: [
      {
        label: "Zenity careers posting",
        url: "https://zenity.io/careers/remote-new-york-ny-united-states/gtm-ai-engineer/1D.27F",
      },
    ],
    implication: "Every module on this page ends in a running system with an owner, not a diagram.",
  },
  {
    id: "c16",
    claim:
      "The posting asks the engineer to turn undocumented internal processes into specs and working systems, and to prioritize a large AI project pipeline with the hiring manager and GTM leadership.",
    status: "verified-current",
    authority: "primary",
    visibility: "main-page",
    asOf: "2026-10-02",
    sources: [
      {
        label: "Zenity careers posting",
        url: "https://zenity.io/careers/remote-new-york-ny-united-states/gtm-ai-engineer/1D.27F",
      },
    ],
    implication: "Module two is the spec step. The backlog ranker is the prioritization step.",
  },
  {
    id: "c17",
    claim:
      "The posting names Workato, HubSpot, Zapier, Claude Code, Vercel, and AWS, says no single tool is required, and asks candidates what they shipped, who used it, and what broke first.",
    status: "verified-current",
    authority: "primary",
    visibility: "main-page",
    asOf: "2026-10-02",
    sources: [
      {
        label: "Zenity careers posting, remote",
        url: "https://zenity.io/careers/remote-new-york-ny-united-states/gtm-ai-engineer/1D.27F",
      },
      {
        label: "Zenity careers posting, hybrid",
        url: "https://zenity.io/careers/hybrid-new-york-ny-united-states/gtm-ai-engineer/96.861",
      },
    ],
    implication: "The production archive answers that exact question, row by row.",
  },
  {
    id: "c18",
    claim:
      "In April 2026 a coding agent deleted PocketOS's production database and its backups in nine seconds using an API token scoped far beyond its task. Zenity published an analysis.",
    status: "verified-current",
    authority: "vendor",
    visibility: "annex-only",
    asOf: "2026-04-25",
    sources: [
      {
        label: "Zenity blog, PocketOS",
        url: "https://zenity.io/blog/current-events/ai-agent-database-deletion-pocketos",
      },
    ],
    caveat: "A third-party incident Zenity wrote about, not Zenity Labs research.",
    implication:
      "Every internal workflow gets its own narrowly scoped credential, and destructive actions need a person.",
  },
  {
    id: "c19",
    claim: "Zenity's sales team runs MEDDPICC with pipeline managed in HubSpot.",
    status: "single-source",
    authority: "community",
    visibility: "discovery-question",
    asOf: "2026-09-28",
    sources: [],
    caveat:
      "From my pre-interview notes; the original source was not re-verified. Not asserted on the page.",
    implication: "Deal-health scoring depends on where MEDDPICC fields actually live.",
    question:
      "How consistently are MEDDPICC fields captured in HubSpot today, and where do they live when they aren't?",
  },
  {
    id: "c20",
    claim:
      "Inbound leads reach HubSpot through public forms whose free-text fields are read by automations.",
    status: "hypothesis",
    authority: "community",
    visibility: "discovery-question",
    asOf: "2026-10-02",
    sources: [],
    implication: "If true, the lead gate is the first project.",
    question:
      "Which public forms feed HubSpot, and does any automation or agent read their free-text fields?",
  },
  {
    id: "c21",
    claim:
      "GTM automations exist across Zapier and Workato without a central inventory of owners and write scopes.",
    status: "hypothesis",
    authority: "community",
    visibility: "discovery-question",
    asOf: "2026-10-02",
    sources: [],
    implication: "If true, the Surface month starts with the inventory.",
    question: "Is there one list of every GTM automation, with an owner and write scope for each?",
  },
  {
    id: "c22",
    claim: "Summit follow-up is mostly manual.",
    status: "hypothesis",
    authority: "community",
    visibility: "discovery-question",
    asOf: "2026-10-02",
    sources: [],
    implication: "If true, event follow-up is a fast first ship.",
    question: "How long does it take a scanned summit badge to become a worked lead?",
  },
  {
    id: "c23",
    claim: "Field engineering stands up demo and evaluation environments by hand.",
    status: "hypothesis",
    authority: "community",
    visibility: "discovery-question",
    asOf: "2026-10-02",
    sources: [],
    implication: "If true, sandbox provisioning is high value but needs a security review first.",
    question: "What is the slowest step in standing up a demo or proof-of-concept environment?",
  },
  {
    id: "c24",
    claim: "Zenity's internal GTM agents run under the Zenity platform.",
    status: "hypothesis",
    authority: "community",
    visibility: "discovery-question",
    asOf: "2026-10-02",
    sources: [],
    implication:
      "If true, every system on this page ships already governed. If not, GTM becomes customer zero.",
    question: "Does Zenity run its own GTM agents through Zenity?",
  },
  {
    id: "c25",
    claim:
      "Zenity case studies report 80% risk reduction across tenants with 150,000+ resources and 95% auto-remediation of high-risk violations.",
    status: "single-source",
    authority: "vendor",
    visibility: "annex-only",
    asOf: "2026-09-28",
    sources: [{ label: "Zenity platform page", url: "https://zenity.io/platform" }],
    caveat: "Vendor case-study figures, not independently verified.",
    implication: "Customer proof points need fast, accurate distribution to the field.",
  },
];

export function claim(id: string): Claim {
  const found = CLAIMS.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Claim ${id} is cited on the page but missing from the ledger.`);
  }
  if (found.visibility !== "main-page") {
    throw new Error(`Claim ${id} is ${found.visibility} and may not be asserted on the main page.`);
  }
  if (found.status === "hypothesis" || found.status === "superseded") {
    throw new Error(`Claim ${id} is ${found.status} and may not be asserted.`);
  }
  return found;
}

export const STATUS_LABEL: Record<ResearchStatus, string> = {
  "verified-current": "Verified",
  "verified-historical": "Verified, historical",
  "strong-inference": "Strong inference",
  "single-source": "Single source",
  hypothesis: "Hypothesis",
  superseded: "Superseded",
  unverified: "Unverified",
};
