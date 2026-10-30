/**
 * Core Lessons: tailoring.
 *
 * Each program built from the intake form gets its own version of the seven
 * lessons. Only the EXAMPLE layer is rewritten for the program's setting:
 * scenarios, sample lines, check-question stories, sort items and similar.
 * The TEACHING layer (big idea, model, research, sources, reflection
 * questions, go-deeper links) never changes.
 *
 * Pure functions only: no API calls, no database. See TAILORING.md for the
 * pipeline that uses them.
 */
import type { CoreLesson, SortModel } from "./types";

/** Bump when lesson content changes, so stored tailored versions can be refreshed. */
export const CORE_LESSONS_CONTENT_VERSION = "2026-10-24";

/** What the platform knows about a program, mapped from its intake form. */
export interface ProgramContext {
  organizationDescription: string;      // what the organization does, in plain words
  industry?: string;                    // e.g. "home health", "software", "hospitality"
  leaderRole: string;                   // the new leader's title or role
  teamDescription: string;              // who they lead and what that work involves
  teamSize?: string;
  workSetting?: string;                 // "remote", "in person", "hybrid", or a description
  keyMetrics?: string[];                // the numbers this team is measured on
  commonChallenges?: string[];          // challenges named in the intake
  /** What "someone could be harmed" means in this work (patient safety, customer data, job-site safety…). */
  harmContext?: string;
  /**
   * The practice-conversation persona this program uses for each module, so
   * lesson examples use the same names. Omit to keep the default names.
   */
  practicePersonas?: { legacyModuleId: string; name: string; role: string }[];
}

/* ---------- The tailorable layer ---------- */

export type TailoredModel =
  | { type: "flipcards"; cards: { id: string; example: string }[] }
  | { type: "equation"; factors: { id: string; lowSounds: string; highSounds: string; buildIt: string[] }[] }
  | { type: "sort"; items: { id: string; text: string; explain: string }[] }
  | { type: "stages"; stages: { id: string; example: string }[] }
  | { type: "matrix"; quadrants: { id: string; soundsLike: string }[] };

export interface TailoredLessonContent {
  lessonId: string;
  contentVersion: string;
  whyNow: string[];
  model: TailoredModel;
  spotlightActivity?: { id: string; text: string; explain: string }[];
  seeItInAction: {
    setup: string;
    weak: { lines: { text: string; note?: string }[]; result: string };
    strong: { lines: { text: string; note?: string }[]; result: string };
    takeaway: string;
  };
  traps: { trap: string; instead: string }[];
  check: { id: string; question: string; options: { text: string; explain: string }[] }[];
  fieldCard: { lines: string[] };
  practiceTieIn: { text: string };
}

const sortItems = (m: SortModel) => m.items.map((i) => ({ id: i.id, text: i.text, explain: i.explain }));

/** The lesson's current example layer, in the exact shape a tailored version must return. */
export function extractTailorable(lesson: CoreLesson): TailoredLessonContent {
  const m = lesson.model;
  let model: TailoredModel;
  switch (m.type) {
    case "flipcards": model = { type: "flipcards", cards: m.cards.map((c) => ({ id: c.id, example: c.example ?? "" })) }; break;
    case "equation": model = { type: "equation", factors: m.factors.map((f) => ({ id: f.id, lowSounds: f.lowSounds, highSounds: f.highSounds, buildIt: [...f.buildIt] })) }; break;
    case "sort": model = { type: "sort", items: sortItems(m) }; break;
    case "stages": model = { type: "stages", stages: m.stages.map((s) => ({ id: s.id, example: s.example })) }; break;
    case "matrix": model = { type: "matrix", quadrants: m.quadrants.map((q) => ({ id: q.id, soundsLike: q.soundsLike })) }; break;
  }
  const lines = (ls: CoreLesson["seeItInAction"]["weak"]["lines"]) => ls.map((l) => (l.note ? { text: l.text, note: l.note } : { text: l.text }));
  return {
    lessonId: lesson.id,
    contentVersion: CORE_LESSONS_CONTENT_VERSION,
    whyNow: [...lesson.whyNow],
    model,
    ...(lesson.spotlight?.activity ? { spotlightActivity: sortItems(lesson.spotlight.activity) } : {}),
    seeItInAction: {
      setup: lesson.seeItInAction.setup,
      weak: { lines: lines(lesson.seeItInAction.weak.lines), result: lesson.seeItInAction.weak.result },
      strong: { lines: lines(lesson.seeItInAction.strong.lines), result: lesson.seeItInAction.strong.result },
      takeaway: lesson.seeItInAction.takeaway,
    },
    traps: lesson.traps.map((t) => ({ ...t })),
    check: lesson.check.map((q) => ({ id: q.id, question: q.question, options: q.options.map((o) => ({ text: o.text, explain: o.explain })) })),
    fieldCard: { lines: [...lesson.fieldCard.lines] },
    practiceTieIn: { text: lesson.practiceTieIn.text },
  };
}

