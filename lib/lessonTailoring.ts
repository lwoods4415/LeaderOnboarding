import "server-only";
// Tailored core lessons (docs/TAILORING.md). Each lesson set holds the seven lessons' example layer, rewritten
// for one company program, one live program (e.g. Individuals' general version) or one individual leader.
// Generation uses the package's own prompt, request builder and validator; a lesson that still fails after one
// retry stores the base examples as "fallback", so leaders never see a half-tailored lesson. Viewing a lesson
// never calls Claude: /api/program applies the stored version.
import Anthropic from "@anthropic-ai/sdk";
import { CORE_LESSONS } from "@/content/core-lessons";
import {
  applyTailored, buildTailoringRequest, CORE_LESSONS_CONTENT_VERSION, extractTailorable, TAILORING_SYSTEM_PROMPT, validateTailored,
  type ProgramContext, type TailoredLessonContent,
} from "@/content/core-lessons/tailoring";
import type { CoreLesson } from "@/content/core-lessons/types";
import type { ProgramContent } from "@/content/program";
import { GENERAL_TEMPLATE_ANSWERS } from "./intake";
import { moduleOpen, type Plan } from "./plans";
import { anthropic } from "./practice";
import { supabaseAdmin } from "./supabase/admin";

const MODEL = process.env.TAILOR_MODEL || "claude-opus-5-5";
const FALLBACK_MODELS = new Set(["claude-sonnet-5-5", "claude-opus-5-5", "claude-opus-5", "claude-fable-5-1"]);
const PRICES: Record<string, [number, number]> = { "claude-opus-5-5": [4, 20], "claude-sonnet-5-5": [2, 10], "claude-opus-5": [5, 25] };

/** While false, leaders see a tailored lesson as soon as it's generated; while true, only once approved. */
export const REQUIRE_LESSON_APPROVAL = false;
/** Individual plans whose lessons are tailored to the leader's own answers (approved 2026-10-31). */
export const tailorsForIndividual = (plan: Plan) => plan === "complete" || plan === "cohort";

type Db = ReturnType<typeof supabaseAdmin>;
export type LessonSet = {
  id: string; intake_request_id: string | null; org_program_id: string | null; enrollment_id: string | null;
  use_default: boolean; answers: Record<string, string> | null; context: ProgramContext | null;
  state: "idle" | "running" | "done" | "failed"; error: string | null; cost: number;
};
export type LessonRow = {
  lesson_id: string; content_version: string; status: "generated" | "approved" | "edited" | "fallback";
  tailored: TailoredLessonContent; errors: string[] | null; note: string | null; generated_at: string; approved_at: string | null;
};

export const lessonById = (id: string) => CORE_LESSONS.find((l) => l.id === id);

// ---------- calls to Claude ----------

type Usage = { model: string; input: number; output: number };
const costOf = (u: Usage[]) => u.reduce((s, x) => { const p = PRICES[x.model] ?? PRICES["claude-opus-5-5"]; return s + (x.input * p[0] + x.output * p[1]) / 1e6; }, 0);

