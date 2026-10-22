"use server";
// Free preview sign-up for an individual leader. Creates the account and its free enrollment in the
// Individuals organization, then emails a sign-in link (the same email as signing in). Rate limited,
// and it never reveals whether an address already has an account.
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { individualsProgram } from "@/lib/individuals";
import { MAX_ANSWER } from "@/lib/intake";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requestSignInLink } from "../signin/actions";

export type SignUpInput = { name: string; email: string; industry: string; hardest: string; website: string };
export type SignUpResult = { ok: true } | { ok: false; message: string };

const PER_ADDRESS_PER_DAY = 5;
const ALL_PER_DAY = 300;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function signUpFree(input: SignUpInput): Promise<SignUpResult> {
  if (input?.website) return { ok: true }; // a bot
  const name = clip(input.name, 120), email = clip(input.email, 254).toLowerCase();
  if (!name || !EMAIL.test(email)) return { ok: false, message: "Enter your name and a valid email address." };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = createHash("sha256").update(`signup|${ip}|${process.env.SUPABASE_SECRET_KEY ?? ""}`).digest("hex").slice(0, 32);
  const db = supabaseAdmin();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [mine, everyone] = await Promise.all([
    db.from("intake_requests").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since),
    db.from("intake_requests").select("id", { count: "exact", head: true }).eq("kind", "individual").gte("created_at", since),
  ]);
  if ((mine.count ?? 0) >= PER_ADDRESS_PER_DAY || (everyone.count ?? 0) >= ALL_PER_DAY) {
    return { ok: false, message: "We've had a lot of sign-ups today. Please try again tomorrow." };
  }

  const { data: existing } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!existing) {
    const { orgId, programId } = await individualsProgram(db);
    const { data: created, error } = await db.auth.admin.createUser({ email, email_confirm: true });
    if (error || !created.user) return { ok: false, message: "Something went wrong creating your account. Please try again." };
    const id = created.user.id;
    const p = await db.from("profiles").insert({ id, email, name });
    const m = p.error ? p : await db.from("memberships").insert({ user_id: id, org_id: orgId, role: "leader" });
    const e = m.error ? m : await db.from("enrollments").insert({ user_id: id, org_id: orgId, org_program_id: programId, plan: "free" });
    if (e.error) {
      await db.auth.admin.deleteUser(id);
      return { ok: false, message: "Something went wrong creating your account. Please try again." };
    }
    // Kept so the platform owner can see who signed up and what they're dealing with.
    const answers: Record<string, string> = {};
    const industry = clip(input.industry, MAX_ANSWER), hardest = clip(input.hardest, MAX_ANSWER);
    if (industry) answers.industry = industry;
    if (hardest) answers.hardest = hardest;
    await db.from("intake_requests").insert({ kind: "individual", contact_name: name, contact_email: email, answers, status: "new", ip_hash: ipHash });
  }

  // Someone who already has an account just gets a sign-in link.
  const sent = await requestSignInLink(email);
  if (sent === "busy") return { ok: false, message: "Too many emails were sent in a short time. Wait a few minutes, then use Sign in." };
  if (sent === "failed") return { ok: false, message: "Your account is ready, but the sign-in email didn't send. Use Sign in to get a new link." };
  return { ok: true };
}
