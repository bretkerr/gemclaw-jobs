import { describe, it, expect } from "vitest";
import { loadConfig, defaultConfig } from "./config.js";

describe("config", () => {
  it("returns defaults for empty object", () => {
    const cfg = defaultConfig();
    expect(cfg.ollamaBaseUrl).toBe("http://localhost:11434");
    expect(cfg.costBudgetPerApp).toBe(0.05);
    expect(cfg.autoSubmit).toBe(false);
    expect(cfg.minFitScore).toBe(60);
  });

  it("parses valid config", () => {
    const cfg = loadConfig({
      anthropicApiKey: "sk-test",
      defaultBoardToken: "anthropic",
      minFitScore: 75,
    });
    expect(cfg.anthropicApiKey).toBe("sk-test");
    expect(cfg.defaultBoardToken).toBe("anthropic");
    expect(cfg.minFitScore).toBe(75);
  });

  it("rejects invalid minFitScore", () => {
    expect(() => loadConfig({ minFitScore: 150 })).toThrow();
  });

  it("rejects invalid ollamaBaseUrl", () => {
    expect(() => loadConfig({ ollamaBaseUrl: "not-a-url" })).toThrow();
  });
});
