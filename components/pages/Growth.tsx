"use client";
import Link from "next/link";
import { MODULES, PULSE_OPEN, PULSE_Q, ROLEPLAYS, SELF_SKILLS, type Module } from "@/content";
import { raw } from "@/lib/html";
import { avgOf, modProgress } from "@/lib/progress";
import type { ScenarioAttempt, ScenarioPicks } from "@/lib/state";
import { update, useLeader } from "@/lib/store";
import { CopyButton, RateChip } from "../ui";
import { useOpenRoleplay } from "../useOpenRoleplay";

type Grp = "self0" | "self12" | "pulse0" | "pulse12";

function DeltaChip({ a, b }: { a: number | null; b: number | null }) {
  if (a == null || b == null) return null;
  const d = Math.round((b - a) * 10) / 10;
  return <span className={`delta ${d > 0 ? "up" : d < 0 ? "down" : ""}`}>{d > 0 ? "+" : ""}{d}</span>;
}

export function BarPair({ a, b, max }: { a: number; b: number; max: number }) {
  const w = (x: number) => (x ? Math.round((x / max) * 100) : 0);
  return <div className="bars"><div className="b0" style={{ width: `${w(a)}%` }} /><div className="b1" style={{ width: `${w(b)}%` }} /></div>;
}

const PULSE_TEXT =
  "Team pulse (anonymous)\nRate each from 1 (strongly disagree) to 5 (strongly agree).\n\n" +
  PULSE_Q.map((q, i) => i + 1 + ". " + q).join("\n") +
  "\n\nOpen questions:\n" + PULSE_OPEN.map((q) => "- " + q).join("\n");

