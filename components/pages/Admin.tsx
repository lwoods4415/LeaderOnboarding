"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { createCohort, createSignInLink, deleteLeader, inviteLeader, loadAdminData, moveLeader, setAccess, type AdminData, type Result } from "@/app/(app)/admin/actions";
import { useProfile } from "../Account";

const ago = (ts: string | null) => {
  if (!ts) return "–";
  const days = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : days + " days ago";
};

export function Admin() {
  const profile = useProfile();
  const [data, setData] = useState<AdminData | null>(null);
  const [msg, setMsg] = useState<Result | null>(null);
  const [busy, start] = useTransition();
  const [form, setForm] = useState({ name: "", email: "", cohortId: "" });
  const [cohortName, setCohortName] = useState("");
  const [link, setLink] = useState<{ name: string; url: string; copied: boolean } | null>(null);

  const refresh = useCallback(() => loadAdminData().then(setData, () => setMsg({ ok: false, message: "Couldn't load leaders. Refresh the page." })), []);
  useEffect(() => { if (profile?.role === "admin") void refresh(); }, [profile, refresh]);

  if (profile?.role !== "admin") {
    return <><div className="mhead"><h2>Leaders and cohorts</h2></div><p>Only the program owner can see this page.</p></>;
  }

  // A one-time sign-in link to share directly (no email), shown with a copy button.
  const copyLink = (id: string, name: string) =>
    start(async () => {
      try {
        const r = await createSignInLink(id);
        if (!r.ok || !r.url) { setMsg(r); return; }
        const url = r.url;
        let copied = false;
        try { await navigator.clipboard.writeText(url); copied = true; } catch {}
        setLink({ name, url, copied });
        setMsg(null);
      } catch {
        setMsg({ ok: false, message: "Something went wrong. Refresh the page and try again." });
      }
    });

  const run = (action: () => Promise<Result>, after?: () => void) =>
    start(async () => {
      try {
        const r = await action();
        setMsg(r);
        if (r.ok) { after?.(); await refresh(); }
      } catch {
        setMsg({ ok: false, message: "Something went wrong. Refresh the page and try again." });
      }
    });

  return (
    <>
      <div className="mhead"><div className="eyebrow">Only visible to you</div><h2>Leaders and <em>cohorts</em></h2><div className="sub">Invite leaders, organize cohorts and manage access</div></div>
      {msg ? <p className={msg.ok ? "msg-ok" : "msg-err"} role="status" style={{ marginBottom: 18 }}>{msg.message}</p> : null}

      <section className="blk"><h3>Invite a leader</h3><p className="lede">They&apos;ll get an email with a link to sign in. No password is needed.</p>
        <form className="form-row" onSubmit={(e) => { e.preventDefault(); run(() => inviteLeader(form), () => setForm({ name: "", email: "", cohortId: form.cohortId })); }}>
          <label htmlFor="inv-name">Name<input type="text" id="inv-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label htmlFor="inv-email">Email<input type="text" inputMode="email" id="inv-email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label htmlFor="inv-cohort">Cohort
            <select id="inv-cohort" value={form.cohortId} onChange={(e) => setForm({ ...form, cohortId: e.target.value })}>
              <option value="">No cohort</option>
              {data?.cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <button className="btn primary" disabled={busy}>Send invite</button>
        </form>
      </section>

      <section className="blk"><h3>Cohorts</h3>
        <p className="lede">{data?.cohorts.length ? data.cohorts.map((c) => c.name).join(" · ") : "No cohorts yet."}</p>
        <form className="dash-bar" onSubmit={(e) => { e.preventDefault(); run(() => createCohort(cohortName), () => setCohortName("")); }}>
          <label htmlFor="new-cohort">New cohort <input type="text" id="new-cohort" placeholder="e.g. Pilot, fall 2026" value={cohortName} onChange={(e) => setCohortName(e.target.value)} /></label>
          <button className="btn" disabled={busy}>Create cohort</button>
        </form>
      </section>

      <section className="blk"><h3>Leaders</h3>
        <p className="lede">Invite emails can be slow or land in spam. To get someone in quickly, use <b>Copy sign-in link</b> and send it to them yourself (Teams, text or your own email). No email is sent. Each link works once, for that leader only.</p>
        {link ? (
          <div className="checkin" style={{ marginBottom: 16 }}>
            <h3>Sign-in link for {link.name}</h3>
            <p style={{ marginTop: 6 }}>{link.copied ? "Copied. Paste it into a private message to them." : "Copy this and paste it into a private message to them."} It works once and expires after the time set in Supabase (24 hours).</p>
            <div className="row" style={{ marginTop: 10 }}>
              <input type="text" readOnly value={link.url} aria-label={`Sign-in link for ${link.name}`} onFocus={(e) => e.target.select()} style={{ flex: "1 1 260px" }} />
              <button className="btn" onClick={() => navigator.clipboard.writeText(link.url).then(() => setLink({ ...link, copied: true }), () => {})}>Copy</button>
              <button className="btn ghost" onClick={() => setLink(null)}>Done</button>
            </div>
          </div>
        ) : null}
        {!data ? <p className="note">Loading…</p> : !data.leaders.length ? <p className="note">No leaders yet. Invite one above.</p> : (
          <div className="hm-wrap"><table className="hm">
            <thead><tr><th>Leader</th><th>Cohort</th><th>Status</th><th>Last active</th><th>Access</th></tr></thead>
            <tbody>
              {data.leaders.map((l) => (
                <tr key={l.id}>
                  <th>{l.name || l.email}<small>{l.email}{l.role === "admin" ? " · admin" : ""}</small></th>
                  <td>
                    <select aria-label={`Cohort for ${l.name}`} value={l.cohortId ?? ""} disabled={busy} onChange={(e) => { const v = e.target.value; run(() => moveLeader(l.id, v)); }}>
                      <option value="">No cohort</option>
                      {data.cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td>{!l.active ? "Access removed" : l.invitePending ? "Invite pending" : "Signed in"}</td>
                  <td>{ago(l.lastActive)}</td>
                  <td>
                    {l.id === profile.id ? <span className="note">You</span>
                      : l.active
                        ? <>
                            <button className="btn ghost" disabled={busy} onClick={() => copyLink(l.id, l.name || l.email)}>Copy sign-in link</button>{" "}
                            <button className="btn ghost" disabled={busy} onClick={() => { if (confirm(`Remove ${l.name || l.email}'s access? Their progress is kept and you can restore it later.`)) run(() => setAccess(l.id, false)); }}>Remove access</button>
                          </>
                        : <>
                            <button className="btn ghost" disabled={busy} onClick={() => run(() => setAccess(l.id, true))}>Restore access</button>{" "}
                            <button className="btn ghost" disabled={busy} onClick={() => { if (confirm(`Permanently delete ${l.name || l.email} and everything they saved? This can't be undone.`)) run(() => deleteLeader(l.id)); }}>Delete permanently</button>
                          </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
