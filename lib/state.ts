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

/**
 * A leader's work in one core lesson (content/core-lessons), keyed by lesson id (cl-m0 … cl-m6).
 * Split on save: opened, completedAt and checkAnswers go to the record the program leader can see;
 * written answers, sliders, sorting and cards explored stay private (see lib/sync.ts).
 */
export type CoreLessonState = {
  opened?: string;
  completedAt?: string;
  /** Check question id → chosen option index. */
  checkAnswers?: Record<string, number>;
  /** "Make it yours" and self-placement question id → text. */
  answers?: Record<string, string>;
  /** Cards flipped, stages viewed or quadrants opened. */
  modelExplored?: string[];
  /** Equation slider values (factor id → value). */
  sliders?: Record<string, number>;
  /** Sort model item id → chosen bucket. */
  modelSorted?: Record<string, string>;
  /** Spotlight activity item id → chosen bucket (the marble jar). */
  spotlightSorted?: Record<string, string>;
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
  coreLessons: Record<string, CoreLessonState>;
  updatedAt: number;
};

export function blankState(): LeaderState {
  return {
    checks: {}, notes: {}, picks: {}, braving: {}, planner: {}, me: {}, rp: {}, rpSel: "rp0",
    shared: { refl: {}, rp: {} },
    growth: { self0: {}, self12: {}, pulse0: {}, pulse12: {}, n0: "", n12: "" },
    coreLessons: {},
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
  for (const k in s.coreLessons) if (typeof s.coreLessons[k] !== "object" || s.coreLessons[k] === null) delete s.coreLessons[k];
  return s;
}

export function lessonState(s: LeaderState, id: string): CoreLessonState {
  if (!s.coreLessons[id]) s.coreLessons[id] = {};
  return s.coreLessons[id];
}

export function rpState(s: LeaderState, id: string): RpState {
  if (!s.rp[id]) s.rp[id] = { mode: "realistic", turns: [], fb: null, history: [] };
  return s.rp[id];
}
