// Custom practice scenarios: the standard rubric every leader-written scenario is scored on,
// and the form limits. Not part of the reference page; approved by the program owner, 2026-10-16.
import type { Difficulty } from "./types";

/** The five core skills from the program, used to score every custom scenario. */
export const STANDARD_SKILLS = [
  "Opened with purpose and care",
  "Asked open questions and listened",
  "Stuck to facts, not stories",
  "Was honest and clear about what matters",
  "Agreed on a specific next step",
];

export const CUSTOM_LIMITS = { title: 80, who: 40, role: 120, situation: 1200, goal: 400, reactions: 600, hidden: 600, maxScenarios: 20 };

/** Custom scenario ids are stored with this prefix wherever practice state is keyed by conversation. */
export const CUSTOM_PREFIX = "c:";
export const isCustomId = (id: string) => id.startsWith(CUSTOM_PREFIX);

export type CustomScenario = {
  id: string; // database id (uuid), without the prefix
  title: string;
  who: string;
  role: string;
  situation: string;
  goal: string;
  reactions: string;
  hidden: string;
};

/** The difficulty description, about the leader's character instead of "the nurse". */
export const customMode = (modes: Record<Difficulty, string>, mode: Difficulty, who: string) => modes[mode].replace("the nurse", who);
