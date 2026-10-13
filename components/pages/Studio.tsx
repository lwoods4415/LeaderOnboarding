"use client";
import { useState } from "react";
import { MODES, MODULES, ROLEPLAYS, type Difficulty } from "@/content";
import { raw } from "@/lib/html";
import { rpAvg } from "@/lib/progress";
import { rpState, type Feedback } from "@/lib/state";
import { update, useLeader } from "@/lib/store";

// Phase 3 switches this on with the server-side practice partner.
const PARTNER_READY = false;

export function Studio() {
  const s = useLeader();
  const rp = ROLEPLAYS.find((r) => r.id === s.rpSel) ?? ROLEPLAYS[0];
  const st = s.rp[rp.id] ?? { mode: "realistic" as Difficulty, turns: [], fb: null, history: [] };
  const m = MODULES.find((x) => x.id === rp.mod)!;
  const [draft, setDraft] = useState("");
  const busy = false;
  const leaderTurns = st.turns.filter((t) => t.role === "leader").length;

  return (
    <>
      <div className="mhead"><div className="eyebrow">Practice studio</div><h2>Practice the <em>hard conversations</em></h2><div className="sub">Low stakes, real reactions, honest feedback</div></div>
      <div className="rp-picker" role="tablist" aria-label="Conversations">
        {ROLEPLAYS.map((r) => {
          const a = rpAvg(s.rp[r.id]?.fb);
          return (
            <button key={r.id} role="tab" aria-selected={r.id === rp.id} onClick={() => update((d) => { d.rpSel = r.id; })}>
              <b {...raw(r.title)} /><small {...raw(MODULES.find((x) => x.id === r.mod)!.short + (a != null ? " · " + a + "/3" : ""))} />
            </button>
          );
        })}
      </div>
      <div className="studio">
        <div className="brief">
          <span className="eyebrow">{m.weeks} · {rp.who}, {rp.role}</span>
          <h3 {...raw(rp.title)} />
          <p {...raw(rp.brief)} />
          <p {...raw(`<b>Your goal:</b> ${rp.goal}`)} />
          <div className="modes" role="radiogroup" aria-label="Difficulty">
            {(Object.keys(MODES) as Difficulty[]).map((k) => (
              <button key={k} role="radio" aria-checked={st.mode === k} disabled={busy}
                onClick={() => update((d) => { rpState(d, rp.id).mode = k; })}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          <p className="note">{MODES[st.mode]}</p>
          <p className="eyebrow" style={{ marginTop: 6 }}>Skills you&apos;ll be scored on</p>
          <ul className="skills">{rp.skills.map((x, k) => <li key={k} {...raw(x)} />)}</ul>
        </div>
        <div className="chat">
          {PARTNER_READY ? null : (
            <div className="warn">The AI practice partner isn&apos;t switched on yet. You can still practice this conversation with a colleague: one plays the nurse using the description above, one observes using the skills list.</div>
          )}
          <div className="chat-log" id="chat-log" aria-live="polite">
            {st.turns.length ? st.turns.map((t, k) => (
              <div key={k} className={`msg ${t.role === "leader" ? "me" : "them"}`}><span>{t.role === "leader" ? "You" : rp.who}</span><p>{t.text}</p></div>
            )) : <p className="empty">Start the conversation the way you would in real life. {rp.who} will respond in character.</p>}
          </div>
          <div className="composer">
            <label htmlFor="rp-input" className="sr">Your message</label>
            <textarea id="rp-input" placeholder="Type what you'd say…" value={draft} onChange={(e) => setDraft(e.target.value)} disabled={!PARTNER_READY || busy} />
            <div className="row">
              <button className="btn primary" disabled={!PARTNER_READY || busy}>Send</button>
              <button className="btn" disabled={!PARTNER_READY || busy || leaderTurns < 2}>End and get feedback</button>
              <button className="btn ghost" disabled={busy} onClick={() => update((d) => { const x = rpState(d, rp.id); x.turns = []; x.fb = null; })}>Start over</button>
            </div>
            <p className="note" id="rp-msg" role="status">Practice only. Never type real patient names or details. Your program leader sees your scores and feedback, not the conversation, unless you share it.</p>
          </div>
          {st.fb ? <FeedbackCard fb={st.fb} /> : null}
        </div>
      </div>
    </>
  );
}

function FeedbackCard({ fb }: { fb: Feedback }) {
  const avg = rpAvg(fb);
  return (
    <div className="feedback" id="rp-fb">
      <div className="fb-head"><div><span className="eyebrow">Your feedback</span><h3>{fb.overall ?? ""}</h3></div><div className="score"><b>{avg ?? "–"}</b><span>average of 3</span></div></div>
      <div className="fb-rows">
        {fb.scores.map((x, k) => (
          <div className="fb-row" key={k}>
            <div className="dots" aria-label={`${Number(x.score)} of 3`}>{[1, 2, 3].map((n) => <i key={n} className={n <= Number(x.score) ? "on" : ""} />)}</div>
            <div><b>{x.skill}</b><p>{x.evidence}</p>{x.tip ? <p className="tip">{x.tip}</p> : null}</div>
          </div>
        ))}
      </div>
      {fb.strongest ? <p><b>Your strongest moment:</b> {fb.strongest}</p> : null}
      {fb.try_this ? <p><b>Try saying:</b> {fb.try_this}</p> : null}
      {fb.hidden != null ? <p><b>Did you uncover what was really going on?</b> {fb.hidden}</p> : null}
      {fb.next ? <p><b>Practice next:</b> {fb.next}</p> : null}
      <div className="sharebar">
        <button className="btn" disabled>Share this conversation with your program leader</button>
        <span className="note">Your scores and feedback are already visible. This adds the full conversation.</span>
      </div>
      <p className="note">Try it again on a harder setting, or bring this feedback to your 1:1.</p>
    </div>
  );
}
