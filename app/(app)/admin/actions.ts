"use server";
// Org-admin actions for one organization. Each one checks, as the caller, that they are an active admin
// of that organization before using the secret key, and only ever touches that organization's people.
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type Result = { ok: boolean; message: string };
export type AdminLeader = {
  id: string;
  email: string;
  name: string;
  role: "org_admin" | "leader";
  active: boolean;
  cohortId: string | null;
  lastActive: string | null;
  invitePending: boolean;
};
export type AdminData = { cohorts: { id: string; name: string }[]; leaders: AdminLeader[] };

const BANNED = "876000h"; // ~100 years: how Supabase blocks sign-in until access is restored
const PROGRAM = "leading-people";

async function requireOrgAdmin(orgId: string) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { data: ok } = await supabase.rpc("is_org_admin", { org: orgId });
  if (!ok) throw new Error("Not allowed");
  return { admin: supabaseAdmin(), myId: auth.user.id };
}

const fail = (message: string): Result => ({ ok: false, message });

async function siteUrl() {
  const h = await headers();
  return process.env.SITE_URL || h.get("origin") || `https://${h.get("host")}`;
}

/** The organization's live copy of the program, which new leaders are enrolled in. */
async function liveProgram(admin: ReturnType<typeof supabaseAdmin>, orgId: string) {
  const { data } = await admin.from("org_programs").select("id").eq("org_id", orgId).eq("program", PROGRAM).eq("status", "live").maybeSingle();
  return data?.id ?? null;
}

/** True if this person belongs to this organization. */
async function isMember(admin: ReturnType<typeof supabaseAdmin>, orgId: string, userId: string) {
  const { data } = await admin.from("memberships").select("user_id").eq("org_id", orgId).eq("user_id", userId).maybeSingle();
  return !!data;
}

export async function loadAdminData(orgId: string): Promise<AdminData> {
  const { admin } = await requireOrgAdmin(orgId);
  const [cohorts, members, enrollments, users] = await Promise.all([
    admin.from("cohorts").select("id, name").eq("org_id", orgId).order("name"),
    admin.from("memberships").select("user_id, role, active").eq("org_id", orgId),
    admin.from("enrollments").select("user_id, cohort_id").eq("org_id", orgId),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const signedIn = new Set((users.data?.users ?? []).filter((u) => u.last_sign_in_at).map((u) => u.id));
  const { data: profiles } = await admin.from("profiles").select("id, email, name, last_active").in("id", (members.data ?? []).map((m) => m.user_id));
  const profileOf = new Map((profiles ?? []).map((p) => [p.id, p]));
  const cohortOf = new Map((enrollments.data ?? []).map((e) => [e.user_id, e.cohort_id as string | null]));
  type Member = { user_id: string; role: "org_admin" | "leader"; active: boolean };
  return {
    cohorts: cohorts.data ?? [],
    leaders: ((members.data ?? []) as Member[])
      .filter((m) => profileOf.has(m.user_id))
      .map((m) => {
        const p = profileOf.get(m.user_id)!;
        return {
          id: m.user_id, email: p.email, name: p.name, role: m.role, active: m.active,
          cohortId: cohortOf.get(m.user_id) ?? null, lastActive: p.last_active, invitePending: !signedIn.has(m.user_id),
        };
      })
      .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)),
  };
}

export async function createCohort(orgId: string, name: string): Promise<Result> {
  const { admin } = await requireOrgAdmin(orgId);
  const clean = name.trim();
  if (!clean) return fail("Give the cohort a name.");
  const { error } = await admin.from("cohorts").insert({ name: clean, org_id: orgId });
  if (error) return fail(error.code === "23505" ? "A cohort with that name already exists." : "Couldn't create the cohort. Try again.");
  return { ok: true, message: `Created ${clean}.` };
}

export async function inviteLeader(orgId: string, input: { name: string; email: string; cohortId: string }): Promise<Result> {
  const { admin } = await requireOrgAdmin(orgId);
  const name = input.name.trim(), email = input.email.trim().toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a name and a valid email address.");
  const programId = await liveProgram(admin, orgId);
  if (!programId) return fail("Your organization's program isn't live yet.");
  if (input.cohortId) {
    const { data: c } = await admin.from("cohorts").select("id").eq("id", input.cohortId).eq("org_id", orgId).maybeSingle();
    if (!c) return fail("That cohort wasn't found.");
  }

  // Someone who already has an account (for example in another program) is added without a new invite.
  const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  let userId = existing?.id as string | undefined;
  if (userId && (await isMember(admin, orgId, userId))) return fail("That email has already been invited.");
  if (!userId) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${await siteUrl()}/auth/callback` });
    if (error || !data.user) {
      if (error?.status === 429) return fail("Too many emails sent recently. Wait a few minutes and try again.");
      return fail(`Couldn't send the invite: ${error?.message ?? "unknown error"}.`);
    }
    userId = data.user.id;
    const { error: profileError } = await admin.from("profiles").insert({ id: userId, email, name });
    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return fail("Couldn't save the leader. Nothing was sent; try again.");
    }
  }
  const m = await admin.from("memberships").insert({ user_id: userId, org_id: orgId, role: "leader" });
  const e = m.error ? m : await admin.from("enrollments").insert({ user_id: userId, org_id: orgId, org_program_id: programId, plan: "company", cohort_id: input.cohortId || null });
  if (e.error) return fail("Couldn't add the leader. Try again.");
  return existing
    ? { ok: true, message: `${email} already had an account, so no email was sent. Use "Copy sign-in link" to get them in.` }
    : { ok: true, message: `Invite sent to ${email}.` };
}