/* ---------- Validation ---------- */

function strErr(path: string, base: string, value: unknown, errors: string[], allowEmpty = false) {
  if (typeof value !== "string") { errors.push(`${path}: must be a string`); return; }
  const v = value.trim();
  if (!allowEmpty && v.length === 0) { errors.push(`${path}: empty`); return; }
  const max = Math.max(160, Math.round(base.length * 1.6));
  if (v.length > max) errors.push(`${path}: too long (${v.length} chars, limit ${max})`);
  if (/\{\{|\}\}|\[(?:name|company|org|insert)[^\]]*\]/i.test(v)) errors.push(`${path}: contains a template placeholder`);
}

function sameIds(path: string, base: { id: string }[], got: unknown, errors: string[]): got is { id: string }[] {
  if (!Array.isArray(got)) { errors.push(`${path}: must be an array`); return false; }
  if (got.length !== base.length) { errors.push(`${path}: expected ${base.length} items, got ${got.length}`); return false; }
  base.forEach((b, i) => { if ((got[i] as { id?: string })?.id !== b.id) errors.push(`${path}[${i}]: id must be "${b.id}" in the same order`); });
  return true;
}

function sameLen(path: string, base: unknown[], got: unknown, errors: string[]): got is unknown[] {
  if (!Array.isArray(got)) { errors.push(`${path}: must be an array`); return false; }
  if (got.length !== base.length) { errors.push(`${path}: expected ${base.length} items, got ${got.length}`); return false; }
  return true;
}

/** Returns a list of problems. An empty list means the tailored content is safe to apply. */
export function validateTailored(lesson: CoreLesson, t: TailoredLessonContent): string[] {
  const e: string[] = [];
  const base = extractTailorable(lesson);
  if (!t || typeof t !== "object") return ["Tailored content is not an object"];
  if (t.lessonId !== lesson.id) e.push(`lessonId must be "${lesson.id}"`);

  if (sameLen("whyNow", base.whyNow, t.whyNow, e)) base.whyNow.forEach((b, i) => strErr(`whyNow[${i}]`, b, t.whyNow[i], e));

  if (!t.model || t.model.type !== base.model.type) e.push(`model.type must be "${base.model.type}"`);
  else {
    const bm = base.model, tm = t.model;
    if (bm.type === "flipcards" && tm.type === "flipcards" && sameIds("model.cards", bm.cards, tm.cards, e))
      bm.cards.forEach((c, i) => strErr(`model.cards[${i}].example`, c.example, tm.cards[i].example, e, c.example === ""));
    if (bm.type === "equation" && tm.type === "equation" && sameIds("model.factors", bm.factors, tm.factors, e))
      bm.factors.forEach((f, i) => {
        const g = tm.factors[i];
        strErr(`model.factors[${i}].lowSounds`, f.lowSounds, g.lowSounds, e);
        strErr(`model.factors[${i}].highSounds`, f.highSounds, g.highSounds, e);
        if (sameLen(`model.factors[${i}].buildIt`, f.buildIt, g.buildIt, e)) f.buildIt.forEach((b, j) => strErr(`model.factors[${i}].buildIt[${j}]`, b, g.buildIt[j], e));
      });
    if (bm.type === "sort" && tm.type === "sort" && sameIds("model.items", bm.items, tm.items, e))
      bm.items.forEach((it, i) => { strErr(`model.items[${i}].text`, it.text, tm.items[i].text, e); strErr(`model.items[${i}].explain`, it.explain, tm.items[i].explain, e); });
    if (bm.type === "stages" && tm.type === "stages" && sameIds("model.stages", bm.stages, tm.stages, e))
      bm.stages.forEach((s, i) => strErr(`model.stages[${i}].example`, s.example, tm.stages[i].example, e));
    if (bm.type === "matrix" && tm.type === "matrix" && sameIds("model.quadrants", bm.quadrants, tm.quadrants, e))
      bm.quadrants.forEach((q, i) => strErr(`model.quadrants[${i}].soundsLike`, q.soundsLike, tm.quadrants[i].soundsLike, e));
  }

  if (base.spotlightActivity) {
    if (sameIds("spotlightActivity", base.spotlightActivity, t.spotlightActivity, e))
      base.spotlightActivity.forEach((it, i) => { strErr(`spotlightActivity[${i}].text`, it.text, t.spotlightActivity![i].text, e); strErr(`spotlightActivity[${i}].explain`, it.explain, t.spotlightActivity![i].explain, e); });
  } else if (t.spotlightActivity) e.push("spotlightActivity: this lesson has no spotlight activity");

  const s = t.seeItInAction, bs = base.seeItInAction;
  if (!s) e.push("seeItInAction missing");
  else {
    strErr("seeItInAction.setup", bs.setup, s.setup, e);
    strErr("seeItInAction.takeaway", bs.takeaway, s.takeaway, e);
    for (const side of ["weak", "strong"] as const) {
      const bl = bs[side].lines, gl = s[side]?.lines;
      if (sameLen(`seeItInAction.${side}.lines`, bl, gl, e))
        bl.forEach((l, i) => {
          strErr(`seeItInAction.${side}.lines[${i}].text`, l.text, gl[i]?.text, e);
          if (l.note) strErr(`seeItInAction.${side}.lines[${i}].note`, l.note, gl[i]?.note, e);
          else if (gl[i]?.note) e.push(`seeItInAction.${side}.lines[${i}]: base line has no note; don't add one`);
        });
      strErr(`seeItInAction.${side}.result`, bs[side].result, s[side]?.result, e);
    }
  }

  if (sameLen("traps", base.traps, t.traps, e))
    base.traps.forEach((b, i) => { strErr(`traps[${i}].trap`, b.trap, t.traps[i]?.trap, e); strErr(`traps[${i}].instead`, b.instead, t.traps[i]?.instead, e); });

  if (sameIds("check", base.check, t.check, e))
    base.check.forEach((q, i) => {
      const g = t.check[i];
      strErr(`check[${i}].question`, q.question, g.question, e);
      if (sameLen(`check[${i}].options`, q.options, g.options, e))
        q.options.forEach((o, j) => { strErr(`check[${i}].options[${j}].text`, o.text, g.options[j]?.text, e); strErr(`check[${i}].options[${j}].explain`, o.explain, g.options[j]?.explain, e); });
    });

  if (sameLen("fieldCard.lines", base.fieldCard.lines, t.fieldCard?.lines, e))
    base.fieldCard.lines.forEach((b, i) => strErr(`fieldCard.lines[${i}]`, b, t.fieldCard.lines[i], e));

  strErr("practiceTieIn.text", base.practiceTieIn.text, t.practiceTieIn?.text, e);
  return e;
}

