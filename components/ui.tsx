"use client";
// Small building blocks shared across pages, ported from the reference page's helpers.
import type { Rating } from "@/content";
import { raw } from "@/lib/html";
import { update, useLeader } from "@/lib/store";

export const RATING: Record<Rating, [string, string]> = {
  strong: ["Strong move", "good"],
  partial: ["Partly works", "mid"],
  risky: ["Risky", "bad"],
};

export function RateChip({ r }: { r: Rating }) {
  return <span className={`rate ${RATING[r][1]}`}>{RATING[r][0]}</span>;
}

export function Ring({ pct }: { pct: number }) {
  const r = 15.5, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return (
    <svg className="ring" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--good)" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 18 18)" />
    </svg>
  );
}

export function CheckRow({ id, t, s }: { id: string; t: string; s?: string }) {
  const done = !!useLeader().checks[id];
  return (
    <label className={`check ${done ? "done" : ""}`}>
      <input type="checkbox" checked={done} onChange={(e) => { const v = e.target.checked; update((d) => { d.checks[id] = v; }); }} />
      <span {...raw(t + (s ? `<small>${s}</small>` : ""))} />
    </label>
  );
}

/** Copy button for a block of text, with the reference page's select-to-copy fallback. */
export function CopyButton({ text, targetId }: { text: string; targetId: string }) {
  const say = (msg: string) => { const el = document.getElementById("copy-" + targetId); if (el) el.textContent = msg; };
  const fallback = () => {
    const el = document.getElementById("out-" + targetId);
    if (!el) return;
    el.classList.remove("sr");
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    say("Selected. Press Ctrl+C or Cmd+C to copy.");
  };
  const copy = () => { try { navigator.clipboard.writeText(text).then(() => say("Copied."), fallback); } catch { fallback(); } };
  return (
    <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <button className="btn" onClick={copy}>{targetId === "pulse" ? "Copy the survey" : "Copy"}</button>
      <span className="note" id={"copy-" + targetId} role="status" />
    </div>
  );
}
