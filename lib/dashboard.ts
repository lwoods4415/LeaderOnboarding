"use client";
// Cohort dashboard data for one organization, read as its org admin under row-level security:
// people, enrollments, progress (scores, scenario answers, growth), shared items and practice usage.
// Private data is never read here, and the database wouldn't return it to an admin anyway.
// Everything is filtered to the organization, because a super admin can also see other organizations' people.
import type { ProgramContent } from "@/content/program";
import { isCustomId, STANDARD_SKILLS } from "@/content/custom-practice";
import { avgOf, rpAvg } from "./progress";
import type { Growth, RpState, ScenarioPicks, Turn } from "./state";
import { supabaseBrowser } from "./supabase/client";

export type DashLeader = {
  id: string;
  enrollmentId: string;
  name: string;
  email: string;
  cohort: string;
  lastActive: string | null;
  overall: number;
  modules: { id: string; pct: number }[];
  picks: Record<string, ScenarioPicks>;
  rp: Record<string, Omit<RpState, "turns">>;
  growth: Growth | null;
  /** Core lessons: opened and completed dates and check answers (never written answers or sliders). */
  lessons: Record<string, { opened?: string; completedAt?: string; checkAnswers?: Record<string, number> }>;
  shared: { refl: Record<string, { text: string; at: string }>; rp: Record<string, { turns: Turn[]; at: string }> };
};
export type Usage = { userId: string | null; model: string; input: number; output: number };
export type DashData = { leaders: DashLeader[]; usage: Usage[] };

// $ per million tokens (input, output), for the cost estimate. Update if prices or models change.
const PRICES: Record<string, [number, number]> = {
  "claude-haiku-5-5": [0.1, 0.5],
  "claude-sonnet-5-5": [2, 10],
};
export const costOf = (u: Usage) => {
  const p = PRICES[u.model];
  return p ? (u.input * p[0] + u.output * p[1]) / 1e6 : null;
};

export async function loadDashboard(orgId: string, orgProgramId: string, program: ProgramContent): Promise<DashData> {
  const db = supabaseBrowser();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [members, enrollments, progress, shared, usage] = await Promise.all([
    db.from("memberships").select("user_id, role, active").eq("org_id", orgId),
    db.from("enrollments").select("id, user_id, status, cohorts(name)").eq("org_id", orgId).eq("org_program_id", orgProgramId),
    db.from("leader_progress").select("enrollment_id, data, enrollments!inner(org_id)").eq("enrollments.org_id", orgId),
    db.from("shared_items").select("enrollment_id, kind, item_id, content, shared_at, enrollments!inner(org_id)").eq("enrollments.org_id", orgId),
    db.from("usage_log").select("user_id, model, input_tokens, output_tokens").eq("org_id", orgId).gte("created_at", monthStart.toISOString()),
  ]);
  const err = members.error ?? enrollments.error ?? progress.error ?? shared.error ?? usage.error;
  if (err) throw err;
  type Profile = { id: string; email: string; name: string; active: boolean; last_active: string | null };
  const memberIds = ((members.data ?? []) as { user_id: string }[]).map((m) => m.user_id);
  const profiles = await db.from("profiles").select("id, email, name, active, last_active").in("id", memberIds);
  if (profiles.error) throw profiles.error;
  const profileOf = new Map(((profiles.data ?? []) as Profile[]).map((p) => [p.id, p]));

  type ProgressDoc = { picks?: DashLeader["picks"]; rp?: DashLeader["rp"]; growth?: Growth; coreLessons?: DashLeader["lessons"]; summary?: { overall: number; modules: { id: string; pct: number }[] } };
  const prog = new Map((progress.data as { enrollment_id: string; data: ProgressDoc }[]).map((r) => [r.enrollment_id, r.data]));
  type Member = { user_id: string; role: string; active: boolean };
  const member = new Map((members.data as Member[]).map((m) => [m.user_id, m]));
  const leaders: DashLeader[] = [];
  for (const e of enrollments.data as unknown as { id: string; user_id: string; status: string; cohorts: { name: string } | null }[]) {
    const m = member.get(e.user_id), p = profileOf.get(e.user_id);
    // Leaders only (not org admins), with active access, as on the original dashboard.
    if (!m || !p || m.role !== "leader" || !m.active || !p.active || e.status !== "active") continue;
    const d = prog.get(e.id) ?? {};
    leaders.push({
      id: e.user_id, enrollmentId: e.id, name: p.name || p.email, email: p.email, cohort: e.cohorts?.name ?? "", lastActive: p.last_active,
      overall: d.summary?.overall ?? 0,
      modules: d.summary?.modules ?? program.modules.map((x) => ({ id: x.id, pct: 0 })),
      picks: d.picks ?? {}, rp: d.rp ?? {}, growth: d.growth ?? null, lessons: d.coreLessons ?? {},
      shared: { refl: {}, rp: {} },
    });
  }
  const byEnrollment = new Map(leaders.map((l) => [l.enrollmentId, l]));
  for (const s of shared.data as { enrollment_id: string; kind: string; item_id: string; content: { text?: string; turns?: Turn[] }; shared_at: string }[]) {
    const l = byEnrollment.get(s.enrollment_id);
    if (!l) continue;
    const at = s.shared_at.slice(0, 10);
    if (s.kind === "reflection") l.shared.refl[s.item_id] = { text: s.content.text ?? "", at };
    else l.shared.rp[s.item_id] = { turns: s.content.turns ?? [], at };
  }
  return {
    leaders: leaders.sort((a, b) => a.name.localeCompare(b.name)),
    usage: (usage.data as { user_id: string | null; model: string; input_tokens: number; output_tokens: number }[]).map((u) => ({ userId: u.user_id, model: u.model, input: u.input_tokens, output: u.output_tokens })),
  };
}