/* ---------- Apply ---------- */

/**
 * Merge a validated tailored version into a copy of the base lesson.
 * Ids, structure, correct answers, sort answers and every teaching field
 * come from the base lesson, never from the tailored content.
 */
export function applyTailored(lesson: CoreLesson, t: TailoredLessonContent): CoreLesson {
  const out: CoreLesson = JSON.parse(JSON.stringify(lesson));
  out.whyNow = t.whyNow.map((x) => x.trim());
  const m = out.model, tm = t.model;
  if (m.type === "flipcards" && tm.type === "flipcards") m.cards.forEach((c, i) => { if (c.example !== undefined) c.example = tm.cards[i].example.trim(); });
  if (m.type === "equation" && tm.type === "equation") m.factors.forEach((f, i) => { const g = tm.factors[i]; f.lowSounds = g.lowSounds.trim(); f.highSounds = g.highSounds.trim(); f.buildIt = g.buildIt.map((x) => x.trim()); });
  if (m.type === "sort" && tm.type === "sort") m.items.forEach((it, i) => { it.text = tm.items[i].text.trim(); it.explain = tm.items[i].explain.trim(); });
  if (m.type === "stages" && tm.type === "stages") m.stages.forEach((s, i) => { s.example = tm.stages[i].example.trim(); });
  if (m.type === "matrix" && tm.type === "matrix") m.quadrants.forEach((q, i) => { q.soundsLike = tm.quadrants[i].soundsLike.trim(); });
  if (out.spotlight?.activity && t.spotlightActivity)
    out.spotlight.activity.items.forEach((it, i) => { it.text = t.spotlightActivity![i].text.trim(); it.explain = t.spotlightActivity![i].explain.trim(); });
  const sa = out.seeItInAction;
  sa.setup = t.seeItInAction.setup.trim();
  sa.takeaway = t.seeItInAction.takeaway.trim();
  for (const side of ["weak", "strong"] as const) {
    sa[side].lines.forEach((l, i) => { const g = t.seeItInAction[side].lines[i]; l.text = g.text.trim(); if (l.note) l.note = (g.note ?? l.note).trim(); });
    sa[side].result = t.seeItInAction[side].result.trim();
  }
  out.traps = out.traps.map((x, i) => ({ trap: t.traps[i].trap.trim(), instead: t.traps[i].instead.trim() }));
  out.check.forEach((q, i) => { q.question = t.check[i].question.trim(); q.options.forEach((o, j) => { o.text = t.check[i].options[j].text.trim(); o.explain = t.check[i].options[j].explain.trim(); }); });
  out.fieldCard.lines = t.fieldCard.lines.map((x) => x.trim());
  out.practiceTieIn.text = t.practiceTieIn.text.trim();
  return out;
}

