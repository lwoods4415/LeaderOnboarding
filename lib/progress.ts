// Progress rules, ported from the reference page's modProgress(), overall(), rpAvg() and avgOf().
import type { Module, Roleplay } from "@/content";
import type { Feedback, LeaderState } from "./state";

/** The parts of a program the progress rules need (the leader's own program, from useProgram()). */
type ProgramShape = { modules: Module[]; roleplays: Roleplay[] };

export function modProgress(s: LeaderState, m: Module, program: ProgramShape) {
  const rp = program.roleplays.find((r) => r.mod === m.id);
  let done = 0;
  const total = m.practice.length + m.reflect.length + 1 + (rp ? 1 : 0);
  m.practice.forEach((p) => { if (s.checks[p.id]) done++; });
  m.reflect.forEach((r) => { if ((s.notes[r.id] || "").trim()) done++; });
  const pk = s.picks[m.id];
  if (pk && pk.s1 != null) done++;
  if (rp && s.rp[rp.id]?.fb) done++;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export function overall(s: LeaderState, program: ProgramShape) {
  let d = 0, t = 0;
  program.modules.forEach((m) => { const p = modProgress(s, m, program); d += p.done; t += p.total; });
  return Math.round((d / t) * 100);
}

export const rpAvg = (fb: Feedback | null | undefined) =>
  fb && fb.scores && fb.scores.length
    ? Math.round((fb.scores.reduce((a, x) => a + (Number(x.score) || 0), 0) / fb.scores.length) * 10) / 10
    : null;

export function avgOf(obj: Record<string, string>, n: number) {
  const v: number[] = [];
  for (let i = 0; i < n; i++) { const x = Number(obj[i]); if (x) v.push(x); }
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
}

export const today = () => new Date().toISOString().slice(0, 10);
