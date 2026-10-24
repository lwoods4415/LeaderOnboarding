"use server";
// The page Stripe returns buyers to. It works signed in or not: the Checkout Session id in the address
// identifies the purchase, and only its plan, date and email go back to the page. Signing in still
// takes the emailed link or code, sent only to the address that paid.
import { fulfill, stripe } from "@/lib/billing";
import { PLAN_NAMES, type PaidPlan } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requestSignInLink } from "../signin/actions";

export type Purchase = { ok: true; plan: string; email: string; until: string | null } | { ok: false; message: string };

async function paidSession(sessionId: unknown) {
  if (typeof sessionId !== "string" || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return null;
  const s = await stripe().checkout.sessions.retrieve(sessionId).catch(() => null);
  return s && s.payment_status === "paid" && s.metadata?.enrollment_id ? s : null;
}

export async function confirmPurchase(sessionId: string): Promise<Purchase> {
  try {
    const s = await paidSession(sessionId);
    if (!s) return { ok: false, message: "We couldn't find a completed payment for this page. If you were charged, contact us and we'll sort it out." };
    const plan = (await fulfill(s.id)) as PaidPlan | null;
    if (!plan) return { ok: false, message: "Your payment went through, but we couldn't apply it yet. Contact us and we'll sort it out." };
    const db = supabaseAdmin();
    const [{ data: e }, { data: p }] = await Promise.all([
      db.from("enrollments").select("expires_at").eq("id", s.metadata!.enrollment_id!).maybeSingle(),
      db.from("profiles").select("email").eq("id", s.metadata!.user_id ?? "").maybeSingle(),
    ]);
    // The account they sign in with, which may differ from the email on the receipt.
    return { ok: true, plan: PLAN_NAMES[plan], email: p?.email ?? s.customer_details?.email ?? "", until: e?.expires_at ?? null };
  } catch (err) {
    console.error("purchase confirm failed", err);
    return { ok: false, message: "Your payment is safe, but we couldn't check it just now. Refresh the page in a minute." };
  }
}

/** Emails a sign-in link and code to the account that made this purchase. */
export async function sendPurchaseSignIn(sessionId: string): Promise<"sent" | "busy" | "failed"> {
  const s = await paidSession(sessionId);
  const userId = s?.metadata?.user_id;
  if (!userId) return "failed";
  // The account's own email (the one they sign in with), which may differ from the receipt email.
  const { data: p } = await supabaseAdmin().from("profiles").select("email").eq("id", userId).maybeSingle();
  return p?.email ? requestSignInLink(p.email) : "failed";
}
