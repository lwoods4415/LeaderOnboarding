"use client";
// Speech-to-text fallback, in the browser: records the leader's speech and sends it to this site
// (/api/practice/transcribe) to be turned into text, for when the browser's own speech service can't be reached
// (some work networks block it) or the browser has none (e.g. Firefox). The microphone button and voice mode
// switch to it on their own the first time the browser's service fails, for the rest of the visit.
import { currentEnrollmentId } from "./sync";

export const recorderSupported = () =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

const FLAG = "speech-fallback";
let fallback = false;
/** True once the browser's speech service has failed this visit (or doesn't exist): use the recorder instead. */
export function serverSpeechOn(hasBrowserService: boolean) {
  if (!hasBrowserService) return true;
  if (fallback) return true;
  try { fallback = sessionStorage.getItem(FLAG) === "1"; } catch { /* storage blocked */ }
  return fallback;
}
export function switchToServerSpeech() {
  fallback = true;
  try { sessionStorage.setItem(FLAG, "1"); } catch { /* storage blocked */ }
}

const LOUD = 0.02; // root-mean-square level that counts as speech
const MAX_MS = 60_000; // one recording
const IDLE_MS = 30_000; // nothing said for this long: stop and start again, so silence isn't kept

export type Recorder = {
  /** Resolves with the recording when it stops, or null if nothing was said (or it was cancelled). */
  done: Promise<Blob | null>;
  stop(): void;
  cancel(): void;
};

/** Starts recording. Throws a speech error code ("not-allowed", "audio-capture") if the microphone can't be used. */
export async function startRecording(opts: { endOnSilence?: number } = {}): Promise<Recorder> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (err) {
    throw new Error((err as DOMException)?.name === "NotAllowedError" ? "not-allowed" : "audio-capture");
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const samples = new Float32Array(analyser.fftSize);

  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  let heard = false, cancelled = false;
  const began = Date.now();
  let lastLoud = began;
  const end = () => { if (rec.state !== "inactive") rec.stop(); };

  const tick = setInterval(() => {
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (const s of samples) sum += s * s;
    const now = Date.now();
    if (Math.sqrt(sum / samples.length) > LOUD) { heard = true; lastLoud = now; }
    if (opts.endOnSilence && heard && now - lastLoud > opts.endOnSilence) end();
    if (!heard && now - began > IDLE_MS) end();
    if (now - began > MAX_MS) end();
  }, 100);

  const done = new Promise<Blob | null>((resolve) => {
    rec.onstop = () => {
      clearInterval(tick);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
      resolve(cancelled || !heard || !chunks.length ? null : new Blob(chunks, { type: rec.mimeType }));
    };
  });
  rec.start(250);
  return { done, stop: end, cancel: () => { cancelled = true; end(); } };
}

/** Turns a recording into text through this site. */
export async function transcribe(audio: Blob): Promise<{ text: string } | { error: string }> {
  const enrollmentId = currentEnrollmentId();
  if (!enrollmentId) return { error: "Your sign-in has expired. Sign in again, then try again." };
  const form = new FormData();
  form.append("file", audio);
  form.append("enrollmentId", enrollmentId);
  form.append("lang", (navigator.language || "en").split("-")[0].toLowerCase());
  const res = await fetch("/api/practice/transcribe", { method: "POST", body: form }).catch(() => null);
  const body = (await res?.json().catch(() => null)) as { text?: string; error?: string } | null;
  if (!res?.ok) return { error: body?.error ?? "Your speech couldn't be turned into text. Check your connection and try again, or type instead." };
  return { text: body?.text ?? "" };
}
