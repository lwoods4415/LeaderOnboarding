"use client";
// Cohort dashboard (admin only), ported from the reference page's renderDashboard and
// renderLeaderDetail. Shows only what the privacy rules allow: progress, scenario answers,
// practice scores and feedback, growth numbers, and items each leader chose to share.
import { useEffect, useMemo, useState } from "react";
import type { ProgramContent } from "@/content/program";
import { useProgram } from "@/lib/program";
import { raw } from "@/lib/html";
import { rpAvg } from "@/lib/progress";
import {
  avg, change, costOf, currentModule, lessonCheckSummary, loadDashboard, lowestSkills, practiceAvg, pulseAvg, selfAvg, strongChoices, summaryCsv,
  type DashData, type DashLeader,
} from "@/lib/dashboard";
import { useProfile } from "../Account";
import { Attempt, BarPair } from "./Growth";
import { isCustomId } from "@/content/custom-practice";
import type { RpState, Turn } from "@/lib/state";

const ago = (ts: string | null) => {
  if (!ts) return "–";
  const days = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : days + " days ago";
};
const sign = (x: number | null) => (x == null ? "–" : (x > 0 ? "+" : "") + x);
const wk = (weeks: string) => weeks.replace("Weeks ", "Wk ").replace("Week ", "Wk ");

