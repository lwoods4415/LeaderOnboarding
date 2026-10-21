import "server-only";
// Intake requests and their tailored drafts, on the server with the secret key. Callers check who is
// asking first: the public form only ever inserts a request; everything else is the platform owner's.
import type { ProgramContent, ProgramSecrets } from "@/content/program";
import { STANDARD_TEMPLATE_ID } from "@/content/program";
import { GENERAL_TEMPLATE_ANSWERS, type IntakeKind } from "./intake";
import { supabaseAdmin } from "./supabase/admin";
import { tailor, type Doc } from "./tailor";

export const GENERAL_TEMPLATE_ID = "leading-people-general-v1";
const PROGRAM = "leading-people";
const HEALTHCARE = /health|nurs|patient|clinic|hospital|medical|care team|pharm/i;

type Db = ReturnType<typeof supabaseAdmin>;

export type RequestRow = {
  id: string;
  kind: IntakeKind | "template";
  org_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  answers: Record<string, string>;
  status: "new" | "drafting" | "draft_ready" | "draft_failed" | "approved" | "declined";
  base_template_id: string | null;
  draft_content: ProgramContent | null;
  draft_secrets: ProgramSecrets | null;
  draft_summary: string | null;
  review_notes: string | null;
  draft_error: string | null;
  draft_cost: number;
  drafted_at: string | null;
  approved_at: string | null;
  org_id: string | null;
  template_id: string | null;
  created_at: string;
};

export async function loadTemplate(db: Db, id: string): Promise<Doc | null> {
  const [t, s] = await Promise.all([
    db.from("program_templates").select("content").eq("id", id).maybeSingle(),
    db.from("program_template_secrets").select("secrets").eq("template_id", id).maybeSingle(),
  ]);
  if (!t.data || !s.data) return null;
  return { content: t.data.content as ProgramContent, secrets: s.data.secrets as ProgramSecrets };
}

/** Which standard version a request starts from: healthcare for healthcare teams, otherwise the general one once it exists. */
async function chooseTemplate(db: Db, r: RequestRow) {
  if (r.base_template_id) return r.base_template_id;
  if (r.kind === "template" || HEALTHCARE.test(r.answers.industry ?? "")) return STANDARD_TEMPLATE_ID;
  const { data } = await db.from("program_templates").select("id").eq("id", GENERAL_TEMPLATE_ID).maybeSingle();
  return data ? GENERAL_TEMPLATE_ID : STANDARD_TEMPLATE_ID;
}

/**
 * Drafts (or, with review notes, redrafts) the tailored program for a request. Runs after the response
 * is sent, so it records its own success or failure on the row. Takes a minute or two.
 */
export async function runDraft(id: string) {
  const db = supabaseAdmin();
  const { data } = await db.from("intake_requests").select("*").eq("id", id).maybeSingle();
  const r = data as RequestRow | null;
  if (!r || r.status !== "drafting") return;
  try {
    const templateId = await chooseTemplate(db, r);
    const template = await loadTemplate(db, templateId);
    if (!template) throw new Error(`The standard program (${templateId}) wasn't found.`);
    const redraft = !!(r.review_notes?.trim() && r.draft_content && r.draft_secrets);
    const base = redraft ? { content: r.draft_content!, secrets: r.draft_secrets! } : template;
    const result = await tailor({ base, kind: r.kind, answers: r.answers, orgName: r.org_name, notes: redraft ? r.review_notes : null });
    await db.from("intake_requests").update({
      status: "draft_ready", base_template_id: templateId,
      draft_content: result.doc.content, draft_secrets: result.doc.secrets,
      draft_summary: redraft && r.draft_summary ? r.draft_summary : result.summary,
      draft_error: result.problems.length ? result.problems.join("\n") : null,
      draft_cost: Number(r.draft_cost) + result.cost, drafted_at: new Date().toISOString(),
    }).eq("id", id);
  } catch (err) {
    console.error("draft failed", id, err);
    await db.from("intake_requests").update({
      status: "draft_failed", draft_error: err instanceof Error ? err.message : "The draft failed.",
    }).eq("id", id);
  }
}

/** A new template request for the general (non-healthcare) version. */
export async function createGeneralRequest(db: Db) {
  return db.from("intake_requests").insert({
    kind: "template", org_name: "General version (Free and Essentials)", answers: GENERAL_TEMPLATE_ANSWERS,
    status: "drafting", base_template_id: STANDARD_TEMPLATE_ID,
  }).select("id").single();
}

/** A unique organization web name from its display name, e.g. "Acme Health" → "acme-health". */
export async function uniqueSlug(db: Db, name: string) {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "org";
  const root = base.length < 2 ? `${base}-org` : base;
  for (let n = 1; n < 50; n++) {
    const slug = n === 1 ? root : `${root}-${n}`;
    const { data } = await db.from("organizations").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export { PROGRAM };
