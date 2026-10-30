/**
 * Core Lessons: content types.
 *
 * One CoreLesson per module of the Leading People protocol. This file is
 * content only: no UI, no database, no API calls. See INTEGRATION.md for how
 * to render it without changing scenarios or the AI practice conversations.
 */

export type ModelType = "flipcards" | "equation" | "sort" | "stages" | "matrix";

/** A cited source shown under "Why it works" or "Go deeper". */
export interface Citation {
  label: string;          // e.g. "Linda A. Hill, “Becoming the Boss,” Harvard Business Review, Jan 2007"
  url?: string;           // omit for books without a stable free link
}

/** One written-response question. Each gets its own free-text box. */
export interface ReflectionQuestion {
  id: string;             // stable storage key, e.g. "cl-m4-apply-1"
  prompt: string;
  placeholder: string;
}

/** A set of written-response questions with an optional lead-in. */
export interface ReflectionSet {
  id: string;             // group id, e.g. "cl-m4-apply"
  intro?: string;         // shown above the questions
  questions: ReflectionQuestion[];
}

/* ---------- Interactive model variants ---------- */

export interface FlipCardsModel {
  type: "flipcards";
  name: string;
  oneLine: string;
  instructions: string;
  cards: { id: string; front: string; back: string; example?: string }[];
}

export interface EquationModel {
  type: "equation";
  name: string;
  oneLine: string;
  instructions: string;
  /** Display string for the formula, e.g. "Trust = (C + R + I) ÷ S" */
  formula: string;
  factors: {
    id: string;
    label: string;
    role: "numerator" | "denominator";
    question: string;       // the question this factor answers
    lowSounds: string;      // what a low score looks like at work
    highSounds: string;     // what a high score looks like at work
    buildIt: string[];      // concrete moves for a new leader
  }[];
  /** Slider range, inclusive. Renderer computes (sum of numerators) ÷ denominator. */
  scale: { min: number; max: number; default: number };
  /** Bands for the computed score, checked in order; first match wins. */
  resultBands: { maxScore: number; label: string; message: string }[];
}

export interface SortModel {
  type: "sort";
  name: string;
  oneLine: string;
  instructions: string;
  buckets: { id: string; label: string; description: string }[];
  items: { id: string; text: string; answer: string; explain: string }[];
}

export interface StagesModel {
  type: "stages";
  name: string;
  oneLine: string;
  instructions: string;
  stages: {
    id: string;
    name: string;
    summary: string;
    detail: string;
    example: string;
    questions?: string[];   // questions a leader can ask at this stage
    watchFor?: string;      // the common mistake at this stage
  }[];
  /** Optional closing note shown after the last stage. */
  closing?: string;
}

export interface MatrixModel {
  type: "matrix";
  name: string;
  oneLine: string;
  instructions: string;
  axes: {
    x: { label: string; low: string; high: string };
    y: { label: string; low: string; high: string };
  };
  quadrants: {
    id: string;
    position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
    name: string;
    description: string;
    soundsLike: string;     // a line a leader in this quadrant might say
    move: string;           // how to move toward the target quadrant
  }[];
  /** id of the quadrant leaders should aim for */
  target: string;
  /** Optional self-placement exercise. Answers are private to the leader. */
  selfPlacement?: ReflectionSet;
}

export type InteractiveModel =
  | FlipCardsModel
  | EquationModel
  | SortModel
  | StagesModel
  | MatrixModel;

/* ---------- Lesson ---------- */

export interface ExampleLine {
  speaker: "leader" | "teamMember";
  text: string;
  note?: string;            // tap-to-reveal coaching note
}

export interface CheckQuestion {
  id: string;
  question: string;
  options: { text: string; correct: boolean; explain: string }[];
}

export interface GoDeeperResource {
  kind: "video" | "article" | "book" | "tool" | "podcast";
  title: string;
  by: string;
  url?: string;             // omitted for books; render as plain text
  minutes?: number;         // approximate time to watch or read
  access?: string;          // e.g. "May require a subscription"
  why: string;              // one line on why it's worth the time
}

export interface CoreLesson {
  /** Stable id for storage, e.g. "cl-m4". Never reuse or rename. */
  id: string;
  /** Module id in the original Leading People reference page (m0 to m6). */
  legacyModuleId: "m0" | "m1" | "m2" | "m3" | "m4" | "m5" | "m6";
  /** Words that identify the matching module if the platform renamed ids. */
  moduleMatch: string[];
  title: string;            // lesson title, e.g. "The Path to Action"
  estimatedMinutes: number;

  bigIdea: string;          // one sentence, shown large
  whyNow: string[];         // 1–2 short paragraphs: why this matters in this module

  model: InteractiveModel;

  whyItWorks: { paragraphs: string[]; sources: Citation[] };

  /**
   * Optional deeper look at one idea within the lesson, shown right after
   * "Why it works". May include a short sort activity (same renderer as
   * the "sort" model type).
   */
  spotlight?: {
    title: string;
    intro: string;
    paragraphs: string[];
    points?: { title: string; text: string }[];
    activity?: SortModel;
    sources: Citation[];
  };

  seeItInAction: {
    setup: string;
    weak: { label: string; lines: ExampleLine[]; result: string };
    strong: { label: string; lines: ExampleLine[]; result: string };
    takeaway: string;
  };

  traps: { trap: string; instead: string }[];

  check: CheckQuestion[];

  /** Each question renders with its own free-text box. */
  makeItYours: ReflectionSet;

  fieldCard: { title: string; lines: string[] };

  /** Shown as display text only. Does not change any AI prompt or rubric. */
  practiceTieIn: { text: string; relatedSkills: string[] };

  goDeeper: GoDeeperResource[];
}
