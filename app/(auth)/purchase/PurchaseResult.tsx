"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { CodeForm } from "../signin/SignInForm";
import { confirmPurchase, sendPurchaseSignIn, type Purchase } from "./actions";

const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

export function PurchaseResult() {
  const [result, setResult] = useState<Purchase | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [link, setLink] = useState<"idle" | "sending" | "sent" | "busy" | "failed">("idle");
  // Read once in the browser: this page is static, and the session id only arrives in the address.
  const [sessionId] = useState(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("session_id") ?? ""));

  useEffect(() => {
    let live = true;
    confirmPurchase(sessionId).then(
      (r) => { if (live) setResult(r); },
      () => { if (live) setResult({ ok: false, message: "Your payment is safe, but we couldn't check it just now. Refresh the page in a minute." }); },
    );
    supabaseBrowser().auth.getUser().then((r: { data: { user: unknown } }) => { if (live) setSignedIn(!!r.data.user); }, () => { if (live) setSignedIn(false); });
    return () => { live = false; };
  }, [sessionId]);

  if (!result) return <p className="note">Confirming your payment…</p>;
  if (!result.ok) {
    return (
      <section className="blk">
        <h3>We couldn&apos;t confirm this purchase</h3>
        <p className="lede">{result.message}</p>
        <Link className="btn" href="/">Go to my program</Link>
      </section>
    );
  }

  return (
    <section className="blk">
      <div className="checkin">
        <h3>Thank you! Your purchase is complete</h3>
        <p><b>{result.plan}</b> is active{result.email ? <> for <b>{result.email}</b></> : null}{result.until ? <>, with access until <b>{date(result.until)}</b></> : null}. Stripe will email your receipt.</p>
      </div>

      {signedIn ? (
        <p style={{ marginTop: 18 }}><Link className="btn primary" href="/">Go to my program</Link></p>
      ) : signedIn === false ? (
        <div style={{ marginTop: 18 }}>
          <p>Sign in to open your program. We&apos;ll email a link and a code to <b>{result.email}</b>.</p>
          {link === "sent" ? (
            <>
              <p className="msg-ok">Sent. Check your email (and spam folder). Select the link, or enter the code below.</p>
              <CodeForm email={result.email} />
            </>
          ) : (
            <p>
              <button className="btn primary" disabled={link === "sending"} onClick={async () => {
                setLink("sending");
                setLink(await sendPurchaseSignIn(sessionId).catch(() => "failed" as const));
              }}>{link === "sending" ? "Sending…" : "Email me a sign-in link"}</button>
            </p>
          )}
          {link === "busy" ? <p className="msg-err">Too many emails were sent in a short time. Wait a few minutes and try again.</p> : null}
          {link === "failed" ? <p className="msg-err">Couldn&apos;t send the email. Try again, or use <Link href="/signin">Sign in</Link>.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
