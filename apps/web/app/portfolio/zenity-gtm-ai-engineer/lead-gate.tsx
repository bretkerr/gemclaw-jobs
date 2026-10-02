"use client";

import { useEffect, useRef, useState } from "react";
import {
  type LeadScenario,
  POLICY,
  type ProposedAction,
  SCENARIOS,
  VERDICT_GLYPH,
  VERDICT_LABEL,
  type Verdict,
} from "./lead-gate-data";
import s from "./poc.module.css";
import { Segmented } from "./segmented";

const STEP_MS = 420;

const VERDICT_CLASS: Record<Verdict, string | undefined> = {
  allow: s.verdictAllow,
  modify: s.verdictModify,
  block: s.verdictBlock,
  decline: s.verdictDecline,
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function tallyOf(actions: ProposedAction[]): Record<Verdict, number> {
  const t: Record<Verdict, number> = { allow: 0, modify: 0, block: 0, decline: 0 };
  for (const a of actions) t[a.verdict] += 1;
  return t;
}

function logLine(scenario: LeadScenario, a: ProposedAction): string {
  return JSON.stringify(
    {
      workflow: "lead-intake",
      lead: scenario.id,
      step: a.id,
      tool: a.tool,
      verdict: a.verdict,
      rule: a.rule,
    },
    null,
    0,
  );
}

function clearTimer(ref: React.MutableRefObject<ReturnType<typeof setInterval> | null>) {
  if (ref.current) clearInterval(ref.current);
  ref.current = null;
}

export function LeadGate() {
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0]?.id ?? "");
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const scenario = SCENARIOS.find((x) => x.id === scenarioId) ?? SCENARIOS[0];
  const total = scenario?.actions.length ?? 0;
  const done = revealed >= total && total > 0;

  const stop = () => clearTimer(timer);

  useEffect(() => () => clearTimer(timer), []);

  useEffect(() => {
    if (!done || !scenario) return;
    setRunning(false);
    clearTimer(timer);
    const firstInteresting = scenario.actions.find((a) => a.verdict !== "allow");
    setOpenId(firstInteresting?.id ?? null);
  }, [done, scenario]);

  if (!scenario) return null;

  function selectScenario(id: string) {
    stop();
    setScenarioId(id);
    setRevealed(0);
    setRunning(false);
    setOpenId(null);
  }

  function run() {
    stop();
    setOpenId(null);
    if (prefersReducedMotion()) {
      setRevealed(total);
      setOpenId(scenario?.actions.find((a) => a.verdict !== "allow")?.id ?? null);
      return;
    }
    setRevealed(0);
    setRunning(true);
    let n = 0;
    timer.current = setInterval(() => {
      n += 1;
      setRevealed(n);
      if (n >= total) stop();
    }, STEP_MS);
  }

  const tally = tallyOf(scenario.actions.slice(0, revealed));
  const quarantined =
    done && scenario.actions.some((a) => a.id === "create" && a.verdict === "modify");

  return (
    <div className={s.module}>
      <div className={s.moduleHead}>
        <div className={s.moduleIntro}>
          <span className={s.kicker}>Module 1 · Enforce</span>
          <h3>The lead gate</h3>
          <p className={s.muted}>
            An enrichment agent proposes five actions for each inbound lead. The gate judges every
            one before it runs.
          </p>
        </div>
        <Segmented
          label="Choose a lead"
          idPrefix="gate"
          options={SCENARIOS.map((x) => ({ id: x.id, label: x.label }))}
          value={scenario.id}
          onChange={selectScenario}
        />
      </div>

      <div
        className={s.gateGrid}
        id="gate-panel"
        role="tabpanel"
        aria-labelledby={`gate-tab-${scenario.id}`}
      >
        <div className={s.formCard}>
          <span className={s.kicker}>{scenario.source}</span>
          {scenario.fields.map((f) => (
            <div className={s.field} key={f.name}>
              <span className={s.fieldName}>
                {f.name}
                {f.untrusted ? <span className={s.tag}>Untrusted free text</span> : null}
                {f.untrusted && quarantined ? (
                  <span className={`${s.tag} ${s.tagSolid}`}>Quarantined</span>
                ) : null}
              </span>
              <span className={f.untrusted ? s.fieldValueUntrusted : s.fieldValue}>{f.value}</span>
            </div>
          ))}
        </div>

        <div className={s.stack} style={{ gap: 12 }}>
          <div className={s.traceHead}>
            <button type="button" className={s.btn} onClick={run} disabled={running}>
              {running ? "Gate running…" : done ? "Run again" : "Run the gate"}
            </button>
            <div className={s.tally} aria-hidden="true">
              <span>
                Allow <b>{tally.allow}</b>
              </span>
              <span>
                Modify <b>{tally.modify}</b>
              </span>
              <span>
                Block <b>{tally.block}</b>
              </span>
              <span>
                Decline <b>{tally.decline}</b>
              </span>
            </div>
          </div>
          <p aria-live="polite" style={srOnly}>
            {done
              ? `Gate finished: ${tally.allow} allowed, ${tally.modify} modified, ${tally.block} blocked, ${tally.decline} declined.`
              : ""}
          </p>

          <ol className={s.trace}>
            {scenario.actions.map((a, i) => {
              const shown = i < revealed;
              const open = shown && openId === a.id;
              const detailId = `gate-detail-${scenario.id}-${a.id}`;
              return (
                <li key={a.id} className={`${s.traceRow} ${open ? s.traceRowActive : ""}`}>
                  <button
                    type="button"
                    className={s.traceBtn}
                    aria-expanded={shown ? open : undefined}
                    aria-controls={shown ? detailId : undefined}
                    disabled={!shown}
                    onClick={() => setOpenId(open ? null : a.id)}
                  >
                    <span className={s.traceIdx}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={s.traceWhat}>
                      <span className={s.traceAction}>{a.action}</span>
                      <span className={s.traceScope}>
                        {a.tool} · {a.scope}
                      </span>
                    </span>
                    {shown ? (
                      <span className={`${s.verdict} ${VERDICT_CLASS[a.verdict] ?? ""}`}>
                        <span aria-hidden="true">{VERDICT_GLYPH[a.verdict]}</span>
                        {VERDICT_LABEL[a.verdict]}
                      </span>
                    ) : (
                      <span className={`${s.verdict} ${s.verdictPending}`}>Pending</span>
                    )}
                  </button>
                  {open ? (
                    <div className={s.traceDetail} id={detailId}>
                      <p className={s.reason}>
                        {a.reason} <span className={s.fine}>Rule {a.rule}</span>
                      </p>
                      <ul className={s.checks}>
                        {a.checks.map((c) => (
                          <li
                            key={c.dim + c.finding}
                            className={`${s.check} ${c.fail ? s.checkFail : ""}`}
                          >
                            <span className={s.checkDim}>
                              {c.dim}
                              {c.fail ? " · flagged" : ""}
                            </span>
                            {c.finding}
                          </li>
                        ))}
                      </ul>
                      <p className={s.after}>
                        <span className={s.kicker}>Result </span>
                        {a.outcome}
                      </p>
                      <pre className={s.logLine} aria-label="Decision log entry">
                        {logLine(scenario, a)}
                      </pre>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {done ? <p className={s.after}>{scenario.afterwards}</p> : null}
        </div>
      </div>

      <details>
        <summary
          className={s.fine}
          style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}
        >
          Policy in force (six rules)
        </summary>
        <ul className={s.policy} style={{ marginTop: 10 }}>
          {POLICY.map((p) => (
            <li key={p.id}>
              <b>{p.id}</b>
              {p.text}
            </li>
          ))}
        </ul>
      </details>

      <p className={s.moduleNote}>
        Simulation. Deterministic rules running in your browser, with no model and no network calls.
        The people, companies, and domains are fictional. The check categories borrow the ones
        Zenity publicly lists for Runtime Boundaries. This is not Zenity&rsquo;s product or code.
      </p>
    </div>
  );
}

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};
