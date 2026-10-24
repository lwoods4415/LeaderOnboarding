"use server";
// The platform owner's review queue: intake requests, their tailored drafts, and approval.
// Every action first checks, as the caller, that they are the super admin.
import { after } from "next/server";
import { activateCompany, createAwaitingCompany, inviteContact, payLink } from "@/lib/companies";
import { createGeneralRequest, GENERAL_TEMPLATE_ID, loadTemplate, PROGRAM, runDraft, type RequestRow } from "@/lib/drafts";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { diff, placeOf, setLeaf, type Doc } from "@/lib/tailor";

export type Result = { ok: boolean; message: string; payLink?: string };
export type RequestSummary = Pick<RequestRow, "id" | "kind" | "org_name" | "contact_name" | "contact_email" | "status" | "draft_cost" | "created_at" | "drafted_at">;
export type ReviewChange = { path: string; place: string; before: string; after: string };
export type RequestDetail = RequestSummary & {
  answers: Record<string, string>;
  summary: string | null;
  notes: string | null;
  problems: string | null;
  baseTemplateId: string | null;
  changes: ReviewChange[];
  /** The private payment link, while the program waits for payment. */
  payLink: string | null;
};

const fail = (message: string): Result => ({ ok: false, message });

async function requireSuperAdmin() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { data: ok } = await supabase.rpc("is_super_admin");
  if (!ok) throw new Error("Not allowed");
  return { db: supabaseAdmin(), myId: auth.user.id };
}

const SUMMARY_COLS = "id, kind, org_name, contact_name, contact_email, status, draft_cost, created_at, drafted_at";

export async function listRequests(): Promise<RequestSummary[]> {
  const { db } = await requireSuperAdmin();
  const { data, error } = await db.from("intake_requests").select(SUMMARY_COLS).order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return (data ?? []) as RequestSummary[];
}

async function getRow(db: ReturnType<typeof supabaseAdmin>, id: string) {
  const { data } = await db.from("intake_requests").select("*").eq("id", id).maybeSingle();
  return data as RequestRow | null;
}

export async function getRequest(id: string): Promise<RequestDetail | null> {
  const { db } = await requireSuperAdmin();
  const r = await getRow(db, id);
  if (!r) return null;
  let changes: ReviewChange[] = [];
  if (r.draft_content && r.draft_secrets && r.base_template_id) {
    const template = await loadTemplate(db, r.base_template_id);
    if (template) {
      changes = diff(template, { content: r.draft_content, secrets: r.draft_secrets })
        .map((c) => ({ ...c, place: placeOf(c.path, template) }));
    }
  }
  return {
    id: r.id, kind: r.kind, org_name: r.org_name, contact_name: r.contact_name, contact_email: r.contact_email, status: r.status,
    draft_cost: Number(r.draft_cost), created_at: r.created_at, drafted_at: r.drafted_at,
    answers: r.answers, summary: r.draft_summary, notes: r.review_notes, problems: r.draft_error, baseTemplateId: r.base_template_id, changes,
    payLink: r.status === "awaiting_payment" && r.pay_token ? payLink(r.pay_token) : null,
  };
}

/** Starts a draft, or a redraft that applies the platform owner's notes to the current draft. */
export async function draftRequest(id: string, notes?: string): Promise<Result> {
  const { db } = await requireSuperAdmin();
  const r = await getRow(db, id);
  if (!r) return fail("That request wasn't found.");
  if (r.kind === "individual") return fail("Individual requests use the general version, so there's nothing to draft.");
  if (r.status === "drafting") return fail("A draft is already being written.");
  if (r.status === "approved" || r.status === "declined") return fail("This request is closed.");
  const clean = (notes ?? "").trim().slice(0, 4000);
  if (r.draft_content && !clean) return fail("Write what you'd like changed, then ask for the redraft.");
  const { error } = await db.from("intake_requests").update({ status: "drafting", review_notes: clean || null, draft_error: null }).eq("id", id);
  if (error) return fail("Couldn't start the draft. Try again.");
  after(() => runDraft(id));
  return { ok: true, message: r.draft_content ? "Redrafting with your notes. This takes a minute or two." : "Drafting. This takes a minute or two." };
}

