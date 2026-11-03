"use client";
// Talk instead of typing: a microphone button that turns speech into text in a message box, using the
// browser's built-in speech recognition (Chrome, Edge, Safari on desktop and phones). The words appear as
// the leader speaks; they can edit before sending. The browser's own speech service does the recognition.
// If that service can't be reached (some work networks block it) or the browser has none (e.g. Firefox), the
// button records instead, and the speech is turned into text through this site (lib/recorder, ElevenLabs).
import { useEffect, useRef, useState } from "react";
import { recorderSupported, serverSpeechOn, startRecording, switchToServerSpeech, transcribe, type Recorder } from "@/lib/recorder";
import { speechErrorMessage } from "@/lib/speech";

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

const join = (a: string, b: string) => (a && b ? `${a.replace(/\s+$/, "")} ${b.replace(/^\s+/, "")}` : a || b);

type State = "off" | "listening" | "transcribing";

export function MicButton({ value, onChange, disabled, onError }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; onError?: (message: string) => void;
}) {
  // Only shown in the browser (the Studio renders after the account loads), so support can be read directly.
  const [supported] = useState(() => !!ctor() || recorderSupported());
  const [state, setState] = useState<State>("off");
  const rec = useRef<Recognition | null>(null);
  const recorder = useRef<Recorder | null>(null);
  const latest = useRef({ value, onChange, onError });
  useEffect(() => { latest.current = { value, onChange, onError }; });

  // Stop listening when the box is disabled (sending, waiting for a reply) or the page closes.
  useEffect(() => { if (disabled) { rec.current?.stop(); recorder.current?.stop(); } }, [disabled]);
  useEffect(() => () => { rec.current?.abort(); recorder.current?.cancel(); }, []);

  if (!supported) return null;

  function start() {
    const R = ctor();
    if (!R || serverSpeechOn(!!R)) return void record();
    const r = new R();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;
    const before = latest.current.value;
    let finished = "", switching = false;
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finished = join(finished, res[0].transcript);
        else interim = join(interim, res[0].transcript);
      }
      latest.current.onChange(join(before, join(finished, interim)));
    };
    r.onerror = (e) => {
      // The browser's speech service is blocked: record and turn the speech into text through this site instead.
      if (e.error === "network" && recorderSupported()) { switching = true; switchToServerSpeech(); return; }
      const message = speechErrorMessage(e.error);
      if (message) latest.current.onError?.(message);
    };
    r.onend = () => {
      rec.current = null;
      setState("off");
      if (switching) void record();
    };
    rec.current = r;
    try { r.start(); setState("listening"); } catch { setState("off"); }
  }

  async function record() {
    let r: Recorder;
    try { r = await startRecording(); } catch (err) {
      latest.current.onError?.(speechErrorMessage((err as Error).message) ?? "");
      return;
    }
    recorder.current = r;
    setState("listening");
    const audio = await r.done;
    recorder.current = null;
    if (!audio) return setState("off");
    setState("transcribing");
    const out = await transcribe(audio);
    setState("off");
    if ("error" in out) return latest.current.onError?.(out.error);
    if (!out.text) return latest.current.onError?.(speechErrorMessage("no-speech") ?? "");
    latest.current.onChange(join(latest.current.value, out.text));
  }

  const listening = state === "listening";
  return (
    <button type="button" className={`mic${state !== "off" ? " on" : ""}`} disabled={(disabled && !listening) || state === "transcribing"}
      aria-pressed={listening} aria-label={listening ? "Stop talking" : state === "transcribing" ? "Turning your speech into text" : "Talk instead of typing"}
      title={listening ? "Listening… tap to stop" : "Talk instead of typing"}
      onClick={() => (listening ? (rec.current?.stop(), recorder.current?.stop()) : start())}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></svg>
      {listening ? <span className="mic-label">Listening… tap to stop</span> : state === "transcribing" ? <span className="mic-label">Turning into text…</span> : null}
    </button>
  );
}
