"use client";
import { useState } from "react";
import { labelFor, MAX_ANSWER, questionsFor } from "@/lib/intake";
import { submitIntake, type IntakeInput } from "./actions";

const EMPTY: IntakeInput = { kind: "company", orgName: "", contactName: "", contactRole: "", contactEmail: "", answers: {}, website: "" };

export function IntakeForm() {
  const [form, setForm] = useState<IntakeInput>(EMPTY);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const kind = form.kind;
  const set = (patch: Partial<IntakeInput>) => setForm({ ...form, ...patch });
  const answer = (key: string, value: string) => set({ answers: { ...form.answers, [key]: value } });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const r = await submitIntake(form);
      if (r.ok) setState("sent");
      else { setError(r.message); setState("idle"); }
    } catch {
      setError("Something went wrong sending your answers. Check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="checkin">
        <h3>Thank you</h3>
        <p>{kind === "company"
          ? "We've got your answers and we're tailoring the program to your team. It's reviewed by a person before it goes live, and we'll email you at the address you gave, usually within two working days."
          : "We've got your answers. We'll email you at the address you gave with how to get started."}</p>
      </div>
    );
  }

  return (
    <form className="signin intake" onSubmit={send}>
      <fieldset className="kind">
        <legend>Who is this for?</legend>
        <label><input type="radio" name="kind" checked={kind === "company"} onChange={() => set({ kind: "company" })} /> My company&apos;s new leaders</label>
        <label><input type="radio" name="kind" checked={kind === "individual"} onChange={() => set({ kind: "individual" })} /> Just me, as a new leader</label>
      </fieldset>

      {kind === "company" ? (
        <label htmlFor="in-org">Company name<input type="text" id="in-org" required maxLength={120} value={form.orgName} onChange={(e) => set({ orgName: e.target.value })} /></label>
      ) : null}
      <label htmlFor="in-name">Your name<input type="text" id="in-name" required maxLength={120} autoComplete="name" value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} /></label>
      {kind === "company" ? (
        <label htmlFor="in-role">Your role<input type="text" id="in-role" maxLength={120} placeholder="e.g. Director of Operations, HR partner" value={form.contactRole} onChange={(e) => set({ contactRole: e.target.value })} /></label>
      ) : null}
      <label htmlFor="in-email">Your work email<input type="email" id="in-email" required maxLength={254} autoComplete="email" value={form.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} /></label>

      {questionsFor(kind).map((q) => {
        const id = `in-${q.key}`;
        const label = <span>{labelFor(q, kind)}{q.required ? <span className="req"> (required)</span> : null}</span>;
        const value = form.answers[q.key] ?? "";
        if (q.type === "select") {
          return (
            <label key={q.key} htmlFor={id}>{label}
              <select id={id} required={q.required} value={value} onChange={(e) => answer(q.key, e.target.value)}>
                <option value="">Choose…</option>
                {q.options!.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          );
        }
        if (q.type === "date") {
          return <label key={q.key} htmlFor={id}>{label}<input type="date" id={id} value={value} onChange={(e) => answer(q.key, e.target.value)} /></label>;
        }
        return <label key={q.key} htmlFor={id}>{label}<textarea id={id} required={q.required} maxLength={MAX_ANSWER} placeholder={q.ph} value={value} onChange={(e) => answer(q.key, e.target.value)} /></label>;
      })}

      <label className="hp" aria-hidden="true">Website<input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set({ website: e.target.value })} /></label>

      <div><button className="btn primary" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send my answers"}</button></div>
      {error ? <p className="msg-err" role="alert">{error}</p> : null}
    </form>
  );
}
