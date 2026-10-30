"use client";
import Link from "next/link";
import { raw } from "@/lib/html";
import { useProgram } from "@/lib/program";
import { modProgress, overall } from "@/lib/progress";
import { update, useLeader } from "@/lib/store";
import { useProfile } from "../Account";
import { Ring } from "../ui";

type MeKey = "start" | "leader";

export function Overview() {
  const s = useLeader();
  const profile = useProfile();
  const program = useProgram();
  const { modules: MODULES, program: PROGRAM } = program;
  const pct = overall(s, program);
  const me = (key: MeKey) => ({
    value: s.me[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { const v = e.target.value; update((d) => { d.me[key] = v; }); },
  });
  // A new leader who hasn't started anything yet gets a short welcome with the first two steps.
  const isNew = !s.updatedAt;
  const firstName = profile?.name.split(" ")[0];
  return (
    <>
      {isNew ? (
        <section className="blk"><div className="checkin">
          <h3>Welcome{firstName ? `, ${firstName}` : ""}</h3>
          <p style={{ marginTop: 6 }}>Here&apos;s how to start:</p>
          <ul>
            <li><Link href="/growth" scroll={false}>Take the Week 0 self-assessment</Link> on the My growth page. It takes about five minutes.</li>
            <li><Link href="/module/m0" scroll={false}>Open Week 0: Before day one</Link> and work through it at your own pace.</li>
          </ul>
          <p className="note" style={{ marginTop: 10 }}>Your progress saves to your account as you go, so you can stop at any time and pick up on another device.</p>
        </div></section>
      ) : null}
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
                  <span {...raw(m.short)} /><small>{modProgress(s, m, program).pct}% done</small>
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
          <label htmlFor="me-name">Your name<input type="text" id="me-name" readOnly value={profile?.name ?? ""} /></label>
          <label htmlFor="me-start">Start date in role<input type="date" id="me-start" {...me("start")} /></label>
          <label htmlFor="me-lead">Your leader<input type="text" id="me-lead" placeholder={PROGRAM.sponsorPlaceholder} {...me("leader")} /></label>
          <label htmlFor="me-cohort">Your cohort<input type="text" id="me-cohort" readOnly value={profile?.cohort ?? ""} /></label>
        </div>
      </section>
      <section className="blk"><div className="visible"><span className="tag">What your program leader can see</span>
        {/* Wording approved by the program owner, 2026-10-14. Core lesson lines approved 2026-10-30. */}
        <div className="vis-grid">
          <div><b>Shared automatically</b><ul className="plain"><li>Your name, cohort, progress through each module, and when you were last active</li><li>Your scenario answers: what you typed first, the options you chose, and any later tries</li><li>Your Practice studio scores, score history and coach feedback</li><li>Your self-assessment and team pulse numbers</li>{program.coreLessons?.length ? <li>Whether you&apos;ve opened and completed each core lesson, and your answers to its check questions</li> : null}</ul></div>
          <div><b>Private unless you choose to share</b><ul className="plain"><li>Your reflections. Each has its own share button, and you can stop sharing at any time.</li><li>Your full practice conversations. Share one from the Practice studio after you get feedback, and stop sharing at any time.</li>{program.coreLessons?.length ? <li>Your written answers in each core lesson. Each has its own share button.</li> : null}</ul>
            <b style={{ marginTop: 12 }}>Always private</b><ul className="plain"><li>Your planners, documentation builder, trust self-check, &ldquo;Do it for real&rdquo; checklist, and the practice scenarios you write. Your scores and coach feedback from practicing them are shared like any other practice.</li>{program.coreLessons?.length ? <li>Your core lesson sliders, sorting activities and flipped cards.</li> : null}</ul></div>
        </div>
        <p className="note">Your progress is saved in a secure database that your program leader manages. The program dashboard shows only the items above. Private items are stored so they&apos;re here when you come back. As the database owner, your program leader could technically access them, but commits not to view them.</p>
        <p className="note">Practice conversations are sent to Anthropic&apos;s Claude to create the character&apos;s replies and your feedback. Your name and email are never sent.</p>
        <p className="note">Your program leader uses this to plan the leader labs and support you. It isn&apos;t a performance evaluation. <Link href="/privacy">More about your data</Link></p></div></section>
      <div className="pager">
        <Link className="btn" href="/growth" scroll={false}>Take the Week 0 self-assessment</Link>
        <Link className="btn primary" href="/module/m0" scroll={false}>Start with Week 0 →</Link>
      </div>
    </>
  );
}
