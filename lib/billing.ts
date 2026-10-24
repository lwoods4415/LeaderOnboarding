import "server-only";
// Stripe payments for individual plans. Checkout happens on Stripe's own page, so card details never
// reach this site. A paid Checkout Session is recorded once (by its id) and unlocks the plan, whether
// the leader comes back to the success page or Stripe's webhook arrives first.
import Stripe from "stripe";
import { activateCompany } from "./companies";
import { ACCESS_DAYS, companyTier, LAUNCH_PRICE, LAUNCH_SEATS, PLAN_NAMES, PRICES, rank, effectivePlan, type PaidPlan, type Plan } from "./plans";
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
  // Twelve months from the day this payment was recorded (so confirming it again changes nothing),
  // never shorter than what they already have.
  const { data: paid } = await db.from("payments").select("created_at").eq("stripe_session_id", s.id).single();
  const from = new Date(paid?.created_at ?? Date.now()).getTime();
  const until = new Date(Math.max(from + ACCESS_DAYS * 864e5, current === "free" ? 0 : new Date(e.expires_at ?? 0).getTime()));
  const { error: upError } = await db.from("enrollments").update({ plan, expires_at: until.toISOString(), status: "active" }).eq("id", enrollmentId);
  if (upError) throw upError;
  return plan;
}

// ---------- companies ----------

export type CompanyQuote = { seats: number; perLeader: number; setup: number; total: number };

/** The price of `seats` more leaders for an organization that already has `existing` (setup fee only on the first purchase). */
export function companyQuote(seats: number, existing: number, withSetup: boolean): CompanyQuote {
  const tier = companyTier(existing + seats);
  const setup = withSetup ? tier.setup : 0;
  return { seats, perLeader: tier.perLeader, setup, total: seats * tier.perLeader + setup };
}

/** A Stripe Checkout page for a company's first purchase ("initial") or for more seats ("seats"). Promotion codes are accepted. */
export async function companyCheckout(o: {
  kind: "initial" | "seats"; quote: CompanyQuote; orgName: string; email: string | null;
  metadata: Record<string, string>; successUrl: string; cancelUrl: string;
}) {
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
    quantity: o.quote.seats,
    price_data: {
      currency: "usd", unit_amount: o.quote.perLeader,
      product_data: { name: `Leading People for ${o.orgName}: leader seat`, description: "12 months of access for one leader" },
    },
  }];
  if (o.quote.setup) {
    items.push({ quantity: 1, price_data: { currency: "usd", unit_amount: o.quote.setup, product_data: { name: "Program setup and tailoring (one-time)" } } });
  }
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: items,
    allow_promotion_codes: true,
    ...(o.email ? { customer_email: o.email } : {}),
    metadata: { kind: o.kind, seats: String(o.quote.seats), ...o.metadata },
    payment_intent_data: { metadata: { kind: o.kind, ...o.metadata } },
    success_url: o.successUrl,
    cancel_url: o.cancelUrl,
  });
  if (!session.url) throw new Error("Stripe didn't return a checkout page");
  return session.url;
}

export type Fulfilled =
  | { kind: "individual"; plan: PaidPlan }
  | { kind: "initial"; orgName: string; email: string | null; invite: string; seats: number }
  | { kind: "seats"; orgName: string; seats: number; total: number | null };

/** Records a paid company Checkout Session once, and applies it. */
async function fulfillCompany(s: Stripe.Checkout.Session): Promise<Fulfilled | null> {
  const db = supabaseAdmin();
  const kind = s.metadata?.kind as "initial" | "seats";
  const seats = Number(s.metadata?.seats);
  let orgId = s.metadata?.org_id ?? null;
  const requestId = s.metadata?.request_id ?? null;
  if (kind === "initial" && requestId) {
    const { data } = await db.from("intake_requests").select("org_id").eq("id", requestId).maybeSingle();
    orgId = data?.org_id ?? null;
  }
  if (!orgId || !(seats > 0)) return null;

  const { data: inserted, error } = await db.from("org_payments").upsert({
    org_id: orgId, kind, seats, amount_cents: s.amount_total ?? 0, currency: s.currency ?? "usd", stripe_session_id: s.id,
    stripe_payment_intent: typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null,
    email: s.customer_details?.email ?? s.customer_email ?? null,
  }, { onConflict: "stripe_session_id", ignoreDuplicates: true }).select("id, created_at");
  if (error) throw error;
  const first = !!inserted?.length; // false when this payment was already recorded

  const { data: org } = await db.from("organizations").select("name, seats").eq("id", orgId).single();
  if (kind === "initial") {
    const { data: paid } = await db.from("org_payments").select("created_at").eq("stripe_session_id", s.id).single();
    const { invite } = await activateCompany(db, requestId!, seats, new Date(paid?.created_at ?? Date.now()));
    const { data: r } = await db.from("intake_requests").select("contact_email").eq("id", requestId!).maybeSingle();
    return { kind, orgName: org?.name ?? "", email: r?.contact_email ?? null, invite, seats };
  }
  let total = org?.seats ?? null;
  if (first && total !== null) {
    total += seats;
    const up = await db.from("organizations").update({ seats: total }).eq("id", orgId);
    if (up.error) throw up.error;
  }
  return { kind, orgName: org?.name ?? "", seats, total };
}

/** Records and applies any paid Checkout Session of ours: an individual plan or a company purchase. */
export async function fulfillSession(sessionId: string): Promise<Fulfilled | null> {
  const s = await stripe().checkout.sessions.retrieve(sessionId);
  if (s.payment_status !== "paid") return null;
  if (s.metadata?.kind === "initial" || s.metadata?.kind === "seats") return fulfillCompany(s);
  const plan = await fulfill(sessionId);
  return plan ? { kind: "individual", plan } : null;
}