async function call(system: string, prompt: string, usage: Usage[], schema?: Record<string, unknown>) {
  const stream = anthropic().beta.messages.stream({
    model: MODEL, max_tokens: 12000, system, messages: [{ role: "user", content: prompt }],
    output_config: { effort: "medium", ...(schema ? { format: { type: "json_schema" as const, schema } } : {}) },
    ...(FALLBACK_MODELS.has(MODEL) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
  });
  const r = await stream.finalMessage();
  usage.push({ model: r.model, input: r.usage.input_tokens, output: r.usage.output_tokens });
  if (r.stop_reason === "refusal") throw new Error("declined");
  if (r.stop_reason === "max_tokens") throw new Error("ran out of room");
  return r.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

const parseJson = (text: string) => JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as unknown;

// ---------- the ProgramContext ----------

const CONTEXT_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["organizationDescription", "industry", "leaderRole", "teamDescription", "teamSize", "workSetting", "keyMetrics", "commonChallenges", "harmContext"],
  properties: {
    organizationDescription: { type: "string" }, industry: { type: "string" }, leaderRole: { type: "string" },
    teamDescription: { type: "string" }, teamSize: { type: "string" }, workSetting: { type: "string" },
    keyMetrics: { type: "array", items: { type: "string" } }, commonChallenges: { type: "array", items: { type: "string" } },
    harmContext: { type: "string" },
  },
};
const CONTEXT_SYSTEM = `You turn a short intake description of a team into a structured profile used to adapt examples in leadership training.
Use only what the text says or clearly implies. Leave a field as an empty string (or an empty list) when it isn't stated:
never guess numbers, and never invent facts. Write in plain words. Never include the organization's name or any
person's name. If the text says which words or job titles to use, use them (for example the new leader's title).`;

/**
 * Builds the ProgramContext from intake answers (and, for a company, the brief Claude wrote when drafting its
 * program, which fills gaps like the leader's title and the work setting). Practice personas come from the program.
 */
export async function buildContext(input: { answers: Record<string, string>; brief?: string | null; personasFrom?: ProgramContent | null }, usage: Usage[]): Promise<ProgramContext> {
  const lines = [
    input.answers.industry && `Industry and what the team does: ${input.answers.industry}`,
    input.answers.role && `The new leader's role: ${input.answers.role}`,
    input.answers.before && `What new leaders did before: ${input.answers.before}`,
    input.answers.hardest && `Hardest moments: ${input.answers.hardest}`,
    input.answers.measures && `Key measures: ${input.answers.measures}`,
    input.answers.words && `Words or titles to use or avoid: ${input.answers.words}`,
    input.answers.avoid && `Must not appear: ${input.answers.avoid}`,
    input.answers.setting && `Work setting: ${input.answers.setting}`,
    input.brief && `Program brief:\n${input.brief}`,
  ].filter(Boolean).join("\n");
  const raw = parseJson(await call(CONTEXT_SYSTEM, `<intake>\n${lines}\n</intake>`, usage, CONTEXT_SCHEMA)) as Record<string, string | string[]>;
  const str = (k: string) => (typeof raw[k] === "string" && (raw[k] as string).trim() ? (raw[k] as string).trim() : undefined);
  const list = (k: string) => (Array.isArray(raw[k]) && (raw[k] as string[]).length ? (raw[k] as string[]).filter(Boolean) : undefined);
  // The words to use or avoid are added to the description so examples use the organization's own vocabulary.
  const words = [input.answers.words && `Words to use or avoid: ${input.answers.words}`, input.answers.avoid && `Never mention: ${input.answers.avoid}`].filter(Boolean).join(" ");
  return {
    organizationDescription: [str("organizationDescription") ?? input.answers.industry ?? "A team at work", words].filter(Boolean).join(" "),
    industry: str("industry"),
    leaderRole: str("leaderRole") ?? "New team leader",
    teamDescription: str("teamDescription") ?? input.answers.industry ?? "",
    teamSize: str("teamSize"),
    workSetting: str("workSetting"),
    keyMetrics: list("keyMetrics"),
    commonChallenges: list("commonChallenges"),
    harmContext: str("harmContext"),
    practicePersonas: input.personasFrom?.roleplays.map((r) => ({ legacyModuleId: r.mod, name: r.who, role: r.role })),
  };
}

export const generalAnswers = () => GENERAL_TEMPLATE_ANSWERS;

// ---------- tailoring one lesson ----------

async function tailorLesson(lesson: CoreLesson, ctx: ProgramContext, note: string | null, usage: Usage[]) {
  let errors: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const prompt = buildTailoringRequest(lesson, ctx, attempt ? errors : undefined)
        + (note ? `\n\nNOTE FROM THE PROGRAM OWNER (follow it within the rules above)\n${note}` : "");
      const tailored = parseJson(await call(TAILORING_SYSTEM_PROMPT, prompt, usage)) as TailoredLessonContent;
      errors = validateTailored(lesson, tailored);
      if (!errors.length) return { status: "generated" as const, tailored, errors: null };
    } catch (err) {
      errors = [err instanceof Anthropic.APIError ? `Claude error ${err.status}` : err instanceof Error ? err.message : "failed"];
    }
  }
  console.error("lesson tailoring fell back to the base lesson", lesson.id, errors);
  return { status: "fallback" as const, tailored: extractTailorable(lesson), errors };
}

