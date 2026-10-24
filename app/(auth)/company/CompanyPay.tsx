"use client";
import { useEffect, useState } from "react";
import type { CompanyQuote } from "@/lib/billing";
import { COMPANY_MAX_SEATS, COMPANY_MIN_SEATS, COMPANY_TIER_TEXT } from "@/lib/plans";
import { getCompanyOffer, quoteFor, startCompanyPayment, type CompanyOffer } from "./actions";

const dollars = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: cents % 100 ? 2 : 0 })}`;

export function CompanyPay() {
  // Read once in the browser: this page is static, and the link's token only arrives in the address.
  const [token] = useState(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("t") ?? ""));
  const [offer, setOffer] = useState<CompanyOffer | null>(null);
  const [seats, setSeats] = useState("");
  const [quote, setQuote] = useState<CompanyQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    getCompanyOffer(token).then((o) => {
      if (!live) return;
      setOffer(o);
      if (o.state === "pay") setSeats(String(o.suggested));
    }, () => { if (live) setOffer({ state: "missing" }); });
    return () => { live = false; };
  }, [token]);

  useEffect(() => {
    let live = true;
    const n = Number(seats);
    (Number.isInteger(n) && n >= COMPANY_MIN_SEATS && n <= COMPANY_MAX_SEATS ? quoteFor(n) : Promise.resolve(null))
      .then((q) => { if (live) setQuote(q); }, () => {});
    return () => { live = false; };
  }, [seats]);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!quote) return;
    setBusy(true);
    setError("");
    const r = await startCompanyPayment(token, quote.seats).catch(() => ({ message: "Couldn't start checkout. Try again." }) as { url?: string; message?: string });
    if (r.url) { window.location.assign(r.url); return; }
    setError(r.message ?? "Couldn't start checkout. Try again.");
    setBusy(false);
  }

  if (!offer) return <p className="note">Loading…</p>;
  if (offer.state === "missing") {
    return <section className="blk"><p className="lede">This payment link isn&apos;t active. It may have been replaced, or the program may not be ready yet. Contact us for a new link.</p></section>;
  }
  if (offer.state === "live") {
    return <section className="blk"><p className="lede">{offer.orgName}&apos;s program is already live. Your program admin can sign in to invite leaders.</p></section>;
  }

  return (
    <section className="blk">
      <p className="lede">{offer.contactName ? `Hi ${offer.contactName.split(" ")[0]}, ` : ""}{offer.orgName}&apos;s tailored program is reviewed and ready. Choose how many leaders to enroll, then pay securely with Stripe. Your program goes live as soon as payment is complete, and you&apos;ll get an email invite to sign in as its admin.</p>
      <form className="signin intake" onSubmit={pay} style={{ marginTop: 18 }}>
        <label htmlFor="co-seats">Number of leaders
          <input type="text" inputMode="numeric" id="co-seats" value={seats} onChange={(e) => setSeats(e.target.value.replace(/\D/g, ""))} />
        </label>
        <p className="note">{COMPANY_TIER_TEXT} Each seat is 12 months of access for one leader. You can add seats later from your admin page.</p>
        {quote ? (
          <div className="checkin">
            <p>{quote.seats} leaders × {dollars(quote.perLeader)} = <b>{dollars(quote.seats * quote.perLeader)}</b></p>
            <p>One-time setup and tailoring: <b>{dollars(quote.setup)}</b></p>
            <p style={{ marginTop: 6, fontSize: "1.15rem" }}>Total: <b>{dollars(quote.total)}</b></p>
            <p className="note" style={{ marginTop: 6 }}>Have a promotion code? Enter it on the next page.</p>
          </div>
        ) : (
          <p className="msg-err">Choose between {COMPANY_MIN_SEATS} and {COMPANY_MAX_SEATS} leaders. For more than {COMPANY_MAX_SEATS}, contact us for custom pricing.</p>
        )}
        <div><button className="btn primary" disabled={!quote || busy}>{busy ? "Opening checkout…" : quote ? `Pay ${dollars(quote.total)}` : "Pay"}</button></div>
        {error ? <p className="msg-err" role="alert">{error}</p> : null}
      </form>
    </section>
  );
}
