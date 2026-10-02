import type { Metadata } from "next";
import { BacklogRanker } from "./backlog-ranker";
import {
  ARCHIVE,
  BUILD_TIME,
  FORWARD,
  FULL_STACK,
  HERO,
  NAV,
  PERSON,
  PLAN,
  PROOF_BAR,
  PROOF_LINKS,
  THESIS,
} from "./data";
import { body, display, mono } from "./fonts";
import { LeadGate } from "./lead-gate";
import s from "./poc.module.css";
import { ProcessToSpec } from "./process-to-spec";
import { CLAIMS, type Claim, LEDGER_AS_OF, STATUS_LABEL, claim } from "./research";
import { SectionNav } from "./section-nav";

const DESCRIPTION =
  "A work sample for Zenity's GTM AI Engineer role: three internal GTM systems, each gated before it acts and audited after. Researched, written, designed, and built by Bret Kerr.";

export const metadata: Metadata = {
  title: "Make Zenity's GTM its own first customer · Bret Kerr",
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    title: "Make Zenity's GTM its own first customer",
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Make Zenity's GTM its own first customer",
    description: DESCRIPTION,
  },
};

const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

function Cite({ id }: { id: string }) {
  const c = claim(id);
  return (
    <a className={s.cite} href={`#claim-${c.id}`} aria-label={`Source: ledger entry ${c.id}`}>
      {c.id.toUpperCase()}
    </a>
  );
}

function statusClass(c: Claim): string {
  if (c.status === "verified-current" || c.status === "verified-historical")
    return `${s.status} ${s.statusStrong}`;
  if (c.status === "superseded" || c.status === "hypothesis")
    return `${s.status} ${s.statusDashed}`;
  return s.status ?? "";
}

