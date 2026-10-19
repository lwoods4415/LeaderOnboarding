"use client";
import { useEffect, useRef, useState } from "react";
import type { Difficulty, Module, Roleplay } from "@/content";
import { useProgram } from "@/lib/program";
import { currentEnrollmentId } from "@/lib/sync";
import { raw } from "@/lib/html";
import { rpAvg, today } from "@/lib/progress";
import { shareConversation, unshareConversation } from "@/lib/sharing";
import { rpState, type Feedback, type Turn } from "@/lib/state";
import { CUSTOM_PREFIX, customMode, isCustomId, STANDARD_SKILLS, type CustomScenario } from "@/content/custom-practice";
import { deleteScenario, useCustomScenarios } from "@/lib/customScenarios";
import { ScenarioForm } from "./ScenarioForm";
import { update, useLeader } from "@/lib/store";

const NOTE = "Practice only. Never type real patient names or details. Your program leader sees your scores and feedback, not the conversation, unless you share it.";
const MAX_CHARS = 2000;
const MAX_LEADER_TURNS = 30;

async function errorText(res: Response, fallback: string) {
  try {
    return ((await res.json()) as { error?: string }).error ?? fallback;
  } catch {
    return fallback;
  }
}

/** One practice conversation: a built-in one (content may hold inline HTML) or the leader's own (plain text). */
type Conv = { id: string; custom: boolean; title: string; who: string; role: string; brief: string; goal: string; skills: string[]; label: string; source?: CustomScenario };

const fromBuiltin = (r: Roleplay, modules: Module[]): Conv => ({
  id: r.id, custom: false, title: r.title, who: r.who, role: r.role, brief: r.brief, goal: r.goal, skills: r.skills,
  label: modules.find((x) => x.id === r.mod)?.weeks ?? "",
});
const fromCustom = (c: CustomScenario): Conv => ({
  id: CUSTOM_PREFIX + c.id, custom: true, title: c.title, who: c.who, role: c.role, brief: c.situation, goal: c.goal, skills: STANDARD_SKILLS,
  label: "Your scenario", source: c,
});

