"use client";
// Where sign-in and invite links land. The link carries the session in the URL fragment
// (or a one-time code when opened in the same browser); this stores it and goes to the program.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function Callback() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const db = supabaseBrowser();
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const code = new URLSearchParams(window.location.search).get("code");
    const access_token = hash.get("access_token"), refresh_token = hash.get("refresh_token");
    const done = (ok: boolean) => {
      // Take the tokens out of the address bar and browser history either way.
      window.history.replaceState(null, "", window.location.pathname);
      if (ok) router.replace("/");
      else setFailed(true);
    };
    (async () => {
      if (access_token && refresh_token) done(!(await db.auth.setSession({ access_token, refresh_token })).error);
      else if (code) done(!(await db.auth.exchangeCodeForSession(code)).error);
      else done(false);
    })();
  }, [router]);

  if (!failed) return <p className="note">Signing you in…</p>;
  return (
    <section className="blk">
      <h3>That link didn&apos;t work</h3>
      <p className="lede">Sign-in links work once and expire after an hour. Request a new one and use the newest email.</p>
      <Link className="btn primary" href="/signin">Get a new sign-in link</Link>
    </section>
  );
}