export default function ZenityWorkSample() {
  const questions = CLAIMS.filter((c) => c.visibility === "discovery-question" && c.question);
  const peopleWord = WORDS[FULL_STACK.length] ?? String(FULL_STACK.length);

  return (
    <div className={`${s.root} ${display.variable} ${body.variable} ${mono.variable}`}>
      <a className={s.skip} href="#the-work">
        Skip to the work
      </a>
      <SectionNav items={NAV} name={PERSON.name} />

      <main>
        {/* ---------- I · Overview ---------- */}
        <section id="overview" className={s.act} aria-labelledby="overview-h">
          <div className={s.wrap}>
            <header className={s.hero}>
              <span className={s.kicker}>{HERO.kicker}</span>
              <h1 id="overview-h">{HERO.title}</h1>
              <p className={s.dek}>{HERO.dek}</p>
            </header>

            <dl className={s.proofBar}>
              {PROOF_BAR.map((p) => (
                <div className={s.proofItem} key={p.figure}>
                  <dt>{p.figure}</dt>
                  <dd>{p.label}</dd>
                </div>
              ))}
            </dl>

            <aside className={s.forward} aria-label="If this was forwarded to you">
              <span className={s.kicker}>If this was forwarded to you</span>
              <p>
                <strong>{PERSON.name}</strong>: {FORWARD.credential}
              </p>
              <p>
                This page is the work sample. One person researched, wrote, designed, and shipped it
                in {BUILD_TIME}.
              </p>
              <div className={s.ctaRow}>
                <a className={s.btn} href="#the-work">
                  See the gate run <span aria-hidden="true">▸</span>
                </a>
                <a className={s.btnGhost} href="#first-90-days">
                  First 90 days
                </a>
                <a
                  className={s.btnGhost}
                  href={PERSON.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn <span aria-hidden="true">↗</span>
                </a>
              </div>
            </aside>

            <div className={s.thesis}>
              <div className={s.stack} style={{ gap: 12 }}>
                <span className={s.kicker}>Operating thesis</span>
                <h2 className={s.thesisTitle}>{THESIS.title}</h2>
              </div>
              <div className={s.thesisBody}>
                {THESIS.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <p>
                  Zenity&rsquo;s platform now judges each agent decision before it becomes an
                  enterprise action
                  <Cite id="c01" />. More than half of organizations have already had agents exceed
                  their intended permissions <Cite id="c08" />, and internal GTM agents count. A
                  company that sells the decision layer should run it on its own pipeline first.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- II · The work ---------- */}
        <section id="the-work" className={s.act} aria-labelledby="work-h">
          <div className={`${s.wrap} ${s.stack}`}>
            <header className={s.actHead} style={{ marginBottom: 0 }}>
              <span className={s.kicker}>II · The work</span>
              <h2 id="work-h">
                Three internal systems, each run the way Zenity tells customers to run agents
              </h2>
              <p>
                The role owns AI projects end to end across Sales, Marketing, Field Engineering, and
                Partners, and the posting is explicit that this isn&rsquo;t prototype-and-hand-off
                work <Cite id="c15" />. So every module ends in something with an owner, a gate, and
                a log.
              </p>
            </header>

            <div className={s.lede}>
              <p>
                In September, Zenity Labs showed how a public web-to-lead form could carry a dormant
                prompt injection into a CRM agent, leak data through a rendered image, and send
                Slack messages in the agent&rsquo;s name
                <Cite id="c06" />.{" "}
                <strong>Every GTM team runs a form like that, including Zenity&rsquo;s.</strong>
              </p>
              <p>
                Below is an inbound pipeline with a gate in front of every write. Its checks use the
                categories Zenity lists for Runtime Boundaries: intent, identity, action, data,
                tools, history, and policy <Cite id="c02" />.
              </p>
            </div>
            <LeadGate />

            <div className={s.lede}>
              <p>
                The posting&rsquo;s other half is turning undocumented processes into specs and
                working systems
                <Cite id="c16" />. With summits in London on October 8 and New York on October 21{" "}
                <Cite id="c14" />, event follow-up is a natural first candidate.{" "}
                <strong>Start with what people actually said.</strong>
              </p>
            </div>
            <ProcessToSpec />
          </div>
        </section>

        {/* ---------- III · Who I am ---------- */}
        <section id="who-i-am" className={s.act} aria-labelledby="who-h">
          <div className={`${s.wrap} ${s.stack}`}>
            <header className={s.actHead} style={{ marginBottom: 0 }}>
              <span className={s.kicker}>III · Who I am</span>
              <h2 id="who-h">This stack usually takes {peopleWord} people.</h2>
              <p>
                The role sits where GTM judgment, hands-on building, and agent-security context
                meet. Here&rsquo;s the evidence for each, and who usually covers it.
              </p>
            </header>

            <div className={s.tableWrap}>
              <table className={s.table} aria-labelledby="who-h">
                <thead>
                  <tr>
                    <th scope="col">Capability</th>
                    <th scope="col">Evidence</th>
                    <th scope="col">Conventionally</th>
                  </tr>
                </thead>
                <tbody>
                  {FULL_STACK.map((r) => (
                    <tr key={r.capability}>
                      <th scope="row">{r.capability}</th>
                      <td>
                        {r.href ? (
                          <a
                            href={r.href}
                            {...(r.href.startsWith("http")
                              ? { target: "_blank", rel: "noopener noreferrer" }
                              : {})}
                          >
                            {r.evidence}
                          </a>
                        ) : (
                          r.evidence
                        )}
                      </td>
                      <td className={s.conv}>{r.conventionally}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className={s.statement}>
              Researched, written, designed, built, and deployed by one person.
            </p>

            <div className={s.stack} style={{ gap: 16 }}>
              <div className={s.actHead} style={{ marginBottom: 0 }}>
                <h3>What I shipped, who used it, and what broke first</h3>
                <p>
                  The posting asks this question directly <Cite id="c17" />.
                </p>
              </div>
              <ul className={s.archive}>
                {ARCHIVE.map((a) => (
                  <li key={a.shipped} className={s.archiveRow}>
                    <div>
                      <span className={s.kicker}>Shipped</span>
                      {a.shipped}
                    </div>
                    <div>
                      <span className={s.kicker}>Used by</span>
                      {a.usedBy}
                    </div>
                    <div>
                      <span className={s.kicker}>What broke first</span>
                      {a.brokeFirst}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- IV · First 90 days ---------- */}
        <section id="first-90-days" className={s.act} aria-labelledby="plan-h">
          <div className={`${s.wrap} ${s.stack}`}>
            <header className={s.actHead} style={{ marginBottom: 0 }}>
              <span className={s.kicker}>IV · First 90 days</span>
              <h2 id="plan-h">Surface, Enforce, Protect, applied to Zenity&rsquo;s own GTM</h2>
              <p>
                Zenity organizes its platform as three pillars that run as one loop{" "}
                <Cite id="c03" />. This plan borrows the loop. It&rsquo;s illustrative: a work
                sample, not a promise. Week one exists to replace my assumptions with interviews.
              </p>
            </header>

            <ol className={s.phases} style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {PLAN.map((p) => (
                <li key={p.name} className={s.phase}>
                  <span className={s.kicker}>{p.window}</span>
                  <div className={s.phaseName}>
                    <h3>{p.name}</h3>
                  </div>
                  <p className={s.muted}>{p.goal}</p>
                  <ul>
                    {p.moves.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <p className={s.ships}>
                    <span className={s.kicker}>Ships </span>
                    {p.ships}
                  </p>
                </li>
              ))}
            </ol>

            <BacklogRanker />
          </div>
        </section>

        {/* ---------- V · Proof ---------- */}
        <section id="proof" className={s.act} aria-labelledby="proof-h">
          <div className={`${s.wrap} ${s.stack}`}>
            <header className={s.actHead} style={{ marginBottom: 0 }}>
              <span className={s.kicker}>V · Proof</span>
              <h2 id="proof-h">The work behind the work</h2>
              <p>Everything referenced above is live.</p>
            </header>
            <ul className={s.links}>
              {PROOF_LINKS.map((l) => (
                <li key={l.href} className={s.linkItem}>
                  <a className={s.linkA} href={l.href} target="_blank" rel="noopener noreferrer">
                    <h3>
                      {l.title} <span aria-hidden="true">↗</span>
                    </h3>
                    <span>{l.note}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className={s.contact}>
              <a className={s.btn} href={`mailto:${PERSON.email}`}>
                Email {PERSON.name.split(" ")[0]}
              </a>
              <a
                className={s.btnGhost}
                href={PERSON.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
              <span className={s.fine} style={{ alignSelf: "center" }}>
                {PERSON.location}
              </span>
            </div>
          </div>
        </section>

        {/* ---------- Annex ---------- */}
        <section id="annex" className={s.act} aria-labelledby="annex-h">
          <div className={s.wrap}>
            <header className={s.actHead}>
              <span className={s.kicker}>Annex</span>
              <h2 id="annex-h">The research behind the page</h2>
              <p>Collapsed by default. Open what you need.</p>
            </header>

            <details className={s.annex} id="ledger">
              <summary>
                <span className={s.annexTitle}>Claim ledger · {CLAIMS.length} claims, graded</span>
                <span className={s.why}>
                  Why open: see what this page is allowed to assert, what it isn&rsquo;t, and what I
                  got wrong first.
                </span>
              </summary>
              <div className={s.annexBody}>
                <p className={s.fine}>
                  Every statement about Zenity on this page cites one of these rows. Hypotheses
                  never appear as claims; they become discovery questions. Superseded rows stay,
                  marked, with what replaced them. Current as of {LEDGER_AS_OF}.
                </p>
                <div className={s.tableWrap}>
                  <table className={s.ledger}>
                    <thead>
                      <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Claim</th>
                        <th scope="col">Status</th>
                        <th scope="col">Sources</th>
                        <th scope="col">Caveat and implication</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CLAIMS.map((c) => (
                        <tr
                          key={c.id}
                          id={`claim-${c.id}`}
                          className={c.status === "superseded" ? s.ledgerSuperseded : undefined}
                        >
                          <td className={s.ledgerId}>{c.id.toUpperCase()}</td>
                          <td>
                            <span className={s.ledgerClaim}>{c.claim}</span>
                            {c.supersededBy ? (
                              <>
                                {" "}
                                <a href={`#claim-${c.supersededBy}`}>
                                  Replaced by {c.supersededBy.toUpperCase()}
                                </a>
                              </>
                            ) : null}
                          </td>
                          <td>
                            <span className={statusClass(c)}>{STATUS_LABEL[c.status]}</span>
                            <br />
                            <span className={s.fine}>
                              {c.authority} · {c.visibility.replace(/-/g, " ")}
                            </span>
                          </td>
                          <td>
                            {c.sources.length > 0 ? (
                              <ul className={s.srcList}>
                                {c.sources.map((src) => (
                                  <li key={src.url}>
                                    <a href={src.url} target="_blank" rel="noopener noreferrer">
                                      {src.label}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className={s.fine}>None. Reasoning only.</span>
                            )}
                          </td>
                          <td>
                            {c.caveat ? <p>{c.caveat}</p> : null}
                            <p className={s.fine}>{c.implication}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>

            <details className={s.annex}>
              <summary>
                <span className={s.annexTitle}>Discovery questions · {questions.length}</span>
                <span className={s.why}>
                  Why open: the hypotheses I&rsquo;d test in week one, phrased as questions rather
                  than claims.
                </span>
              </summary>
              <div className={s.annexBody}>
                <ol className={s.questions}>
                  {questions.map((q) => (
                    <li key={q.id}>
                      {q.question}{" "}
                      <a href={`#claim-${q.id}`} className={s.cite}>
                        {q.id.toUpperCase()}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </details>

            <details className={s.annex}>
              <summary>
                <span className={s.annexTitle}>Colophon</span>
                <span className={s.why}>
                  Why open: how this page was built, and what it deliberately doesn&rsquo;t do.
                </span>
              </summary>
              <div className={`${s.annexBody} ${s.colophon}`}>
                <p>
                  Built with Claude Code on Next.js 15 (App Router) and React 19. The claim ledger
                  is a typed, server-only module: the page fails to build if it cites a missing
                  claim or asserts a hypothesis.
                </p>
                <p>
                  The three modules are deterministic simulations that run in the browser. No model,
                  no network calls, no tracking, and no chatbot. The page itself is the
                  demonstration.
                </p>
                <p>
                  Research went through the ledger before any copy was written. Two of my own
                  earlier notes were wrong: a survey figure and a launch date. The ledger shows both
                  corrections.
                </p>
                <p>
                  Type: Familjen Grotesk, Instrument Sans, and JetBrains Mono, self-hosted under the
                  SIL Open Font License.
                </p>
              </div>
            </details>
          </div>
        </section>
      </main>

      <footer className={`${s.wrap} ${s.footer}`}>
        <p>
          Independent work sample by {PERSON.name}. Not affiliated with, sponsored by, or endorsed
          by Zenity. Zenity, Zenity Labs, and Runtime Boundaries are trademarks of their owner.
          Salesforce, Agentforce, HubSpot, Workato, Zapier, Slack, Microsoft Copilot, Claude Code,
          Vercel, and AWS are trademarks of their respective owners. Names are used only to describe
          publicly reported facts.
        </p>
        <p>
          Simulations use fictional people, companies, and domains. Research current as of{" "}
          {LEDGER_AS_OF}.
        </p>
      </footer>
    </div>
  );
}
