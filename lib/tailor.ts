import "server-only";
// Drafts a tailored copy of a program from intake answers. The program's structure, ids, research and
// sources never change: Claude only rewrites text strings, and only where the setting calls for it.
//
// 1. One call writes a short brief for the organization: its setting and a glossary (e.g. patients → customers),
//    so every part of the program uses the same words.
// 2. Calls in parallel, one per part (each module, the practice conversations and characters, the rest),
//    return only the strings they change.
// 3. Every change is checked before it's used: the string must exist, keep exactly the same inline HTML tags
//    and {placeholders}, and stay a similar length. Anything that fails is dropped and the original is kept.
import Anthropic from "@anthropic-ai/sdk";
import type { ProgramContent, ProgramSecrets } from "@/content/program";
import { labelFor, questionsFor, type IntakeKind } from "./intake";
import { anthropic } from "./practice";

const MODEL = process.env.TAILOR_MODEL || "claude-opus-5-5";
const FALLBACK_MODELS = new Set(["claude-sonnet-5-5", "claude-opus-5-5", "claude-opus-5", "claude-fable-5-1"]);
// USD per million input / output tokens, for the estimated cost shown to the platform owner.
const PRICES: Record<string, [number, number]> = {
  "claude-opus-5-5": [4, 20], "claude-sonnet-5-5": [2, 10], "claude-opus-5": [5, 25], "claude-haiku-5-5": [0.1, 0.5],
};

export type Doc = { content: ProgramContent; secrets: ProgramSecrets };
export type Change = { path: string; before: string; after: string };

// Keys whose strings are ids, settings or research citations, and parts kept word for word everywhere
// (difficulty instructions, book list, Brené Brown's BRAVING definitions).
const SKIP_KEYS = new Set(["id", "wk", "key", "type", "prefix", "r", "mod", "passage", "skills", "src", "weeks"]);
const SKIP_TOP = new Set(["modes", "books", "braving"]);

/** Every rewritable string in a program, by path (e.g. "content.modules.2.scenario.setup"). */
export function leaves(doc: Doc): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (v: unknown, path: string[]) => {
    if (typeof v === "string") { if (v.trim()) out.set(path.join("."), v); return; }
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...path, String(i)]));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!SKIP_KEYS.has(k)) walk(x, [...path, k]);
  };
  for (const [k, v] of Object.entries(doc.content)) if (!SKIP_TOP.has(k)) walk(v, ["content", k]);
  walk(doc.secrets, ["secrets"]);
  return out;
}

/** Sets one string in a copy-safe way (the doc should already be a copy). */
export function setLeaf(doc: Doc, path: string, value: string) {
  const parts = path.split(".");
  let node: Record<string, unknown> = doc as unknown as Record<string, unknown>;
  for (const p of parts.slice(0, -1)) node = node[p] as Record<string, unknown>;
  node[parts[parts.length - 1]] = value;
}

export const copyDoc = (doc: Doc): Doc => structuredClone(doc);

/** Strings that differ between two programs with the same structure. */
export function diff(from: Doc, to: Doc): Change[] {
  const a = leaves(from), b = leaves(to);
  const out: Change[] = [];
  for (const [path, before] of a) {
    const after = b.get(path);
    if (after !== undefined && after !== before) out.push({ path, before, after });
  }
  return out;
}

const TAG = /<[^>]*>/g;
const PLACEHOLDER = /\{[a-zA-Z]+\}/g;
const sorted = (s: string, re: RegExp) => (s.match(re) ?? []).sort().join("|");
const strayBrackets = (s: string) => (s.replace(TAG, "").match(/[<>]/g) ?? []).length;

/** Why a rewritten string can't be used, or null if it's fine. */
export function problemWith(before: string, after: string): string | null {
  if (typeof after !== "string" || !after.trim()) return "empty";
  if (sorted(before, TAG) !== sorted(after, TAG)) return "changed the formatting tags";
  if (strayBrackets(after) !== strayBrackets(before)) return "added angle brackets";
  if (sorted(before, PLACEHOLDER) !== sorted(after, PLACEHOLDER)) return "changed the {placeholders}";
  const ratio = after.length / before.length;
  if (before.length > 40 && (ratio < 0.4 || ratio > 2.5)) return "changed the length too much";
  return null;
}

// ---------- prompts ----------

const RULES = `You are adapting a leadership onboarding program for first-time leaders so it fits one organization's world.
The program was written for a remote healthcare team (nurses calling patients), or it may already be a general version.

What to change: only setting details. Job titles, the work people do, the people being served, examples, measures,
situations, and the words the organization asked to use or avoid.

What to keep, always:
- Every idea, skill, research finding and its meaning. The program teaches the same leadership skills everywhere.
- People's names (Tasha, Marcus, Jen, Priya, Keisha and so on).
- In scenarios, what makes an option strong, partial or risky. The best answer must still be the best behavior.
- In practice characters, the hidden detail must still be something the leader only learns by asking well and listening.
- The reader is the new leader, addressed as "you" in leader-facing text. Character descriptions stay in the third person.
- Inline HTML tags exactly as they are (<em>, <b>, <i>): the same tags, the same number of them. Keep {placeholders} and line breaks exactly.
- Roughly the same length, tone and reading level: plain, warm and direct. Short sentences. No jargon.

Never invent facts about the organization (statistics, policies, products, real people). Never include real customer,
patient or employee details. Use the organization's name sparingly, if at all.

If a string already fits, leave it out. Return only the strings you change.`;

