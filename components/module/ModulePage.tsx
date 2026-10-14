"use client";
import Link from "next/link";
import { useEffect } from "react";
import { MEASURES, MODULES, PROGRAM, roleplayFor, type Module, type Roleplay } from "@/content";
import { PROGRAM_NAME } from "@/program.config";
import { raw } from "@/lib/html";
import { modProgress, rpAvg } from "@/lib/progress";
import { update, useLeader } from "@/lib/store";
import { CheckRow } from "../ui";
import { useOpenRoleplay } from "../useOpenRoleplay";
import { ShareBar } from "./ShareBar";
import { Scenario } from "./Scenario";

export function ModulePage({ id }: { id: string }) {
  const s = useLeader();
  const i = MODULES.findIndex((x) => x.id === id);
  const m = MODULES[i];
  const p = modProgress(s, m);
  const rp = roleplayFor(m.id);
  const prev = MODULES[i - 1], next = MODULES[i + 1];
  // Set here rather than in generateMetadata, which would block prefetching on URL data.
  useEffect(() => { document.title = `${m.weeks}: ${m.short} · ${PROGRAM_NAME}`; }, [m]);
  return (
    <>
      <div className="mhead">
        <div className="eyebrow" {...raw(`${m.weeks} · ${m.eyebrow}`)} />
        <h2 {...raw(m.title)} />
        <div className="sub" {...raw(m.sub)} />
        <div className="bar" aria-label="Module progress"><span style={{ width: `${p.pct}%` }} /></div>
      </div>
      <div className="pair">
        <div className="panel peach"><span className="tag">What changes</span><p {...raw(m.changes)} /></div>
        <div className="panel sky"><span className="tag">The shift</span>
          <dl className="shift"><dt>From</dt><dd {...raw(`“${m.from}”`)} /><dt>To</dt><dd className="to" {...raw(`“${m.to}”`)} /></dl>
        </div>
      </div>
      <section className="blk"><h3>1. Learn</h3><p className="lede">Ideas from leaders and researchers worth knowing at this stage.</p>
        <div className="learn">
          {m.learn.map((l, k) => (
            <div className="card" key={k}><h4 {...raw(l.h)} /><span className="src" {...raw(l.src)} /><p {...raw(l.p)} /></div>
          ))}
        </div>
      </section>
      <section className="blk"><h3>2. Work the scenario</h3><p className="lede">Write what you&apos;d actually say first. Then choose, see what happens, and handle what comes next.</p>
        <Scenario m={m} />
      </section>
      {rp ? (
        <section className="blk"><h3>3. Practice the conversation</h3><p className="lede">Hold this conversation with an AI partner who plays a nurse on your team, then get feedback on each skill.</p>
          <RoleplayCard rp={rp} />
        </section>
      ) : null}
      <section className="blk"><h3>4. Do it for real</h3><p className="lede">Use these in your real work over the next two weeks.</p>
        <div className="checks">{m.practice.map((x) => <CheckRow key={x.id} id={x.id} t={x.t} s={x.s} />)}</div>
        {m.measures ? (
          <div className="card" style={{ marginTop: 12 }}><h4 {...raw(PROGRAM.measuresTitle)} />
            <div className="checks">{MEASURES.map((x) => <CheckRow key={x.id} id={x.id} t={x.t} />)}</div>
          </div>
        ) : null}
      </section>
      <section className="blk"><h3>5. Practice with your cohort</h3><LabBlock m={m} /></section>
      <section className="blk"><h3>6. Reflect</h3><p className="lede">Private to you unless you choose to share a reflection with your program leader.</p>
        <div className="ref">
          {m.reflect.map((r) => (
            <div key={r.id}>
              <label htmlFor={r.id} {...raw(r.q)} />
              <textarea id={r.id} value={s.notes[r.id] ?? ""} onChange={(e) => { const v = e.target.value; update((d) => { d.notes[r.id] = v; }); }} />
              <div className="sharebar"><ShareBar id={r.id} /></div>
            </div>
          ))}
        </div>
      </section>
      <section className="blk"><div className="checkin"><h3>For your 1:1 with your leader</h3>
        <ul>{m.checkin.map((x, k) => <li key={k} {...raw(x)} />)}</ul></div></section>
      <div className="pager">
        {prev
          ? <Link className="btn" href={`/module/${prev.id}`} scroll={false} {...raw(`← ${prev.short}`)} />
          : <Link className="btn" href="/" scroll={false}>← Overview</Link>}
        {next
          ? <Link className="btn primary" href={`/module/${next.id}`} scroll={false} {...raw(`${next.short} →`)} />
          : <Link className="btn primary" href="/growth" scroll={false}>Measure your growth →</Link>}
      </div>
    </>
  );
}

function RoleplayCard({ rp }: { rp: Roleplay }) {
  const st = useLeader().rp[rp.id];
  const avg = st?.fb ? rpAvg(st.fb) : null;
  const open = useOpenRoleplay();
  return (
    <div className="rpcard">
      <div className="rpc-main">
        <span className="eyebrow" {...raw(`Practice with ${rp.who} · ${rp.role}`)} />
        <h4 {...raw(rp.title)} />
        <p {...raw(rp.brief)} />
        <p className="note" {...raw(`<b>Your goal:</b> ${rp.goal}`)} />
      </div>
      <div className="rpc-side">
        {avg != null ? <div className="score"><b>{avg}</b><span>last score of 3</span></div> : null}
        <button className="btn primary" onClick={() => open(rp.id)}>{st?.turns?.length ? "Continue in the studio" : "Start practicing"} →</button>
      </div>
    </div>
  );
}

function LabBlock({ m }: { m: Module }) {
  const l = m.lab;
  return (
    <div className="lab">
      <div className="lab-head"><span className="tag">Leader lab</span><h3 {...raw(l.focus)} /><p className="note">60 minutes with your cohort. Your facilitator runs it using the Leader lab guide.</p></div>
      <ol className="agenda">
        <li><span className="min">10 min</span><div><b>Check-in round</b><p {...raw(l.checkin)} /></div></li>
        <li><span className="min">15 min</span><div><b>Challenge clinic</b><p {...raw(l.clinic)} /></div></li>
        <li><span className="min">25 min</span><div><b>Practice in threes</b><p {...raw(l.triad)} />
          <p className="note">Rotate roles: leader, team member, observer. Observers score each item 1 (not yet), 2 (partly), 3 (strong):</p>
          <ul className="obs">{l.observe.map((x, k) => <li key={k} {...raw(x)} />)}</ul></div></li>
        <li><span className="min">10 min</span><div><b>Commitments</b><p {...raw(l.commit)} /></div></li>
      </ol>
    </div>
  );
}
