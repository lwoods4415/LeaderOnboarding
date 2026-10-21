"use client";
// The platform owner's review queue: intake requests from /start, the tailored drafts Claude writes for
// them, and approval. Each change in a draft is shown next to the standard wording and can be undone.
import { useCallback, useEffect, useState } from "react";
import {
  approveRequest, declineRequest, draftRequest, getRequest, listRequests, startGeneralVersion, undoChange,
  type RequestDetail, type RequestSummary, type Result,
} from "@/app/(app)/platform/actions";
import { labelFor, questionsFor } from "@/lib/intake";
import { raw } from "@/lib/html";

const STATUS: Record<RequestSummary["status"], string> = {
  new: "New", drafting: "Drafting…", draft_ready: "Ready for your review", draft_failed: "Draft failed",
  approved: "Approved", declined: "Closed",
};
const KIND: Record<RequestSummary["kind"], string> = { company: "Company", individual: "Individual", template: "Standard version" };
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function PlatformRequests() {
  const [list, setList] = useState<RequestSummary[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [msg, setMsg] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(false);

  const refresh = useCallback(() => Promise.all([listRequests(), openId ? getRequest(openId) : null]).then(
    ([l, d]) => { setList(l); setDetail(d); },
    () => setError(true),
  ), [openId]);

  useEffect(() => { void refresh(); }, [refresh]);
  // While anything is drafting, check back every 10 seconds.
  const drafting = list?.some((r) => r.status === "drafting");
  useEffect(() => {
    if (!drafting) return;
    const t = setInterval(() => void refresh(), 10000);
    return () => clearInterval(t);
  }, [drafting, refresh]);

  async function run(action: () => Promise<Result>, then?: () => void) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await action();
      setMsg(r);
      if (r.ok) then?.();
      await refresh();
    } catch { setMsg({ ok: false, message: "Something went wrong. Refresh the page and try again." }); }
    setBusy(false);
  }

  function open(id: string | null) {
    setOpenId(id);
    setDetail(null);
    setNotes("");
    setMsg(null);
  }

  const generalOpen = list?.some((r) => r.kind === "template" && r.status !== "approved" && r.status !== "declined");
  return (
    <section className="blk"><h3>Requests</h3>
      <p className="lede">Answers from the <a href="/start" target="_blank" rel="noreferrer">get-started form</a>. For a company, Claude drafts a tailored copy of the program. Nothing goes live until you approve it.</p>
      {error ? <p className="msg-err">Couldn&apos;t load the requests. Refresh the page and try again.</p> : null}
      {msg ? <p className={msg.ok ? "msg-ok" : "msg-err"} role="status" style={{ marginBottom: 12 }}>{msg.message}</p> : null}
      {!generalOpen && !openId ? (
        <p><button className="btn" disabled={busy} onClick={() => run(async () => { const r = await startGeneralVersion(); if (r.id) open(r.id); return r; })}>Draft the general (non-healthcare) version</button></p>
      ) : null}

      {openId ? <Detail d={detail} busy={busy} notes={notes} setNotes={setNotes} run={run} close={() => open(null)} /> : !list ? <p className="note">Loading…</p> : !list.length ? <p className="note">No requests yet.</p> : (
        <div className="hm-wrap"><table className="hm req-list">
          <thead><tr><th>Received</th><th>Who</th><th>Type</th><th>Status</th><th>Draft cost</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>{day(r.created_at)}</td>
                <th><button className="linkbtn" onClick={() => open(r.id)}>{r.org_name || r.contact_name || "Request"}</button><small>{r.contact_email ?? ""}</small></th>
                <td>{KIND[r.kind]}</td>
                <td>{STATUS[r.status]}</td>
                <td>{Number(r.draft_cost) ? `$${Number(r.draft_cost).toFixed(2)}` : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}

function Detail({ d, busy, notes, setNotes, run, close }: {
  d: RequestDetail | null; busy: boolean; notes: string; setNotes: (v: string) => void;
  run: (a: () => Promise<Result>, then?: () => void) => Promise<void>; close: () => void;
}) {
  const [filter, setFilter] = useState("");
  if (!d) return <><p><button className="linkbtn" onClick={close}>← All requests</button></p><p className="note">Loading…</p></>;
  const kind = d.kind === "individual" ? "individual" : "company";
  const open = d.status !== "approved" && d.status !== "declined";
  const shown = d.changes.filter((c) => !filter || (c.place + c.before + c.after).toLowerCase().includes(filter.toLowerCase()));
  const confirmText = d.kind === "template"
    ? "Approve the general version? It becomes a standard version for Free and Essentials."
    : `Approve ${d.org_name}'s program? This creates the organization, makes the program live, and emails an invite to ${d.contact_email} as its admin.`;

  return (
    <>
      <p><button className="linkbtn" onClick={close}>← All requests</button></p>
      <h3 style={{ marginTop: 8 }}>{d.org_name || d.contact_name}</h3>
      <p className="note">{KIND[d.kind]} · {STATUS[d.status]} · received {day(d.created_at)}{d.contact_email ? ` · ${d.contact_name ?? ""} <${d.contact_email}>` : ""}{d.answers.contactRole ? `, ${d.answers.contactRole}` : ""}{d.draft_cost ? ` · drafts so far cost about $${d.draft_cost.toFixed(2)}` : ""}</p>

      <details style={{ marginTop: 12 }}><summary>Their answers</summary>
        <dl className="review-answers">
          {questionsFor(kind).filter((q) => d.answers[q.key]).map((q) => <div key={q.key}><dt>{labelFor(q, kind)}</dt><dd>{d.answers[q.key]}</dd></div>)}
        </dl>
      </details>

      {d.status === "drafting" ? <p className="checkin" style={{ marginTop: 16 }}>Claude is writing the draft. This takes a minute or two, and this page checks back every 10 seconds.</p> : null}
      {d.status === "draft_failed" ? <p className="msg-err" style={{ marginTop: 16 }}>The draft failed: {d.problems}</p> : null}
      {d.kind === "individual" ? <p className="note" style={{ marginTop: 16 }}>Individuals use the general version, so there&apos;s no draft. Close the request once you&apos;ve followed up.</p> : null}
      {open && d.kind !== "individual" && (d.status === "new" || (d.status === "draft_failed" && !d.changes.length)) ? (
        <p style={{ marginTop: 12 }}><button className="btn primary" disabled={busy} onClick={() => run(() => draftRequest(d.id))}>Draft the tailored program</button></p>
      ) : null}

      {d.summary && d.status !== "drafting" ? (
        <>
          <h4 style={{ marginTop: 20 }}>What Claude changed</h4>
          <p style={{ whiteSpace: "pre-wrap" }}>{d.summary}</p>
          {d.problems && d.status === "draft_ready" ? <details><summary className="note">Notes from the draft ({d.problems.split("\n").length})</summary><p className="note" style={{ whiteSpace: "pre-wrap" }}>{d.problems}</p></details> : null}
          <p className="note">{d.changes.length} changes from the standard wording. Read each one; undo any you don&apos;t want, or describe what to change and ask for a redraft.</p>
          <label className="dash-bar" style={{ marginTop: 8 }}>Find <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="e.g. Weeks 3, Tasha, customers" /></label>
          <div className="review-changes">
            {shown.map((c) => (
              <div className="review-change" key={c.path}>
                <div className="place"><span>{c.place}</span>{open && d.status === "draft_ready" ? <button className="linkbtn" disabled={busy} onClick={() => run(() => undoChange(d.id, c.path))}>Undo</button> : null}</div>
                <div className="pair"><div className="before" {...raw(c.before)} /><div {...raw(c.after)} /></div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {open && d.status === "draft_ready" ? (
        <div className="checkin" style={{ marginTop: 20 }}>
          <label htmlFor="rv-notes"><b>Ask for changes</b>
            <textarea id="rv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Call them “associates”, not “team members”. Make the Week 3–4 scenario about missed deadlines." />
          </label>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" disabled={busy || !notes.trim()} onClick={() => run(() => draftRequest(d.id, notes), () => setNotes(""))}>Redraft with my notes</button>
            <button className="btn primary" disabled={busy} onClick={() => { if (confirm(confirmText)) void run(() => approveRequest(d.id)); }}>Approve and go live</button>
            <button className="btn ghost" disabled={busy} onClick={() => { if (confirm("Close this request without approving it?")) void run(() => declineRequest(d.id)); }}>Decline</button>
          </div>
        </div>
      ) : open && d.status !== "drafting" ? (
        <p style={{ marginTop: 16 }}><button className="btn ghost" disabled={busy} onClick={() => { if (confirm("Close this request?")) void run(() => declineRequest(d.id)); }}>Close request</button></p>
      ) : null}
    </>
  );
}
