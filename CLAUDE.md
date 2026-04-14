# GemClaw JobSeek -- Project Constitution

## 1. Project Identity

**GemClaw JobSeek** is a sub-brand of **GemClaw** by **ACRA Insight LLC**.

An automated job application system targeting the Greenhouse ATS (Applicant Tracking System). It uses cross-model AI orchestration to parse job listings, score fit, tailor resumes, generate cover letters, and pre-fill application forms — all at less than $0.05 per application.

- **Owner:** Bret Kerr / ACRA Insight LLC
- **License:** MIT
- **Brand palette:** Signal Amber (#F5A623), Circuit Blue (#1A3A5C)
- **Parent project:** [GemClaw](https://gemclaw.click) — Cross-model Mixture of Experts engine
- **Case study for:** [Context Jamming](https://contextjamming.substack.com) Substack

---

## 2. Architecture Overview

### Deployment Targets

| Target | Technology | Host | Purpose |
|--------|-----------|------|---------|
| Dashboard | Next.js 15 App Router | Vercel | Web UI for job discovery, application tracking, resume preview |
| CLI | Commander.js + tsup | npm (local) | Terminal-based workflow: import profile, discover jobs, apply |
| Playwright Worker | Express + Playwright | Railway | Browser automation for Greenhouse form filling |

### Monorepo Layout

```
gemclaw-jobseek/
├── apps/web/                  # Next.js dashboard (Vercel)
├── packages/
│   ├── core/                  # Shared types, config, Result monad
│   ├── ai/                    # Multi-model orchestration (Vercel AI SDK)
│   ├── greenhouse/            # Greenhouse Job Board API client
│   ├── resume/                # PDF generation (@react-pdf/renderer)
│   ├── linkedin-parser/       # LinkedIn data export parser
│   ├── cli/                   # CLI tool (Commander.js + @clack/prompts)
│   ├── typescript-config/     # Shared tsconfig presets
│   └── eslint-config/         # Shared ESLint rules
└── docker/playwright-worker/  # Railway Playwright service
```

### Build Orchestration

- **Turborepo** manages the build graph via `turbo.json`
- **pnpm workspaces** for package resolution
- Internal packages use `workspace:*` protocol

---

## 3. Tech Stack & Conventions

### Languages & Runtimes

- **TypeScript** in strict mode everywhere (`"strict": true`)
- **Node.js 20+** (LTS)
- **pnpm 9+** as package manager

### Frameworks & Libraries

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Web framework | Next.js 15 (App Router) | Server components, API routes, Vercel-native |
| Styling | Tailwind CSS v4 | Utility-first, dark mode, brand theming |
| PDF generation | @react-pdf/renderer | React-based, ATS-optimized output |
| AI orchestration | Vercel AI SDK | Unified interface across providers |
| CLI framework | Commander.js | Standard, well-tested |
| CLI UX | @clack/prompts | Beautiful terminal UIs |
| Schema validation | Zod | Runtime type safety |
| CSV parsing | papaparse | Streaming CSV parser |
| ZIP extraction | adm-zip | LinkedIn export handling |
| Rate limiting | bottleneck | Per-provider rate limits |
| Testing | Vitest | Fast, TypeScript-native |
| Linting | Biome | Fast formatter + linter |
| Browser automation | Playwright | Greenhouse form filling |
| Bundling (CLI) | tsup | Fast ESM/CJS bundler |

### Conventions

- **File naming:** kebab-case for files, PascalCase for React components
- **Imports:** Use `@repo/` prefix for internal packages
- **Error handling:** Use `Result<T, E>` monad from `@repo/core` — no thrown exceptions in library code
- **Commits:** Conventional commits — `feat(scope): message`, `fix(scope): message`, `chore(scope): message`
- **Testing:** Co-located test files (`*.test.ts`) next to source
- **No TODO comments** unless they reference a specific GitHub issue number
- **No placeholder code** — every function has a real implementation

---

## 4. Greenhouse Job Board API

### Base URL

```
https://boards-api.greenhouse.io
```

### Authentication

- **Read endpoints** (GET): No authentication required for public boards
- **Submit endpoint** (POST): Requires Greenhouse API key via HTTP Basic Auth
  - Username: API key
  - Password: empty string
  - Header: `Authorization: Basic base64(apikey:)`

### Endpoints

#### List Jobs

```
GET /v1/boards/{board_token}/jobs
```

Query params: `content=true` (include job description HTML)

Response:
```typescript
{
  jobs: Array<{
    id: number;
    title: string;
    updated_at: string;
    location: { name: string };
    departments: Array<{ id: number; name: string }>;
    absolute_url: string;
    metadata: Array<{ id: number; name: string; value: string | string[] | null }>;
  }>;
  meta: { total: number };
}
```

#### Get Job Details

```
GET /v1/boards/{board_token}/jobs/{id}
```

Response: Single job object with full HTML `content` field.

#### Get Job + Application Questions

```
GET /v1/boards/{board_token}/jobs/{id}?questions=true
```

Response includes `questions` array:
```typescript
{
  // ...job fields...
  questions: Array<{
    label: string;
    fields: Array<{
      name: string;
      type: "input_text" | "input_file" | "textarea" | "multi_value_single_select" | "multi_value_multi_select";
      required: boolean;
      values: Array<{ label: string; value: number }> | [];
    }>;
    required: boolean;
  }>;
  compliance: Array<{
    type: string;
    questions: Array<{
      label: string;
      required: boolean;
      type: string;
      answer_options: Array<{ id: number; label: string; free_form: boolean }>;
    }>;
  }>;
}
```

#### Submit Application

```
POST /v1/boards/{board_token}/jobs/{id}
Content-Type: multipart/form-data
Authorization: Basic base64(apikey:)
```

Standard fields:
- `first_name` (required)
- `last_name` (required)
- `email` (required)
- `phone`
- `resume` (file)
- `cover_letter` (file)
- `question_{id}` (custom fields)

---

## 5. Model Assignment Matrix

### Cost Optimization Strategy

The pipeline uses three tiers of models, routing tasks to the cheapest capable model:

| Model | Provider | Cost | Assignment | Rationale |
|-------|----------|------|------------|-----------|
| Gemma 4 27B | Ollama (local) | $0.00 | Job parsing, keyword extraction, fit scoring, bullet drafting | Free, fast, adequate for structured extraction |
| Gemini 2.5 Flash | Google AI | $0.075/1M in, $0.30/1M out | Resume tailoring, cover letter generation, form answers | Cheap, fast, good at following templates |
| Claude Sonnet 4 | Anthropic | $3/1M in, $15/1M out | Final quality review, complex questions, tone calibration | Best judgment, used sparingly |

### Per-Application Cost Budget

```
Gemma 4 (local):     ~2K tokens  = $0.000
Gemini 2.5 Flash:    ~8K tokens  = $0.003
Claude Sonnet 4:     ~4K tokens  = $0.027
                         Total  ≈ $0.030 per application
```

Target: **< $0.05 per application** including retries and edge cases.

### Rate Limits

| Provider | Limit | Implementation |
|----------|-------|----------------|
| Google (Gemini) | 60 RPM | Bottleneck limiter, 1 req/sec |
| Anthropic (Claude) | 50 RPM | Bottleneck limiter, 1.2 sec interval |
| Ollama (Gemma) | No limit | Direct calls, no throttling |

---

## 6. Pipeline Architecture

### Application Pipeline Stages

```
1. DISCOVER  → Greenhouse API → List jobs for board
2. MATCH     → Gemma 4        → Score fit (0-100) + reasoning
3. TAILOR    → Gemini Flash    → Customize resume bullets for role
4. COMPOSE   → Gemini Flash    → Generate cover letter
5. REVIEW    → Claude Sonnet   → Quality check + suggestions
6. MAP       → Local logic     → Map profile to form fields
7. ANSWER    → Claude Sonnet   → Answer custom form questions
8. RENDER    → react-pdf       → Generate tailored PDF resume
9. SUBMIT    → Playwright      → Fill and submit Greenhouse form
```

Each stage returns `Result<T, PipelineError>` so failures are explicit and recoverable.

### Fallback Strategy

- If Ollama is unavailable: fall back to Gemini Flash for Gemma tasks (cost increases ~$0.002)
- If a model returns poor quality (review score < 60): retry with temperature adjustment
- If Greenhouse API rate-limits: exponential backoff with 3 retries

---

## 7. Data Models

### UserProfile (JSON Resume v1.0.0 compatible)

```typescript
interface UserProfile {
  basics: {
    name: string;
    label: string;
    email: string;
    phone: string;
    url: string;
    summary: string;
    location: { city: string; region: string; countryCode: string };
    profiles: Array<{ network: string; username: string; url: string }>;
  };
  work: Array<{
    name: string;
    position: string;
    url: string;
    startDate: string;
    endDate: string;
    summary: string;
    highlights: string[];
  }>;
  education: Array<{
    institution: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate: string;
  }>;
  skills: Array<{ name: string; keywords: string[] }>;
  certificates: Array<{ name: string; issuer: string; date: string }>;
}
```

---

## 8. Environment Variables

```
# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
OLLAMA_BASE_URL=http://localhost:11434   # Optional, defaults to this

# Greenhouse
GREENHOUSE_API_KEY=...                   # For POST submissions
GREENHOUSE_BOARD_TOKEN=...               # Default board

# Playwright Worker
PLAYWRIGHT_WORKER_URL=https://...        # Railway URL
PLAYWRIGHT_WORKER_TOKEN=...              # Bearer token

# Dashboard
NEXTAUTH_SECRET=...                      # If auth is added later
```

---

## 9. Design Decisions & Assumptions

1. **Greenhouse-first:** Initial release only supports Greenhouse ATS. Lever, Workday, etc. are future work.
2. **No auth on dashboard v1:** The dashboard is a local/personal tool. Auth will be added if it becomes multi-tenant.
3. **Ollama optional:** If Gemma/Ollama is not running locally, the pipeline falls back to Gemini Flash. The CLI warns but does not fail.
4. **Resume PDF only:** Cover letters are plain text. Only the resume gets PDF rendering.
5. **Human-in-the-loop:** The Playwright worker pauses at the review step before final submission. No fully automated submissions without explicit confirmation.
6. **LinkedIn export format:** Assumes the standard LinkedIn data export ZIP format (Settings > Get a copy of your data).
7. **ATS optimization:** Resume PDFs use single-column layout, standard fonts, no graphics — optimized for ATS parsing.