/* ---------- Prompt ---------- */

/** The system prompt for one tailoring call. Send buildTailoringRequest().user as the user message. */
export const TAILORING_SYSTEM_PROMPT = `You adapt the examples in a leadership training lesson so they fit a specific organization and team. You never change what the lesson teaches.

The lesson has two layers:
- TEACHING LAYER (read-only, for context): the big idea, the model, the research, and the questions. You must not contradict it.
- EXAMPLE LAYER (you rewrite this): the scenarios, sample dialogue, check-question stories, activity items, traps, field card wording and practice tie-in.

Rules for rewriting the example layer:
1. Keep every teaching point. Each rewritten item must teach exactly what the original teaches. Change the setting, roles, vocabulary, numbers and situations so they feel real for this team.
2. "See it in action": the weak version must show the same mistake as the original, line for line, and the strong version must show the same skill. Every coaching note must still be true about the line it belongs to. Keep the same number of lines and the same speaker on each line.
3. Check questions: keep the same number of options in the same order. The option in each position must stay correct or incorrect exactly as in the original, for the same reason. Rewrite the explanations to match. Wrong options must stay plausible.
4. Sort items: each item's correct bucket is given and is fixed. Rewrite the item so that the given bucket is clearly correct for this team.
5. Use the team's real vocabulary and work: their roles, the kind of work, their metrics, and their setting (for example "on camera" for remote teams, "in the room" for in-person teams). Where the original involves patient safety, use what "someone could be harmed" means for this team, if provided.
6. People in examples are fictional. Use first names only. If a practice persona name is provided for this module, use it wherever the original uses the matching practice persona's name. Never name real people, and don't name the organization.
7. Don't add statistics, research findings or claims that aren't in the teaching layer.
8. Keep language plain and warm: short sentences, everyday words, US English. Keep each field close to the original's length. Inside text, use curly quotes (“ ” and ’), never straight double quotes.
9. If the organization's setting is similar to the original (for example, a nurse-led healthcare team), keep the examples close to the original.

Reply with only one JSON object in exactly the shape of EXAMPLE_LAYER_TO_REWRITE: the same keys, the same ids in the same order, the same array lengths. Return "lessonId" and "contentVersion" unchanged.`;

/** Build the user message for one lesson. */
export function buildTailoringRequest(lesson: CoreLesson, ctx: ProgramContext, previousErrors?: string[]): string {
  const teaching = {
    title: lesson.title,
    bigIdea: lesson.bigIdea,
    model: lesson.model,
    whyItWorks: lesson.whyItWorks.paragraphs,
    spotlight: lesson.spotlight ? { title: lesson.spotlight.title, paragraphs: lesson.spotlight.paragraphs } : undefined,
    practiceSkills: lesson.practiceTieIn.relatedSkills,
  };
  const persona = ctx.practicePersonas?.find((p) => p.legacyModuleId === lesson.legacyModuleId);
  const sortAnswers =
    lesson.model.type === "sort" ? lesson.model.items.map((i) => ({ id: i.id, correctBucket: i.answer })) : undefined;
  const spotlightAnswers = lesson.spotlight?.activity?.items.map((i) => ({ id: i.id, correctBucket: i.answer }));
  const correctOptions = lesson.check.map((q) => ({ id: q.id, correctOptionIndex: q.options.findIndex((o) => o.correct) }));

  const parts = [
    "ORGANIZATION AND TEAM",
    JSON.stringify({ ...ctx, practicePersonas: undefined }, null, 2),
    persona ? `PRACTICE PERSONA FOR THIS MODULE: ${persona.name}, ${persona.role}` : "PRACTICE PERSONA FOR THIS MODULE: keep the original names.",
    "TEACHING LAYER (read-only)",
    JSON.stringify(teaching, null, 2),
    "FIXED ANSWERS (do not change which answer is correct)",
    JSON.stringify({ checkQuestions: correctOptions, sortItems: sortAnswers, spotlightActivityItems: spotlightAnswers }, null, 2),
    "EXAMPLE_LAYER_TO_REWRITE",
    JSON.stringify(extractTailorable(lesson), null, 2),
  ];
  if (previousErrors?.length) {
    parts.push("YOUR PREVIOUS ATTEMPT HAD THESE PROBLEMS. FIX ALL OF THEM:", previousErrors.map((x) => `- ${x}`).join("\n"));
  }
  return parts.join("\n\n");
}
