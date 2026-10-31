"use server";
// An individual leader on the Complete or Cohort plan tailors their core lessons to their own team, from a short
// form on their plan page (approved 2026-10-31). Once, so the cost stays predictable; the platform owner can
// regenerate from the Platform page if needed.
import { after } from "next/server";
import { ensureSet, runLessonSet, tailorsForIndividual, type LessonSet } from "@/lib/lessonTailoring";
import { MAX_ANSWER, TAILOR_QUESTIONS } from "@/lib/intake";
import { effectivePlan, type Plan } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type MyTailoring =
  | { eligible: false }
  | { eligible: true; state: LessonSet["state"] | "none"; prefill: Record<string, string> };

async function mine(enrollmentId: string) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { data: e } = await supabase.from("enrollments").select("id, plan, expires_at").eq("id", enrollmentId).eq("user_id", auth.user.id).maybeSingle();
  if (!e) throw new Error("Not found");
  return { e, email: auth.user.email ?? "" };
}

export async function getMyTailoring(enrollmentId: string): Promise<MyTailoring> {
  const { e, email } = await mine(enrollmentId);
  if (!tailorsForIndividual(effectivePlan(e.plan as Plan, e.expires_at))) return { eligible: false };
  const db = supabaseAdmin();
  const { data: set } = await db.from("lesson_sets").select("state, answers").eq("enrollment_id", e.id).maybeSingle();
  // Start from what they told us when they signed up.
  const { data: signup } = await db.from("intake_requests").select("answers").eq("kind", "individual").eq("contact_email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return { eligible: true, state: (set?.state as LessonSet["state"]) ?? "none", prefill: { ...(signup?.answers ?? {}), ...(set?.answers ?? {}) } };
}

export async function submitMyTailoring(enrollmentId: string, answers: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const { e } = await mine(enrollmentId);
  if (!tailorsForIndividual(effectivePlan(e.plan as Plan, e.expires_at))) return { ok: false, message: "Tailored lessons are part of the Complete and Cohort plans." };
  const clean: Record<string, string> = {};
  for (const q of TAILOR_QUESTIONS) {
    const v = typeof answers?.[q.key] === "string" ? answers[q.key].trim().slice(0, MAX_ANSWER) : "";
    if ("required" in q && q.required && !v) return { ok: false, message: "Answer the questions marked as required." };
    if (v) clean[q.key] = v;
  }
  const db = supabaseAdmin();
  const { data: existing } = await db.from("lesson_sets").select("id, state").eq("enrollment_id", e.id).maybeSingle();
  if (existing && existing.state !== "failed" && existing.state !== "idle") return { ok: false, message: "Your lessons are already tailored (or being tailored)." };
  const set = await ensureSet(db, { enrollment_id: e.id }, { answers: clean });
  await db.from("lesson_sets").update({ answers: clean, context: null, state: "running" }).eq("id", set.id);
  after(() => runLessonSet(set.id));
  return { ok: true, message: "Thanks! We're tailoring your lessons now. It takes a couple of minutes; they'll appear in each module." };
}
