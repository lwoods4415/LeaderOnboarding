// Progress rules, ported from the reference page's modProgress(), overall(), rpAvg() and avgOf().
import type { Module, Roleplay } from "@/content";
import type { CoreLesson } from "@/content/core-lessons/types";

// Mirrors COUNT_CORE_LESSON_IN_PROGRESS in content/core-lessons/index.ts. Importing that file here would put
// every lesson in the browser bundle (lessons reach the browser only from /api/program, trimmed to the plan).
const COUNT_CORE_LESSON_IN_PROGRESS = true;
import type { Feedback, LeaderState } from "./state";

/** The parts of a program the progress rules need (the leader's own program, from useProgram()). */
type ProgramShape = { modules: Module[]; roleplays: Roleplay[]; coreLessons?: CoreLesson[] };

/** The core lesson for a module, if this program has core lessons. */
export const lessonFor = (program: ProgramShape, moduleId: string) => program.coreLessons?.find((l) => l.legacyModuleId === moduleId);

/**
 * A core lesson's own steps: explore the model, the spotlight activity (Module 1), answer every check
 * question, answer every written question, mark it complete. 100% only when all are done.
 */
export function lessonProgress(s: LeaderState, l: CoreLesson) {
  const st = s.coreLessons[l.id] ?? {};
  const filled = (ids: string[]) => ids.every((id) => (st.answers?.[id] ?? "").trim());
  const written = [...l.makeItYours.questions, ...(l.model.type === "matrix" ? l.model.selfPlacement?.questions ?? [] : [])].map((q) => q.id);
  const steps = [
    !!(st.modelExplored?.length || Object.keys(st.sliders ?? {}).length || Object.keys(st.modelSorted ?? {}).length),
    ...(l.spotlight?.activity ? [l.spotlight.activity.items.every((i) => st.spotlightSorted?.[i.id])] : []),
    l.check.every((q) => st.checkAnswers?.[q.id] != null),
    filled(written),
    !!st.completedAt,
  ];
  const done = steps.filter(Boolean).length;
  return { done, total: steps.length, pct: Math.round((done / steps.length) * 100) };
}

export function modProgress(s: LeaderState, m: Module, program: ProgramShape) {
  const rp = program.roleplays.find((r) => r.mod === m.id);
  let done = 0;
  const lesson = COUNT_CORE_LESSON_IN_PROGRESS ? lessonFor(program, m.id) : undefined;
  // A completed core lesson counts as one item, alongside the checklist, reflections, scenario and practice.
  const total = m.practice.length + m.reflect.length + 1 + (rp ? 1 : 0) + (lesson ? 1 : 0);
  if (lesson && s.coreLessons[lesson.id]?.completedAt) done++;
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
