import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { PurchaseResult } from "./PurchaseResult";

export const metadata: Metadata = { title: "Purchase complete" };

// Public page (no sign-in needed): where Stripe sends buyers after paying.
export default function Page() {
  return (
    <>
      <Header />
      <div className="mhead"><div className="eyebrow">Your plan</div><h2>Purchase <em>complete</em></h2></div>
      <PurchaseResult />
    </>
  );
}
