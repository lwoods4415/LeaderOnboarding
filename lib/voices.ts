import "server-only";
// Voice mode: which ElevenLabs voice speaks for each practice character, and the voice model. Voices are
// chosen by character name, so they stay the same in every organization's tailored program. A leader's own
// scenario uses the default voice. Any of these can be changed with environment variables.

/** A fast, expressive real-time model (ElevenLabs docs, 2026-11). */
export const VOICE_MODEL = process.env.ELEVENLABS_MODEL || "eleven_v4_turbo";

/** Character name → ElevenLabs voice id. Filled in from the account's voices. */
const BY_NAME: Record<string, string> = {};

export const DEFAULT_VOICE = process.env.ELEVENLABS_DEFAULT_VOICE || "";

export function voiceFor(characterName: string): string | undefined {
  const name = characterName.trim().split(/\s+/)[0];
  const fromEnv = process.env[`ELEVENLABS_VOICE_${name.toUpperCase()}`];
  return fromEnv || BY_NAME[name] || DEFAULT_VOICE || undefined;
}

/** Characters spoken per leader per day (UTC), so costs stay predictable. */
export const SPEAK_CHARS_PER_DAY = Number(process.env.SPEAK_CHARS_PER_DAY) || 20000;
export const SPEAK_MAX_CHARS = 1500;
