"use server";
// Upgrading an individual plan with Stripe Checkout. Every action checks, as the caller, that the
// enrollment is their own, and prices are always worked out here, never taken from the browser.
import { headers } from "next/headers";
import { fulfill, launchSeatsLeft, quotes, stripe, type Enrollment, type Quote } from "@/lib/billing";
import { effectivePlan, PLAN_NAMES, type PaidPlan, type Plan } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type Offer = { plan: Plan; expiresAt: string | null; quotes: Quote[]; seatsLeft: number };

async function myEnrollment(enrollmentId: string) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { data: e } = await supabase.from("enrollments").select("id, user_id, plan, expires_at, status")
    .eq("id", enrollmentId).eq("user_id", auth.user.id).maybeSingle();
  if (!e) throw new Error("Not found");
  return { user: auth.user, e: e as Enrollment };
}

export async function getOffer(enrollmentId: string): Promise<Offer> {
  const { e } = await myEnrollment(enrollmentId);
  const db = supabaseAdmin();
  const [q, seatsLeft] = await Promise.all([quotes(db, e), launchSeatsLeft(db)]);
  return { plan: effectivePlan(e.plan, e.expires_at), expiresAt: e.expires_at, quotes: q, seatsLeft };
}

export async function startCheckout(enrollmentId: string, plan: PaidPlan): Promise<{ url?: string; message?: string }> {
  const { user, e } = await myEnrollment(enrollmentId);
  if (e.status !== "active") return { message: "Your access isn't active. Contact us for help." };
  const quote = (await quotes(supabaseAdmin(), e)).find((q) => q.plan === plan);
  if (!quote) return { message: "That plan isn't available for your account." };
  const h = await headers();
  const site = process.env.SITE_URL || h.get("origin") || `https://${h.get("host")}`;
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd", unit_amount: quote.cents,
        product_data: { name: `Leader Onboarding: ${PLAN_NAMES[plan]}`, description: "12 months of access to the Leading People program" },
      },
    }],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { user_id: user.id, enrollment_id: e.id, plan, launch: quote.launch ? "1" : "0" },
    payment_intent_data: { metadata: { user_id: user.id, enrollment_id: e.id, plan } },
    success_url: `${site}/upgrade?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/upgrade`,
  });
  return session.url ? { url: session.url } : { message: "Couldn't start checkout. Try again." };
}

/** Called when the leader comes back from Stripe: records the payment if Stripe's webhook hasn't yet. */
export async function confirmCheckout(sessionId: string): Promise<{ ok: boolean; plan?: PaidPlan; message?: string }> {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) return { ok: false, message: "That payment wasn't found." };
  const s = await stripe().checkout.sessions.retrieve(sessionId);
  if (s.metadata?.user_id !== auth.user.id) return { ok: false, message: "That payment wasn't found." };
  if (s.payment_status !== "paid") return { ok: false, message: "The payment hasn't gone through yet. Refresh in a minute." };
  const plan = await fulfill(sessionId);
  return plan ? { ok: true, plan } : { ok: false, message: "We couldn't apply that payment. Contact us and we'll sort it out." };
}
