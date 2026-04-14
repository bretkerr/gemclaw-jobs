import { z } from "zod";
export const jobseekConfigSchema = z.object({
    anthropicApiKey: z.string().optional(),
    googleApiKey: z.string().optional(),
    ollamaBaseUrl: z.string().url().default("http://localhost:11434"),
    greenhouseApiKey: z.string().optional(),
    defaultBoardToken: z.string().optional(),
    profilePath: z.string().optional(),
    playwrightWorkerUrl: z.string().url().optional(),
    playwrightWorkerToken: z.string().optional(),
    costBudgetPerApp: z.number().positive().default(0.05),
    autoSubmit: z.boolean().default(false),
    minFitScore: z.number().min(0).max(100).default(60),
});
export function loadConfig(raw) {
    return jobseekConfigSchema.parse(raw);
}
export function defaultConfig() {
    return jobseekConfigSchema.parse({});
}
//# sourceMappingURL=config.js.map