function intakeText(kind: IntakeKind | "template", answers: Record<string, string>, orgName?: string | null) {
  const qs = questionsFor(kind === "individual" ? "individual" : "company");
  const lines = qs.filter((q) => answers[q.key]?.trim()).map((q) => `${labelFor(q, kind === "individual" ? "individual" : "company")}\n${answers[q.key].trim()}`);
  const who = kind === "template" ? "A general version of the program (not for one organization)" : kind === "individual" ? "An individual first-time leader" : `Organization: ${orgName ?? "(not given)"}`;
  return `<intake>\n${who}\n\n${lines.join("\n\n")}\n</intake>`;
}

const BRIEF_SCHEMA = {
  type: "object", additionalProperties: false, required: ["setting", "glossary", "notes"],
  properties: {
    setting: { type: "string" },
    glossary: { type: "array", items: { type: "object", additionalProperties: false, required: ["from", "to"], properties: { from: { type: "string" }, to: { type: "string" } } } },
    notes: { type: "string" },
  },
};
const CHANGES_SCHEMA = {
  type: "object", additionalProperties: false, required: ["changes"],
  properties: {
    changes: { type: "array", items: { type: "object", additionalProperties: false, required: ["path", "text"], properties: { path: { type: "string" }, text: { type: "string" } } } },
  },
};

type Usage = { model: string; input: number; output: number };
const costOf = (u: Usage[]) => u.reduce((sum, x) => {
  const p = PRICES[x.model] ?? PRICES["claude-opus-5-5"];
  return sum + (x.input * p[0] + x.output * p[1]) / 1e6;
}, 0);

async function ask(system: string, prompt: string, schema: Record<string, unknown>, usage: Usage[]) {
  const fallback = FALLBACK_MODELS.has(MODEL);
  const stream = anthropic().beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    system,
    messages: [{ role: "user", content: prompt }],
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
    ...(fallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
  });
  const response = await stream.finalMessage();
  usage.push({ model: response.model, input: response.usage.input_tokens, output: response.usage.output_tokens });
  if (response.stop_reason === "refusal") throw new Error("declined");
  if (response.stop_reason === "max_tokens") throw new Error("ran out of room");
  const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return JSON.parse(text) as unknown;
}

/** The program split into parts that are drafted in parallel. */
function parts(doc: Doc, all: Map<string, string>) {
  const groups = new Map<string, { title: string; strings: Record<string, string> }>();
  const add = (key: string, title: string, path: string, text: string) => {
    if (!groups.has(key)) groups.set(key, { title, strings: {} });
    groups.get(key)!.strings[path] = text;
  };
  for (const [path, text] of all) {
    const m = path.match(/^content\.modules\.(\d+)\./);
    if (m) { const mod = doc.content.modules[Number(m[1])]; add(`m${m[1]}`, `Module: ${mod.weeks}, ${mod.short}`, path, text); }
    else if (path.startsWith("content.roleplays.") || path.startsWith("secrets.")) add("practice", "Practice conversations and the AI practice partner's characters (the character descriptions are private to the AI)", path, text);
    else add("general", "Program introduction, sponsor guide, pathway, toolkit, growth measures and lab guide", path, text);
  }
  return [...groups.values()];
}

export type DraftResult = { doc: Doc; summary: string; cost: number; problems: string[] };

/**
 * Drafts a tailored copy of `base`. With `notes` (the platform owner's review comments), `base` is the
 * current draft and only what the notes ask for should change.
 */