export function Growth() {
  const s = useLeader();
  const g = s.growth;
  const open = useOpenRoleplay();
  const s0 = avgOf(g.self0, SELF_SKILLS.length), s1 = avgOf(g.self12, SELF_SKILLS.length);
  const p0 = avgOf(g.pulse0, PULSE_Q.length), p1 = avgOf(g.pulse12, PULSE_Q.length);
  const rpRuns = ROLEPLAYS.reduce((a, r) => a + (s.rp[r.id]?.history ?? []).length, 0);
  const setGrow = (grp: Grp, i: number, v: string) => update((d) => { d.growth[grp][i] = v; });

  const sel = (grp: Grp, i: number) => (
    <select id={`${grp}-${i}`} aria-label={`${grp === "self0" ? "Week 0" : "Week 12"} rating`} value={g[grp][i] ?? ""} onChange={(e) => setGrow(grp, i, e.target.value)}>
      <option value="">–</option>
      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={String(n)}>{n}</option>)}
    </select>
  );
  // Same rule as the reference: keep only values from 1 to 5; anything else leaves the last good value.
  const num = (grp: Grp, i: number) => (
    <input type="text" inputMode="decimal" id={`${grp}-${i}`} placeholder="1.0–5.0" aria-label={`${grp === "pulse0" ? "Week 0" : "Week 12"} average`}
      value={g[grp][i] ?? ""}
      onChange={(e) => { const v = e.target.value.trim(), n = Number(v); if (!v || (n >= 1 && n <= 5)) setGrow(grp, i, v); }} />
  );
  const count = (key: "n0" | "n12") => (
    <input type="text" inputMode="numeric" id={key} aria-label={`${key === "n0" ? "Week 0" : "Week 12"} responses`} value={g[key]}
      onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); update((d) => { d.growth[key] = v; }); }} />
  );

  return (
    <>
      <div className="mhead"><div className="eyebrow">Start here</div><h2>My <em>growth</em></h2><div className="sub">Measure where you start, and see how far you&apos;ve come</div></div>
      <div className="tiles">
        <div className="tile"><span>Self-assessment</span><b>{s0 ?? "–"} → {s1 ?? "–"}</b><DeltaChip a={s0} b={s1} /><small>Average of 5, Week 0 to Week 12</small></div>
        <div className="tile"><span>Team pulse</span><b>{p0 ?? "–"} → {p1 ?? "–"}</b><DeltaChip a={p0} b={p1} /><small>Average of 5, from your team</small></div>
        <div className="tile"><span>Practice conversations</span><b>{rpRuns}</b><small>Scored sessions in the studio</small></div>
      </div>

      <section className="blk"><h3>My progress</h3><p className="lede">How far you are through each module. Each one counts its scenario, practice conversation, practice items and reflections.</p>
        <div className="checks">
          {MODULES.map((m) => {
            const p = modProgress(s, m);
            return (
              <Link key={m.id} href={`/module/${m.id}`} scroll={false} className="check linkrow">
                <span className="min">{p.pct}%</span>
                <span {...raw(`<b>${m.short}</b><small>${m.weeks} · ${p.done} of ${p.total} done</small>`)} />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="blk"><h3>Scenarios: first try and latest</h3><p className="lede">Your first answers are kept the first time you work each scenario. If you try a scenario again, your latest answers appear beside them.</p>
        <ScenarioHistory picks={s.picks} />
      </section>

      <section className="blk"><h3>Self-assessment</h3><p className="lede">Rate yourself from 1 (not yet) to 5 (consistently) in Week 0, and again in Week 12 without looking back first. Most new leaders rate themselves lower on a few skills at Week 12. That usually means they understand the skill better, not that they&apos;ve gotten worse.</p>
        <div className="gtable"><div className="gh"><span>Skill</span><span>Week 0</span><span>Week 12</span><span></span></div>
          {SELF_SKILLS.map((sk, i) => (
            <div className="gr" key={i}><span {...raw(sk)} />{sel("self0", i)}{sel("self12", i)}<div><BarPair a={Number(g.self0[i]) || 0} b={Number(g.self12[i]) || 0} max={5} /></div></div>
          ))}
        </div>
      </section>

      <section className="blk"><h3>Team pulse</h3><p className="lede">An anonymous survey your team completes in Week 0 and Week 12. Ask your leader to send it and share the averages with you, so responses stay anonymous. Wait for at least four responses before looking at results.</p>
        <div className="tool"><h3>The survey</h3><p className="lede">Ten statements rated 1 (strongly disagree) to 5 (strongly agree), plus two open questions. Copy it into an anonymous survey tool.</p>
          <ol className="qlist">
            {PULSE_Q.map((q, i) => <li key={i} {...raw(q)} />)}
            {PULSE_OPEN.map((q, i) => <li key={"o" + i} {...raw(`${q} <i>(open answer)</i>`)} />)}
          </ol>
          <CopyButton text={PULSE_TEXT} targetId="pulse" />
          <pre className="sr" id="out-pulse">{PULSE_TEXT}</pre>
        </div>
        <div className="gtable"><div className="gh"><span>Statement</span><span>Week 0</span><span>Week 12</span><span></span></div>
          {PULSE_Q.map((q, i) => (
            <div className="gr" key={i}><span {...raw(q)} />{num("pulse0", i)}{num("pulse12", i)}<div><BarPair a={Number(g.pulse0[i]) || 0} b={Number(g.pulse12[i]) || 0} max={5} /></div></div>
          ))}
          <div className="gr"><span><b>Number of responses</b></span>{count("n0")}{count("n12")}<div></div></div>
        </div>
        <div className="legend"><span><i className="b0"></i>Week 0</span><span><i className="b1"></i>Week 12</span></div>
      </section>

      <section className="blk"><h3>Practice scores</h3><p className="lede">Your scored sessions in the Practice studio, by conversation.</p>
        <div className="checks">
          {ROLEPLAYS.map((r) => {
            const h = s.rp[r.id]?.history ?? [];
            return (
              <button key={r.id} className="check linkrow" onClick={() => open(r.id)}>
                <span className="min">{h.length ? h[h.length - 1].avg + "/3" : "–"}</span>
                <span><b {...raw(r.title)} /><small>{h.length ? h.map((x) => x.avg + " (" + x.mode + ")").join(" → ") : "Not practiced yet"}</small></span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function Attempt({ m, a, label, said }: { m: Module; a: ScenarioAttempt; label: string; said?: string }) {
  const choice = (step: number, k?: number) => {
    if (k == null) return null;
    const o = m.scenario.steps[step].options[k];
    return <p key={step}><RateChip r={o.r} /> <span {...raw(o.t)} /></p>;
  };
  return (
    <div>
      <span className="eyebrow">{label}</span>
      {said != null
        ? (said.trim() ? <p><b>Wrote:</b> “{said}”</p> : <p className="note">Didn&apos;t write a first response.</p>)
        : null}
      {choice(0, a.s0)}
      {choice(1, a.s1)}
      {a.s0 == null ? <p className="note">Not finished yet.</p> : null}
    </div>
  );
}

function ScenarioHistory({ picks }: { picks: Record<string, ScenarioPicks> }) {
  const worked = MODULES.filter((m) => picks[m.id]?.first);
  if (!worked.length) return <p className="note">Your answers appear here once you work through a module&apos;s scenario.</p>;
  return (
    <div className="stack">
      {worked.map((m) => {
        const pk = picks[m.id], first = pk.first!;
        const edited = (pk.say ?? "") !== first.say;
        return (
          <div className="card" key={m.id}>
            <Link href={`/module/${m.id}`} scroll={false} className="eyebrow" {...raw(`${m.weeks} · ${m.short}`)} />
            <div className="attempts">
              <Attempt m={m} a={first} label="First try" said={first.say} />
              {pk.retried
                ? <Attempt m={m} a={{ say: pk.say ?? "", s0: pk.s0, s1: pk.s1 }} label="Latest" said={edited ? pk.say ?? "" : undefined} />
                : <div><span className="eyebrow">Latest</span><p className="note">No second try yet. Use “Try the scenario again” in the module to compare.</p></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
