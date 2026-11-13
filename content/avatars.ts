// Illustrated avatars for voice mode (components/Avatar): how each practice character looks. Looks are chosen by
// character name, like their voices (lib/voices.ts), so they stay the same in every organization's tailored
// program. A leader's own scenario uses the look that matches the voice they chose for it.
import type { Voice } from "./custom-practice";

export type HairStyle = "curls" | "bun" | "long" | "bob" | "short" | "crop" | "waves";
export type Look = {
  skin: string;
  hair: string;
  style: HairStyle;
  top: string;
  glasses?: boolean;
  beard?: boolean;
};

const BY_NAME: Record<string, Look> = {
  Tasha: { skin: "#8D5A3B", hair: "#1E1410", style: "curls", top: "#2E7D6B" },
  Marcus: { skin: "#6B4330", hair: "#16100C", style: "crop", top: "#34558B", beard: true },
  Jen: { skin: "#F1C9A5", hair: "#B5763A", style: "bob", top: "#8E4C7A", glasses: true },
  Priya: { skin: "#B7825C", hair: "#20140F", style: "long", top: "#C2562B" },
  Dana: { skin: "#E3B08C", hair: "#5A3A26", style: "bun", top: "#3D6E9E" },
  Leah: { skin: "#F4D2B8", hair: "#D9A55A", style: "waves", top: "#5C8A4A" },
};

const BY_VOICE: Record<Voice | "neutral", Look> = {
  female: { skin: "#C48B66", hair: "#2B1D16", style: "long", top: "#6D4C9C" },
  male: { skin: "#D9A47F", hair: "#3A2A20", style: "short", top: "#2F6F8F", glasses: true },
  neutral: { skin: "#B88160", hair: "#2E2420", style: "short", top: "#4D6A86" },
};

export function lookFor(who: string, opts: { custom: boolean; voice?: Voice | null }): Look {
  if (opts.custom) return BY_VOICE[opts.voice ?? "neutral"];
  return BY_NAME[who.trim().split(/\s+/)[0]] ?? BY_VOICE.neutral;
}
