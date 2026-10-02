import { describe, expect, it } from "vitest";
import { PROJECTS, type Project } from "./backlog-data";
import { rank } from "./backlog-rank";

const base: Project = {
  id: "a",
  name: "A",
  team: "T",
  hoursPerWeek: 4,
  weeksToShip: 2,
  blast: 1,
  dataReady: 0.9,
  owner: "Owner",
  question: "Q?",
};

describe("rank", () => {
  it("holds projects with no owner, unreachable data, or too much risk", () => {
    const projects: Project[] = [
      base,
      { ...base, id: "no-owner", owner: null },
      { ...base, id: "no-data", dataReady: 0.2 },
      { ...base, id: "risky", blast: 3 },
    ];
    const { ranked, held } = rank(projects, 100, 50, 2);
    expect(ranked.map((r) => r.project.id)).toEqual(["a"]);
    expect(held.map((h) => [h.project.id, h.why.split(":")[0]])).toEqual([
      ["no-owner", "Declined"],
      ["no-data", "Declined"],
      ["risky", "Held"],
    ]);
  });

  it("ranks by value when speed weight is zero and by speed when it is 100", () => {
    const big: Project = { ...base, id: "big", hoursPerWeek: 10, weeksToShip: 8 };
    const fast: Project = { ...base, id: "fast", hoursPerWeek: 2, weeksToShip: 1 };
    expect(rank([big, fast], 100, 0, 3).ranked[0]?.project.id).toBe("big");
    expect(rank([big, fast], 100, 100, 3).ranked[0]?.project.id).toBe("fast");
  });

  it("anchors value to headcount hours", () => {
    const { ranked } = rank([base], 100, 0, 3);
    expect(ranked[0]?.valuePerYear).toBe(4 * 48 * 100);
    expect(ranked[0]?.fte).toBeCloseTo((4 * 48) / 1800);
  });

  it("returns an empty ranking without throwing when everything is held", () => {
    const { ranked, held } = rank([{ ...base, owner: null }], 100, 50, 3);
    expect(ranked).toEqual([]);
    expect(held).toHaveLength(1);
  });

  it("keeps the shipped fixtures honest: some projects are held at default settings", () => {
    const { ranked, held } = rank(PROJECTS, 95, 40, 2);
    expect(ranked.length).toBeGreaterThan(0);
    expect(held.length).toBeGreaterThan(0);
    expect(ranked.length + held.length).toBe(PROJECTS.length);
  });
});
