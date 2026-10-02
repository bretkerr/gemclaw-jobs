import { describe, expect, it } from "vitest";
import { POLICY, SCENARIOS } from "./lead-gate-data";

const ruleIds = new Set(POLICY.map((p) => p.id));

describe("lead-gate fixtures", () => {
  it("cites only rules that exist in the policy", () => {
    for (const sc of SCENARIOS) {
      for (const a of sc.actions) {
        for (const r of a.rule.split(",").map((x) => x.trim())) {
          expect(ruleIds.has(r), `${sc.id}/${a.id} cites ${r}`).toBe(true);
        }
      }
    }
  });

  it("uses only reserved example domains", () => {
    const text = JSON.stringify(SCENARIOS);
    const domains = text.match(/[a-z0-9-]+\.(?:com|io|net|org|example)\b/g) ?? [];
    for (const d of domains) expect(d.endsWith(".example"), d).toBe(true);
  });

  it("blocks the external fetch and the agent-voiced reply in the hostile scenario", () => {
    const hostile = SCENARIOS.find((s) => s.id === "hostile");
    expect(hostile).toBeDefined();
    const verdicts = Object.fromEntries((hostile?.actions ?? []).map((a) => [a.id, a.verdict]));
    expect(verdicts.render).toBe("block");
    expect(verdicts.reply).toBe("block");
    expect(verdicts.summarize).toBe("block");
  });

  it("declines rather than guesses when evidence is thin", () => {
    const thin = SCENARIOS.find((s) => s.id === "thin");
    const verdicts = (thin?.actions ?? []).map((a) => a.verdict);
    expect(verdicts).toContain("decline");
    expect(verdicts).not.toContain("block");
  });

  it("flags at least one failing check on every non-allow verdict", () => {
    for (const sc of SCENARIOS) {
      for (const a of sc.actions) {
        if (a.verdict === "allow") continue;
        expect(
          a.checks.some((c) => c.fail),
          `${sc.id}/${a.id}`,
        ).toBe(true);
      }
    }
  });
});