export async function moveLeader(orgId: string, userId: string, cohortId: string): Promise<Result> {
  const { admin } = await requireOrgAdmin(orgId);
  if (cohortId) {
    const { data: c } = await admin.from("cohorts").select("id").eq("id", cohortId).eq("org_id", orgId).maybeSingle();
    if (!c) return fail("That cohort wasn't found.");
  }
  const { error } = await admin.from("enrollments").update({ cohort_id: cohortId || null }).eq("org_id", orgId).eq("user_id", userId);
  return error ? fail("Couldn't move the leader. Try again.") : { ok: true, message: "Cohort updated." };
}

export async function setAccess(orgId: string, userId: string, active: boolean): Promise<Result> {
  const { admin, myId } = await requireOrgAdmin(orgId);
  if (userId === myId) return fail("You can't remove your own access.");
  if (!(await isMember(admin, orgId, userId))) return fail("That leader wasn't found.");
  const { error } = await admin.from("memberships").update({ active }).eq("org_id", orgId).eq("user_id", userId);
  if (error) return fail("Couldn't change access. Try again.");
  // Block sign-in entirely only when they have no other active organization.
  const { data: others } = await admin.from("memberships").select("org_id").eq("user_id", userId).eq("active", true).neq("org_id", orgId);
  if (!others?.length) await admin.auth.admin.updateUserById(userId, { ban_duration: active ? "none" : BANNED });
  return { ok: true, message: active ? "Access restored. They can sign in again." : "Access removed. Their progress is kept." };
}

/** Permanently deletes a leader's data in this organization. Only after their access has been removed. */
export async function deleteLeader(orgId: string, userId: string): Promise<Result> {
  const { admin, myId } = await requireOrgAdmin(orgId);
  if (userId === myId) return fail("You can't delete your own account here.");
  const { data: m } = await admin.from("memberships").select("active").eq("org_id", orgId).eq("user_id", userId).maybeSingle();
  if (!m) return fail("That leader wasn't found.");
  if (m.active) return fail("Remove their access first, then delete.");
  const { data: others } = await admin.from("memberships").select("org_id").eq("user_id", userId).neq("org_id", orgId);
  if (!others?.length) {
    // Only in this organization: delete the account, which removes everything saved with it.
    const { error } = await admin.auth.admin.deleteUser(userId);
    return error ? fail("Couldn't delete the leader. Try again.") : { ok: true, message: "Leader and all their data permanently deleted." };
  }
  // Also in other organizations: remove only what belongs to this one.
  const e = await admin.from("enrollments").delete().eq("org_id", orgId).eq("user_id", userId);
  const mm = e.error ? e : await admin.from("memberships").delete().eq("org_id", orgId).eq("user_id", userId);
  return mm.error ? fail("Couldn't delete the leader. Try again.") : { ok: true, message: "Leader removed from your organization and their data here permanently deleted." };
}

/**
 * Creates a one-time sign-in link for a leader without sending any email, for the admin to share
 * directly (Teams, text). It opens /auth/confirm, which signs in only when the leader selects Sign in,
 * so link scanners can't use it up. Works for leaders whose invite is still pending.
 */
export async function createSignInLink(orgId: string, userId: string): Promise<Result & { url?: string }> {
  const { admin } = await requireOrgAdmin(orgId);
  const { data: m } = await admin.from("memberships").select("active").eq("org_id", orgId).eq("user_id", userId).maybeSingle();
  const { data: who } = await admin.from("profiles").select("email").eq("id", userId).maybeSingle();
  const email = who?.email;
  if (!m || !email) return fail("That leader wasn't found.");
  if (!m.active) return fail("Restore their access first.");
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) return fail("Couldn't create a sign-in link. Try again.");
  const url = `${await siteUrl()}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=email`;
  return { ok: true, message: "Sign-in link created.", url };
}
