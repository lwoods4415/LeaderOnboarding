"use server";
// The platform owner's review of tailored core lessons (docs/TAILORING.md): list each set's lessons, compare
// them with the base, regenerate (optionally with a steering note), edit, approve, or use the default lessons.
// Every action first checks, as the caller, that they are the super admin.
import { after } from "next/server";
import { CORE_LESSONS } from "@/content/core-lessons";
import { extractTailorable, validateTailored, type ProgramContext, type TailoredLessonContent } from "@/content/core-lessons/tailoring";
import { ensureSet, lessonById, runLessonSet, startedLessons, type LessonRow, type LessonSet } from "@/lib/lessonTailoring";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type Result = { ok: boolean; message: string };
export type SetSummary = {
  id: string; label: string; kind: "draft" | "program" | "individual"; state: LessonSet["state"]; useDefault: boolean;
  cost: number; counts: Record<string, number>; requestId: string | null;
};
export type LessonView = {
  id: string; title: string; status: LessonRow["status"] | "none"; errors: string[] | null; note: string | null;
  generatedAt: string | null; approvedAt: string | null; locked: boolean;
  base: TailoredLessonContent; tailored: TailoredLessonContent | null;
};
export type SetDetail = SetSummary & { context: ProgramContext | null; error: string | null; lessons: LessonView[] };

const fail = (message: string): Result => ({ ok: false, message });

async function requireSuperAdmin() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { data: ok } = await supabase.rpc("is_super_admin");
  if (!ok) throw new Error("Not allowed");
  return { db: supabaseAdmin(), myId: auth.user.id };
}

type Db = ReturnType<typeof supabaseAdmin>;

