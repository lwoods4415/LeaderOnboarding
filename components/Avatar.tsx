"use client";
// An illustrated practice character for voice mode, in a soft 3D-animated style. Drawn in the browser (no avatar
// service, no running cost): the mouth follows the loudness of the character's voice as it plays, the eyes blink,
// and the character glances up while thinking. Looks come from content/avatars.ts.
import { useEffect, useId, useRef } from "react";
import type { Look } from "@/content/avatars";

export type AvatarPhase = "idle" | "listening" | "thinking" | "speaking";

// Blend two hex colors; t = 0 gives a, t = 1 gives b.
function blend(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
const light = (c: string, t: number) => blend(c, "#ffffff", t);
const dark = (c: string, t: number) => blend(c, "#000000", t);

function HairBack({ look, fill }: { look: Look; fill: string }) {
  switch (look.style) {
    case "long":
      return <path fill={fill} d="M36 50C34 28 46 21 60 21s26 7 24 29l3 44c-8 5-17 4-21-1H54c-4 5-13 6-21 1z" />;
    case "waves":
      return <path fill={fill} d="M36 50C34 28 46 21 60 21s26 7 24 29l2 32c-3 4-7 2-9 6-3-4-8-2-9 2H52c-1-4-6-6-9-2-2-4-6-2-9-6z" />;
    case "bob":
      return <path fill={fill} d="M37 52C35 30 46 23 60 23s25 7 23 29l1 22c-6 3-12 2-14-2H50c-2 4-8 5-14 2z" />;
    case "bun":
      return <circle fill={fill} cx="60" cy="21" r="10" />;
    case "curls":
      return (
        <g fill={fill}>
          {[[40, 40], [47, 28], [60, 23], [73, 28], [80, 40], [84, 53], [36, 53], [38, 66], [82, 66]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="10" />)}
        </g>
      );
    default:
      return null;
  }
}

function HairFront({ look, fill }: { look: Look; fill: string }) {
  switch (look.style) {
    case "curls":
      return (
        <g fill={fill}>
          {[[45, 35], [54, 30], [64, 29], [73, 33], [79, 41], [41, 43]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7.5" />)}
        </g>
      );
    case "crop":
      return <path fill={fill} d="M40 45c2-13 10-18 20-18s18 5 20 18c-6-7-13-10-20-10s-14 3-20 10z" />;
    case "short":
      return <path fill={fill} d="M39 50c-1-18 9-24 21-24s22 6 21 24c-3-8-8-12-14-13-7 4-17 5-28 13z" />;
    default: // long, waves, bob, bun: a side part
      return <path fill={fill} d="M39 52c-2-21 9-27 22-27s22 8 20 27c-3-10-9-16-17-17-6 5-16 7-25 17z" />;
  }
}

// Where light catches the hair.
const SHEEN: Record<Look["style"], string> = {
  curls: "M48 29q8-4 16-2",
  crop: "M50 32q8-3 16 0",
  short: "M48 31q9-4 18-1",
  long: "M47 31q8-4 16-3",
  waves: "M47 31q8-4 16-3",
  bob: "M47 31q8-4 16-3",
  bun: "M47 31q8-4 16-3",
};

export function Avatar({ look, phase, name, level }: {
  look: Look; phase: AvatarPhase; name: string;
  /** While speaking: the voice's current loudness, 0 to 1. */
  level?: () => number;
}) {
  const id = useId();
  const ref = (n: string) => `${id}-${n}`;
  const url = (n: string) => `url(#${ref(n)})`;
  const mouth = useRef<SVGEllipseElement>(null);

  // Move the mouth with the voice, frame by frame, without re-rendering.
  useEffect(() => {
    const m = mouth.current;
    if (!m) return;
    if (phase !== "speaking" || !level) { m.setAttribute("ry", "0"); return; }
    let smooth = 0, frame = 0;
    const step = () => {
      smooth = smooth * 0.45 + level() * 0.55;
      m.setAttribute("ry", (0.8 + smooth * 5.2).toFixed(2));
      m.setAttribute("rx", (3.8 + smooth * 1.6).toFixed(2));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); m.setAttribute("ry", "0"); };
  }, [phase, level]);

  const { skin, hair, top } = look;
  const iris = look.eyes ?? "#5A3B28";
  const lip = blend(skin, "#A8434B", 0.5);
  const lash = dark(hair, 0.35);
  // A bigger head on a smaller body, like an animated film character.
  const head = "translate(60 58) scale(1.1) translate(-60 -58)";

  return (
    <svg className={`avatar ${phase}`} viewBox="0 0 120 120" role="img" aria-label={`${name}, your practice partner`}>
      <defs>
        <clipPath id={ref("clip")}><circle cx="60" cy="60" r="56" /></clipPath>
        <radialGradient id={ref("glow")} cx="50%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ref("face")} cx="42%" cy="34%" r="72%">
          <stop offset="0" stopColor={light(skin, 0.16)} />
          <stop offset=".55" stopColor={skin} />
          <stop offset="1" stopColor={dark(skin, 0.2)} />
        </radialGradient>
        <linearGradient id={ref("neck")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dark(skin, 0.28)} />
          <stop offset=".6" stopColor={dark(skin, 0.08)} />
        </linearGradient>
        <linearGradient id={ref("hair")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light(hair, 0.2)} />
          <stop offset=".5" stopColor={hair} />
          <stop offset="1" stopColor={dark(hair, 0.3)} />
        </linearGradient>
        <linearGradient id={ref("top")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light(top, 0.18)} />
          <stop offset="1" stopColor={dark(top, 0.25)} />
        </linearGradient>
        <radialGradient id={ref("blush")}>
          <stop offset="0" stopColor="#F07A6A" stopOpacity=".38" />
          <stop offset="1" stopColor="#F07A6A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ref("iris")} cx="50%" cy="65%" r="60%">
          <stop offset="0" stopColor={light(iris, 0.35)} />
          <stop offset="1" stopColor={dark(iris, 0.3)} />
        </radialGradient>
        <radialGradient id={ref("mouth")} cx="50%" cy="85%" r="70%">
          <stop offset="0" stopColor="#C2525A" />
          <stop offset=".45" stopColor="#6A2026" />
          <stop offset="1" stopColor="#3A0F12" />
        </radialGradient>
      </defs>
      <circle className="avatar-ring" cx="60" cy="60" r="58" />
      <g clipPath={url("clip")}>
        <circle cx="60" cy="60" r="56" className="avatar-bg" />
        <circle cx="60" cy="60" r="56" fill={url("glow")} />
        <g className="avatar-body">
          <g transform={head}><HairBack look={look} fill={url("hair")} /></g>
          <path fill={url("top")} d="M20 124c2-22 18-33 40-33s38 11 40 33z" />
          <path fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round" d="M53 92l7 8 7-8" />
          <rect fill={url("neck")} x="53" y="70" width="14" height="24" rx="6" />
          <g transform={head}>
            <ellipse fill={skin} cx="38.5" cy="56" rx="4" ry="5.5" />
            <ellipse fill={skin} cx="81.5" cy="56" rx="4" ry="5.5" />
            <ellipse fill={dark(skin, 0.18)} cx="38.8" cy="56.3" rx="2" ry="3.2" />
            <ellipse fill={dark(skin, 0.18)} cx="81.2" cy="56.3" rx="2" ry="3.2" />
            <ellipse fill={url("face")} cx="60" cy="54" rx="21.5" ry="24.5" />
            <ellipse cx="46" cy="64" rx="5.5" ry="4" fill={url("blush")} />
            <ellipse cx="74" cy="64" rx="5.5" ry="4" fill={url("blush")} />
            {look.beard ? <path fill={url("hair")} opacity=".92" d="M40 57c1 18 11 25 20 25s19-7 20-25c-4 8-10 12-20 12s-16-4-20-12z" /> : null}
            {/* Nose: a soft shadow and a highlight. */}
            <path fill="none" stroke={dark(skin, 0.32)} strokeOpacity=".55" strokeWidth="1.3" strokeLinecap="round" d="M57.6 62.2q2.4 1.6 4.8 0" />
            <ellipse cx="60.6" cy="59" rx="1.3" ry="2.4" fill="#fff" opacity=".28" />
            <g className="avatar-brows">
              <path fill="none" stroke={dark(hair, 0.1)} strokeWidth="2.4" strokeLinecap="round" d="M45.5 45.5q5.5-2.6 10.5-.4M64 45.1q5-2.2 10.5.4" />
            </g>
            <g className="avatar-eyes">
              {[51.5, 68.5].map((x) => (
                <g key={x}>
                  <ellipse cx={x} cy="54" rx="5.4" ry="6" fill="#FCFBF8" />
                  <g className="avatar-gaze">
                    <circle cx={x} cy="54.6" r="3.9" fill={url("iris")} />
                    <circle cx={x} cy="54.8" r="2" fill="#120C0A" />
                    <circle cx={x - 1.4} cy="53" r="1.25" fill="#fff" />
                    <circle cx={x + 1.3} cy="56.3" r=".55" fill="#fff" opacity=".85" />
                  </g>
                  <path fill="none" stroke={lash} strokeWidth="1.5" strokeLinecap="round" d={`M${x - 5.6} 53.4q5.6-7.4 11.2 0`} />
                </g>
              ))}
            </g>
            {look.glasses ? (
              <g fill="none" stroke="#2A2A2A" strokeWidth="1.5">
                <rect x="44.3" y="47" width="14.4" height="13.6" rx="5" fill="#fff" fillOpacity=".08" />
                <rect x="61.3" y="47" width="14.4" height="13.6" rx="5" fill="#fff" fillOpacity=".08" />
                <path d="M58.7 52.5q1.3-1 2.6 0" />
              </g>
            ) : null}
            <path className="avatar-smile" fill="none" stroke={dark(lip, 0.25)} strokeWidth="2" strokeLinecap="round" d="M53.5 67.5q6.5 4.6 13 0" />
            <ellipse ref={mouth} className="avatar-mouth" cx="60" cy="69" rx="3.8" ry="0" fill={url("mouth")} stroke={dark(lip, 0.1)} strokeWidth=".8" />
            <HairFront look={look} fill={url("hair")} />
            <path fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="2.6" strokeLinecap="round" d={SHEEN[look.style]} />
          </g>
        </g>
      </g>
    </svg>
  );
}
