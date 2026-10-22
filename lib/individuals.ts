import "server-only";
// Individual leaders (free preview and paid plans) all belong to one organization, "Individuals", which
// runs the general version of the program. Each leader sees only their own work; it has no org admins.
import { STANDARD_TEMPLATE_ID } from "@/content/program";
import { GENERAL_TEMPLATE_ID, loadTemplate } from "./drafts";
import type { supabaseAdmin } from "./supabase/admin";

type Db = ReturnType<typeof supabaseAdmin>;
const SLUG = "individuals";

/** The Individuals organization and its live program, created on first use. */
export async function individualsProgram(db: Db): Promise<{ orgId: string; programId: string }> {
  let { data: org } = await db.from("organizations").select("id").eq("slug", SLUG).maybeSingle();
  if (!org) {
    const created = await db.from("organizations").insert({ name: "Individuals", slug: SLUG, kind: "individual" }).select("id").single();
    // Two sign-ups at once: the other one created it.
    org = created.data ?? (await db.from("organizations").select("id").eq("slug", SLUG).single()).data;
  }
  if (!org) throw new Error("Couldn't set up the Individuals organization");

  const { data: op } = await db.from("org_programs").select("id").eq("org_id", org.id).eq("status", "live").maybeSingle();
  if (op) return { orgId: org.id, programId: op.id };

  const templateId = (await loadTemplate(db, GENERAL_TEMPLATE_ID)) ? GENERAL_TEMPLATE_ID : STANDARD_TEMPLATE_ID;
  const template = await loadTemplate(db, templateId);
  if (!template) throw new Error("No program template to start individuals from");
  const { data: created, error } = await db.from("org_programs").insert({
    org_id: org.id, program: "leading-people", template_id: templateId, status: "live", content: template.content, approved_at: new Date().toISOString(),
  }).select("id").single();
  if (error || !created) throw new Error("Couldn't set up the individuals' program");
  const s = await db.from("org_program_secrets").insert({ org_program_id: created.id, secrets: template.secrets });
  if (s.error) throw new Error("Couldn't set up the individuals' program");
  return { orgId: org.id, programId: created.id };
}
