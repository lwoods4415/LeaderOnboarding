"use client";
// Phase 1: sharing needs an account, so the button shows but stays off until Phase 4.
import { useLeader } from "@/lib/store";

export function ShareBar({ id }: { id: string }) {
  const hasText = !!(useLeader().notes[id] ?? "").trim();
  return (
    <>
      <button className="btn ghost" disabled>Share with my program leader</button>
      {hasText ? <span className="note">Sharing turns on once sign-in is added.</span> : null}
    </>
  );
}
