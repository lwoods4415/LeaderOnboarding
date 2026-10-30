// A whole program as one object, so each organization can have its own copy (stored in the database).
// The content files in content/leading-people are the standard healthcare version of Leading People;
// standardProgram() bundles them. Character backstories travel separately (server only).
import { BOOKS, BRAVING, DOC_TOOL, TOOLS } from "./leading-people/toolkit";
import { ESCALATE, PATHWAY } from "./leading-people/pathway";
import { MEASURES, MODULES } from "./leading-people/modules";
import { MODES, ROLEPLAYS } from "./leading-people/roleplays";
import { PASSAGES, PROGRAM, SPONSOR } from "./leading-people/program";
import { PULSE_OPEN, PULSE_Q, SELF_SKILLS } from "./leading-people/growth";
import type { CoreLesson } from "./core-lessons/types";
import type { Difficulty, Measure, Module, PathwayStage, PlannerTool, Program, Roleplay, RoleplaySecret, Sponsor, Tool } from "./types";

export type ProgramContent = {
  program: Program;
  passages: string[];
  modules: Module[];
  measures: Measure[];
  roleplays: Roleplay[];
  modes: Record<Difficulty, string>;
  pathway: PathwayStage[];
  escalate: string[];
  selfSkills: string[];
  pulseQ: string[];
  pulseOpen: string[];
  tools: Tool[];
  docTool: PlannerTool;
  books: [string, string][];
  braving: [string, string][];
  sponsor: Sponsor;
  /**
   * Core lessons (content/core-lessons), added by the server for programs that have them and trimmed to the
   * leader's plan. Never stored with the program in the database.
   */
  coreLessons?: CoreLesson[];
};

/** Server-only parts of a program. */
export type ProgramSecrets = { roleplays: Record<string, RoleplaySecret> };

/** The standard healthcare version of Leading People, from the content files. */
export function standardProgram(): ProgramContent {
  return {
    program: PROGRAM, passages: PASSAGES, modules: MODULES, measures: MEASURES, roleplays: ROLEPLAYS, modes: MODES,
    pathway: PATHWAY, escalate: ESCALATE, selfSkills: SELF_SKILLS, pulseQ: PULSE_Q, pulseOpen: PULSE_OPEN,
    tools: TOOLS, docTool: DOC_TOOL, books: BOOKS, braving: BRAVING, sponsor: SPONSOR,
  };
}

export const STANDARD_TEMPLATE_ID = "leading-people-healthcare-v1";