// ---------- started lessons are locked ----------

/** Lessons that any leader using this set has started (answered a check question or written an answer). */
export async function startedLessons(db: Db, set: Pick<LessonSet, "org_program_id" | "enrollment_id">): Promise<Set<string>> {
  let enrollmentIds: string[] = [];
  if (set.enrollment_id) enrollmentIds = [set.enrollment_id];
  else if (set.org_program_id) {
    const { data } = await db.from("enrollments").select("id").eq("org_program_id", set.org_program_id);
    enrollmentIds = (data ?? []).map((e) => e.id);
  }
  const started = new Set<string>();
  if (!enrollmentIds.length) return started;
  const [prog, priv] = await Promise.all([
    db.from("leader_progress").select("data").in("enrollment_id", enrollmentIds),
    db.from("leader_private").select("data").in("enrollment_id", enrollmentIds),
  ]);
  type Doc = { coreLessons?: Record<string, { checkAnswers?: Record<string, number>; answers?: Record<string, string> }> };
  for (const r of (prog.data ?? []) as { data: Doc }[]) for (const [id, x] of Object.entries(r.data?.coreLessons ?? {})) if (Object.keys(x.checkAnswers ?? {}).length) started.add(id);
  for (const r of (priv.data ?? []) as { data: Doc }[]) for (const [id, x] of Object.entries(r.data?.coreLessons ?? {})) if (Object.values(x.answers ?? {}).some((v) => v?.trim())) started.add(id);
  return started;
}

// ---------- running a set ----------

/** The context for a set, built (and saved) the first time it's needed. */
async function contextFor(db: Db, set: LessonSet, usage: Usage[]): Promise<ProgramContext> {
  if (set.context) return set.context;
  let ctx: ProgramContext;
  if (set.enrollment_id) {
    const { data: e } = await db.from("enrollments").select("org_program_id").eq("id", set.enrollment_id).single();
    const { data: op } = await db.from("org_programs").select("content").eq("id", e!.org_program_id).single();
    ctx = await buildContext({ answers: set.answers ?? {}, personasFrom: op?.content as ProgramContent }, usage);
  } else if (set.intake_request_id) {
    const { data: r } = await db.from("intake_requests").select("answers, draft_summary, draft_content").eq("id", set.intake_request_id).single();
    ctx = await buildContext({ answers: r!.answers, brief: r!.draft_summary, personasFrom: r!.draft_content as ProgramContent }, usage);
  } else {
    // A live program: its approved intake request if it has one, otherwise the general version's description.
    const { data: op } = await db.from("org_programs").select("content, intake, org_id").eq("id", set.org_program_id!).single();
    const { data: req } = await db.from("intake_requests").select("draft_summary").eq("org_id", op!.org_id).eq("kind", "company").maybeSingle();
    ctx = await buildContext({ answers: (op?.intake as Record<string, string> | null) ?? GENERAL_TEMPLATE_ANSWERS, brief: req?.draft_summary, personasFrom: op?.content as ProgramContent }, usage);
  }
  await db.from("lesson_sets").update({ context: ctx }).eq("id", set.id);
  return ctx;
}

/**
 * Tailors the set's lessons (all seven, or just `lessonIds`), skipping any a leader has already started.
 * Runs after the response is sent, so it records its own state.
 */
