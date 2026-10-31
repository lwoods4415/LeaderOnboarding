"use client";
// The platform owner's review of tailored core lessons: each set's seven lessons with their status, a
// side-by-side comparison with the base examples, regenerate (with an optional note), edit, approve, and
// "use default content". Shown on the Platform page and with each company request.
import { useCallback, useEffect, useState } from "react";
import type { TailoredLessonContent } from "@/content/core-lessons/tailoring";
import {
  approve, getLessonSet, listLessonSets, regenerate, saveEdit, setUseDefault, tailorProgram,
  type LessonView, type Result, type SetDetail, type SetSummary,
} from "@/app/(app)/platform/lessonActions";

const STATUS: Record<string, string> = {
  none: "Not tailored yet", generated: "Tailored", approved: "Approved", edited: "Edited by you", fallback: "Using the base lesson",
};
const STATE: Record<string, string> = { idle: "Not started", running: "Tailoring…", done: "Done", failed: "Failed" };

/** Every string in a tailored lesson, by path (e.g. "check.1.options.2.explain"), in a stable order. */
function leaves(v: unknown, path: string[] = [], out: [string, string][] = []) {
  if (typeof v === "string") { if (!["lessonId", "contentVersion", "type", "id"].includes(path[path.length - 1])) out.push([path.join("."), v]); }
  else if (Array.isArray(v)) v.forEach((x, i) => leaves(x, [...path, String(i)], out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) leaves(x, [...path, k], out);
  return out;
}
function setPath(obj: unknown, path: string, value: string) {
  const parts = path.split(".");
  let node = obj as Record<string, unknown>;
  for (const p of parts.slice(0, -1)) node = node[p] as Record<string, unknown>;
  node[parts[parts.length - 1]] = value;
}
const label = (path: string) => path.replace(/\.(\d+)/g, (_, n) => ` ${Number(n) + 1}`).replace(/\./g, " · ");

/** The list of lesson sets for the Platform page. */
export function LessonSets() {
  const [data, setData] = useState<{ sets: SetSummary[]; untailored: { id: string; name: string }[] } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<Result | null>(null);
  const refresh = useCallback(() => listLessonSets().then(setData, () => setMsg({ ok: false, message: "Couldn't load the lesson sets." })), []);
  useEffect(() => { void refresh(); }, [refresh]);

  if (!data) return null;
  if (open) return <section className="blk"><LessonSetPanel id={open} onClose={() => { setOpen(null); void refresh(); }} /></section>;
  return (
    <section className="blk"><h3>Tailored core lessons</h3>
      <p className="lede">Each company program, the Individuals program and each Complete or Cohort individual gets the seven core lessons with examples rewritten for their world. What they teach never changes.</p>
      {msg ? <p className={msg.ok ? "msg-ok" : "msg-err"}>{msg.message}</p> : null}
      {data.sets.length ? (
        <div className="hm-wrap"><table className="hm">
          <thead><tr><th>For</th><th>Status</th><th>Lessons</th><th>Cost</th></tr></thead>
          <tbody>{data.sets.map((s) => (
            <tr key={s.id}>
              <th><button className="linkbtn" onClick={() => setOpen(s.id)}>{s.label}</button></th>
              <td>{s.useDefault ? "Default lessons" : STATE[s.state]}</td>
              <td>{s.useDefault ? "–" : Object.entries(s.counts).map(([k, v]) => `${v} ${STATUS[k]?.toLowerCase()}`).join(", ") || "–"}</td>
              <td>{s.cost ? `$${s.cost.toFixed(2)}` : "–"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <p className="note">No tailored lessons yet.</p>}
      {data.untailored.length ? (
        <p style={{ marginTop: 12 }}>{data.untailored.map((p) => (
          <button key={p.id} className="btn" style={{ marginRight: 8 }} onClick={async () => {
            const r = await tailorProgram(p.id).catch(() => ({ ok: false, message: "Couldn't start. Try again." }) as Result & { id?: string });
            setMsg(r);
            if (r.id) setOpen(r.id);
          }}>Tailor lessons for {p.name}</button>
        ))}</p>
      ) : null}
    </section>
  );
}

export function LessonSetPanel({ id, onClose }: { id: string; onClose?: () => void }) {
  const [d, setD] = useState<SetDetail | null>(null);
  const [msg, setMsg] = useState<(Result & { problems?: string[] }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const load = useCallback(() => getLessonSet(id).then(setD, () => setMsg({ ok: false, message: "Couldn't load the lessons." })), [id]);
  useEffect(() => { void load(); }, [load]);
  const running = d?.state === "running";
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => void load(), 10000);
    return () => clearInterval(t);
  }, [running, load]);

  async function run(fn: () => Promise<Result & { problems?: string[] }>): Promise<boolean> {
    setBusy(true); setMsg(null);
    let ok = false;
    try { const r = await fn(); setMsg(r); ok = r.ok; } catch { setMsg({ ok: false, message: "Something went wrong. Try again." }); }
    await load(); setBusy(false);
    return ok;
  }

  if (!d) return <p className="note">Loading lessons…</p>;
  return (
    <div className="ls-panel">
      {onClose ? <p><button className="linkbtn" onClick={onClose}>← All tailored lessons</button></p> : null}
      <h3>Core lessons: {d.label}</h3>
      <p className="note">{d.useDefault ? "Showing the default lessons" : STATE[d.state]}{d.cost ? ` · tailoring so far cost about $${d.cost.toFixed(2)}` : ""}</p>
      {msg ? <div className={msg.ok ? "msg-ok" : "msg-err"} role="status">{msg.message}{msg.problems ? <ul className="plain">{msg.problems.map((p) => <li key={p}>{p}</li>)}</ul> : null}</div> : null}
      {d.error ? <p className="msg-err">{d.error}</p> : null}
      {running ? <p className="checkin">Claude is tailoring these lessons. This takes a minute or two, and this page checks back every 10 seconds.</p> : null}

      <label className="ls-default"><input type="checkbox" checked={d.useDefault} disabled={busy} onChange={(e) => run(() => setUseDefault(d.id, e.target.checked))} />
        Use default content (show the base lessons, no tailoring)</label>

      {d.context ? (
        <details style={{ marginTop: 10 }}><summary>What Claude was told about this team</summary>
          <dl className="review-answers">{Object.entries(d.context).filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length)).map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : `${x.name} (${x.role}, ${x.legacyModuleId})`)).join("; ") : String(v)}</dd></div>
          ))}</dl>
        </details>
      ) : null}

      {!d.useDefault ? (
        <div className="row" style={{ marginTop: 12, alignItems: "flex-end" }}>
          <label style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 4 }}>Steering note (optional)
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. make the examples about the night shift" />
          </label>
          <button className="btn" disabled={busy || running} onClick={() => run(() => regenerate(d.id, null, note))}>{d.lessons.some((l) => l.status !== "none") ? "Regenerate all" : "Tailor all seven"}</button>
          <button className="btn ghost" disabled={busy || running || !d.lessons.some((l) => l.status === "generated" || l.status === "edited")} onClick={() => run(() => approve(d.id, null))}>Approve all</button>
        </div>
      ) : null}

      <div className="ls-lessons">
        {d.lessons.map((l) => <LessonRowView key={l.id} setId={d.id} l={l} note={note} busy={busy || running} run={run} disabled={d.useDefault} />)}
      </div>
    </div>
  );
}

