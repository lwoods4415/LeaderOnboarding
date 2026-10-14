"use client";
// Cohort dashboard data, read as the admin under row-level security: profiles, progress
// (scores, scenario answers, growth), shared items and practice usage. Private data is never
// read here, and the database wouldn't return it to the admin anyway.
import { MODULES, PULSE_Q, ROLEPLAYS, SELF_SKILLS } from "@/content";
import { avgOf, rpAvg } from "./progress";
import type { Growth, RpState, ScenarioPicks, Turn } from "./state";
import { supabaseBrowser } from "./supabase/client";

export type DashLeader = {
  id: string;
  name: string;
  email: string;
  cohort: string;
  lastActive: string | null;
  overall: number;
  modules: { id: string; pct: number }[];
  picks: Record<string, ScenarioPicks>;
  rp: Record<string, Omit<RpState, "turns">>;
  growth: Growth | null;
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

export async function loadDashboard(): Promise<DashData> {
  const db = supabaseBrowser();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [profiles, progress, shared, usage] = await Promise.all([
    db.from("profiles").select("id, email, name, role, active, last_active, cohorts(name)"),
    db.from("leader_progress").select("user_id, data"),
    db.from("shared_items").select("user_id, kind, item_id, content, shared_at"),
    db.from("usage_log").select("user_id, model, input_tokens, output_tokens").gte("created_at", monthStart.toISOString()),
  ]);
  const err = profiles.error ?? progress.error ?? shared.error ?? usage.error;
  if (err) throw err;

  type ProgressDoc = { picks?: DashLeader["picks"]; rp?: DashLeader["rp"]; growth?: Growth; summary?: { overall: number; modules: { id: string; pct: number }[] } };
  const prog = new Map((progress.data as { user_id: string; data: ProgressDoc }[]).map((r) => [r.user_id, r.data]));
  const leaders: DashLeader[] = [];
  for (const p of profiles.data as { id: string; email: string; name: string; role: string; active: boolean; last_active: string | null; cohorts: { name: string } | null }[]) {
    if (p.role !== "leader" || !p.active) continue;
    const d = prog.get(p.id) ?? {};
    leaders.push({
      id: p.id, name: p.name || p.email, email: p.email, cohort: p.cohorts?.name ?? "", lastActive: p.last_active,
      overall: d.summary?.overall ?? 0,
      modules: d.summary?.modules ?? MODULES.map((m) => ({ id: m.id, pct: 0 })),
      picks: d.picks ?? {}, rp: d.rp ?? {}, growth: d.growth ?? null,
      shared: { refl: {}, rp: {} },
    });
  }
  const byId = new Map(leaders.map((l) => [l.id, l]));
  for (const s of shared.data as { user_id: string; kind: string; item_id: string; content: { text?: string; turns?: Turn[] }; shared_at: string }[]) {
    const l = byId.get(s.user_id);
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
export const selfAvg = (l: DashLeader, wk: 0 | 12) => (l.growth ? avgOf(wk === 0 ? l.growth.self0 : l.growth.self12, SELF_SKILLS.length) : null);
export const pulseAvg = (l: DashLeader, wk: 0 | 12) => (l.growth ? avgOf(wk === 0 ? l.growth.pulse0 : l.growth.pulse12, PULSE_Q.length) : null);
export const change = (a: number | null, b: number | null) => (a != null && b != null ? round1(b - a) : null);

export function currentModule(l: DashLeader) {
  const m = l.modules.find((x) => x.pct < 100);
  return m ? MODULES.find((x) => x.id === m.id)?.short ?? "" : "All modules done";
}

/** The cohort's lowest-scoring practice skills, with the conversation and number of leaders behind each. */
export function lowestSkills(leaders: DashLeader[]) {
  const rows: { skill: string; conv: string; n: number; a: number }[] = [];
  for (const r of ROLEPLAYS) {
    r.skills.forEach((skill, i) => {
      const v: number[] = [];
      for (const l of leaders) { const s = l.rp[r.id]?.fb?.scores?.[i]; if (s) v.push(Number(s.score)); }
      if (v.length) rows.push({ skill, conv: r.title, n: v.length, a: round1(v.reduce((a, b) => a + b, 0) / v.length) });
    });
  }
  return rows.sort((a, b) => a.a - b.a);
}

/** Share of strong scenario choices per module (latest choices, as on the reference page). */
export function strongChoices(leaders: DashLeader[]) {
  return MODULES.map((m) => {
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

export function summaryCsv(leaders: DashLeader[]) {
  const head = ["Name", "Email", "Cohort", "Last active", "Overall %", ...MODULES.map((m) => `${m.weeks} %`), "Avg practice score (of 3)", "Scored practice sessions",
    "Self-assessment Wk 0", "Self-assessment Wk 12", "Self-assessment change", "Team pulse Wk 0", "Team pulse Wk 12", "Team pulse change", "Pulse responses Wk 0", "Pulse responses Wk 12", "Strong scenario choices"];
  const rows = leaders.map((l) => {
    const strong = strongChoices([l]).reduce((a, x) => [a[0] + x.strong, a[1] + x.total], [0, 0]);
    const s0 = selfAvg(l, 0), s12 = selfAvg(l, 12), p0 = pulseAvg(l, 0), p12 = pulseAvg(l, 12);
    return [l.name, l.email, l.cohort, l.lastActive?.slice(0, 10) ?? "", l.overall, ...MODULES.map((m) => l.modules.find((x) => x.id === m.id)?.pct ?? 0),
      practiceAvg(l) ?? "", Object.values(l.rp).reduce((a, x) => a + (x.history?.length ?? 0), 0),
      s0 ?? "", s12 ?? "", change(s0, s12) ?? "", p0 ?? "", p12 ?? "", change(p0, p12) ?? "", l.growth?.n0 ?? "", l.growth?.n12 ?? "",
      strong[1] ? `${strong[0]} of ${strong[1]}` : ""];
  });
  return [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
