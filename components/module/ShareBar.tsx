"use client";
// Sharing is switched on in Phase 4; until then the button shows but stays off.
import { useLeader } from "@/lib/store";

export function ShareBar({ id }: { id: string }) {
  const hasText = !!(useLeader().notes[id] ?? "").trim();
  return (
    <>
      <button className="btn ghost" disabled>Share with my program leader</button>
      {hasText ? <span className="note">Sharing with your program leader is coming soon.</span> : null}
    </>
  );
}
