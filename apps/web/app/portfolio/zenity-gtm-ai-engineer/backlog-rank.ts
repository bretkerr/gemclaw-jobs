import {
  type BlastRadius,
  DATA_READY_MIN,
  HOURS_PER_FTE_YEAR,
  type Project,
  WORK_WEEKS_PER_YEAR,
} from "./backlog-data";

export type Held = { project: Project; why: string };
export type Ranked = { project: Project; score: number; valuePerYear: number; fte: number };

export function rank(
  projects: Project[],
  rate: number,
  speedWeight: number,
  tolerance: BlastRadius,
): { ranked: Ranked[]; held: Held[] } {
  const held: Held[] = [];
  const eligible: Project[] = [];
  for (const p of projects) {
    if (p.owner === null) held.push({ project: p, why: "Declined: no owner yet." });
    else if (p.dataReady < DATA_READY_MIN)
      held.push({ project: p, why: "Declined: the data isn't reachable yet." });
    else if (p.blast > tolerance)
      held.push({ project: p, why: "Held: needs a security review at this risk setting." });
    else eligible.push(p);
  }
  const values = eligible.map((p) => p.hoursPerWeek * WORK_WEEKS_PER_YEAR * rate);
  const maxValue = Math.max(1, ...values);
  const minWeeks = Math.min(...eligible.map((p) => p.weeksToShip), Number.POSITIVE_INFINITY);
  const w = speedWeight / 100;
  const ranked = eligible
    .map((p, i) => {
      const valuePerYear = values[i] ?? 0;
      const score = (1 - w) * (valuePerYear / maxValue) + w * (minWeeks / p.weeksToShip);
      return {
        project: p,
        score,
        valuePerYear,
        fte: (p.hoursPerWeek * WORK_WEEKS_PER_YEAR) / HOURS_PER_FTE_YEAR,
      };
    })
    .sort((a, b) => b.score - a.score);
  return { ranked, held };
}
