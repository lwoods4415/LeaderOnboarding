"use server";
// Admin-only actions. Each one checks the caller is the active admin before using the secret key.
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type Result = { ok: boolean; message: string };
export type AdminLeader = {
  id: string;
  email: string;
  name: string;
  role: "leader" | "admin";
  active: boolean;
  cohortId: string | null;
  lastActive: string | null;
  invitePending: boolean;
};
export type AdminData = { cohorts: { id: string; name: string }[]; leaders: AdminLeader[] };

const BANNED = "876000h"; // ~100 years: how Supabase blocks sign-in until access is restored

async function requireAdmin() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { data: me } = await supabase.from("profiles").select("role, active").eq("id", auth.user.id).maybeSingle();
  if (me?.role !== "admin" || !me.active) throw new Error("Not allowed");
  return { admin: supabaseAdmin(), myId: auth.user.id };
}

const fail = (message: string): Result => ({ ok: false, message });

export async function loadAdminData(): Promise<AdminData> {
  const { admin } = await requireAdmin();
  const [cohorts, profiles, users] = await Promise.all([
    admin.from("cohorts").select("id, name").order("name"),
    admin.from("profiles").select("id, email, name, role, active, cohort_id, last_active").order("name"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const signedIn = new Set((users.data?.users ?? []).filter((u) => u.last_sign_in_at).map((u) => u.id));
  return {
    cohorts: cohorts.data ?? [],
    leaders: (profiles.data ?? []).map((p) => ({
      id: p.id, email: p.email, name: p.name, role: p.role, active: p.active,
      cohortId: p.cohort_id, lastActive: p.last_active, invitePending: !signedIn.has(p.id),
    })),
  };
}

export async function createCohort(name: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const clean = name.trim();
  if (!clean) return fail("Give the cohort a name.");
  const { error } = await admin.from("cohorts").insert({ name: clean });
  if (error) return fail(error.code === "23505" ? "A cohort with that name already exists." : "Couldn't create the cohort. Try again.");
  return { ok: true, message: `Created ${clean}.` };
}

export async function inviteLeader(input: { name: string; email: string; cohortId: string }): Promise<Result> {
  const { admin } = await requireAdmin();
  const name = input.name.trim(), email = input.email.trim().toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a name and a valid email address.");
  const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing) return fail("That email has already been invited.");

  const site = process.env.SITE_URL;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, site ? { redirectTo: site } : undefined);
  if (error || !data.user) {
    if (error?.status === 429) return fail("Too many emails sent recently. Wait a few minutes and try again.");
    return fail(`Couldn't send the invite: ${error?.message ?? "unknown error"}.`);
  }
  const { error: profileError } = await admin.from("profiles").insert({ id: data.user.id, email, name, cohort_id: input.cohortId || null });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return fail("Couldn't save the leader. Nothing was sent; try again.");
  }
  return { ok: true, message: `Invite sent to ${email}.` };
}

export async function moveLeader(userId: string, cohortId: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("profiles").update({ cohort_id: cohortId || null }).eq("id", userId);
  return error ? fail("Couldn't move the leader. Try again.") : { ok: true, message: "Cohort updated." };
}

export async function setAccess(userId: string, active: boolean): Promise<Result> {
  const { admin, myId } = await requireAdmin();
  if (userId === myId) return fail("You can't remove your own access.");
  const { error: banError } = await admin.auth.admin.updateUserById(userId, { ban_duration: active ? "none" : BANNED });
  if (banError) return fail("Couldn't change access. Try again.");
  const { error } = await admin.from("profiles").update({ active }).eq("id", userId);
  if (error) return fail("Couldn't change access. Try again.");
  return { ok: true, message: active ? "Access restored. They can sign in again." : "Access removed. Their progress is kept." };
}
