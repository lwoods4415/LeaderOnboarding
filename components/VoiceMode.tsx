"use client";
// Voice mode for the Practice studio: a hands-free, spoken conversation. The leader talks; when they pause,
// their words are sent; the character's reply appears on screen and is spoken aloud (ElevenLabs, via
// /api/practice/speak); then the microphone listens again. The leader's speech is turned into text by the
// browser's own speech service, as with the microphone button; if that can't be reached (some work networks
// block it) or the browser has none, the leader's speech is recorded and turned into text through this site.
import { useEffect, useRef, useState } from "react";
import { recorderSupported, serverSpeechOn, startRecording, switchToServerSpeech, transcribe, type Recorder } from "@/lib/recorder";
import { FATAL_SPEECH_ERRORS, speechErrorMessage } from "@/lib/speech";

type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;
const ctor = (): RecognitionCtor | undefined => {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};
export const voiceSupported = () => !!ctor() || recorderSupported();

type Phase = "idle" | "listening" | "thinking" | "speaking";
const SILENCE_MS = 1600; // a pause this long ends the leader's turn

export function VoiceMode({ who, enabled, onUtterance, onMessage, rpId, enrollmentId }: {
  who: string; rpId: string; enrollmentId: string | null; enabled: boolean;
  /** Sends what the leader said; resolves with the character's reply (or null if it didn't go through). */
  onUtterance: (text: string) => Promise<string | null | undefined>;
  onMessage: (text: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [live, setLive] = useState("");
  const active = useRef(false);
  const rec = useRef<Recognition | null>(null);
  const recorder = useRef<Recorder | null>(null);
  // Replies play through the Web Audio engine, started on the "Start talking" tap, so phones allow
  // them to play later in the conversation without another tap.
  const audio = useRef<AudioContext | null>(null);
  const playing = useRef<AudioBufferSourceNode | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quickEnds = useRef(0);
  const latest = useRef({ onUtterance, onMessage, rpId, enrollmentId });
  useEffect(() => { latest.current = { onUtterance, onMessage, rpId, enrollmentId }; });

  /** Stops listening and speaking (no state changes, so it can run from effects). */
  function halt() {
    active.current = false;
    if (timer.current) clearTimeout(timer.current);
    rec.current?.abort();
    rec.current = null;
    recorder.current?.cancel();
    recorder.current = null;
    playing.current?.stop();
  }
  function stop() {
    halt();
    setPhase("idle");
    setLive("");
  }
  // Leaving the page, or the conversation can't continue (feedback started, message limit reached), stops it.
  // The Studio gives each conversation its own VoiceMode (keyed by conversation), so switching starts fresh.
  useEffect(() => halt, []);
  useEffect(() => { if (!enabled) halt(); }, [enabled]);
  const shown: Phase = enabled ? phase : "idle";

  async function speak(text: string) {
    const { enrollmentId: eid, rpId: id } = latest.current;
    const res = await fetch("/api/practice/speak", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ enrollmentId: eid, roleplayId: id, text }),
    }).catch(() => null);
    if (res?.status === 204) return; // only stage directions: nothing to say aloud
    if (!res?.ok) {
      const why = res ? ((await res.json().catch(() => null)) as { error?: string } | null)?.error : null;
      latest.current.onMessage(why ?? "The voice didn't come through. The reply is on screen.");
      return;
    }
    const ctx = audio.current!;
    try {
      const buf = await ctx.decodeAudioData(await res.arrayBuffer());
      if (!active.current) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      playing.current = src;
      await new Promise<void>((resolve) => { src.onended = () => resolve(); src.start(); });
    } catch {
      latest.current.onMessage("The voice didn't come through. The reply is on screen.");
    } finally {
      playing.current = null;
    }
  }

  async function take(text: string) {
    setPhase("thinking");
    setLive("");
    const reply = await latest.current.onUtterance(text);
    if (!active.current) return;
    if (reply) {
      setPhase("speaking");
      await speak(reply);
    }
    if (active.current) listen();
  }

  function listen() {
    const R = ctor();
    if (!active.current) return;
    if (!R || serverSpeechOn(!!R)) return void listenByRecording();
    const r = new R();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;
    let heard = "", submit = false, failed = false, switching = false;
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) heard = `${heard} ${t}`.trim(); else interim = `${interim} ${t}`.trim();
      }
      setLive(`${heard} ${interim}`.trim());
      // A pause after they've said something ends their turn.
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { submit = true; r.stop(); }, SILENCE_MS);
    };
    r.onerror = (e) => {
      // The browser's speech service is blocked: record and turn the speech into text through this site instead.
      if (e.error === "network" && recorderSupported()) { switching = true; switchToServerSpeech(); return; }
      // A blocked microphone stops voice mode with the reason; a quiet spell just listens again.
      if (FATAL_SPEECH_ERRORS.has(e.error)) {
        failed = true;
        latest.current.onMessage(`Voice mode stopped. ${speechErrorMessage(e.error)}`);
      }
    };
    r.onend = () => {
      if (timer.current) clearTimeout(timer.current);
      rec.current = null;
      if (failed) return stop();
      if (!active.current) return;
      if (switching) return void listenByRecording();
      const text = heard.trim();
      if ((submit || text) && text) void take(text);
      else if (Date.now() - began < 1000 && ++quickEnds.current >= 3) {
        // Listening keeps ending the moment it starts: something is blocking it.
        latest.current.onMessage(`Voice mode stopped. ${speechErrorMessage("keeps-stopping")}`);
        stop();
      } else {
        if (Date.now() - began >= 1000) quickEnds.current = 0;
        listen(); // the browser stopped listening after a long silence: keep going
      }
    };
    rec.current = r;
    setPhase("listening");
    const began = Date.now();
    try { r.start(); } catch { stop(); }
  }

  /** Listening without the browser's speech service: record until the leader pauses, then turn it into text. */
  async function listenByRecording() {
    setPhase("listening");
    setLive("");
    let r: Recorder;
    try { r = await startRecording({ endOnSilence: SILENCE_MS }); } catch (err) {
      latest.current.onMessage(`Voice mode stopped. ${speechErrorMessage((err as Error).message)}`);
      return stop();
    }
    if (!active.current) return r.cancel();
    recorder.current = r;
    const recording = await r.done;
    recorder.current = null;
    if (!active.current) return;
    if (!recording) return void listenByRecording(); // nothing said yet: keep listening
    setPhase("thinking");
    const out = await transcribe(recording);
    if (!active.current) return;
    if ("error" in out) {
      latest.current.onMessage(`Voice mode stopped. ${out.error}`);
      return stop();
    }
    if (!out.text) return void listenByRecording();
    setLive(out.text);
    await take(out.text);
  }

  function start() {
    // Started on this tap, so phones allow the replies to play later in the conversation.
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio.current ??= new AC();
    void audio.current.resume();
    active.current = true;
    quickEnds.current = 0;
    latest.current.onMessage(`Voice mode is on. Talk to ${who} as you would in person; pause when you've finished.`);
    listen();
  }

  const label = { idle: "", listening: "Listening… pause when you've finished", thinking: `${who} is thinking…`, speaking: `${who} is speaking…` }[shown];
  return (
    <div className={`voice ${shown}`}>
      {shown === "idle" ? (
        <button type="button" className="btn primary voice-start" disabled={!enabled} onClick={start}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></svg>
          Start talking
        </button>
      ) : (
        <>
          <div className="voice-status" role="status" aria-live="polite"><span className="voice-dot" aria-hidden="true" />{label}</div>
          {live ? <p className="voice-live">“{live}”</p> : null}
          <div className="row">
            {shown === "speaking" ? <button type="button" className="btn ghost" onClick={() => playing.current?.stop()}>Skip</button> : null}
            <button type="button" className="btn" onClick={stop}>Pause voice mode</button>
          </div>
        </>
      )}
    </div>
  );
}