// ---------- calculations, ported from the reference page's renderDashboard ----------
export const round1 = (x: number) => Math.round(x * 10) / 10;
export const avg = (arr: (number | null)[]) => {
  const v = arr.filter((x): x is number => x != null);
  return v.length ? round1(v.reduce((a, b) => a + b, 0) / v.length) : null;
};
/** Average of each conversation's latest score. */
export const practiceAvg = (l: DashLeader) => avg(Object.values(l.rp).map((x) => (x.fb ? rpAvg(x.fb) : null)));
export const selfAvg = (l: DashLeader, wk: 0 | 12, p: ProgramContent) => (l.growth ? avgOf((wk === 0 ? l.growth.self0 : l.growth.self12) ?? {}, p.selfSkills.length) : null);
export const pulseAvg = (l: DashLeader, wk: 0 | 12, p: ProgramContent) => (l.growth ? avgOf((wk === 0 ? l.growth.pulse0 : l.growth.pulse12) ?? {}, p.pulseQ.length) : null);
export const change = (a: number | null, b: number | null) => (a != null && b != null ? round1(b - a) : null);

export function currentModule(l: DashLeader, p: ProgramContent) {
  const m = l.modules.find((x) => x.pct < 100);
  return m ? p.modules.find((x) => x.id === m.id)?.short ?? "" : "All modules done";
}

/** The cohort's lowest-scoring practice skills, with the conversation and number of leaders behind each. */
export function lowestSkills(leaders: DashLeader[], p: ProgramContent) {
  const rows: { skill: string; conv: string; n: number; a: number }[] = [];
  for (const r of p.roleplays) {
    r.skills.forEach((skill, i) => {
      const v: number[] = [];
      for (const l of leaders) { const s = l.rp[r.id]?.fb?.scores?.[i]; if (s) v.push(Number(s.score)); }
      if (v.length) rows.push({ skill, conv: r.title, n: v.length, a: round1(v.reduce((a, b) => a + b, 0) / v.length) });
    });
  }
  // Leaders' own scenarios are all scored on the same standard rubric, so they can be combined.
  STANDARD_SKILLS.forEach((skill, i) => {
    const v: number[] = [], who = new Set<string>();
    for (const l of leaders) {
      for (const [id, x] of Object.entries(l.rp)) {
        const sc = isCustomId(id) ? x.fb?.scores?.[i] : undefined;
        if (sc) { v.push(Number(sc.score)); who.add(l.id); }
      }
    }
    if (v.length) rows.push({ skill, conv: "Leaders' own scenarios", n: who.size, a: round1(v.reduce((a, b) => a + b, 0) / v.length) });
  });
  return rows.sort((a, b) => a.a - b.a);
}

/** Share of strong scenario choices per module (latest choices, as on the reference page). */
export function strongChoices(leaders: DashLeader[], p: ProgramContent) {
  return p.modules.map((m) => {
    let strong = 0, total = 0;
    for (const l of leaders) {
      const pk = l.picks[m.id];
      if (!pk) continue;
      [pk.s0, pk.s1].forEach((k, step) => {
        if (k == null) return;
        total++;
        if (m.scenario.steps[step].options[k]?.r === "strong") strong++;
      });
    }
    return { m, strong, total };
  }).filter((x) => x.total);
}

// ---------- CSV export ----------
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@]/.test(s) && typeof v === "string") s = "'" + s; // stop spreadsheets treating text as a formula
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function summaryCsv(leaders: DashLeader[], p: ProgramContent) {
  const head = ["Name", "Email", "Cohort", "Last active", "Overall %", ...p.modules.map((m) => `${m.weeks} %`), "Avg practice score (of 3)", "Scored practice sessions",
    "Self-assessment Wk 0", "Self-assessment Wk 12", "Self-assessment change", "Team pulse Wk 0", "Team pulse Wk 12", "Team pulse change", "Pulse responses Wk 0", "Pulse responses Wk 12", "Strong scenario choices"];
  const rows = leaders.map((l) => {
    const strong = strongChoices([l], p).reduce((a, x) => [a[0] + x.strong, a[1] + x.total], [0, 0]);
    const s0 = selfAvg(l, 0, p), s12 = selfAvg(l, 12, p), p0 = pulseAvg(l, 0, p), p12 = pulseAvg(l, 12, p);
    return [l.name, l.email, l.cohort, l.lastActive?.slice(0, 10) ?? "", l.overall, ...p.modules.map((m) => l.modules.find((x) => x.id === m.id)?.pct ?? 0),
      practiceAvg(l) ?? "", Object.values(l.rp).reduce((a, x) => a + (x.history?.length ?? 0), 0),
      s0 ?? "", s12 ?? "", change(s0, s12) ?? "", p0 ?? "", p12 ?? "", change(p0, p12) ?? "", l.growth?.n0 ?? "", l.growth?.n12 ?? "",
      strong[1] ? `${strong[0]} of ${strong[1]}` : ""];
  });
  return [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

/**
 * Core lesson check questions, for "Focus for your next lab": per question, how many leaders answered and
 * the share who chose the correct option.
 */
export function lessonCheckSummary(docs: DashLeader[], program: Pick<ProgramContent, "coreLessons">) {
  return (program.coreLessons ?? []).map((l) => ({
    lesson: l,
    completed: docs.filter((d) => d.lessons[l.id]?.completedAt).length,
    questions: l.check.map((q) => {
      const correct = q.options.findIndex((o) => o.correct);
      const answers = docs.map((d) => d.lessons[l.id]?.checkAnswers?.[q.id]).filter((a): a is number => a != null);
      return { q, answered: answers.length, pct: answers.length ? Math.round((answers.filter((a) => a === correct).length / answers.length) * 100) : null };
    }),
  }));
}