export async function tailor(input: { base: Doc; kind: IntakeKind | "template"; answers: Record<string, string>; orgName?: string | null; notes?: string | null }): Promise<DraftResult> {
  const usage: Usage[] = [];
  const intake = intakeText(input.kind, input.answers, input.orgName);
  const notes = input.notes?.trim() ? `\n\n<review_notes>\nThe program owner reviewed the current draft and asked for these changes. Apply them, and change nothing else:\n${input.notes.trim()}\n</review_notes>` : "";

  const brief = (await ask(
    RULES,
    `${intake}${notes}\n\nBefore the program is adapted, write a short brief that every part of the adaptation will follow:\n` +
    `- setting: two or three sentences on who the new leaders are, their team, the work and the people they serve.\n` +
    `- glossary: the words to swap throughout, as from → to pairs (for example "patients" → "customers", "nurse" → "agent"). Include the organization's preferred words. Empty if nothing needs swapping.\n` +
    `- notes: anything else every part should know (what to avoid, the key measures to use in examples).`,
    BRIEF_SCHEMA, usage,
  )) as { setting: string; glossary: { from: string; to: string }[]; notes: string };
  const briefText = `<brief>\nSetting: ${brief.setting}\nGlossary:\n${brief.glossary.map((g) => `- ${g.from} → ${g.to}`).join("\n") || "- (none)"}\nNotes: ${brief.notes}\n</brief>`;

  const all = leaves(input.base);
  const doc = copyDoc(input.base);
  const problems: string[] = [];
  const groups = parts(input.base, all);
  await Promise.all(groups.map(async (g) => {
    try {
      const out = (await ask(
        RULES,
        `${intake}\n\n${briefText}${notes}\n\n<part>${g.title}</part>\n\nHere are the part's strings, by path. Return the ones that need adapting, with the full new text of each, and keep each path exactly as given.\n\n` +
        JSON.stringify(g.strings, null, 1),
        CHANGES_SCHEMA, usage,
      )) as { changes: { path: string; text: string }[] };
      for (const c of out.changes) {
        const before = g.strings[c.path];
        if (before === undefined) { problems.push(`${g.title}: unknown path ${c.path}`); continue; }
        if (c.text === before) continue;
        const why = problemWith(before, c.text);
        if (why) { problems.push(`${g.title}: kept the original of ${c.path} (the rewrite ${why})`); continue; }
        setLeaf(doc, c.path, c.text);
      }
    } catch (err) {
      const why = err instanceof Anthropic.APIError ? `Claude error ${err.status}` : err instanceof Error ? err.message : "failed";
      problems.push(`${g.title}: not adapted (${why}). The original text is kept; ask for a redraft to try again.`);
    }
  }));

  const summary = `${brief.setting}${brief.glossary.length ? `\n\nWords swapped: ${brief.glossary.map((g) => `${g.from} → ${g.to}`).join("; ")}.` : ""}${brief.notes ? `\n\n${brief.notes}` : ""}`;
  return { doc, summary, cost: costOf(usage), problems };
}

/** A readable name for where a string sits in the program, for the review page. */
export function placeOf(path: string, base: Doc): string {
  const p = path.split(".");
  const WORDS: Record<string, string> = {
    learn: "Ideas", practice: "Do it for real", scenario: "Scenario", reflect: "Reflection", lab: "Leader lab", checkin: "Check-in",
    steps: "step", options: "option", fb: "feedback", t: "text", s: "detail", q: "question", h: "heading", p: "text", setup: "setup",
    ask: "question", debrief: "debrief", reply: "their reply", changes: "What changes", from: "From", to: "To", title: "Title",
    sub: "Subtitle", short: "Short name", eyebrow: "Label", brief: "Brief", goal: "Goal", who: "Who", role: "Role", persona: "Who they are",
    hidden: "What they hold back", note: "Note", lede: "Intro", fields: "field", label: "label", ph: "example text", blank: "blank text",
    template: "template", items: "item", focus: "Focus", clinic: "Clinic", triad: "Practice in threes", observe: "observer item", commit: "Commitment",
    header: "Page header", hero: "Welcome", h1a: "headline", h1b: "headline", h2a: "headline", h2b: "headline", measuresTitle: "Measures heading",
    sponsorName: "Sponsor name", sponsorPlaceholder: "Sponsor example", railSub: "Menu subtitle", why: "Why", watch: "What to watch for",
    do: "to do", doc: "Documentation", when: "When", n: "Stage", input: "input",
  };
  const TOP: Record<string, string> = {
    program: "Program intro", passages: "Reading passage", measures: "Lead measures", pathway: "Performance pathway", escalate: "When to escalate",
    selfSkills: "Self-assessment item", pulseQ: "Team pulse question", pulseOpen: "Team pulse open question", tools: "Toolkit",
    docTool: "Toolkit: documentation builder", sponsor: "Sponsor guide",
  };
  const rest = (parts: string[]) => parts.map((x) => (/^\d+$/.test(x) ? String(Number(x) + 1) : WORDS[x] ?? x)).join(" ");
  if (p[0] === "content" && p[1] === "modules") {
    const m = base.content.modules[Number(p[2])];
    return `${m?.weeks ?? "Module"} · ${m?.short ?? ""} · ${rest(p.slice(3))}`;
  }
  if (p[0] === "content" && p[1] === "roleplays") return `Practice: ${base.content.roleplays[Number(p[2])]?.title ?? ""} · ${rest(p.slice(3))}`;
  if (p[0] === "secrets") return `Practice character (private to the AI): ${base.content.roleplays.find((r) => r.id === p[3])?.who ?? p[3]} · ${rest(p.slice(4))}`;
  if (p[1] === "tools") {
    const tool = base.content.tools[Number(p[2])];
    return `Toolkit: ${tool && "title" in tool ? tool.title : "BRAVING"} · ${rest(p.slice(3))}`;
  }
  if (p[1] === "pathway") return `Performance pathway: ${base.content.pathway[Number(p[2])]?.t ?? ""} · ${rest(p.slice(3))}`;
  return `${TOP[p[1]] ?? p[1]} · ${rest(p.slice(2))}`.replace(/ · $/, "");
}
