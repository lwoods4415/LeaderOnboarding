import "server-only";
// Voice mode: which ElevenLabs voice speaks for each practice character, and the voice model. Voices are
// chosen by character name, so they stay the same in every organization's tailored program. A leader's own
// scenario uses the default voice. Any of these can be changed with environment variables.

/** A fast, expressive real-time model (ElevenLabs docs, 2026-11). */
export const VOICE_MODEL = process.env.ELEVENLABS_MODEL || "eleven_v4_turbo";

/** Character name → ElevenLabs voice id (premade voices, chosen 2026-11-03). */
const BY_NAME: Record<string, string> = {
  Tasha: "EXAVITQu4vr4xnSDxMaL", // Sarah: mature, reassuring, confident
  Marcus: "iP95p4xoKVk53GoZ742B", // Chris: charming, down-to-earth
  Jen: "XrExE9yKIg1WjnnlVkGX", // Matilda: knowledgeable, professional
  Priya: "cgSgspJ2msm6clMCkdW9", // Jessica: bright, warm
  Dana: "hpp4J3VqNfWAUOO0d1Us", // Bella: professional, warm
  Leah: "FGY2WhTYpPnrIDTdsKH5", // Laura: enthusiastic
};

/** For a leader's own scenario, until they can pick a voice: River (relaxed, neutral). */
export const DEFAULT_VOICE = process.env.ELEVENLABS_DEFAULT_VOICE || "SAz9YHcvj6GT2YYXdXww";
/** For a leader's own scenario once "Their voice: female / male" is added. */
export const VOICE_BY_GENDER = { female: "XrExE9yKIg1WjnnlVkGX", male: "cjVigY5qzO86Huf0OWal" } as const; // Matilda, Eric

export function voiceFor(characterName: string): string | undefined {
  const name = characterName.trim().split(/\s+/)[0];
  const fromEnv = process.env[`ELEVENLABS_VOICE_${name.toUpperCase()}`];
  return fromEnv || BY_NAME[name] || DEFAULT_VOICE || undefined;
}

/** Characters spoken per leader per day (UTC), so costs stay predictable. */
export const SPEAK_CHARS_PER_DAY = Number(process.env.SPEAK_CHARS_PER_DAY) || 20000;
export const SPEAK_MAX_CHARS = 1500;
