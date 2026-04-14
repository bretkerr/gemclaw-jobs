import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

describe("CLI", () => {
  const cliPath = resolve(__dirname, "index.ts");

  it("shows help text", () => {
    const output = execSync(`npx tsx ${cliPath} --help`, { encoding: "utf-8" });
    expect(output).toContain("GemClaw JobSeek");
    expect(output).toContain("profile");
    expect(output).toContain("discover");
    expect(output).toContain("apply");
    expect(output).toContain("dashboard");
  });

  it("shows version", () => {
    const output = execSync(`npx tsx ${cliPath} --version`, { encoding: "utf-8" });
    expect(output.trim()).toBe("0.1.0");
  });
});
