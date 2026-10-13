// A leader's saved progress. Same shape as the reference page's state, plus `first`
// on each scenario so the first attempt survives "Try the scenario again".
import type { Difficulty } from "@/content";

export type ScenarioAttempt = { say: string; s0?: number; s1?: number };
export type ScenarioPicks = {
  say?: string;
  open?: boolean;
  s0?: number;
  s1?: number;
  /** First attempt, frozen once both steps are chosen. `say` is what they typed before seeing the options. */
  first?: ScenarioAttempt & { done?: boolean };
  /** Set once they select "Try the scenario again". */
  retried?: boolean;
};

export type Turn = { role: "leader" | "them"; text: string };
export type SkillScore = { skill: string; score: number; evidence: string; tip: string };
export type Feedback = {
  overall?: string;
  scores: SkillScore[];
  strongest?: string;
  try_this?: string;
  hidden?: string;
  next?: string;
};
export type RpState = {
  mode: Difficulty;
  turns: Turn[];
  fb: Feedback | null;
  history: { d: string; avg: number | null; mode: Difficulty }[];
};

export type Growth = {
  self0: Record<string, string>;
  self12: Record<string, string>;
  pulse0: Record<string, string>;
  pulse12: Record<string, string>;
  n0: string;
  n12: string;
};

export type LeaderState = {
  checks: Record<string, boolean>;
  notes: Record<string, string>;
  picks: Record<string, ScenarioPicks>;
  braving: Record<string, number>;
  planner: Record<string, string>;
  me: { name?: string; start?: string; leader?: string; cohort?: string };
  rp: Record<string, RpState>;
  rpSel: string;
  shared: { refl: Record<string, { text: string; at: string }>; rp: Record<string, { turns: Turn[]; at: string }> };
  growth: Growth;
  updatedAt: number;
};

export function blankState(): LeaderState {
  return {
    checks: {}, notes: {}, picks: {}, braving: {}, planner: {}, me: {}, rp: {}, rpSel: "rp0",
    shared: { refl: {}, rp: {} },
    growth: { self0: {}, self12: {}, pulse0: {}, pulse12: {}, n0: "", n12: "" },
    updatedAt: 0,
  };
}

/** Fill in anything missing from saved data, as the reference page's normalize() does. */
export function normalize(saved: Partial<LeaderState>): LeaderState {
  const b = blankState();
  const s = { ...b, ...saved } as LeaderState;
  for (const k of Object.keys(b) as (keyof LeaderState)[]) if (s[k] == null) (s as Record<string, unknown>)[k] = b[k];
  s.growth = { ...b.growth, ...s.growth };
  s.shared = { refl: s.shared.refl ?? {}, rp: s.shared.rp ?? {} };
  for (const k in s.picks) if (typeof s.picks[k] !== "object" || s.picks[k] === null) delete s.picks[k];
  return s;
}

export function rpState(s: LeaderState, id: string): RpState {
  if (!s.rp[id]) s.rp[id] = { mode: "realistic", turns: [], fb: null, history: [] };
  return s.rp[id];
}