async function describe(db: Db, sets: LessonSet[]): Promise<SetSummary[]> {
  const ids = sets.map((s) => s.id);
  const [{ data: rows }, { data: reqs }, { data: ops }, { data: ens }] = await Promise.all([
    db.from("program_core_lessons").select("set_id, status").in("set_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    db.from("intake_requests").select("id, org_name, status").in("id", sets.map((s) => s.intake_request_id).filter(Boolean) as string[]),
    db.from("org_programs").select("id, organizations(name)").in("id", sets.map((s) => s.org_program_id).filter(Boolean) as string[]),
    db.from("enrollments").select("id, user_id").in("id", sets.map((s) => s.enrollment_id).filter(Boolean) as string[]),
  ]);
  // Enrollments have no direct link to profiles, so the leaders' emails are looked up separately.
  const { data: people } = await db.from("profiles").select("id, email").in("id", ((ens ?? []) as { user_id: string }[]).map((e) => e.user_id));
  const emailOf = new Map(((ens ?? []) as { id: string; user_id: string }[]).map((e) => [e.id, (people ?? []).find((p) => p.id === e.user_id)?.email as string | undefined]));
  const name = (rows: unknown, id: string | null, pick: (x: Record<string, unknown>) => string | undefined) =>
    id ? pick(((rows ?? []) as Record<string, unknown>[]).find((x) => x.id === id) ?? {}) : undefined;
  return sets.map((s) => {
    const counts: Record<string, number> = {};
    for (const r of (rows ?? []) as { set_id: string; status: string }[]) if (r.set_id === s.id) counts[r.status] = (counts[r.status] ?? 0) + 1;
    const kind = s.enrollment_id ? "individual" : s.org_program_id ? "program" : "draft";
    const label = kind === "individual"
      ? `Individual: ${(s.enrollment_id && emailOf.get(s.enrollment_id)) ?? "leader"}`
      : kind === "program"
        ? (name(ops, s.org_program_id, (x) => (x.organizations as { name?: string } | null)?.name) ?? "Program")
        : `Draft: ${name(reqs, s.intake_request_id, (x) => x.org_name as string) ?? "company"}`;
    return { id: s.id, label, kind, state: s.state, useDefault: s.use_default, cost: Number(s.cost), counts, requestId: s.intake_request_id };
  });
}

export async function listLessonSets(): Promise<{ sets: SetSummary[]; untailored: { id: string; name: string }[] }> {
  const { db } = await requireSuperAdmin();
  const { data } = await db.from("lesson_sets").select("*").order("created_at", { ascending: false }).limit(200);
  const sets = (data ?? []) as LessonSet[];
  // Live programs with no lesson set yet, which can be tailored from here.
  const { data: ops } = await db.from("org_programs").select("id, organizations(name)").eq("status", "live");
  const have = new Set(sets.map((s) => s.org_program_id));
  const untailored = ((ops ?? []) as unknown as { id: string; organizations: { name: string } | null }[])
    .filter((o) => !have.has(o.id)).map((o) => ({ id: o.id, name: o.organizations?.name ?? "Program" }));
  return { sets: await describe(db, sets), untailored };
}

export async function getLessonSet(id: string): Promise<SetDetail | null> {
  const { db } = await requireSuperAdmin();
  const { data } = await db.from("lesson_sets").select("*").eq("id", id).maybeSingle();
  const set = data as LessonSet | null;
  if (!set) return null;
  const [[summary], { data: rows }, locked] = await Promise.all([
    describe(db, [set]),
    db.from("program_core_lessons").select("*").eq("set_id", id),
    startedLessons(db, set),
  ]);
  const byId = new Map(((rows ?? []) as LessonRow[]).map((r) => [r.lesson_id, r]));
  return {
    ...summary, context: set.context, error: set.error,
    lessons: CORE_LESSONS.map((l) => {
      const r = byId.get(l.id);
      return {
        id: l.id, title: l.title, status: r?.status ?? "none", errors: r?.errors ?? null, note: r?.note ?? null,
        generatedAt: r?.generated_at ?? null, approvedAt: r?.approved_at ?? null, locked: locked.has(l.id),
        base: extractTailorable(l), tailored: r?.tailored ?? null,
      };
    }),
  };
}

/** Lessons a leader has started can't be regenerated or edited, so what they saw never changes underneath them. */
async function checkUnlocked(db: Db, set: LessonSet, lessonIds: string[]) {
  const locked = await startedLessons(db, set);
  const hit = lessonIds.filter((x) => locked.has(x)).map((x) => lessonById(x)?.title ?? x);
  return hit.length ? `Leaders have already started ${hit.join(", ")}, so ${hit.length === 1 ? "it" : "they"} can't be changed.` : null;
}

async function getSet(db: Db, id: string) {
  const { data } = await db.from("lesson_sets").select("*").eq("id", id).maybeSingle();
  return data as LessonSet | null;
}

export async function regenerate(setId: string, lessonId: string | null, note: string): Promise<Result> {
  const { db } = await requireSuperAdmin();
  const set = await getSet(db, setId);
  if (!set) return fail("That lesson set wasn't found.");
  if (set.state === "running") return fail("These lessons are already being tailored.");
  if (lessonId && !lessonById(lessonId)) return fail("That lesson wasn't found.");
  const ids = lessonId ? [lessonId] : CORE_LESSONS.map((l) => l.id);
  if (lessonId) { const why = await checkUnlocked(db, set, ids); if (why) return fail(why); }
  await db.from("lesson_sets").update({ state: "running", use_default: false }).eq("id", setId);
  after(() => runLessonSet(setId, { lessonIds: lessonId ? [lessonId] : undefined, note: note.trim().slice(0, 1000) || null }));
  return { ok: true, message: lessonId ? "Regenerating the lesson. This takes about a minute." : "Tailoring all seven lessons (any that leaders have started are skipped). This takes a minute or two." };
}

export async function saveEdit(setId: string, lessonId: string, tailored: TailoredLessonContent): Promise<Result & { problems?: string[] }> {
  const { db } = await requireSuperAdmin();
  const set = await getSet(db, setId);
  const lesson = lessonById(lessonId);
  if (!set || !lesson) return fail("That lesson wasn't found.");
  const why = await checkUnlocked(db, set, [lessonId]);
  if (why) return fail(why);
  const problems = validateTailored(lesson, tailored);
  if (problems.length) return { ok: false, message: "The edit wasn't saved. Fix these first:", problems };
  const { error } = await db.from("program_core_lessons").update({ tailored, status: "edited", errors: null }).eq("set_id", setId).eq("lesson_id", lessonId);
  return error ? fail("Couldn't save the edit. Try again.") : { ok: true, message: "Saved. Leaders see your edited version." };
}

export async function approve(setId: string, lessonId: string | null): Promise<Result> {
  const { db, myId } = await requireSuperAdmin();
  let q = db.from("program_core_lessons").update({ status: "approved", approved_at: new Date().toISOString(), approved_by: myId }).eq("set_id", setId).neq("status", "fallback");
  if (lessonId) q = q.eq("lesson_id", lessonId);
  const { error } = await q;
  return error ? fail("Couldn't approve. Try again.") : { ok: true, message: lessonId ? "Lesson approved." : "All tailored lessons approved." };
}

export async function setUseDefault(setId: string, on: boolean): Promise<Result> {
  const { db } = await requireSuperAdmin();
  const { error } = await db.from("lesson_sets").update({ use_default: on }).eq("id", setId);
  return error ? fail("Couldn't change the setting. Try again.") : { ok: true, message: on ? "This program now shows the default lessons." : "This program now shows its tailored lessons (where tailored)." };
}

/** Tailors a live program's lessons (for example the Individuals program's general version). */
export async function tailorProgram(orgProgramId: string): Promise<Result & { id?: string }> {
  const { db } = await requireSuperAdmin();
  const set = await ensureSet(db, { org_program_id: orgProgramId });
  if (set.state === "running") return fail("These lessons are already being tailored.");
  await db.from("lesson_sets").update({ state: "running" }).eq("id", set.id);
  after(() => runLessonSet(set.id));
  return { ok: true, message: "Tailoring the seven lessons. This takes a minute or two.", id: set.id };
}

/** The lesson set for a request's draft, if any (shown with the request on the review page). */
export async function setForRequest(requestId: string): Promise<string | null> {
  const { db } = await requireSuperAdmin();
  const { data } = await db.from("lesson_sets").select("id").eq("intake_request_id", requestId).maybeSingle();
  return data?.id ?? null;
}
