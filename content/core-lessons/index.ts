import type { CoreLesson } from "./types";
import { lessonM0 } from "./m0-five-myths";
import { lessonM1 } from "./m1-trust-equation";
import { lessonM2 } from "./m2-lead-lag";
import { lessonM3 } from "./m3-grow-coaching";
import { lessonM4 } from "./m4-path-to-action";
import { lessonM5 } from "./m5-radical-candor";
import { lessonM6 } from "./m6-safety-accountability";

export * from "./types";

/** All seven core lessons, in module order. */
export const CORE_LESSONS: CoreLesson[] = [
  lessonM0,
  lessonM1,
  lessonM2,
  lessonM3,
  lessonM4,
  lessonM5,
  lessonM6,
];

/** Look up a lesson by the original reference-page module id (m0 to m6). */
export function getCoreLessonByLegacyModuleId(moduleId: string): CoreLesson | undefined {
  return CORE_LESSONS.find((l) => l.legacyModuleId === moduleId);
}

/** Fallback lookup by module title, for platforms that renamed module ids. */
export function getCoreLessonByModuleTitle(title: string): CoreLesson | undefined {
  const t = title.toLowerCase();
  return CORE_LESSONS.find((l) => l.moduleMatch.some((m) => t.includes(m.toLowerCase())));
}

/**
 * Feature flag: when true, completing the core lesson counts as one item in
 * the module's progress percentage. Existing leaders' percentages will dip
 * slightly the first time they see the new lesson.
 */
export const COUNT_CORE_LESSON_IN_PROGRESS = true;

export * from "./tailoring";
