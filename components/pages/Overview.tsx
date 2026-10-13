"use client";
import Link from "next/link";
import { MODULES, PROGRAM } from "@/content";
import { raw } from "@/lib/html";
import { modProgress, overall } from "@/lib/progress";
import type { LeaderState } from "@/lib/state";
import { update, useLeader } from "@/lib/store";
import { Ring } from "../ui";

type MeKey = keyof LeaderState["me"];

export function Overview() {
  const s = useLeader();
  const pct = overall(s);
  const me = (key: MeKey) => ({
    value: s.me[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { const v = e.target.value; update((d) => { d.me[key] = v; }); },
  });
  return (
    <>
      <div className="hero">
        <div className="eyebrow" {...raw(PROGRAM.hero.eyebrow)} />
        <h2 {...raw(`${PROGRAM.hero.h2a} <span>${PROGRAM.hero.h2b}</span>`)} />
        {PROGRAM.hero.p.map((x, i) => <p key={i} {...raw(x)} />)}
      </div>
      <div className="steps">
        {PROGRAM.steps.map((st, i) => (
          <div className="step" key={i}><b {...raw(`${i + 1}. ${st[0]}`)} /><p {...raw(st[1])} /></div>
        ))}
      </div>
      <section className="blk">
        <h3>Your twelve weeks</h3>
        <p className="lede">Select any module to open it. Start with the self-assessment on the My growth page so you can see how far you&apos;ve come at the end.</p>
        <div className="tl-wrap"><div className="tl-inner">
          <div className="timeline">{Array.from({ length: 13 }, (_, i) => <div className="tl-wk" key={i}>Wk {i}</div>)}</div>
          <div className="timeline">
            {MODULES.map((m, i) => {
              const span = m.wk[1] - m.wk[0] + 1;
              const cls = i === 0 ? "zero" : i === MODULES.length - 1 ? "cap" : "";
              return (
                <Link key={m.id} href={`/module/${m.id}`} scroll={false} className={`tl-seg ${cls}`} style={{ gridColumn: `${m.wk[0] + 1} / span ${span}` }}>
                  <span {...raw(m.short)} /><small>{modProgress(s, m).pct}% done</small>
                </Link>
              );
            })}
          </div>
        </div></div>
      </section>
      <section className="blk">
        <h3>Your details</h3>
        <div className="bigpct"><Ring pct={pct} /><div><b>{pct}% complete</b><span className="note">Counts scenarios, practice conversations, practice items and reflections.</span></div></div>
        <div className="me">
          <label htmlFor="me-name">Your name<input type="text" id="me-name" placeholder="First and last name" {...me("name")} /></label>
          <label htmlFor="me-start">Start date in role<input type="date" id="me-start" {...me("start")} /></label>
          <label htmlFor="me-lead">Your leader<input type="text" id="me-lead" placeholder={PROGRAM.sponsorPlaceholder} {...me("leader")} /></label>
          <label htmlFor="me-cohort">Your cohort<input type="text" id="me-cohort" placeholder="e.g. Fall 2026 cohort" {...me("cohort")} /></label>
        </div>
      </section>
      <section className="blk"><div className="visible"><span className="tag">What your program leader can see</span>
        <div className="vis-grid">
          <div><b>Shared automatically</b><ul className="plain"><li>Your name, cohort and progress through each module</li><li>Your scenario answers: what you typed first and the options you chose</li><li>Your Practice studio scores and coach feedback</li><li>Your self-assessment and team pulse numbers</li></ul></div>
          <div><b>Private unless you choose to share</b><ul className="plain"><li>Your reflections. Each has its own share button.</li><li>Your full practice conversations. Share one from the Practice studio after you get feedback.</li><li>Your planners, notes and trust self-check</li></ul></div>
        </div>
        <p className="note">Your program leader uses this to plan the leader labs and support you. It isn&apos;t a performance evaluation.</p></div></section>
      <div className="pager">
        <Link className="btn" href="/growth" scroll={false}>Take the Week 0 self-assessment</Link>
        <Link className="btn primary" href="/module/m0" scroll={false}>Start with Week 0 →</Link>
      </div>
    </>
  );
}
