"use client";
// On the plan page: Complete and Cohort leaders tailor their core lessons to their own team.
import { useEffect, useState } from "react";
import { getMyTailoring, submitMyTailoring, type MyTailoring } from "@/app/(app)/upgrade/tailorActions";
import { MAX_ANSWER, TAILOR_QUESTIONS } from "@/lib/intake";

export function TailorForm({ enrollmentId }: { enrollmentId: string }) {
  const [t, setT] = useState<MyTailoring | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    getMyTailoring(enrollmentId).then((r) => { if (!live) return; setT(r); if (r.eligible) setAnswers(r.prefill); }, () => {});
    return () => { live = false; };
  }, [enrollmentId]);

  if (!t?.eligible) return null;
  if (t.state === "running" || t.state === "done" || msg?.ok) {
    return (
      <section className="blk"><div className="checkin">
        <h3>Your lessons are tailored to you</h3>
        <p>{msg?.message ?? (t.state === "running"
          ? "We're tailoring your core lessons now. It takes a couple of minutes; they'll appear in each module."
          : "Each module's core lesson uses examples from your own team and work. What the lessons teach is the same for everyone.")}</p>
      </div></section>
    );
  }
  return (
    <section className="blk"><h3>Tailor your lessons to your team</h3>
      <p className="lede">Your plan includes core lessons with examples written for your world. Answer a few questions (about a minute) and we&apos;ll rewrite each lesson&apos;s examples, traps and practice questions to fit. Please don&apos;t include real people&apos;s names.</p>
      <form className="signin intake" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setMsg(null);
        const r = await submitMyTailoring(enrollmentId, answers).catch(() => ({ ok: false, message: "Something went wrong. Try again." }));
        setMsg(r); setBusy(false);
      }}>
        {TAILOR_QUESTIONS.map((q) => (
          <label key={q.key} htmlFor={`tl-${q.key}`}><span>{q.label}{"required" in q && q.required ? <span className="req"> (required)</span> : null}</span>
            <textarea id={`tl-${q.key}`} maxLength={MAX_ANSWER} placeholder={q.ph} required={"required" in q && q.required} value={answers[q.key] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} className="cl-grow" />
          </label>
        ))}
        <div><button className="btn primary" disabled={busy}>{busy ? "Sending…" : "Tailor my lessons"}</button></div>
        {msg && !msg.ok ? <p className="msg-err" role="alert">{msg.message}</p> : null}
      </form>
    </section>
  );
}
