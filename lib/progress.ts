// Progress rules, ported from the reference page's modProgress(), overall(), rpAvg() and avgOf().
import { MODULES, roleplayFor, type Module } from "@/content";
import type { Feedback, LeaderState } from "./state";

export function modProgress(s: LeaderState, m: Module) {
  const rp = roleplayFor(m.id);
  let done = 0;
  const total = m.practice.length + m.reflect.length + 1 + (rp ? 1 : 0);
  m.practice.forEach((p) => { if (s.checks[p.id]) done++; });
  m.reflect.forEach((r) => { if ((s.notes[r.id] || "").trim()) done++; });
  const pk = s.picks[m.id];
  if (pk && pk.s1 != null) done++;
  if (rp && s.rp[rp.id]?.fb) done++;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export function overall(s: LeaderState) {
  let d = 0, t = 0;
  MODULES.forEach((m) => { const p = modProgress(s, m); d += p.done; t += p.total; });
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
