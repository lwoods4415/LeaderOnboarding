"use server";
// The page Stripe returns buyers to. It works signed in or not: the Checkout Session id in the address
// identifies the purchase, and only what's needed to confirm it goes back to the page. Signing in still
// takes the emailed link or code, sent only to the account's own address.
import { fulfillSession, stripe } from "@/lib/billing";
import { PLAN_NAMES } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requestSignInLink } from "../signin/actions";

export type Purchase =
  | { ok: true; kind: "individual"; plan: string; email: string; until: string | null }
  | { ok: true; kind: "initial"; orgName: string; email: string | null; seats: number; invite: "sent" | "existing" | "failed" }
  | { ok: true; kind: "seats"; orgName: string; seats: number; total: number | null }
  | { ok: false; message: string };

const SESSION = /^cs_(test|live)_[A-Za-z0-9]+$/;

export async function confirmPurchase(sessionId: string): Promise<Purchase> {
  try {
    if (typeof sessionId !== "string" || !SESSION.test(sessionId)) return { ok: false, message: "We couldn't find a payment for this page." };
    const done = await fulfillSession(sessionId);
    if (!done) return { ok: false, message: "We couldn't find a completed payment for this page. If you were charged, contact us and we'll sort it out." };
    if (done.kind === "initial") return { ok: true, kind: "initial", orgName: done.orgName, email: done.email, seats: done.seats, invite: done.invite === "sent" ? "sent" : done.invite === "existing" || done.invite === "already live" ? "existing" : "failed" };
    if (done.kind === "seats") return { ok: true, kind: "seats", orgName: done.orgName, seats: done.seats, total: done.total };

    const s = await stripe().checkout.sessions.retrieve(sessionId);
    const db = supabaseAdmin();
    const [{ data: e }, { data: p }] = await Promise.all([
      db.from("enrollments").select("expires_at").eq("id", s.metadata?.enrollment_id ?? "").maybeSingle(),
      db.from("profiles").select("email").eq("id", s.metadata?.user_id ?? "").maybeSingle(),
    ]);
    // The account they sign in with, which may differ from the email on the receipt.
    return { ok: true, kind: "individual", plan: PLAN_NAMES[done.plan], email: p?.email ?? s.customer_details?.email ?? "", until: e?.expires_at ?? null };
  } catch (err) {
    console.error("purchase confirm failed", err);
    return { ok: false, message: "Your payment is safe, but we couldn't check it just now. Refresh the page in a minute." };
  }
}

/** Emails a sign-in link and code to the account that made this (individual) purchase. */
export async function sendPurchaseSignIn(sessionId: string): Promise<"sent" | "busy" | "failed"> {
  if (typeof sessionId !== "string" || !SESSION.test(sessionId)) return "failed";
  const s = await stripe().checkout.sessions.retrieve(sessionId).catch(() => null);
  const userId = s?.payment_status === "paid" ? s.metadata?.user_id : null;
  if (!userId) return "failed";
  const { data: p } = await supabaseAdmin().from("profiles").select("email").eq("id", userId).maybeSingle();
  return p?.email ? requestSignInLink(p.email) : "failed";
}
