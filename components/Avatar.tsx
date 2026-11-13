"use client";
// An illustrated practice character for voice mode. Drawn in the browser (no avatar service, no running cost):
// the mouth follows the loudness of the character's voice as it plays, the eyes blink, and the character looks
// up while thinking. Looks come from content/avatars.ts.
import { useEffect, useId, useRef } from "react";
import type { Look } from "@/content/avatars";

export type AvatarPhase = "idle" | "listening" | "thinking" | "speaking";

function HairBack({ look }: { look: Look }) {
  const f = look.hair;
  switch (look.style) {
    case "long":
      return <path fill={f} d="M36 50C34 28 46 21 60 21s26 7 24 29l3 44c-8 5-17 4-21-1H54c-4 5-13 6-21 1z" />;
    case "waves":
      return <path fill={f} d="M36 50C34 28 46 21 60 21s26 7 24 29l2 32c-3 4-7 2-9 6-3-4-8-2-9 2H52c-1-4-6-6-9-2-2-4-6-2-9-6z" />;
    case "bob":
      return <path fill={f} d="M37 52C35 30 46 23 60 23s25 7 23 29l1 22c-6 3-12 2-14-2H50c-2 4-8 5-14 2z" />;
    case "bun":
      return <circle fill={f} cx="60" cy="21" r="10" />;
    case "curls":
      return (
        <g fill={f}>
          {[[40, 40], [47, 28], [60, 23], [73, 28], [80, 40], [84, 53], [36, 53], [38, 66], [82, 66]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="10" />)}
        </g>
      );
    default:
      return null;
  }
}

function HairFront({ look }: { look: Look }) {
  const f = look.hair;
  switch (look.style) {
    case "curls":
      return (
        <g fill={f}>
          {[[45, 35], [54, 30], [64, 29], [73, 33], [79, 41], [41, 43]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7.5" />)}
        </g>
      );
    case "crop":
      return <path fill={f} d="M40 45c2-13 10-18 20-18s18 5 20 18c-6-7-13-10-20-10s-14 3-20 10z" />;
    case "short":
      return <path fill={f} d="M39 50c-1-18 9-24 21-24s22 6 21 24c-3-8-8-12-14-13-7 4-17 5-28 13z" />;
    default: // long, waves, bob, bun: a side part
      return <path fill={f} d="M39 52c-2-21 9-27 22-27s22 8 20 27c-3-10-9-16-17-17-6 5-16 7-25 17z" />;
  }
}

export function Avatar({ look, phase, name, level }: {
  look: Look; phase: AvatarPhase; name: string;
  /** While speaking: the voice's current loudness, 0 to 1. */
  level?: () => number;
}) {
  const clip = useId();
  const mouth = useRef<SVGEllipseElement>(null);

  // Move the mouth with the voice, frame by frame, without re-rendering.
  useEffect(() => {
    const m = mouth.current;
    if (!m) return;
    if (phase !== "speaking" || !level) { m.setAttribute("ry", "0"); return; }
    let smooth = 0, frame = 0;
    const step = () => {
      smooth = smooth * 0.45 + level() * 0.55;
      m.setAttribute("ry", (0.8 + smooth * 6).toFixed(2));
      m.setAttribute("rx", (4.2 + smooth * 1.8).toFixed(2));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); m.setAttribute("ry", "0"); };
  }, [phase, level]);

  return (
    <svg className={`avatar ${phase}`} viewBox="0 0 120 120" role="img" aria-label={`${name}, your practice partner`}>
      <defs><clipPath id={clip}><circle cx="60" cy="60" r="56" /></clipPath></defs>
      <circle className="avatar-ring" cx="60" cy="60" r="58" />
      <g clipPath={`url(#${clip})`}>
        <circle cx="60" cy="60" r="56" className="avatar-bg" />
        <g className="avatar-body">
          <HairBack look={look} />
          <path fill={look.top} d="M16 122c2-24 20-36 44-36s42 12 44 36z" />
          <path fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2" d="M52 87l8 9 8-9" />
          <rect fill={look.skin} x="52" y="68" width="16" height="19" rx="6" />
          <ellipse fill={look.skin} cx="39" cy="55" rx="3.5" ry="5" />
          <ellipse fill={look.skin} cx="81" cy="55" rx="3.5" ry="5" />
          <ellipse fill={look.skin} cx="60" cy="53" rx="21" ry="25" />
          {look.beard ? <path fill={look.hair} opacity=".9" d="M40 57c1 18 11 25 20 25s19-7 20-25c-4 8-10 12-20 12s-16-4-20-12z" /> : null}
          <circle cx="48" cy="62" r="3.5" fill="#E06B5A" opacity=".18" />
          <circle cx="72" cy="62" r="3.5" fill="#E06B5A" opacity=".18" />
          <path fill="none" stroke="#000" strokeOpacity=".22" strokeWidth="1.4" strokeLinecap="round" d="M60 55q-2 6 .5 7" />
          <g className="avatar-gaze">
            <path fill="none" stroke={look.hair} strokeWidth="2.2" strokeLinecap="round" d="M47 46q5-2 9 0M64 46q5-2 9 0" />
            <g className="avatar-eyes">
              <ellipse cx="52" cy="53" rx="2.4" ry="2.9" fill="#1D1612" />
              <ellipse cx="68" cy="53" rx="2.4" ry="2.9" fill="#1D1612" />
            </g>
          </g>
          {look.glasses ? (
            <g fill="none" stroke="#2A2A2A" strokeWidth="1.6">
              <rect x="45.5" y="48.5" width="13" height="10" rx="3.5" />
              <rect x="61.5" y="48.5" width="13" height="10" rx="3.5" />
              <path d="M58.5 53h3" />
            </g>
          ) : null}
          <path className="avatar-smile" fill="none" stroke="#6B2B2B" strokeWidth="2" strokeLinecap="round" d="M54 67q6 4 12 0" />
          <ellipse ref={mouth} className="avatar-mouth" cx="60" cy="68.5" rx="4.2" ry="0" fill="#5A1F22" />
          <HairFront look={look} />
        </g>
      </g>
    </svg>
  );
}
