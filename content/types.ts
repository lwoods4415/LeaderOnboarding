// Shapes of the protocol content. Strings may contain small inline HTML
// (<em>, <b>, <i>) authored in the reference page; render them with <Html>.

export type Rating = "strong" | "partial" | "risky";

export type ScenarioOption = { t: string; r: Rating; reply?: string; fb: string };
export type ScenarioStep = { setup?: string; options: ScenarioOption[] };
export type Scenario = { setup: string; ask: string; steps: ScenarioStep[]; debrief: string; note?: string };

export type Lab = { focus: string; checkin: string; clinic: string; triad: string; observe: string[]; commit: string };

export type Module = {
  id: string;
  weeks: string;
  wk: [number, number];
  short: string;
  eyebrow: string;
  title: string;
  sub: string;
  changes: string;
  from: string;
  to: string;
  learn: { h: string; src: string; p: string }[];
  practice: { id: string; t: string; s?: string }[];
  scenario: Scenario;
  reflect: { id: string; q: string }[];
  checkin: string[];
  lab: Lab;
  measures?: boolean;
  note?: string;
};

export type Measure = { id: string; t: string };

export type Roleplay = {
  id: string;
  mod: string;
  title: string;
  who: string;
  role: string;
  brief: string;
  goal: string;
  persona: string;
  hidden: string;
  skills: string[];
};

export type Difficulty = "cooperative" | "realistic" | "tough";

export type PathwayStage = { n: string; t: string; when: string; goal: string; do: string[]; doc: string; who: string };

export type PlannerField = { key: string; label: string; ph?: string; blank: string; input?: boolean };
export type PlannerTool = {
  type: "planner";
  id: string;
  prefix: string;
  title: string;
  lede: string;
  fields: PlannerField[];
  note?: string;
  template: string;
};
export type BravingTool = { type: "braving"; lede: string };
export type ListTool = { type: "list"; title: string; lede: string; items: string[] };
export type Tool = PlannerTool | BravingTool | ListTool;

export type Program = {
  key: string;
  passage: number;
  sponsorName: string;
  sponsorPlaceholder: string;
  header: { eyebrow: string; h1a: string; h1b: string; p: string };
  hero: { eyebrow: string; h2a: string; h2b: string; p: string[] };
  steps: [string, string][];
  measuresTitle: string;
};

export type Sponsor = {
  railSub: string;
  eyebrow: string;
  title: string;
  sub: string;
  why: string;
  commit: string;
  steps: { id: string; t: string; s: string }[];
  watch: [string, string][];
};
