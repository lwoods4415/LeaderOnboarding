// The intake form's questions (approved 2026-10-19), shared by the public form, the server that checks
// it, the prompt that tailors a program from it, and the platform owner's review page.

export type IntakeKind = "company" | "individual";

export type Question = {
  key: string;
  label: string;
  /** Wording for an individual, when it differs. */
  labelIndividual?: string;
  ph?: string;
  kinds: IntakeKind[];
  required?: boolean;
  type?: "text" | "select" | "date";
  options?: string[];
};

export const QUESTIONS: Question[] = [
  {
    key: "industry", label: "What industry are you in, and what does the team do day to day?",
    labelIndividual: "What industry are you in, and what does your team do day to day?",
    ph: "e.g. A remote nurse team calling patients with chronic conditions; a retail store team; a software support team",
    kinds: ["company", "individual"], required: true,
  },
  {
    key: "leaders", label: "How many new leaders do you expect over the next 12 months?",
    kinds: ["company"], required: true, type: "select", options: ["1–5", "6–20", "21–50", "51–200", "More than 200"],
  },
  {
    key: "before", label: "What were your new leaders doing before their promotion?",
    labelIndividual: "What were you doing before you became a leader?",
    ph: "e.g. Top performers promoted from the same team; some hired from outside",
    kinds: ["company", "individual"],
  },
  {
    key: "hardest", label: "What are the 2–3 hardest moments for new leaders there?",
    labelIndividual: "What are the 2–3 hardest moments for you as a new leader?",
    ph: "e.g. Managing former peers, a top performer missing targets, schedule conflicts",
    kinds: ["company", "individual"], required: true,
  },
  {
    key: "measures", label: "What key measures are the teams judged on?",
    labelIndividual: "What key measures is your team judged on?",
    ph: "e.g. Calls completed, sales, quality scores, customer satisfaction",
    kinds: ["company", "individual"],
  },
  {
    key: "words", label: "Are there words or job titles to use or avoid?",
    ph: "e.g. Say “team member”, not “employee”; leaders are “supervisors”",
    kinds: ["company", "individual"],
  },
  {
    key: "sponsor", label: "Who sponsors new leaders (their manager, HR), and how do they meet with them?",
    ph: "e.g. Their manager, in a weekly 30-minute 1:1",
    kinds: ["company"],
  },
  {
    key: "avoid", label: "Is there anything that must not appear in the program?",
    ph: "e.g. Confidential policies or client names. Please don't include real customer, patient or employee details anywhere in this form.",
    kinds: ["company"],
  },
  { key: "start", label: "When would you like to start?", kinds: ["company"], type: "date" },
];

export const MAX_ANSWER = 1500;

export const questionsFor = (kind: IntakeKind) => QUESTIONS.filter((q) => q.kinds.includes(kind));
export const labelFor = (q: Question, kind: IntakeKind) => (kind === "individual" && q.labelIndividual) || q.label;

/** The answers a template request uses: a general version for first-time leaders in any industry. */
export const GENERAL_TEMPLATE_ANSWERS: Record<string, string> = {
  industry:
    "Any industry. This is the general version of the program for first-time leaders anywhere: offices, retail, operations, " +
    "technology, services, nonprofits. It must not be specific to healthcare. Use everyday work that most teams recognize.",
  before: "Strong individual contributors promoted to lead the team they were part of, plus some hired from outside.",
  hardest: "Leading former peers and friends, a strong performer quietly falling below goal, coaching instead of rescuing, and fair, prompt performance conversations.",
  measures: "Typical team goals: work completed on time, quality, customer or client satisfaction, and response times.",
  words:
    "Use “team member”, “customer” or “client”, and “your leader” for the new leader's own manager. " +
    "Avoid clinical words (patient, nurse, ICU, clinic, charting) unless one appears as a single example among several industries.",
};
