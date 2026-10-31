"use client";
// An individual leader's plan, and upgrading it with Stripe Checkout. Returning from Stripe with a
// session id confirms the payment and reloads the program with the new plan.
import { useEffect, useRef, useState } from "react";
import { confirmCheckout, getOffer, startCheckout, type Offer } from "@/app/(app)/upgrade/actions";
import { isIndividual, PLAN_FEATURES, PLAN_NAMES, type PaidPlan } from "@/lib/plans";
import { flushNow } from "@/lib/sync";
import { useProfile } from "../Account";
import { TailorForm } from "./TailorForm";

const dollars = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

export function Upgrade() {
  const profile = useProfile();
  const [offer, setOffer] = useState<Offer | null>(null);
  // Rendered only in the browser (after the account loads), so the address can be read straight away.
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(() =>
    new URLSearchParams(window.location.search).get("welcome") ? { ok: true, text: "Thank you! Your plan is active and everything it includes is open." } : null);
  const [busy, setBusy] = useState<PaidPlan | "confirm" | null>(null);
  const confirming = useRef(false);
  const eid = profile?.enrollmentId;

  useEffect(() => {
    if (!eid) return;
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (sessionId && !confirming.current) {
      confirming.current = true;
      void (async () => {
        setBusy("confirm");
        const r = await confirmCheckout(sessionId).catch(() => ({ ok: false, message: "Couldn't check your payment. Refresh the page." }));
        if (r.ok) {
          // Reload so the whole program opens up with the new plan.
          window.location.replace("/upgrade?welcome=1");
          return;
        }
        setMsg({ ok: false, text: r.message ?? "Couldn't check your payment." });
        setBusy(null);
        window.history.replaceState(null, "", "/upgrade");
      })();
    }
    if (new URLSearchParams(window.location.search).get("welcome")) window.history.replaceState(null, "", "/upgrade");
    getOffer(eid).then(setOffer, () => setMsg({ ok: false, text: "Couldn't load your plan. Refresh the page." }));
  }, [eid]);

  async function buy(plan: PaidPlan) {
    if (!eid) return;
    setBusy(plan);
    setMsg(null);
    await flushNow().catch(() => false); // save their work before leaving for Stripe
    const r = await startCheckout(eid, plan).catch(() => ({ message: "Couldn't start checkout. Try again." }) as { url?: string; message?: string });
    if (r.url) { window.location.assign(r.url); return; }
    setMsg({ ok: false, text: r.message ?? "Couldn't start checkout. Try again." });
    setBusy(null);
  }

  if (!profile) return null;
  if (!isIndividual(profile.plan)) {
    return <><div className="mhead"><h2>Your <em>plan</em></h2></div><p>Your access is provided by {profile.orgName}. Everything in the program is included.</p></>;
  }

  return (
    <>
      <div className="mhead"><div className="eyebrow">Your plan</div><h2>{PLAN_NAMES[offer?.plan ?? profile.plan]}</h2>
        <div className="sub">{profile.plan !== "free" && profile.expiresAt ? `Your access runs until ${date(profile.expiresAt)}` : "Upgrade any time for the full program"}</div></div>
      {msg ? <p className={msg.ok ? "msg-ok" : "msg-err"} role="status" style={{ marginBottom: 18 }}>{msg.text}</p> : null}
      {busy === "confirm" ? <p className="note">Confirming your payment…</p> : null}
      {eid ? <TailorForm enrollmentId={eid} /> : null}

      {!offer ? <p className="note">Loading…</p> : !offer.quotes.length ? (
        <section className="blk"><p>You have the most complete plan. Thank you!</p></section>
      ) : (
        <section className="blk">
          <div className="plans">
            {offer.quotes.map((q) => (
              <div className={`plan${q.plan === "complete" ? " featured" : ""}`} key={q.plan}>
                <h3>{q.name}</h3>
                <div className="price">{dollars(q.cents)}{q.cents < q.fullCents ? <small> (upgrade price)</small> : null}</div>
                {q.launch ? <p className="note">Launch price for the first 100 leaders: {offer.seatsLeft} left. Usually {dollars(14900)}.</p> : null}
                <ul className="plain">{PLAN_FEATURES[q.plan].map((f) => <li key={f}>{f}</li>)}</ul>
                <button className={`btn${q.plan === "complete" ? " primary" : ""}`} disabled={!!busy} onClick={() => buy(q.plan)}>
                  {busy === q.plan ? "Opening checkout…" : `Get ${q.name}`}
                </button>
              </div>
            ))}
          </div>
          <p className="note" style={{ marginTop: 16 }}>One-time payment for 12 months of access. No subscription. Payment is handled securely by Stripe. 30-day money-back guarantee: if it isn&apos;t right for you, let us know within 30 days for a full refund.</p>
        </section>
      )}
    </>
  );
}
