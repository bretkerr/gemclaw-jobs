#!/usr/bin/env node

import { Command } from "commander";
import * as clack from "@clack/prompts";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";

const CONFIG_PATH = join(homedir(), ".jobseekrc.json");

const program = new Command();

program
  .name("jobseek")
  .description("GemClaw JobSeek -- Automated job application system")
  .version("0.1.0");

// ── profile ──────────────────────────────────────────────────────────────────

program
  .command("profile")
  .description("Import or view your profile")
  .option("--import <path>", "Import LinkedIn data export ZIP")
  .option("--view", "View current profile")
  .action(async (opts: { import?: string; view?: boolean }) => {
    if (opts.import) {
      clack.intro("Importing LinkedIn profile...");
      try {
        const { parseLinkedInExport } = await import("@repo/linkedin-parser");
        const zipPath = resolve(opts.import);
        if (!existsSync(zipPath)) {
          clack.log.error(`File not found: ${zipPath}`);
          process.exit(1);
        }
        const profile = await parseLinkedInExport(zipPath);
        const config = loadConfig();
        config.profile = profile;
        saveConfig(config);
        clack.log.success(`Imported profile for ${profile.basics.name}`);
        clack.log.info(`  Email: ${profile.basics.email}`);
        clack.log.info(`  Title: ${profile.basics.label}`);
        clack.log.info(`  Work entries: ${profile.work.length}`);
        clack.log.info(`  Skills: ${profile.skills.flatMap((s) => s.keywords).length}`);
        clack.outro(`Profile saved to ${CONFIG_PATH}`);
      } catch (e) {
        clack.log.error(`Import failed: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
      return;
    }

    if (opts.view) {
      const config = loadConfig();
      if (!config.profile) {
        clack.log.warn("No profile found. Run: jobseek profile --import <path-to-linkedin-zip>");
        process.exit(1);
      }
      const p = config.profile;
      console.log(`\n  Name:  ${p.basics.name}`);
      console.log(`  Title: ${p.basics.label}`);
      console.log(`  Email: ${p.basics.email}`);
      console.log(`  Work:  ${p.work.length} positions`);
      console.log(`  Skills: ${p.skills.flatMap((s) => s.keywords).join(", ")}\n`);
      return;
    }

    program.commands.find((c) => c.name() === "profile")?.help();
  });

// ── discover ─────────────────────────────────────────────────────────────────

program
  .command("discover")
  .description("Discover jobs from a Greenhouse board")
  .requiredOption("--board <token>", "Greenhouse board token")
  .option("--keyword <filter>", "Filter jobs by keyword")
  .action(async (opts: { board: string; keyword?: string }) => {
    clack.intro(`Discovering jobs on board: ${opts.board}`);
    try {
      const { createGreenhouseClient } = await import("@repo/greenhouse");
      const client = createGreenhouseClient();
      const result = await client.listJobs(opts.board);
      if (!result.ok) {
        clack.log.error(`API error: ${result.error.message}`);
        process.exit(1);
      }
      let jobs = result.value;
      if (opts.keyword) {
        const kw = opts.keyword.toLowerCase();
        jobs = jobs.filter(
          (j) =>
            j.title.toLowerCase().includes(kw) ||
            j.content.toLowerCase().includes(kw) ||
            j.departments.some((d) => d.toLowerCase().includes(kw)),
        );
      }
      clack.log.success(`Found ${jobs.length} jobs`);
      for (const job of jobs) {
        console.log(`  [${job.id}] ${job.title} — ${job.location} (${job.departments.join(", ")})`);
      }
      clack.outro(`${jobs.length} jobs listed`);
    } catch (e) {
      clack.log.error(`Discovery failed: ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    }
  });

// ── apply ────────────────────────────────────────────────────────────────────

program
  .command("apply")
  .description("Apply to a job (runs full AI pipeline)")
  .requiredOption("--board <token>", "Greenhouse board token")
  .requiredOption("--job <id>", "Job ID")
  .option("--dry-run", "Generate materials without submitting")
  .action(async (opts: { board: string; job: string; dryRun?: boolean }) => {
    const config = loadConfig();
    if (!config.profile) {
      clack.log.error("No profile found. Run: jobseek profile --import <path>");
      process.exit(1);
    }

    clack.intro(`${opts.dryRun ? "[DRY RUN] " : ""}Applying to job ${opts.job} on board ${opts.board}`);
    const spinner = clack.spinner();

    try {
      const { createGreenhouseClient } = await import("@repo/greenhouse");
      const { matchJob, tailorResume, generateCoverLetter, reviewApplication, answerFormQuestions } = await import("@repo/ai");
      const { renderResume } = await import("@repo/resume");

      const client = createGreenhouseClient();
      const profile = config.profile;

      // 1. Get job details
      spinner.start("Fetching job details...");
      const jobResult = await client.getJobWithQuestions(opts.board, parseInt(opts.job));
      if (!jobResult.ok) {
        spinner.stop(`Failed: ${jobResult.error.message}`);
        process.exit(1);
      }
      const { job, questions } = jobResult.value;
      spinner.stop(`Job: ${job.title} at ${job.departments.join(", ")}`);

      // 2. Match
      spinner.start("Analyzing job fit (Gemma/Gemini)...");
      const matchResult = await matchJob(profile, job.content);
      if (!matchResult.ok) {
        spinner.stop(`Match failed: ${matchResult.error.message}`);
        process.exit(1);
      }
      spinner.stop(`Fit score: ${matchResult.value.score}/100 — ${matchResult.value.reasoning}`);

      if (matchResult.value.score < (config.minFitScore ?? 60)) {
        clack.log.warn(`Fit score ${matchResult.value.score} is below threshold ${config.minFitScore ?? 60}. Proceeding anyway in dry-run.`);
      }

      // 3. Tailor resume
      spinner.start("Tailoring resume (Gemini)...");
      const tailorResult = await tailorResume(profile, job.content, matchResult.value);
      if (!tailorResult.ok) {
        spinner.stop(`Tailoring failed: ${tailorResult.error.message}`);
        process.exit(1);
      }
      spinner.stop(`Resume tailored: ${tailorResult.value.bullets.length} bullets`);

      // 4. Cover letter
      spinner.start("Generating cover letter (Gemini)...");
      const coverResult = await generateCoverLetter(profile, job.content, tailorResult.value);
      if (!coverResult.ok) {
        spinner.stop(`Cover letter failed: ${coverResult.error.message}`);
        process.exit(1);
      }
      spinner.stop(`Cover letter generated (${coverResult.value.tone} tone)`);

      // 5. Review
      spinner.start("Quality review (Claude)...");
      const reviewResult = await reviewApplication(tailorResult.value, coverResult.value, job.content);
      if (!reviewResult.ok) {
        spinner.stop(`Review failed: ${reviewResult.error.message}`);
        process.exit(1);
      }
      const review = reviewResult.value;
      spinner.stop(`Quality: ${review.qualityScore}/100 — ${review.approved ? "APPROVED" : "NEEDS WORK"}`);

      if (review.suggestions.length > 0) {
        clack.log.info("Suggestions:");
        for (const s of review.suggestions) {
          console.log(`    • ${s}`);
        }
      }

      // 6. Answer form questions
      if (questions.length > 0) {
        spinner.start(`Answering ${questions.length} form questions (Claude)...`);
        const answerResult = await answerFormQuestions(profile, questions, job.content);
        if (!answerResult.ok) {
          spinner.stop(`Form answers failed: ${answerResult.error.message}`);
          process.exit(1);
        }
        spinner.stop(`${answerResult.value.length} form fields answered`);
      }

      // 7. Render PDF
      spinner.start("Rendering resume PDF...");
      const pdf = await renderResume({
        profile,
        tailoredBullets: tailorResult.value.bullets,
        tailoredSummary: tailorResult.value.summary,
      });
      spinner.stop(`Resume PDF: ${(pdf.length / 1024).toFixed(1)} KB`);

      if (opts.dryRun) {
        clack.log.info("\n--- DRY RUN OUTPUT ---");
        clack.log.info(`\nTailored Summary:\n  ${tailorResult.value.summary}`);
        clack.log.info(`\nTailored Bullets:`);
        for (const b of tailorResult.value.bullets) {
          console.log(`    • ${b}`);
        }
        clack.log.info(`\nCover Letter:\n${coverResult.value.text}`);
        clack.outro("Dry run complete. No application submitted.");
      } else {
        clack.log.warn("Live submission requires Playwright worker. Use --dry-run for now.");
        clack.outro("Application materials generated.");
      }
    } catch (e) {
      spinner.stop("Pipeline error");
      clack.log.error(`${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    }
  });

// ── dashboard ────────────────────────────────────────────────────────────────

program
  .command("dashboard")
  .description("Launch the web dashboard")
  .action(async () => {
    clack.intro("Launching GemClaw JobSeek dashboard...");
    const { execSync } = await import("node:child_process");
    try {
      execSync("pnpm --filter @repo/web dev", { stdio: "inherit", cwd: resolve(__dirname, "../..") });
    } catch {
      clack.log.error("Failed to start dashboard. Make sure you're in the monorepo root.");
    }
  });

program.parse();

// ── Config helpers ───────────────────────────────────────────────────────────

interface LocalConfig {
  profile?: import("@repo/core").UserProfile;
  minFitScore?: number;
  defaultBoardToken?: string;
}

function loadConfig(): LocalConfig {
  if (existsSync(CONFIG_PATH)) {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  }
  return {};
}

function saveConfig(config: LocalConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}
