import { z } from "zod";
export declare const jobseekConfigSchema: z.ZodObject<{
    anthropicApiKey: z.ZodOptional<z.ZodString>;
    googleApiKey: z.ZodOptional<z.ZodString>;
    ollamaBaseUrl: z.ZodDefault<z.ZodString>;
    greenhouseApiKey: z.ZodOptional<z.ZodString>;
    defaultBoardToken: z.ZodOptional<z.ZodString>;
    profilePath: z.ZodOptional<z.ZodString>;
    playwrightWorkerUrl: z.ZodOptional<z.ZodString>;
    playwrightWorkerToken: z.ZodOptional<z.ZodString>;
    costBudgetPerApp: z.ZodDefault<z.ZodNumber>;
    autoSubmit: z.ZodDefault<z.ZodBoolean>;
    minFitScore: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    ollamaBaseUrl: string;
    costBudgetPerApp: number;
    autoSubmit: boolean;
    minFitScore: number;
    anthropicApiKey?: string | undefined;
    googleApiKey?: string | undefined;
    greenhouseApiKey?: string | undefined;
    defaultBoardToken?: string | undefined;
    profilePath?: string | undefined;
    playwrightWorkerUrl?: string | undefined;
    playwrightWorkerToken?: string | undefined;
}, {
    anthropicApiKey?: string | undefined;
    googleApiKey?: string | undefined;
    ollamaBaseUrl?: string | undefined;
    greenhouseApiKey?: string | undefined;
    defaultBoardToken?: string | undefined;
    profilePath?: string | undefined;
    playwrightWorkerUrl?: string | undefined;
    playwrightWorkerToken?: string | undefined;
    costBudgetPerApp?: number | undefined;
    autoSubmit?: boolean | undefined;
    minFitScore?: number | undefined;
}>;
export type JobseekConfig = z.infer<typeof jobseekConfigSchema>;
export declare function loadConfig(raw: unknown): JobseekConfig;
export declare function defaultConfig(): JobseekConfig;
//# sourceMappingURL=config.d.ts.map