"use client";
// Share one reflection with the program leader, ported from the reference page's shareBar().
import { useState } from "react";
import { shareReflection, unshareReflection } from "@/lib/sharing";
import { useLeader } from "@/lib/store";

export function ShareBar({ id }: { id: string }) {
  const s = useLeader();
  const sh = s.shared.refl[id];
  const txt = (s.notes[id] ?? "").trim();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch {
      setError("That didn't go through. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (sh) {
    const stale = !!txt && txt !== sh.text;
    return (
      <>
        <span className="shared-on">Shared with your program leader on {sh.at}.{stale ? " You've edited it since." : ""}</span>
        {stale ? <button className="btn ghost" disabled={busy} onClick={() => run(() => shareReflection(id, txt))}>Update shared copy</button> : null}
        <button className="btn ghost" disabled={busy} onClick={() => run(() => unshareReflection(id))}>Stop sharing</button>
        {error ? <span className="msg-err">{error}</span> : null}
      </>
    );
  }
  return (
    <>
      <button className="btn ghost" disabled={!txt || busy} onClick={() => run(() => shareReflection(id, txt))}>Share with my program leader</button>
      {error ? <span className="msg-err">{error}</span> : null}
    </>
  );
}