function LessonRowView({ setId, l, note, busy, run, disabled }: {
  setId: string; l: LessonView; note: string; busy: boolean; disabled: boolean;
  run: (fn: () => Promise<Result & { problems?: string[] }>) => Promise<boolean>;
}) {
  const [view, setView] = useState<null | "compare" | "edit">(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const base = new Map(leaves(l.base));
  const mine = l.tailored ? leaves(l.tailored) : [];
  const changed = mine.filter(([p, v]) => base.get(p) !== v);
  return (
    <div className="review-change">
      <div className="place">
        <span><b>{l.title}</b> · {STATUS[l.status]}{l.locked ? " · leaders have started it (locked)" : ""}{l.note ? ` · note: “${l.note}”` : ""}</span>
        {!disabled ? (
          <span className="row">
            {l.tailored ? <button className="linkbtn" onClick={() => setView(view === "compare" ? null : "compare")}>Compare</button> : null}
            {l.tailored && !l.locked ? <button className="linkbtn" onClick={() => { setDraft(Object.fromEntries(mine)); setView(view === "edit" ? null : "edit"); }}>Edit</button> : null}
            {!l.locked ? <button className="linkbtn" disabled={busy} onClick={() => run(() => regenerate(setId, l.id, note))}>Regenerate</button> : null}
            {l.status === "generated" || l.status === "edited" ? <button className="linkbtn" disabled={busy} onClick={() => run(() => approve(setId, l.id))}>Approve</button> : null}
          </span>
        ) : null}
      </div>
      {l.errors?.length ? <p className="note">Why it used the base lesson: {l.errors.slice(0, 3).join("; ")}</p> : null}
      {view === "compare" ? (
        changed.length ? (
          <div className="review-changes">{changed.map(([p, v]) => (
            <div key={p}><div className="note">{label(p)}</div><div className="pair"><div className="before">{base.get(p)}</div><div>{v}</div></div></div>
          ))}</div>
        ) : <p className="note">No differences from the base lesson.</p>
      ) : null}
      {view === "edit" ? (
        <form onSubmit={(e) => {
          e.preventDefault();
          const next = structuredClone(l.tailored!) as TailoredLessonContent;
          for (const [p, v] of Object.entries(draft)) setPath(next, p, v);
          // The form stays open (with the edits) until a save passes the checks.
          void run(() => saveEdit(setId, l.id, next)).then((ok) => { if (ok) setView(null); });
        }} className="ls-edit">
          {mine.map(([p]) => (
            <label key={p}><span className="note">{label(p)}</span>
              <textarea value={draft[p] ?? ""} onChange={(e) => setDraft({ ...draft, [p]: e.target.value })} className="cl-grow" />
            </label>
          ))}
          <div className="row"><button className="btn primary" disabled={busy}>Save edit</button><button type="button" className="btn ghost" onClick={() => setView(null)}>Cancel</button></div>
        </form>
      ) : null}
    </div>
  );
}
