/*
 * Backlog fixtures. Every number is the candidate's assumption, written down so that
 * week-one interviews can prove it wrong.
 */

export type BlastRadius = 1 | 2 | 3;

export type Project = {
  id: string;
  name: string;
  team: string;
  hoursPerWeek: number;
  weeksToShip: number;
  blast: BlastRadius;
  dataReady: number;
  owner: string | null;
  question: string;
};

export const BLAST_LABEL: Record<BlastRadius, string> = {
  1: "Reads and drafts",
  2: "Writes CRM and messages",
  3: "Creates infrastructure",
};

export const WORK_WEEKS_PER_YEAR = 48;
export const HOURS_PER_FTE_YEAR = 1800;
export const DATA_READY_MIN = 0.5;

export const PROJECTS: Project[] = [
  {
    id: "lead-gate",
    name: "Inbound lead gate and enrichment",
    team: "Marketing · RevOps",
    hoursPerWeek: 6,
    weeksToShip: 3,
    blast: 2,
    dataReady: 0.9,
    owner: "RevOps",
    question:
      "Which public forms feed HubSpot, and does any automation read their free-text fields?",
  },
  {
    id: "summit",
    name: "Summit follow-up",
    team: "Field marketing · Sales",
    hoursPerWeek: 5,
    weeksToShip: 2,
    blast: 2,
    dataReady: 0.8,
    owner: "Field marketing",
    question: "How long does it take a scanned badge to become a worked lead?",
  },
  {
    id: "research",
    name: "Labs research to field assets",
    team: "Product marketing",
    hoursPerWeek: 6,
    weeksToShip: 3,
    blast: 1,
    dataReady: 0.9,
    owner: "Product marketing",
    question: "Who writes the talk track when Labs publishes, and how long does it take?",
  },
  {
    id: "demo",
    name: "Demo environment provisioning",
    team: "Field engineering",
    hoursPerWeek: 8,
    weeksToShip: 6,
    blast: 3,
    dataReady: 0.6,
    owner: "Field engineering",
    question: "What is the slowest step in standing up a demo or evaluation environment?",
  },
  {
    id: "deal-health",
    name: "Deal health and MEDDPICC gaps",
    team: "Sales leadership",
    hoursPerWeek: 10,
    weeksToShip: 8,
    blast: 1,
    dataReady: 0.3,
    owner: "Sales leadership",
    question: "Where do call transcripts and qualification fields actually live today?",
  },
  {
    id: "platform-watch",
    name: "Platform change monitor",
    team: "Partners · Product marketing",
    hoursPerWeek: 3,
    weeksToShip: 2,
    blast: 1,
    dataReady: 0.9,
    owner: "Partner team",
    question: "Which platform changes have caught the field off guard this year?",
  },
  {
    id: "localization",
    name: "Regional versions of field content",
    team: "International marketing",
    hoursPerWeek: 4,
    weeksToShip: 4,
    blast: 1,
    dataReady: 0.7,
    owner: null,
    question: "Who owns regional content today, and who approves it?",
  },
];
