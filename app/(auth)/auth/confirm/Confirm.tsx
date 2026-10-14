"use client";
// Where links in the custom sign-in and invite emails land (supabase/email-templates).
// Signing in waits for a click, because work email systems often open links to scan them,
// which would otherwise use up the one-time link before the leader gets to it.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";

const noop = () => () => {};

export function Confirm() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  const query = useSyncExternalStore(noop, () => window.location.search, () => "");
  const params = new URLSearchParams(query);
  const token_hash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  async function signIn() {
    if (!token_hash || !type) return setState("failed");
    setState("busy");
    const { error } = await supabaseBrowser().auth.verifyOtp({ token_hash, type });
    if (error) return setState("failed");
    router.replace("/");
  }

  if (state === "failed" || (query && (!token_hash || !type))) {
    return (
      <section className="blk">
        <h3>That link didn&apos;t work</h3>
        <p className="lede">Sign-in links work once and expire after an hour. Request a new one, or use the code from your email.</p>
        <Link className="btn primary" href="/signin">Go to sign in</Link>
      </section>
    );
  }
  return (
    <section className="blk">
      <h3>Sign in</h3>
      <p className="lede">Select the button to finish signing in.</p>
      <button className="btn primary" disabled={state === "busy" || !query} onClick={signIn}>{state === "busy" ? "Signing in…" : "Sign in"}</button>
    </section>
  );
}
