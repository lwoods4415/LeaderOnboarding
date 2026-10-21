import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { IntakeForm } from "./IntakeForm";

export const metadata: Metadata = { title: "Get started" };

// Submitting starts a tailored draft in the background, which can take a couple of minutes.
export const maxDuration = 300;

// Public page (no sign-in needed).
export default function Page() {
  return (
    <>
      <Header />
      <div className="mhead"><div className="eyebrow">Get started</div><h2>Tell us about your <em>leaders</em></h2><div className="sub">About 5 minutes. We tailor the program to your team&apos;s world.</div></div>
      <section className="blk">
        <p className="lede">Answer a few questions about your team and your new leaders. We use your answers to adapt the program&apos;s scenarios, practice conversations and examples to your setting. The leadership skills and research stay the same. Every tailored program is reviewed by a person before it goes live, and we&apos;ll be in touch by email.</p>
        <IntakeForm />
        <p className="note" style={{ marginTop: 24 }}>We use your answers only to tailor your program and to contact you about it. They&apos;re sent to Claude (Anthropic&apos;s AI) to draft the tailored version. Please don&apos;t include real customer, patient or employee details. Already have an account? <Link href="/signin">Sign in</Link></p>
      </section>
    </>
  );
}