export async function runLessonSet(setId: string, opts: { lessonIds?: string[]; note?: string | null } = {}) {
  const db = supabaseAdmin();
  const { data } = await db.from("lesson_sets").select("*").eq("id", setId).single();
  const set = data as LessonSet | null;
  if (!set) return;
  await db.from("lesson_sets").update({ state: "running", error: null }).eq("id", setId);
  const usage: Usage[] = [];
  try {
    const ctx = await contextFor(db, set, usage);
    const locked = await startedLessons(db, set);
    const targets = CORE_LESSONS.filter((l) => (!opts.lessonIds || opts.lessonIds.includes(l.id)) && !locked.has(l.id));
    await Promise.all(targets.map(async (l) => {
      const r = await tailorLesson(l, ctx, opts.note ?? null, usage);
      await db.from("program_core_lessons").upsert({
        set_id: setId, lesson_id: l.id, content_version: CORE_LESSONS_CONTENT_VERSION, status: r.status, tailored: r.tailored,
        errors: r.errors, note: opts.note ?? null, generated_at: new Date().toISOString(), approved_at: null, approved_by: null,
      }, { onConflict: "set_id,lesson_id" });
    }));
    const skipped = CORE_LESSONS.filter((l) => (!opts.lessonIds || opts.lessonIds.includes(l.id)) && locked.has(l.id)).map((l) => l.title);
    await db.from("lesson_sets").update({
      state: "done", cost: Number(set.cost) + costOf(usage),
      error: skipped.length ? `Not regenerated because leaders have started them: ${skipped.join(", ")}.` : null,
    }).eq("id", setId);
  } catch (err) {
    console.error("lesson set failed", setId, err);
    await db.from("lesson_sets").update({ state: "failed", error: err instanceof Error ? err.message : "Tailoring failed.", cost: Number(set.cost) + costOf(usage) }).eq("id", setId);
  }
  // Usage is logged with the practice partner's, for cost tracking (no leader content is ever sent).
  if (usage.length) {
    let orgId: string | null = null;
    if (set.org_program_id) orgId = (await db.from("org_programs").select("org_id").eq("id", set.org_program_id).single()).data?.org_id ?? null;
    else if (set.enrollment_id) orgId = (await db.from("enrollments").select("org_id").eq("id", set.enrollment_id).single()).data?.org_id ?? null;
    await db.from("usage_log").insert(usage.map((u) => ({ user_id: null, org_id: orgId, enrollment_id: set.enrollment_id, route: "tailor", model: u.model, input_tokens: u.input, output_tokens: u.output })));
  }
}

/** The set for an owner, created if needed. */
export async function ensureSet(db: Db, owner: { intake_request_id?: string; org_program_id?: string; enrollment_id?: string }, extra: Partial<LessonSet> = {}) {
  const [k, v] = Object.entries(owner)[0];
  const { data: found } = await db.from("lesson_sets").select("*").eq(k, v).maybeSingle();
  if (found) return found as LessonSet;
  const { data, error } = await db.from("lesson_sets").insert({ ...owner, ...extra }).select("*").single();
  if (error || !data) throw new Error("Couldn't create the lesson set.");
  return data as LessonSet;
}

// ---------- what a leader sees ----------

/**
 * The core lessons for a leader: their own tailored set (Complete or Cohort individuals), else their program's.
 * Base lessons when the set uses the default content; tailored ones where generated (or approved, if approval
 * is required); base for any lesson that fell back. No set: the program has no core lessons (yet).
 */
export async function lessonsForLeader(db: Db, e: { id: string; org_program_id: string }, plan: Plan): Promise<CoreLesson[] | undefined> {
  const { data } = await db.from("lesson_sets").select("id, use_default, enrollment_id, org_program_id, state")
    .or(`enrollment_id.eq.${e.id},org_program_id.eq.${e.org_program_id}`);
  const sets = (data ?? []) as Pick<LessonSet, "id" | "use_default" | "enrollment_id" | "org_program_id" | "state">[];
  const base = CORE_LESSONS.filter((l) => moduleOpen(plan, l.legacyModuleId));
  const own = tailorsForIndividual(plan) ? sets.find((s) => s.enrollment_id === e.id) : undefined;
  const candidates = [own, sets.find((s) => s.org_program_id === e.org_program_id)].filter(Boolean) as typeof sets;
  for (const set of candidates) {
    if (set.use_default) return base;
    const { data: rows } = await db.from("program_core_lessons").select("lesson_id, status, tailored").eq("set_id", set.id);
    if (!rows?.length) continue; // still being tailored: use the next set
    const byId = new Map((rows as Pick<LessonRow, "lesson_id" | "status" | "tailored">[]).map((r) => [r.lesson_id, r]));
    return base.map((l) => {
      const r = byId.get(l.id);
      const show = r && r.status !== "fallback" && (!REQUIRE_LESSON_APPROVAL || r.status === "approved" || r.status === "edited");
      return show ? applyTailored(l, r.tailored) : l;
    });
  }
  return undefined;
}
