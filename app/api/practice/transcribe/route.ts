// Speech-to-text fallback for the microphone and voice mode, used when the browser's own speech service can't
// be reached (some work networks block it) or the browser has none. The leader's recorded speech is passed to
// ElevenLabs to be turned into text and is not stored here. The leader's name and email are never sent.
// The leader and their enrollment are checked as for the practice partner, with a daily limit in seconds.
import { currentLeader, fail } from "@/lib/practice";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { LISTEN_MAX_BYTES, LISTEN_SECONDS_PER_DAY, STT_MODEL } from "@/lib/voices";

export async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return fail(503, "Speech isn't available right now. Type instead.");
  const userId = await currentLeader();
  if (!userId) return fail(401, "Your sign-in has expired. Sign in again, then try again.");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const enrollmentId = form?.get("enrollmentId");
  const lang = form?.get("lang");
  if (!(file instanceof Blob) || typeof enrollmentId !== "string" || !file.size) return fail(400, "No speech was recorded.");
  if (file.size > LISTEN_MAX_BYTES) return fail(413, "That was too long to turn into text. Try a shorter message.");

  // The enrollment must be the caller's own active one (checked as the caller, under row-level security).
  const supabase = await supabaseServer();
  const [{ data: e }, { data: active }] = await Promise.all([
    supabase.from("enrollments").select("id, org_id").eq("id", enrollmentId).eq("user_id", userId).maybeSingle(),
    supabase.rpc("owns_active_enrollment", { eid: enrollmentId }),
  ]);
  if (!e || !active) return fail(403, "Your access to this program isn't active.");

  // Daily limit, counted in seconds of speech.
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { data: used } = await supabaseAdmin().from("usage_log").select("input_tokens").eq("user_id", userId).eq("route", "transcribe").gte("created_at", since.toISOString());
  const today = (used ?? []).reduce((s, r) => s + (r.input_tokens ?? 0), 0);
  if (today >= LISTEN_SECONDS_PER_DAY) return fail(429, "You've reached today's limit for speaking. It resets tomorrow. You can keep practicing by typing.");

  const body = new FormData();
  body.append("model_id", STT_MODEL);
  body.append("file", file, "speech");
  body.append("tag_audio_events", "false");
  if (typeof lang === "string" && /^[a-z]{2,3}$/.test(lang)) body.append("language_code", lang);
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body, signal: request.signal }).catch(() => null);
  if (!res?.ok) {
    console.error("elevenlabs stt failed", res?.status, await res?.text().catch(() => ""));
    return fail(502, res?.status === 401 ? "Speech isn't set up correctly. Let your program leader know." : "Your speech couldn't be turned into text. Try again, or type instead.");
  }
  const out = (await res.json().catch(() => null)) as { text?: string; words?: { end?: number }[] } | null;
  const seconds = Math.max(1, Math.ceil(Math.max(0, ...(out?.words ?? []).map((w) => w.end ?? 0))));

  const { error } = await supabaseAdmin().from("usage_log").insert({
    user_id: userId, org_id: e.org_id, enrollment_id: e.id, route: "transcribe", model: `elevenlabs:${STT_MODEL}`, input_tokens: seconds, output_tokens: 0,
  });
  if (error) console.error("usage_log insert failed", error.message);
  return Response.json({ text: (out?.text ?? "").trim() });
}