export function Dashboard() {
  const profile = useProfile();
  const [data, setData] = useState<DashData | null>(null);
  const [error, setError] = useState(false);
  const [cohort, setCohort] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const program = useProgram();
  const { modules: MODULES } = program;
  const isAdmin = profile?.orgRole === "org_admin";
  const load = () => loadDashboard(profile!.orgId, profile!.orgProgramId, program);

  useEffect(() => {
    if (isAdmin) load().then(setData, () => setError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per organization
  }, [isAdmin, profile?.orgId]);

  const cohorts = useMemo(() => [...new Set((data?.leaders ?? []).map((l) => l.cohort).filter(Boolean))].sort(), [data]);
  const docs = useMemo(() => (data?.leaders ?? []).filter((l) => !cohort || l.cohort === cohort), [data, cohort]);

  if (!isAdmin) return <><div className="mhead"><h2>Cohort dashboard</h2></div><p>Only your organization&apos;s program admins can see this page.</p></>;

  const head = (
    <>
      <div className="mhead"><div className="eyebrow">Only visible to you</div><h2>Cohort <em>dashboard</em></h2><div className="sub">Progress, scenario choices, practice scores and growth for every leader</div></div>
      <div className="dash-bar">
        <label htmlFor="coh-filter">Cohort
          <select id="coh-filter" value={cohort} onChange={(e) => { setCohort(e.target.value); setSel(null); }}>
            <option value="">All cohorts</option>
            {cohorts.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <span className="note">{docs.length} leader{docs.length === 1 ? "" : "s"}.</span>
        {docs.length ? <button className="btn" onClick={() => download(docs, cohort, program)}>Download summary (CSV)</button> : null}
        <button className="btn ghost" onClick={() => { setData(null); load().then(setData, () => setError(true)); }}>Refresh</button>
      </div>
    </>
  );
  if (error) return <>{head}<p className="msg-err">Couldn&apos;t load the dashboard. Refresh the page and try again.</p></>;
  if (!data) return <>{head}<p className="note">Loading…</p></>;
  if (!docs.length) {
    return <>{head}<div className="empty-dash"><h3>No leaders here yet</h3><p>Leaders appear here once you invite them on the Leaders and cohorts page. Their progress shows as soon as they start working.</p></div></>;
  }

  const comp = avg(docs.map((d) => d.overall));
  const prac = avg(docs.map(practiceAvg));
  const selfD = avg(docs.map((d) => change(selfAvg(d, 0, program), selfAvg(d, 12, program))));
  const pulseD = avg(docs.map((d) => change(pulseAvg(d, 0, program), pulseAvg(d, 12, program))));
  const skills = lowestSkills(docs, program);
  const scen = strongChoices(docs, program);
  const lessonChecks = lessonCheckSummary(docs, program);
  const lessonCount = program.coreLessons?.length ?? 0;
  const ids = new Set(docs.map((d) => d.id));
  const usage = data.usage.filter((u) => u.userId && ids.has(u.userId));
  const costs = usage.map(costOf);
  const cost = costs.every((c) => c != null) ? costs.reduce<number>((a, c) => a + (c ?? 0), 0) : null;
  const selected = docs.find((d) => d.id === sel);

  return (
    <>
      {head}
      <div className="tiles">
        <div className="tile"><span>Average completion</span><b>{comp ?? 0}%</b><small>Across {docs.length} leader{docs.length === 1 ? "" : "s"}</small></div>
        <div className="tile"><span>Average practice score</span><b>{prac ?? "–"}</b><small>Of 3, latest scored sessions</small></div>
        <div className="tile"><span>Growth, Week 0 to 12</span><b>{sign(selfD)} / {sign(pulseD)}</b><small>Self-assessment / team pulse change</small></div>
      </div>
      <section className="blk"><h3>Focus for your next lab</h3>
        <div className="learn">
          <div className="card"><h4>Lowest practice skills</h4>
            {skills.length ? <ul className="plain">{skills.slice(0, 4).map((x, i) => (
              <li key={i}><b>{x.skill}</b> · {x.a}/3 <span className="note">(<span {...raw(x.conv)} />, {x.n} leader{x.n === 1 ? "" : "s"})</span></li>
            ))}</ul> : <p className="note">Appears once leaders complete scored practice conversations.</p>}
          </div>
          <div className="card"><h4>Scenario choices by module</h4>
            {scen.length ? <ul className="plain">{scen.map((x) => (
              <li key={x.m.id}><b {...raw(x.m.short)} /> · {Math.round((x.strong / x.total) * 100)}% strong choices <span className="note">({x.total} choices)</span></li>
            ))}</ul> : <p className="note">Appears once leaders work through scenarios.</p>}
          </div>
        </div>
        {lessonChecks.length ? (
          <div className="card" style={{ marginTop: 12 }}><h4>Core lesson checks</h4>
            <p className="note">Share of leaders who chose the best answer, per question. Low scores are good topics for the lab.</p>
            {lessonChecks.map(({ lesson, completed, questions }) => (
              <details key={lesson.id} style={{ marginTop: 8 }}>
                <summary><b>{lesson.title}</b> <span className="note">· {completed} of {docs.length} completed</span></summary>
                <ul className="plain" style={{ marginTop: 6 }}>{questions.map(({ q, answered, pct }) => (
                  <li key={q.id}>{pct == null ? "–" : `${pct}%`} <span className="note">({answered} answered)</span> · {q.question}</li>
                ))}</ul>
              </details>
            ))}
          </div>
        ) : null}
      </section>
      <section className="blk"><h3>Leaders</h3><p className="lede">Module completion in percent. Select a leader to see their details.</p>
        <div className="hm-wrap"><table className="hm">
          <thead><tr><th>Leader</th>{MODULES.map((m) => <th key={m.id} title={m.short}>{wk(m.weeks)}</th>)}{lessonCount ? <th title="Core lessons completed">Lessons</th> : null}<th>Practice</th><th>Last active</th></tr></thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className={sel === d.id ? "sel" : ""}>
                <th><button className="linkbtn" onClick={() => { setSel(d.id); requestAnimationFrame(() => document.getElementById("dash-detail")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>{d.name}</button><small>{d.cohort || "No cohort"} · {d.overall}%</small></th>
                {MODULES.map((m) => {
                  const p = d.modules.find((x) => x.id === m.id)?.pct ?? 0;
                  return <td key={m.id}><span className={`cell c${p >= 100 ? 4 : p >= 60 ? 3 : p >= 30 ? 2 : p > 0 ? 1 : 0}`} title={`${m.short}: ${p}%`}>{p}</span></td>;
                })}
                {lessonCount ? <td>{(program.coreLessons ?? []).filter((l) => d.lessons[l.id]?.completedAt).length}/{lessonCount}</td> : null}
                <td>{practiceAvg(d) ?? "–"}</td><td>{ago(d.lastActive)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>
      <section className="blk"><h3>Practice partner cost this month</h3>
        <p className="lede">
          {usage.length
            ? <>{usage.length} call{usage.length === 1 ? "" : "s"} to Claude for {cohort || "all cohorts"}{cost != null ? <>, about <b>${cost.toFixed(2)}</b></> : null}. Based on list prices; your Anthropic Console has the exact bill.</>
            : "No practice partner use yet this month."}
        </p>
      </section>
      {selected ? <LeaderDetail d={selected} /> : <p className="note">Select a leader above to see their scenario answers, practice feedback, growth and anything they&apos;ve shared.</p>}
    </>
  );
}

function download(docs: DashLeader[], cohort: string, program: ProgramContent) {
  const blob = new Blob(["﻿" + summaryCsv(docs, program)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `leader-onboarding-${(cohort || "all-cohorts").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function LeaderDetail({ d }: { d: DashLeader }) {
  const program = useProgram();
  const { modules: MODULES, roleplays: ROLEPLAYS, selfSkills: SELF_SKILLS, pulseQ: PULSE_Q } = program;
  const g = d.growth;
  const growthRows = (labels: string[], a?: Record<string, string>, b?: Record<string, string>) => labels.map((l, i) => (
    <div className="gr" key={i}><span {...raw(l)} /><span>{a?.[i] || "–"}</span><span>{b?.[i] || "–"}</span><div><BarPair a={Number(a?.[i]) || 0} b={Number(b?.[i]) || 0} max={5} /></div></div>
  ));
  const worked = MODULES.filter((m) => d.picks[m.id] && (d.picks[m.id].first || d.picks[m.id].s0 != null));
  const prac = ROLEPLAYS.filter((r) => d.rp[r.id]);
  const custom = Object.entries(d.rp).filter(([id, x]) => isCustomId(id) && (x.fb || x.history?.length));
  const lessons = program.coreLessons ?? [];
  // Core lesson questions ("Make it yours" and self-placement) are plain text, shared like reflections.
  const lessonQ = new Map(lessons.flatMap((l) => [...l.makeItYours.questions, ...(l.model.type === "matrix" ? l.model.selfPlacement?.questions ?? [] : [])]
    .map((q) => [q.id, { lesson: l.title, prompt: q.prompt }] as const)));
  const refl = Object.entries(d.shared.refl).filter(([id]) => !lessonQ.has(id)).map(([id, v]) => {
    const m = MODULES.find((x) => x.reflect.some((r) => r.id === id));
    return { id, v, m, q: m?.reflect.find((r) => r.id === id)?.q ?? id };
  });
  const lessonShared = Object.entries(d.shared.refl).filter(([id]) => lessonQ.has(id)).map(([id, v]) => ({ id, v, ...lessonQ.get(id)! }));

  return (
    <section className="blk detail" id="dash-detail">
      <div className="detail-head"><div><span className="eyebrow">{d.cohort || "No cohort"} · last active {ago(d.lastActive)}</span><h3>{d.name}</h3></div><div className="score"><b>{d.overall}%</b><span>complete</span></div></div>
      <p className="note">Currently on: <span {...raw(currentModule(d, program))} /></p>

      <h4 className="dh">Scenario answers: first try and latest</h4>
      {worked.length ? <div className="stack">{worked.map((m) => {
        const pk = d.picks[m.id], first = pk.first ?? { say: pk.say ?? "", s0: pk.s0, s1: pk.s1 };
        const edited = (pk.say ?? "") !== first.say;
        return (
          <div className="card" key={m.id}>
            <span className="eyebrow" {...raw(`${m.weeks} · ${m.short}`)} />
            <div className="attempts">
              <Attempt m={m} a={first} label="First try" said={first.say} />
              {pk.retried
                ? <Attempt m={m} a={{ say: pk.say ?? "", s0: pk.s0, s1: pk.s1 }} label="Latest" said={edited ? pk.say ?? "" : undefined} />
                : <div><span className="eyebrow">Latest</span><p className="note">No second try yet.</p></div>}
            </div>
          </div>
        );
      })}</div> : <p className="note">No scenarios worked yet.</p>}

      <h4 className="dh">Practice studio</h4>
      {prac.length || custom.length ? <div className="stack">{prac.map((r) => {
        const x = d.rp[r.id], f = x.fb, tr = d.shared.rp[r.id], n = x.history?.length ?? 0;
        return (
          <div className="card prac" key={r.id}>
            <div className="fb-head"><div><span className="eyebrow">{r.who} · {n} scored session{n === 1 ? "" : "s"}</span><h4 {...raw(r.title)} /></div><div className="score"><b>{f ? rpAvg(f) : "–"}</b><span>latest of 3</span></div></div>
            {n ? <p className="note">History: {x.history.map((h) => `${h.avg} (${h.mode}, ${h.d})`).join(" → ")}</p> : null}
            {f ? (
              <>
                <p><b>Coach summary:</b> {f.overall ?? ""}</p>
                <div className="fb-rows">{f.scores.map((s, i) => (
                  <div className="fb-row" key={i}><div className="dots">{[1, 2, 3].map((k) => <i key={k} className={k <= Number(s.score) ? "on" : ""} />)}</div><div><b>{s.skill}</b><p>{s.evidence}</p>{s.tip ? <p className="tip">{s.tip}</p> : null}</div></div>
                ))}</div>
                {f.hidden ? <p><b>Uncovered the real issue?</b> {f.hidden}</p> : null}
                {f.next ? <p><b>Practice next:</b> {f.next}</p> : null}
              </>
            ) : null}
            {tr ? (
              <details><summary>Shared conversation ({tr.at})</summary>
                <div className="chat-log static">{tr.turns.map((t, i) => (
                  <div key={i} className={`msg ${t.role === "leader" ? "me" : "them"}`}><span>{t.role === "leader" ? "Leader" : r.who}</span><p>{t.text}</p></div>
                ))}</div>
              </details>
            ) : <p className="note">Full conversation not shared.</p>}
          </div>
        );
      })}</div> : <p className="note">No scored practice conversations yet.</p>}
      {custom.length ? (
        <>
          <p className="note" style={{ marginTop: 12 }}>Scenarios the leader wrote for themselves. Their titles and descriptions stay private; you see scores and coach feedback, and the conversation only if they share it.</p>
          <div className="stack">{custom.map(([id, x], i) => <PracticeCard key={id} title={`Custom scenario ${i + 1}`} who="" x={x} shared={d.shared.rp[id]} />)}</div>
        </>
      ) : null}

      <h4 className="dh">Growth</h4>
      <div className="gtable"><div className="gh"><span>Self-assessment</span><span>Week 0</span><span>Week 12</span><span></span></div>{growthRows(SELF_SKILLS, g?.self0, g?.self12)}</div>
      <div className="gtable" style={{ marginTop: 12 }}><div className="gh"><span>Team pulse</span><span>Week 0</span><span>Week 12</span><span></span></div>{growthRows(PULSE_Q, g?.pulse0, g?.pulse12)}
        <div className="gr"><span><b>Responses</b></span><span>{g?.n0 || "–"}</span><span>{g?.n12 || "–"}</span><div></div></div>
      </div>

      {lessons.length ? (
        <>
          <h4 className="dh">Core lessons</h4>
          <div className="stack">{lessons.map((l) => {
            const x = d.lessons[l.id];
            const right = l.check.filter((q) => x?.checkAnswers?.[q.id] != null && q.options[x.checkAnswers[q.id]]?.correct).length;
            const answered = l.check.filter((q) => x?.checkAnswers?.[q.id] != null).length;
            return (
              <div className="card" key={l.id}>
                <span className="eyebrow">{x?.completedAt ? `Completed ${x.completedAt}` : x?.opened ? `Opened ${x.opened}` : "Not opened yet"}</span>
                <h4>{l.title}</h4>
                {answered ? <p className="note">Check questions: {right} of {l.check.length} best answers{answered < l.check.length ? ` (${answered} answered)` : ""}</p> : null}
              </div>
            );
          })}</div>
        </>
      ) : null}

      <h4 className="dh">Shared reflections</h4>
      {refl.length ? <div className="stack">{refl.map(({ id, v, m, q }) => (
        <div className="card" key={id}><span className="eyebrow">{m ? <span {...raw(m.short)} /> : null} · shared {v.at}</span><h4 {...raw(q)} /><p>{v.text}</p></div>
      ))}</div> : <p className="note">Nothing shared yet. Reflections stay private unless the leader shares them.</p>}
      {lessonShared.length ? (
        <>
          <h4 className="dh">Shared lesson answers</h4>
          <div className="stack">{lessonShared.map(({ id, v, lesson, prompt }) => (
            <div className="card" key={id}><span className="eyebrow">{lesson} · shared {v.at}</span><h4>{prompt}</h4><p>{v.text}</p></div>
          ))}</div>
        </>
      ) : null}
    </section>
  );
}

/** Scores, history and coach feedback for one of a leader's own scenarios (no scenario text). */
function PracticeCard({ title, who, x, shared }: { title: string; who: string; x: Omit<RpState, "turns">; shared?: { turns: Turn[]; at: string } }) {
  const f = x.fb, n = x.history?.length ?? 0;
  return (
    <div className="card prac">
      <div className="fb-head"><div><span className="eyebrow">{n} scored session{n === 1 ? "" : "s"}</span><h4>{title}</h4></div><div className="score"><b>{f ? rpAvg(f) : "–"}</b><span>latest of 3</span></div></div>
      {n ? <p className="note">History: {x.history.map((h) => `${h.avg} (${h.mode}, ${h.d})`).join(" → ")}</p> : null}
      {f ? (
        <>
          <p><b>Coach summary:</b> {f.overall ?? ""}</p>
          <div className="fb-rows">{f.scores.map((s, i) => (
            <div className="fb-row" key={i}><div className="dots">{[1, 2, 3].map((k) => <i key={k} className={k <= Number(s.score) ? "on" : ""} />)}</div><div><b>{s.skill}</b><p>{s.evidence}</p>{s.tip ? <p className="tip">{s.tip}</p> : null}</div></div>
          ))}</div>
          {f.next ? <p><b>Practice next:</b> {f.next}</p> : null}
        </>
      ) : null}
      {shared ? (
        <details><summary>Shared conversation ({shared.at})</summary>
          <div className="chat-log static">{shared.turns.map((t, i) => (
            <div key={i} className={`msg ${t.role === "leader" ? "me" : "them"}`}><span>{t.role === "leader" ? "Leader" : who || "Practice partner"}</span><p>{t.text}</p></div>
          ))}</div>
        </details>
      ) : <p className="note">Full conversation not shared.</p>}
    </div>
  );
}
