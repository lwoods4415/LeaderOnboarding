import "server-only";
// Which programs show the core lessons (content/core-lessons), and which lessons a plan includes.
// The lessons' examples are written for healthcare teams, so for now they're on for the pilot only;
// other programs get them once per-program tailoring (docs/TAILORING.md) is built. Approved 2026-10-30.
import { CORE_LESSONS } from "@/content/core-lessons";
import type { CoreLesson } from "@/content/core-lessons/types";
import { moduleOpen, type Plan } from "./plans";

/** Organizations (by slug) whose program shows the core lessons. */
export const CORE_LESSON_ORGS = new Set(["pilot"]);

/** The lessons this leader's plan includes: only the free modules' lessons on the free preview. */
export function coreLessonsFor(orgSlug: string | null | undefined, plan: Plan): CoreLesson[] | undefined {
  if (!orgSlug || !CORE_LESSON_ORGS.has(orgSlug)) return undefined;
  return CORE_LESSONS.filter((l) => moduleOpen(plan, l.legacyModuleId));
}
