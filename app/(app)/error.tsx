"use client";
// Shown in place of a page that crashed, keeping the header and menu so the leader can carry on.
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <>
      <div className="mhead"><h2>Something went <em>wrong</em></h2><div className="sub">This page didn&apos;t load properly.</div></div>
      <p className="lede" style={{ maxWidth: "60ch", marginBottom: 20 }}>Your progress is safe. Everything you&apos;ve entered is saved on this device and to your account. Try again, or go back to the overview.</p>
      <div className="row">
        <button className="btn primary" onClick={() => retry()}>Try again</button>
        <Link className="btn" href="/">Program overview</Link>
      </div>
      {error.digest ? <p className="note" style={{ marginTop: 16 }}>If it keeps happening, tell your program leader and mention code {error.digest}.</p> : null}
    </>
  );
}
