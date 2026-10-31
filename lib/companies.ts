import "server-only";
// Company programs, from approval to live. Approving creates the organization with its tailored program
// waiting for payment. Paying (or the platform owner activating it without payment) makes it live, sets
// its leader seats and access date, and invites the contact as its admin.
import { randomBytes } from "node:crypto";
import { ACCESS_DAYS } from "./plans";
import { PROGRAM, uniqueSlug, type RequestRow } from "./drafts";
import type { supabaseAdmin } from "./supabase/admin";

type Db = ReturnType<typeof supabaseAdmin>;

export const siteUrl = () => process.env.SITE_URL || "https://www.growlikealeader.com";
export const payLink = (token: string) => `${siteUrl()}/company?t=${token}`;

/** Creates the organization with its program waiting for payment, and the request's private payment link. */
export async function createAwaitingCompany(db: Db, r: RequestRow, approvedBy: string) {
  if (!r.org_name || !r.draft_content || !r.draft_secrets) throw new Error("The request is missing its organization or draft.");
  const { data: org, error } = await db.from("organizations")
    .insert({ name: r.org_name, slug: await uniqueSlug(db, r.org_name), kind: "company", seats: 0 }).select("id").single();
  if (error || !org) throw new Error("Couldn't create the organization.");
  try {
    const { data: op, error: opError } = await db.from("org_programs").insert({
      org_id: org.id, program: PROGRAM, template_id: r.base_template_id, status: "awaiting_payment", intake: r.answers,
      content: r.draft_content, approved_at: new Date().toISOString(), approved_by: approvedBy,
    }).select("id").single();
    if (opError || !op) throw new Error("Couldn't save the program.");
    const sec = await db.from("org_program_secrets").insert({ org_program_id: op.id, secrets: r.draft_secrets });
    if (sec.error) throw new Error("Couldn't save the program.");
    const token = randomBytes(24).toString("base64url");
    const upd = await db.from("intake_requests").update({ status: "awaiting_payment", org_id: org.id, pay_token: token, approved_by: approvedBy }).eq("id", r.id);
    if (upd.error) throw new Error("Couldn't save the payment link.");
    // Its tailored core lessons now belong to the program.
    await db.from("lesson_sets").update({ org_program_id: op.id }).eq("intake_request_id", r.id);
    return { orgId: org.id, token };
  } catch (err) {
    await db.from("organizations").delete().eq("id", org.id); // nothing half-created
    throw err;
  }
}

/** Invites (or, for an existing account, adds) the contact as the organization's admin. Safe to repeat. */
export async function inviteContact(db: Db, r: Pick<RequestRow, "contact_email" | "contact_name" | "org_id">): Promise<"sent" | "existing" | string> {
  if (!r.contact_email || !r.org_id) return "The request has no contact or organization.";
  const email = r.contact_email.toLowerCase();
  const { data: op } = await db.from("org_programs").select("id").eq("org_id", r.org_id).eq("status", "live").maybeSingle();
  if (!op) return "The program isn't live yet.";
  const { data: existing } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  let userId = existing?.id as string | undefined;
  if (!userId) {
    const { data, error } = await db.auth.admin.inviteUserByEmail(email, { redirectTo: `${siteUrl()}/auth/callback` });
    if (error || !data.user) return error?.status === 429 ? "Too many emails were sent recently. Try again in a few minutes." : `Couldn't send the invite: ${error?.message ?? "unknown error"}.`;
    userId = data.user.id;
    const p = await db.from("profiles").insert({ id: userId, email, name: r.contact_name ?? "" });
    if (p.error) { await db.auth.admin.deleteUser(userId); return "Couldn't save the contact. Try again."; }
  }
  await db.from("memberships").upsert({ user_id: userId, org_id: r.org_id, role: "org_admin", active: true }, { onConflict: "user_id,org_id" });
  await db.from("enrollments").upsert({ user_id: userId, org_id: r.org_id, org_program_id: op.id, plan: "company" }, { onConflict: "user_id,org_program_id", ignoreDuplicates: true });
  return existing ? "existing" : "sent";
}

/**
 * Makes a company's program live with this many leader seats, for 12 months from `from`, and invites
 * its contact. Does nothing if the request is already live.
 */
export async function activateCompany(db: Db, requestId: string, seats: number | null, from: Date) {
  const { data } = await db.from("intake_requests").select("id, status, org_id, contact_email, contact_name").eq("id", requestId).maybeSingle();
  const r = data as Pick<RequestRow, "status" | "org_id" | "contact_email" | "contact_name"> | null;
  if (!r?.org_id) throw new Error("That request has no organization.");
  if (r.status === "approved") return { invite: "already live" };
  const until = new Date(from.getTime() + ACCESS_DAYS * 864e5).toISOString();
  const o = await db.from("organizations").update({ seats, paid_until: seats === null ? null : until }).eq("id", r.org_id);
  const p = o.error ? o : await db.from("org_programs").update({ status: "live" }).eq("org_id", r.org_id).eq("status", "awaiting_payment");
  if (p.error) throw p.error;
  await db.from("intake_requests").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", requestId);
  return { invite: await inviteContact(db, r) };
}
