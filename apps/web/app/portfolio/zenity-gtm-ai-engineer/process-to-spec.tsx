"use client";

import { useState } from "react";
import s from "./poc.module.css";
import { PROCESSES, STEPS, type StepId } from "./process-data";
import { Segmented } from "./segmented";

export function ProcessToSpec() {
  const [processId, setProcessId] = useState<string>(PROCESSES[0]?.id ?? "");
  const [step, setStep] = useState<StepId>("heard");

  const p = PROCESSES.find((x) => x.id === processId) ?? PROCESSES[0];
  if (!p) return null;
  const stepIndex = STEPS.findIndex((x) => x.id === step);
  const prev = STEPS[stepIndex - 1];
  const next = STEPS[stepIndex + 1];

  return (
    <div className={s.module}>
      <div className={s.moduleHead}>
        <div className={s.moduleIntro}>
          <span className={s.kicker}>Module 2 · Surface</span>
          <h3>From what people said to a system someone owns</h3>
          <p className={s.muted}>
            Interview notes compressed into procedures, constraints, and decisions, the template
            from my SkillMemoryBank project, then built with a gate on every write.
          </p>
        </div>
        <Segmented
          label="Choose a process"
          idPrefix="spec"
          options={PROCESSES.map((x) => ({ id: x.id, label: x.label }))}
          value={p.id}
          onChange={(id) => {
            setProcessId(id);
            setStep("heard");
          }}
        />
      </div>

      <div
        id="spec-panel"
        role="tabpanel"
        aria-labelledby={`spec-tab-${p.id}`}
        className={s.stack}
        style={{ gap: 18 }}
      >
        <ol className={s.stepper} aria-label="Steps">
          {STEPS.map((x, i) => (
            <li key={x.id}>
              <button
                type="button"
                className={s.stepBtn}
                aria-current={x.id === step ? "step" : undefined}
                onClick={() => setStep(x.id)}
              >
                <span className={s.stepNum}>{i + 1}</span>
                {x.label}
              </button>
            </li>
          ))}
        </ol>

        {step === "heard" ? (
          <div className={s.stack} style={{ gap: 12 }}>
            <ul className={s.quotes}>
              {p.heard.map((h) => (
                <li key={h.who + h.said} className={s.quote}>
                  <span className={s.kicker}>{h.who}</span>
                  <q>{h.said}</q>
                </li>
              ))}
            </ul>
            <p className={s.fine}>
              Illustrative lines, written before any interview. Week one replaces them with real
              ones.
            </p>
          </div>
        ) : null}

        {step === "spec" ? (
          <div className={s.stack} style={{ gap: 14 }}>
            <dl className={s.specMeta}>
              <div>
                <dt>Owner</dt>
                <dd>{p.owner}</dd>
              </div>
              <div>
                <dt>Trigger</dt>
                <dd>{p.trigger}</dd>
              </div>
              <div>
                <dt>Success metric</dt>
                <dd>{p.metric}</dd>
              </div>
            </dl>
            <div className={s.specGrid}>
              <section className={s.specBlock} aria-label="Procedures">
                <span className={s.kicker}>Procedures</span>
                <ul>
                  {p.procedures.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
              <section className={s.specBlock} aria-label="Constraints">
                <span className={s.kicker}>Constraints</span>
                <ul>
                  {p.constraints.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
              <section className={s.specBlock} aria-label="Decisions">
                <span className={s.kicker}>Decisions</span>
                <ul>
                  {p.decisions.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
            </div>
            <p className={s.after}>
              <span className={s.kicker}>What will break first </span>
              {p.breaksFirst}
            </p>
          </div>
        ) : null}

        {step === "system" ? (
          <div className={s.stack} style={{ gap: 12 }}>
            <ol className={s.pipeline}>
              {p.system.map((x) => (
                <li key={x.step} className={`${s.pipe} ${x.gated ? s.pipeGated : ""}`}>
                  <span className={s.pipeStep}>{x.step}</span>
                  <span className={s.kicker}>
                    {x.tool}
                    {x.gated ? " · gated" : ""}
                  </span>
                  <span>{x.note}</span>
                </li>
              ))}
            </ol>
            <p className={s.fine}>
              Dashed steps pass a decision gate before they act. Every step writes to the decision
              log.
            </p>
          </div>
        ) : null}

        <div className={s.stepNav}>
          <button
            type="button"
            className={s.btnGhost}
            disabled={!prev}
            onClick={() => prev && setStep(prev.id)}
          >
            ← {prev ? prev.label : "Back"}
          </button>
          <button
            type="button"
            className={next ? s.btn : s.btnGhost}
            disabled={!next}
            onClick={() => next && setStep(next.id)}
          >
            {next ? next.label : "End"} →
          </button>
        </div>
      </div>
    </div>
  );
}
