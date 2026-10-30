// The leader's program, trimmed to what their plan includes. The database doesn't let the browser read
// program text directly, so locked modules never leave the server.
import { coreLessonsFor } from "@/lib/coreLessons";
import { contentFor, effectivePlan, type Plan } from "@/lib/plans";
import type { ProgramContent } from "@/content/program";
import { fail } from "@/lib/practice";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const eid = new URL(request.url).searchParams.get("enrollment");
  if (!eid) return fail(400, "Missing enrollment.");
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail(401, "Your sign-in has expired. Sign in again.");

  // Checked as the leader, under row-level security: it must be their own active enrollment.
  const [{ data: e }, { data: active }] = await Promise.all([
    supabase.from("enrollments").select("org_program_id, plan, expires_at").eq("id", eid).eq("user_id", auth.user.id).maybeSingle(),
    supabase.rpc("owns_active_enrollment", { eid }),
  ]);
  if (!e || !active) return fail(403, "Your access to this program isn't active.");

  const { data: op } = await supabaseAdmin().from("org_programs").select("content, organizations(slug)").eq("id", e.org_program_id).maybeSingle();
  if (!op) return fail(404, "Program not found.");
  const plan = effectivePlan(e.plan as Plan, e.expires_at);
  const content = contentFor(op.content as ProgramContent, plan);
  const lessons = coreLessonsFor((op.organizations as unknown as { slug: string } | null)?.slug, plan);
  return Response.json({ plan, content: lessons ? { ...content, coreLessons: lessons } : content }, { headers: { "Cache-Control": "private, no-store" } });
}
