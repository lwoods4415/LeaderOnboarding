"use client";
// Shown when a page outside the main app (sign-in, sign-in links) crashes.
import Link from "next/link";
import { useEffect } from "react";
import { Header } from "@/components/Header";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <>
      <Header />
      <section className="blk">
        <h3>Something went wrong</h3>
        <p className="lede">This page didn&apos;t load properly. Try again, or go back to sign in.</p>
        <div className="row">
          <button className="btn primary" onClick={() => retry()}>Try again</button>
          <Link className="btn" href="/signin">Sign in</Link>
        </div>
        {error.digest ? <p className="note" style={{ marginTop: 16 }}>If it keeps happening, tell your program leader and mention code {error.digest}.</p> : null}
      </section>
    </>
  );
}
