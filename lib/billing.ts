import "server-only";
// Stripe payments for individual plans. Checkout happens on Stripe's own page, so card details never
// reach this site. A paid Checkout Session is recorded once (by its id) and unlocks the plan, whether
// the leader comes back to the success page or Stripe's webhook arrives first.
import Stripe from "stripe";
import { ACCESS_DAYS, LAUNCH_PRICE, LAUNCH_SEATS, PLAN_NAMES, PRICES, rank, effectivePlan, type PaidPlan, type Plan } from "./plans";
import { supabaseAdmin } from "./supabase/admin";

let client: Stripe | undefined;
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return (client ??= new Stripe(key));
}

type Db = ReturnType<typeof supabaseAdmin>;
export type Enrollment = { id: string; user_id: string; plan: Plan; expires_at: string | null; status: string };

/** Launch-price seats left for Complete. */
export async function launchSeatsLeft(db: Db) {
  const { count } = await db.from("payments").select("id", { count: "exact", head: true }).eq("launch_price", true);
  return Math.max(0, LAUNCH_SEATS - (count ?? 0));
}

export type Quote = { plan: PaidPlan; name: string; cents: number; fullCents: number; launch: boolean };

/** What each higher plan costs this leader now: its price, less what they've already paid on this enrollment. */
export async function quotes(db: Db, e: Enrollment): Promise<Quote[]> {
  const current = effectivePlan(e.plan, e.expires_at);
  if (current === "company") return [];
  const [{ data: paid }, seats] = await Promise.all([
    db.from("payments").select("amount_cents").eq("enrollment_id", e.id),
    launchSeatsLeft(db),
  ]);
  // After access runs out, earlier payments no longer count toward an upgrade.
  const credit = current === "free" ? 0 : (paid ?? []).reduce((sum, p) => sum + p.amount_cents, 0);
  return (Object.keys(PRICES) as PaidPlan[])
    .filter((p) => rank(p) > rank(current))
    .map((p) => {
      const launch = p === "complete" && seats > 0;
      const full = launch ? LAUNCH_PRICE : PRICES[p];
      return { plan: p, name: PLAN_NAMES[p], cents: Math.max(0, full - credit), fullCents: full, launch };
    })
    .filter((q) => q.cents >= 50); // Stripe's minimum charge
}

/**
 * Records a paid Checkout Session and unlocks its plan. Safe to call more than once for the same session.
 * Returns the plan, or null if the session isn't paid or isn't one of ours.
 */
export async function fulfill(sessionId: string): Promise<PaidPlan | null> {
  const s = await stripe().checkout.sessions.retrieve(sessionId);
  const plan = s.metadata?.plan as PaidPlan | undefined;
  const enrollmentId = s.metadata?.enrollment_id, userId = s.metadata?.user_id;
  if (s.payment_status !== "paid" || !plan || !(plan in PRICES) || !enrollmentId || !userId) return null;

  const db = supabaseAdmin();
  const { error } = await db.from("payments").upsert({
    user_id: userId, enrollment_id: enrollmentId, plan, amount_cents: s.amount_total ?? 0, currency: s.currency ?? "usd",
    launch_price: s.metadata?.launch === "1", stripe_session_id: s.id,
    stripe_payment_intent: typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null,
    email: s.customer_details?.email ?? s.customer_email ?? null,
  }, { onConflict: "stripe_session_id", ignoreDuplicates: true });
  if (error) throw error;

  const { data: e } = await db.from("enrollments").select("id, user_id, plan, expires_at, status").eq("id", enrollmentId).maybeSingle();
  if (!e || e.user_id !== userId) return null;
  const current = effectivePlan(e.plan as Plan, e.expires_at);
  if (rank(plan) < rank(current)) return plan; // already on a higher plan
  // Twelve months from this purchase, never shorter than what they already have.
  const until = new Date(Math.max(Date.now() + ACCESS_DAYS * 864e5, current === "free" ? 0 : new Date(e.expires_at ?? 0).getTime()));
  const { error: upError } = await db.from("enrollments").update({ plan, expires_at: until.toISOString(), status: "active" }).eq("id", enrollmentId);
  if (upError) throw upError;
  return plan;
}
