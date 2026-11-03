"use client";
// Voice mode for the Practice studio: a hands-free, spoken conversation. The leader talks; when they pause,
// their words are sent; the character's reply appears on screen and is spoken aloud (ElevenLabs, via
// /api/practice/speak); then the microphone listens again. The leader's speech is turned into text by the
// browser's own speech service, as with the microphone button.
import { useEffect, useRef, useState } from "react";

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
export const voiceSupported = () => !!ctor();

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
  // Replies play through the Web Audio engine, started on the "Start talking" tap, so phones allow
  // them to play later in the conversation without another tap.
  const audio = useRef<AudioContext | null>(null);
  const playing = useRef<AudioBufferSourceNode | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ onUtterance, onMessage, rpId, enrollmentId });
  useEffect(() => { latest.current = { onUtterance, onMessage, rpId, enrollmentId }; });

  /** Stops listening and speaking (no state changes, so it can run from effects). */
  function halt() {
    active.current = false;
    if (timer.current) clearTimeout(timer.current);
    rec.current?.abort();
    rec.current = null;
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
    if (!R || !active.current) return;
    const r = new R();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;
    let heard = "", submit = false;
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
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        latest.current.onMessage("Voice mode needs the microphone. Allow microphone access for this site, then try again.");
        stop();
      }
    };
    r.onend = () => {
      if (timer.current) clearTimeout(timer.current);
      rec.current = null;
      if (!active.current) return;
      const text = heard.trim();
      if ((submit || text) && text) void take(text);
      else listen(); // the browser stopped listening after a long silence: keep going
    };
    rec.current = r;
    setPhase("listening");
    try { r.start(); } catch { stop(); }
  }

  function start() {
    // Started on this tap, so phones allow the replies to play later in the conversation.
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio.current ??= new AC();
    void audio.current.resume();
    active.current = true;
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
