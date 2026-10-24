"use server";
// The company payment page, reached by the private link the platform owner sends after approving their
// program. The link's token is the only key; prices are always worked out here.
import { companyCheckout, companyQuote, type CompanyQuote } from "@/lib/billing";
import { payLink, siteUrl } from "@/lib/companies";
import { COMPANY_MAX_SEATS, COMPANY_MIN_SEATS, seatsFromAnswer } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type CompanyOffer =
  | { state: "pay"; orgName: string; contactName: string | null; suggested: number }
  | { state: "live"; orgName: string }
  | { state: "missing" };

const TOKEN = /^[A-Za-z0-9_-]{20,64}$/;

async function requestFor(token: string) {
  if (typeof token !== "string" || !TOKEN.test(token)) return null;
  const { data } = await supabaseAdmin().from("intake_requests")
    .select("id, org_name, contact_name, contact_email, status, answers").eq("pay_token", token).maybeSingle();
  return data as { id: string; org_name: string | null; contact_name: string | null; contact_email: string | null; status: string; answers: Record<string, string> } | null;
}

export async function getCompanyOffer(token: string): Promise<CompanyOffer> {
  const r = await requestFor(token);
  if (!r?.org_name) return { state: "missing" };
  if (r.status === "approved") return { state: "live", orgName: r.org_name };
  if (r.status !== "awaiting_payment") return { state: "missing" };
  return { state: "pay", orgName: r.org_name, contactName: r.contact_name, suggested: seatsFromAnswer(r.answers?.leaders) };
}

export async function quoteFor(seats: number): Promise<CompanyQuote | null> {
  if (!Number.isInteger(seats) || seats < COMPANY_MIN_SEATS || seats > COMPANY_MAX_SEATS) return null;
  return companyQuote(seats, 0, true);
}

export async function startCompanyPayment(token: string, seats: number): Promise<{ url?: string; message?: string }> {
  try {
    const r = await requestFor(token);
    if (!r?.org_name || r.status !== "awaiting_payment") return { message: "This payment link isn't active. Contact us for a new one." };
    const quote = await quoteFor(seats);
    if (!quote) return { message: `Choose between ${COMPANY_MIN_SEATS} and ${COMPANY_MAX_SEATS} leaders. For more, contact us for custom pricing.` };
    const url = await companyCheckout({
      kind: "initial", quote, orgName: r.org_name, email: r.contact_email,
      metadata: { request_id: r.id },
      successUrl: `${siteUrl()}/purchase?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: payLink(token),
    });
    return { url };
  } catch (err) {
    console.error("company checkout failed", err);
    return { message: "Couldn't start checkout. Try again, or contact us." };
  }
}
