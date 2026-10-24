import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { IntakeForm } from "../IntakeForm";

export const metadata: Metadata = { title: "Start free" };

// Public page: the get-started form with "Just me" already chosen (linked from the home page).
export default function Page() {
  return (
    <>
      <Header />
      <div className="mhead"><div className="eyebrow">Start free</div><h2>Start your first <em>12 weeks</em></h2><div className="sub">Free preview, no card needed. Upgrade any time.</div></div>
      <section className="blk">
        <IntakeForm initialKind="individual" />
        <p className="note" style={{ marginTop: 24 }}>Already have an account? <Link href="/signin">Sign in</Link></p>
      </section>
    </>
  );
}
