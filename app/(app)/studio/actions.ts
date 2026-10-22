"use server";
// How many scored practice conversations the leader has left on their plan (null: unlimited).
import { practiceLeft } from "@/lib/practice";
import { effectivePlan, type Plan } from "@/lib/plans";
import { supabaseServer } from "@/lib/supabase/server";

export async function myPracticeLeft(enrollmentId: string): Promise<number | null> {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return 0;
  const { data: e } = await supabase.from("enrollments").select("id, plan, expires_at").eq("id", enrollmentId).eq("user_id", auth.user.id).maybeSingle();
  if (!e) return 0;
  return practiceLeft(e.id, effectivePlan(e.plan as Plan, e.expires_at));
}
