"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { requestSignInLink } from "./actions";

type State = "idle" | "sending" | "sent" | "busy" | "failed";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const router = useRouter();

  // A sign-in link that lands here (e.g. an invite sent from the Supabase dashboard) still signs in.
  useEffect(() => {
    if (window.location.hash.includes("access_token=")) router.replace("/auth/callback" + window.location.hash);
  }, [router]);
  // The page is static, so the "?error=link" from a used or expired link is read in the browser.
  const linkError = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("error") === "link",
    () => false,
  );

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    try {
      setState(await requestSignInLink(email));
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <div className="checkin">
        <h3>Check your email</h3>
        <p>If <b>{email.trim()}</b> has been invited, a sign-in link is on its way. It can take a minute, so check your spam folder too. The link works once and expires after an hour.</p>
        <CodeForm email={email.trim()} />
        <p style={{ marginTop: 10 }}><button className="linkbtn" onClick={() => setState("idle")}>Use a different email</button></p>
      </div>
    );
  }
  return (
    <form className="signin" onSubmit={send}>
      {linkError ? <p className="msg-err">That sign-in link has expired or was already used. Enter your email to get a new one.</p> : null}
      <label htmlFor="email">Email address
        <input type="email" id="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <div><button className="btn primary" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email me a sign-in link"}</button></div>
      {state === "busy" ? <p className="msg-err">Too many sign-in emails were sent in a short time. Wait a few minutes and try again.</p> : null}
      {state === "failed" ? <p className="msg-err">Something went wrong sending the link. Check your connection and try again.</p> : null}
    </form>
  );
}

/** Sign in with the code from the email instead of the link (handy when the link opens on another device). */
function CodeForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return setState("failed");
    setState("busy");
    const { error } = await supabaseBrowser().auth.verifyOtp({ email, token, type: "email" });
    if (error) return setState("failed");
    router.replace("/");
  }

  return (
    <form className="signin" onSubmit={verify} style={{ marginTop: 14 }}>
      <label htmlFor="code">Or, if your email has a sign-in code, enter it here
        <input type="text" id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
      </label>
      <div><button className="btn" disabled={state === "busy"}>{state === "busy" ? "Checking…" : "Sign in with code"}</button></div>
      {state === "failed" ? <p className="msg-err">That code didn&apos;t work. Check it and try again, or use the newest email.</p> : null}
    </form>
  );
}