export function Studio() {
  const s = useLeader();
  const { modules: MODULES, roleplays: ROLEPLAYS, modes: MODES } = useProgram();
  const customs = useCustomScenarios();
  const [editing, setEditing] = useState<null | "new" | CustomScenario>(null);
  const selCustom = isCustomId(s.rpSel) ? customs.list.find((c) => CUSTOM_PREFIX + c.id === s.rpSel) : undefined;
  const waitingForCustom = isCustomId(s.rpSel) && !customs.loaded;
  const conv = selCustom ? fromCustom(selCustom) : fromBuiltin(ROLEPLAYS.find((r) => r.id === s.rpSel) ?? ROLEPLAYS[0], MODULES);
  // Built-in text is authored content that may contain <em>/<b>; a leader's own text is always shown as plain text.
  const T = (text: string) => (conv.custom ? { children: text } : raw(text));
  const st = s.rp[conv.id] ?? { mode: "realistic" as Difficulty, turns: [], fb: null, history: [] };
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<null | "reply" | "feedback">(null);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [msg, setMsg] = useState(NOTE);
  const ctl = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const leaderTurns = st.turns.filter((t) => t.role === "leader").length;

  // Keep the newest message in view, as the reference page does.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [st.turns.length, streaming, conv.id]);
  // Stop a reply that's still streaming if the leader leaves the studio.
  useEffect(() => () => ctl.current?.abort(), []);

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    if (text.length > MAX_CHARS) return setMsg(`Each message can be up to ${MAX_CHARS.toLocaleString()} characters. Shorten it and send again.`);
    if (leaderTurns >= MAX_LEADER_TURNS) return setMsg(`A conversation can have up to ${MAX_LEADER_TURNS} of your messages. Select "End and get feedback", or "Start over".`);
    const id = conv.id, mode = st.mode;
    const turns = [...st.turns, { role: "leader" as const, text }];
    const prevFb = st.fb;
    update((d) => { const x = rpState(d, id); x.turns.push({ role: "leader", text }); x.fb = null; });
    setDraft(""); setBusy("reply"); setStreaming(""); setMsg(NOTE);

    // On failure with nothing back yet, undo the send: take the message out of the conversation,
    // bring back any earlier feedback, and put the message back in the box to resend.
    const restore = (why: string) => {
      update((d) => {
        const x = rpState(d, id), last = x.turns[x.turns.length - 1];
        if (last?.role === "leader" && last.text === text) { x.turns.pop(); x.fb = prevFb; }
      });
      setDraft(text);
      setMsg(why);
    };
    const c = (ctl.current = new AbortController());
    let reply = "";
    try {
      const res = await fetch("/api/practice/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: c.signal,
        body: JSON.stringify({ enrollmentId: currentEnrollmentId(), roleplayId: id, difficulty: mode, turns }),
      });
      if (!res.ok || !res.body) return restore(await errorText(res, "Something interrupted the reply. Try sending again."));
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      for (let r = await reader.read(); !r.done; r = await reader.read()) {
        reply += r.value;
        setStreaming(reply);
      }
      if (!reply.trim()) return restore(`${conv.who} couldn't respond to that message. Try rephrasing it.`);
      update((d) => { rpState(d, id).turns.push({ role: "them", text: reply.trim() }); });
    } catch {
      const stopped = c.signal.aborted;
      if (reply.trim()) {
        update((d) => { rpState(d, id).turns.push({ role: "them", text: reply.trim() }); });
        setMsg(stopped ? "Stopped." : "Something interrupted the reply. You can carry on from here.");
      } else {
        restore(stopped ? "Stopped." : "Something interrupted the reply. Check your connection and try sending again.");
      }
    } finally {
      ctl.current = null;
      setStreaming(null);
      setBusy(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  async function getFeedback() {
    if (busy) return;
    const id = conv.id, mode = st.mode;
    setBusy("feedback");
    setMsg("Reviewing your conversation. This can take up to a minute…");
    const c = (ctl.current = new AbortController());
    try {
      const res = await fetch("/api/practice/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: c.signal,
        body: JSON.stringify({ enrollmentId: currentEnrollmentId(), roleplayId: id, difficulty: mode, turns: st.turns }),
      });
      if (!res.ok) return setMsg(await errorText(res, "Something went wrong getting your feedback. Try again."));
      const { feedback } = (await res.json()) as { feedback: Feedback };
      update((d) => {
        const x = rpState(d, id);
        x.fb = feedback;
        x.history = [...(x.history ?? []), { d: today(), avg: rpAvg(feedback), mode }].slice(-12);
      });
      setMsg(NOTE);
      requestAnimationFrame(() => document.getElementById("rp-fb")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setMsg(c.signal.aborted ? "Stopped." : "Something went wrong getting your feedback. Check your connection and try again.");
    } finally {
      ctl.current = null;
      setBusy(null);
    }
  }

  const ready = !busy;
  const select = (id: string) => { if (busy) return; update((d) => { d.rpSel = id; }); setEditing(null); setMsg(NOTE); setDraft(""); };
  return (
    <>
      <div className="mhead"><div className="eyebrow">Practice studio</div><h2>Practice the <em>hard conversations</em></h2><div className="sub">Low stakes, real reactions, honest feedback</div></div>
      <div className="rp-picker" role="tablist" aria-label="Conversations">
        {ROLEPLAYS.map((r) => {
          const a = rpAvg(s.rp[r.id]?.fb);
          return (
            <button key={r.id} role="tab" aria-selected={!editing && r.id === conv.id} onClick={() => select(r.id)}>
              <b {...raw(r.title)} /><small {...raw((MODULES.find((x) => x.id === r.mod)?.short ?? "") + (a != null ? " · " + a + "/3" : ""))} />
            </button>
          );
        })}
        {customs.list.map((c) => {
          const id = CUSTOM_PREFIX + c.id, a = rpAvg(s.rp[id]?.fb);
          return (
            <button key={id} role="tab" aria-selected={!editing && id === conv.id} onClick={() => select(id)}>
              <b>{c.title}</b><small>Your scenario{a != null ? " · " + a + "/3" : ""}</small>
            </button>
          );
        })}
        <button role="tab" aria-selected={editing === "new"} disabled={!!busy} onClick={() => setEditing("new")}>
          <b>+ Create your own</b><small>Practice a real situation</small>
        </button>
      </div>
      {editing ? (
        <ScenarioForm
          initial={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSaved={(c) => { setEditing(null); select(CUSTOM_PREFIX + c.id); }}
        />
      ) : waitingForCustom ? <p className="note">Loading your scenario…</p> : (
      <div className="studio">
        <div className="brief">
          <span className="eyebrow">{conv.label} · {conv.who}, {conv.role}</span>
          <h3 {...T(conv.title)} />
          <p {...T(conv.brief)} />
          {conv.custom ? <p><b>Your goal:</b> {conv.goal}</p> : <p {...raw(`<b>Your goal:</b> ${conv.goal}`)} />}
          {conv.custom && conv.source ? (
            <div className="row">
              <button className="btn ghost" disabled={!ready} onClick={() => setEditing(conv.source!)}>Edit scenario</button>
              <button className="btn ghost" disabled={!ready} onClick={async () => {
                if (!confirm(`Delete "${conv.title}"? Its practice history and any shared copy go with it.`)) return;
                try { await deleteScenario(conv.source!.id); } catch { setMsg("Couldn't delete the scenario. Try again."); }
              }}>Delete</button>
            </div>
          ) : null}
          <div className="modes" role="radiogroup" aria-label="Difficulty">
            {(Object.keys(MODES) as Difficulty[]).map((k) => (
              <button key={k} role="radio" aria-checked={st.mode === k} disabled={!ready}
                onClick={() => update((d) => { rpState(d, conv.id).mode = k; })}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          <p className="note">{conv.custom ? customMode(MODES, st.mode, conv.who) : MODES[st.mode]}</p>
          <p className="eyebrow" style={{ marginTop: 6 }}>Skills you&apos;ll be scored on</p>
          <ul className="skills">{conv.skills.map((x, k) => <li key={k} {...T(x)} />)}</ul>
        </div>
        <div className="chat">
          <div className="chat-log" id="chat-log" aria-live="polite" ref={logRef}>
            {st.turns.length || streaming != null ? (
              <>
                {st.turns.map((t, k) => (
                  <div key={k} className={`msg ${t.role === "leader" ? "me" : "them"}`}><span>{t.role === "leader" ? "You" : conv.who}</span><p>{t.text}</p></div>
                ))}
                {streaming != null ? (
                  <div className="msg them"><span>{conv.who}</span>{streaming ? <p>{streaming}</p> : <p className="typing">{conv.who} is typing…</p>}</div>
                ) : null}
              </>
            ) : <p className="empty">Start the conversation the way you would in real life. {conv.who} will respond in character.</p>}
          </div>
          <div className="composer">
            <label htmlFor="rp-input" className="sr">Your message</label>
            <textarea id="rp-input" ref={inputRef} placeholder="Type what you'd say…" value={draft} disabled={!ready} maxLength={MAX_CHARS}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} />
            <div className="row">
              <button className="btn primary" disabled={!ready} onClick={() => void send()}>Send</button>
              {busy ? <button className="btn" onClick={() => ctl.current?.abort()}>Stop</button> : null}
              <button className="btn" disabled={!ready || leaderTurns < 2} onClick={() => void getFeedback()}>End and get feedback</button>
              <button className="btn ghost" disabled={!ready} onClick={() => { update((d) => { const x = rpState(d, conv.id); x.turns = []; x.fb = null; }); setMsg(NOTE); }}>Start over</button>
            </div>
            <p className="note" id="rp-msg" role="status">{msg}</p>
          </div>
          {st.fb ? <FeedbackCard fb={st.fb} rpId={conv.id} turns={st.turns} /> : null}
        </div>
      </div>
      )}
    </>
  );
}

/** Share the full conversation with the program leader, ported from the reference page's feedback card. */
function ShareConversation({ rpId, turns }: { rpId: string; turns: Turn[] }) {
  const shared = useLeader().shared.rp[rpId];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch {
      setError("That didn't go through. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="sharebar">
      {shared ? (
        <>
          <span className="shared-on">Shared with your program leader on {shared.at}.</span>
          <button className="btn ghost" disabled={busy} onClick={() => run(() => shareConversation(rpId, turns))}>Update shared copy</button>
          <button className="btn ghost" disabled={busy} onClick={() => run(() => unshareConversation(rpId))}>Stop sharing</button>
        </>
      ) : (
        <>
          <button className="btn" disabled={busy || !turns.length} onClick={() => run(() => shareConversation(rpId, turns))}>Share this conversation with your program leader</button>
          <span className="note">Your scores and feedback are already visible. This adds the full conversation.</span>
        </>
      )}
      {error ? <span className="msg-err">{error}</span> : null}
    </div>
  );
}

function FeedbackCard({ fb, rpId, turns }: { fb: Feedback; rpId: string; turns: Turn[] }) {
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
      <ShareConversation rpId={rpId} turns={turns} />
      <p className="note">Try it again on a harder setting, or bring this feedback to your 1:1.</p>
    </div>
  );
}
