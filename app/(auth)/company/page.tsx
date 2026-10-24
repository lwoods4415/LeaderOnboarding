import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { CompanyPay } from "./CompanyPay";

export const metadata: Metadata = { title: "Activate your program", robots: { index: false } };

// Public page, reached only through the private payment link sent after a company's program is approved.
export default function Page() {
  return (
    <>
      <Header />
      <div className="mhead"><div className="eyebrow">For your organization</div><h2>Activate your <em>program</em></h2></div>
      <CompanyPay />
    </>
  );
}
