// Stripe tells us here when a Checkout payment completes, so a plan unlocks even if the leader closes
// the tab before returning to the site. Only requests signed with our webhook secret are accepted.
import Stripe from "stripe";
import { fulfillSession, stripe } from "@/lib/billing";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  // Only our own checkouts carry an enrollment or a company purchase kind; anything else (e.g. a test event
  // from the Stripe dashboard) is acknowledged and ignored.
  const meta = event.type.startsWith("checkout.session.") ? (event.data.object as Stripe.Checkout.Session).metadata : null;
  if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && (meta?.enrollment_id || meta?.kind)) {
    try {
      await fulfillSession(event.data.object.id);
    } catch (err) {
      console.error("stripe fulfill failed", event.id, err);
      return new Response("Retry", { status: 500 }); // Stripe retries
    }
  }
  return new Response("ok");
}