/** Puts one string back to the standard version's wording. */
export async function undoChange(id: string, path: string): Promise<Result> {
  const { db } = await requireSuperAdmin();
  const r = await getRow(db, id);
  if (!r?.draft_content || !r.draft_secrets || !r.base_template_id) return fail("That draft wasn't found.");
  if (r.status !== "draft_ready") return fail("This draft can't be changed right now.");
  const template = await loadTemplate(db, r.base_template_id);
  const original = template && diff(template, { content: r.draft_content, secrets: r.draft_secrets }).find((c) => c.path === path);
  if (!original) return fail("That change wasn't found.");
  const doc: Doc = { content: r.draft_content, secrets: r.draft_secrets };
  setLeaf(doc, path, original.before);
  const { error } = await db.from("intake_requests").update({ draft_content: doc.content, draft_secrets: doc.secrets }).eq("id", id);
  return error ? fail("Couldn't undo that change. Try again.") : { ok: true, message: "Change undone. The standard wording is back." };
}

export async function declineRequest(id: string): Promise<Result> {
  const { db } = await requireSuperAdmin();
  const { error } = await db.from("intake_requests").update({ status: "declined" }).eq("id", id).neq("status", "approved");
  return error ? fail("Couldn't close the request. Try again.") : { ok: true, message: "Request closed." };
}

export async function startGeneralVersion(): Promise<Result & { id?: string }> {
  const { db } = await requireSuperAdmin();
  const { data: open } = await db.from("intake_requests").select("id").eq("kind", "template").in("status", ["new", "drafting", "draft_ready", "draft_failed"]).maybeSingle();
  if (open) return fail("The general version already has an open draft in the list.");
  const { data, error } = await createGeneralRequest(db);
  if (error || !data) return fail("Couldn't start the general version. Try again.");
  after(() => runDraft(data.id));
  return { ok: true, message: "Drafting the general version. This takes a minute or two.", id: data.id };
}

/**
 * Approves a draft. A template request becomes a standard version (the general one). A company request
 * creates the organization with this program live, and invites the contact as its admin (an email is sent).
 */
export async function approveRequest(id: string): Promise<Result> {
  const { db, myId } = await requireSuperAdmin();
  const r = await getRow(db, id);
  if (!r) return fail("That request wasn't found.");
  if (r.status !== "draft_ready" || !r.draft_content || !r.draft_secrets) return fail("There's no finished draft to approve.");
  const now = new Date().toISOString();

  if (r.kind === "template") {
    const t = await db.from("program_templates").upsert({ id: GENERAL_TEMPLATE_ID, program: PROGRAM, title: "Leading People (general)", content: r.draft_content });
    const s = t.error ? t : await db.from("program_template_secrets").upsert({ template_id: GENERAL_TEMPLATE_ID, secrets: r.draft_secrets });
    if (s.error) return fail("Couldn't save the general version. Try again.");
    await db.from("intake_requests").update({ status: "approved", approved_at: now, approved_by: myId, template_id: GENERAL_TEMPLATE_ID }).eq("id", id);
    return { ok: true, message: "Approved. The general version is now a standard version for Free and Essentials." };
  }

  if (r.kind !== "company" || !r.org_name || !r.contact_email) return fail("This request is missing the organization or contact details.");
  try {
    const { token } = await createAwaitingCompany(db, r, myId);
    return { ok: true, message: `Approved. ${r.org_name}'s program is waiting for payment. Copy the payment link below and send it to ${r.contact_email}. The program goes live when they pay.`, payLink: payLink(token) };
  } catch (err) {
    return fail(err instanceof Error ? `${err.message} Nothing was created; try again.` : "Couldn't approve. Try again.");
  }
}

/** For special arrangements (a pilot, an invoice paid outside Stripe): makes the program live with no seat limit. */
export async function activateWithoutPayment(id: string): Promise<Result> {
  const { db } = await requireSuperAdmin();
  const r = await getRow(db, id);
  if (!r || r.status !== "awaiting_payment") return fail("Only a program waiting for payment can be activated.");
  try {
    const { invite } = await activateCompany(db, id, null, new Date());
    return { ok: true, message: inviteMessage(r, invite, "Activated without payment, with no limit on leaders.") };
  } catch {
    return fail("Couldn't activate the program. Try again.");
  }
}

/** Sends the contact's admin invite again (for example if the first one never arrived). */
export async function resendInvite(id: string): Promise<Result> {
  const { db } = await requireSuperAdmin();
  const r = await getRow(db, id);
  if (!r || r.status !== "approved" || r.kind !== "company") return fail("That program isn't live.");
  return { ok: true, message: inviteMessage(r, await inviteContact(db, r), "") };
}

function inviteMessage(r: RequestRow, invite: string, lead: string) {
  const who = r.contact_email ?? "the contact";
  const tail = invite === "sent" ? `An admin invite was emailed to ${who}.`
    : invite === "existing" || invite === "already live" ? `${who} already had an account, so no email was sent; they can sign in as usual.`
    : `The admin invite didn't send: ${invite}`;
  return `${lead} ${tail}`.trim();
}
