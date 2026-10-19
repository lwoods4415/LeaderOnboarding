"use client";
// Super-admin platform overview: every organization, its programs and their status, people by role,
// enrollments by plan, and this month's practice-partner usage and estimated cost.
// Deliberately no leader-level progress, answers or feedback (that stays with each organization's admins).
import { useEffect, useState } from "react";
import { costOf } from "@/lib/dashboard";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useProfile } from "../Account";

type Org = { id: string; name: string; slug: string; kind: string; status: string; created_at: string };
type OrgProgram = { id: string; org_id: string; program: string; status: string; approved_at: string | null };
type Row = {
  org: Org;
  programs: OrgProgram[];
  admins: number;
  leaders: number;
  plans: Record<string, number>;
  calls: number;
  cost: number | null;
};

const STATUS: Record<string, string> = { draft: "Draft", pending_review: "Waiting for your approval", live: "Live", archived: "Archived" };

async function loadPlatform(): Promise<Row[]> {
  const db = supabaseBrowser();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [orgs, programs, members, enrollments, usage] = await Promise.all([
    db.from("organizations").select("id, name, slug, kind, status, created_at").order("created_at"),
    db.from("org_programs").select("id, org_id, program, status, approved_at"),
    db.from("memberships").select("org_id, role, active"),
    db.from("enrollments").select("org_id, plan, status"),
    db.from("usage_log").select("org_id, model, input_tokens, output_tokens").gte("created_at", monthStart.toISOString()),
  ]);
  const err = orgs.error ?? programs.error ?? members.error ?? enrollments.error ?? usage.error;
  if (err) throw err;
  const memberRows = (members.data ?? []) as { org_id: string; role: string; active: boolean }[];
  const enrollmentRows = (enrollments.data ?? []) as { org_id: string; plan: string; status: string }[];
  const usageRows = (usage.data ?? []) as { org_id: string | null; model: string; input_tokens: number; output_tokens: number }[];
  return (orgs.data as Org[]).map((org) => {
    const m = memberRows.filter((x) => x.org_id === org.id && x.active);
    const plans: Record<string, number> = {};
    for (const e of enrollmentRows.filter((x) => x.org_id === org.id && x.status === "active")) plans[e.plan] = (plans[e.plan] ?? 0) + 1;
    const u = usageRows.filter((x) => x.org_id === org.id).map((x) => ({ userId: null, model: x.model, input: x.input_tokens, output: x.output_tokens }));
    const costs = u.map(costOf);
    return {
      org,
      programs: (programs.data as OrgProgram[]).filter((p) => p.org_id === org.id),
      admins: m.filter((x) => x.role === "org_admin").length,
      leaders: m.filter((x) => x.role === "leader").length,
      plans,
      calls: u.length,
      cost: costs.every((c) => c != null) ? costs.reduce<number>((a, c) => a + (c ?? 0), 0) : null,
    };
  });
}

export function Platform() {
  const profile = useProfile();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState(false);
  const isSuper = !!profile?.isSuperAdmin;

  useEffect(() => {
    if (isSuper) loadPlatform().then(setRows, () => setError(true));
  }, [isSuper]);

  if (!isSuper) return <><div className="mhead"><h2>Platform</h2></div><p>Only the platform owner can see this page.</p></>;

  const total = rows?.reduce((a, r) => ({ leaders: a.leaders + r.leaders, calls: a.calls + r.calls, cost: a.cost + (r.cost ?? 0) }), { leaders: 0, calls: 0, cost: 0 });
  return (
    <>
      <div className="mhead"><div className="eyebrow">Only visible to you</div><h2>The <em>platform</em></h2><div className="sub">Every organization, its programs, people and practice costs</div></div>
      {error ? <p className="msg-err">Couldn&apos;t load the platform overview. Refresh the page and try again.</p> : !rows ? <p className="note">Loading…</p> : (
        <>
          <div className="tiles">
            <div className="tile"><span>Organizations</span><b>{rows.length}</b><small>Companies and individual buyers</small></div>
            <div className="tile"><span>Active leaders</span><b>{total!.leaders}</b><small>Across all organizations</small></div>
            <div className="tile"><span>Practice cost this month</span><b>${total!.cost.toFixed(2)}</b><small>{total!.calls} calls to Claude, at list prices</small></div>
          </div>
          <section className="blk"><h3>Organizations</h3>
            <p className="lede">Leader-level progress, answers and feedback stay with each organization&apos;s own admins.</p>
            <div className="hm-wrap"><table className="hm">
              <thead><tr><th>Organization</th><th>Programs</th><th>Admins</th><th>Leaders</th><th>Plans</th><th>Practice this month</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.org.id}>
                    <th>{r.org.name}<small>{r.org.kind === "individual" ? "Individual" : "Company"} · {r.org.slug}{r.org.status !== "active" ? " · suspended" : ""}</small></th>
                    <td>{r.programs.map((p) => <div key={p.id}>{p.program.replace(/-/g, " ")}: {STATUS[p.status] ?? p.status}</div>)}</td>
                    <td>{r.admins}</td>
                    <td>{r.leaders}</td>
                    <td>{Object.entries(r.plans).map(([k, v]) => `${v} ${k}`).join(", ") || "–"}</td>
                    <td>{r.calls} calls{r.cost != null ? ` · $${r.cost.toFixed(2)}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </section>
        </>
      )}
    </>
  );
}
