"use client";

import { useId, useMemo, useState } from "react";
import {
  BLAST_LABEL,
  type BlastRadius,
  HOURS_PER_FTE_YEAR,
  PROJECTS,
  WORK_WEEKS_PER_YEAR,
} from "./backlog-data";
import { rank } from "./backlog-rank";
import { RAPID7_POC } from "./data";
import s from "./poc.module.css";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const TOLERANCE_LABEL: Record<BlastRadius, string> = {
  1: "Low: reads and drafts only",
  2: "Medium: may write to CRM and send messages",
  3: "High: may create infrastructure",
};

export function BacklogRanker() {
  const [rate, setRate] = useState(95);
  const [speed, setSpeed] = useState(40);
  const [tolerance, setTolerance] = useState<BlastRadius>(2);
  const uid = useId();

  const { ranked, held } = useMemo(
    () => rank(PROJECTS, rate, speed, tolerance),
    [rate, speed, tolerance],
  );
  const top = ranked[0]?.score ?? 1;

  return (
    <div className={s.module}>
      <div className={s.moduleHead}>
        <div className={s.moduleIntro}>
          <span className={s.kicker}>Module 3 · Prioritize</span>
          <h3>A backlog that refuses to rank what it can&rsquo;t see</h3>
          <p className={s.muted}>
            Value is tied to hours of headcount, not adjectives. Projects with no owner, unreachable
            data, or more risk than you allow are held out of the ranking with the question that
            would unblock them.
          </p>
        </div>
      </div>

      <fieldset className={s.controls}>
        <legend className={s.fine} style={{ marginBottom: 8 }}>
          Adjust the assumptions
        </legend>
        <div className={s.control}>
          <label className={s.controlLabel} htmlFor={`${uid}-rate`}>
            Loaded cost per hour <output htmlFor={`${uid}-rate`}>{usd.format(rate)}</output>
          </label>
          <input
            id={`${uid}-rate`}
            className={s.range}
            type="range"
            min={50}
            max={200}
            step={5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </div>
        <div className={s.control}>
          <label className={s.controlLabel} htmlFor={`${uid}-speed`}>
            Favor value or speed{" "}
            <output htmlFor={`${uid}-speed`}>
              {speed < 50 ? `Value ${100 - speed}%` : `Speed ${speed}%`}
            </output>
          </label>
          <input
            id={`${uid}-speed`}
            className={s.range}
            type="range"
            min={0}
            max={100}
            step={5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </div>
        <div className={s.control}>
          <label className={s.controlLabel} htmlFor={`${uid}-risk`}>
            Risk allowed without review{" "}
            <output htmlFor={`${uid}-risk`}>{["Low", "Medium", "High"][tolerance - 1]}</output>
          </label>
          <input
            id={`${uid}-risk`}
            className={s.range}
            type="range"
            min={1}
            max={3}
            step={1}
            value={tolerance}
            aria-valuetext={TOLERANCE_LABEL[tolerance]}
            onChange={(e) => setTolerance(Number(e.target.value) as BlastRadius)}
          />
        </div>
      </fieldset>

      <ol className={s.ranked} aria-label="Ranked projects">
        {ranked.map((r, i) => (
          <li key={r.project.id} className={`${s.rankRow} ${i === 0 ? s.rankTop : ""}`}>
            <span className={s.rankNum}>{i + 1}</span>
            <span className={s.rankName}>
              <b>{r.project.name}</b>
              <span>
                {r.project.team} · ships in ~{r.project.weeksToShip} wks ·{" "}
                {BLAST_LABEL[r.project.blast]}
              </span>
            </span>
            <span className={s.bar} aria-hidden="true">
              <span
                className={s.barFill}
                style={{ width: `${Math.round((r.score / top) * 100)}%`, display: "block" }}
              />
            </span>
            <span className={s.rankValue}>
              {usd.format(r.valuePerYear)}/yr
              <br />≈ {r.fte.toFixed(2)} FTE
            </span>
          </li>
        ))}
      </ol>

      {held.length > 0 ? (
        <div className={s.stack} style={{ gap: 10 }}>
          <span className={s.kicker}>Not ranked yet · {held.length}</span>
          <ul className={s.heldList}>
            {held.map((h) => (
              <li key={h.project.id} className={s.held}>
                <b>{h.project.name}</b>
                <span>{h.why}</span>
                <span>
                  Discovery question: <q>{h.project.question}</q>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className={s.moduleNote}>
        Every hour, week, and readiness figure is my assumption, written down so week-one interviews
        can prove it wrong. Value is assumed hours saved per week × {WORK_WEEKS_PER_YEAR} weeks ×
        the loaded rate. FTE assumes {HOURS_PER_FTE_YEAR.toLocaleString("en-US")} working hours a
        year.
      </p>
      <p className={s.after}>
        I&rsquo;ve built this kind of model before, buyer-facing: the{" "}
        <a href={RAPID7_POC} target="_blank" rel="noopener noreferrer">
          ROI calculator in my Rapid7 work sample
        </a>{" "}
        turns a prospect&rsquo;s own inputs into a business case. Same rule there as here: every
        input is visible and adjustable.
      </p>
    </div>
  );
}
