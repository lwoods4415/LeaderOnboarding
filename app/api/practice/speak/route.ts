// Voice mode: speaks the practice partner's reply aloud with ElevenLabs and streams the audio back.
// Only the character's reply text is sent to ElevenLabs, never the leader's own words, name or email.
// The leader and their enrollment are checked as for the practice partner, with a daily character limit.
import { CUSTOM_PREFIX, isCustomId } from "@/content/custom-practice";
import type { ProgramContent } from "@/content/program";
import { currentLeader, fail } from "@/lib/practice";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { SPEAK_CHARS_PER_DAY, SPEAK_MAX_CHARS, VOICE_MODEL, customVoice, voiceFor } from "@/lib/voices";

export async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return fail(503, "Voice mode isn't set up yet. Use the microphone or type instead.");
  const userId = await currentLeader();
  if (!userId) return fail(401, "Your sign-in has expired. Sign in again, then try again.");

  const b = (await request.json().catch(() => null)) as { enrollmentId?: unknown; roleplayId?: unknown; text?: unknown } | null;
  if (typeof b?.enrollmentId !== "string" || typeof b.roleplayId !== "string" || typeof b.text !== "string") return fail(400, "Nothing to say.");
  // Stage directions (*pauses*) stay on screen; only the character's words are spoken.
  const text = b.text.replace(/\*[^*]*\*/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return new Response(null, { status: 204 });
  if (text.length > SPEAK_MAX_CHARS) return fail(400, "That reply is too long to read aloud.");

  // The enrollment must be the caller's own active one (checked as the caller, under row-level security).
  const supabase = await supabaseServer();
  const [{ data: e }, { data: active }] = await Promise.all([
    supabase.from("enrollments").select("id, org_id, org_program_id").eq("id", b.enrollmentId).eq("user_id", userId).maybeSingle(),
    supabase.rpc("owns_active_enrollment", { eid: b.enrollmentId }),
  ]);
  if (!e || !active) return fail(403, "Your access to this program isn't active.");

  // A built-in character's name picks their voice; a leader's own scenario uses the voice they chose.
  let voice: string | undefined;
  if (isCustomId(b.roleplayId)) {
    const { data: c } = await supabase.from("custom_scenarios").select("voice").eq("id", b.roleplayId.slice(CUSTOM_PREFIX.length)).eq("enrollment_id", e.id).maybeSingle();
    if (!c) return fail(404, "That practice conversation wasn't found.");
    voice = customVoice(c.voice);
  } else {
    const { data: op } = await supabaseAdmin().from("org_programs").select("content").eq("id", e.org_program_id).maybeSingle();
    const who = (op?.content as ProgramContent | undefined)?.roleplays.find((r) => r.id === b.roleplayId)?.who;
    if (who === undefined) return fail(404, "That practice conversation wasn't found.");
    voice = voiceFor(who);
  }
  if (!voice) return fail(503, "Voice mode isn't set up yet. Use the microphone or type instead.");

  // Daily limit, counted in characters spoken.
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { data: used } = await supabaseAdmin().from("usage_log").select("input_tokens").eq("user_id", userId).eq("route", "speak").gte("created_at", since.toISOString());
  const today = (used ?? []).reduce((s, r) => s + (r.input_tokens ?? 0), 0);
  if (today + text.length > SPEAK_CHARS_PER_DAY) return fail(429, "You've reached today's limit for voice mode. It resets tomorrow. You can keep practicing with the microphone or by typing.");

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/stream?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: VOICE_MODEL }),
    signal: request.signal,
  }).catch(() => null);
  if (!res?.ok || !res.body) {
    console.error("elevenlabs failed", res?.status, await res?.text().catch(() => ""));
    return fail(502, res?.status === 401 ? "Voice mode isn't set up correctly. Let your program leader know." : "The voice didn't come through. The reply is on screen; carry on, or switch to the microphone.");
  }

  const { error } = await supabaseAdmin().from("usage_log").insert({
    user_id: userId, org_id: e.org_id, enrollment_id: e.id, route: "speak", model: `elevenlabs:${VOICE_MODEL}`, input_tokens: text.length, output_tokens: 0,
  });
  if (error) console.error("usage_log insert failed", error.message);
  return new Response(res.body, { headers: { "content-type": "audio/mpeg", "cache-control": "no-store" } });
}
