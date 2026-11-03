"use client";
// Talk instead of typing: a microphone button that turns speech into text in a message box, using the
// browser's built-in speech recognition (Chrome, Edge, Safari on desktop and phones). The words appear as
// the leader speaks; they can edit before sending. Browsers without it (e.g. Firefox) don't show the button.
// The browser's own speech service does the recognition; the audio never comes to this site.
import { useEffect, useRef, useState } from "react";
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

export function MicButton({ value, onChange, disabled, onError }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; onError?: (message: string) => void;
}) {
  // Only shown in the browser (the Studio renders after the account loads), so support can be read directly.
  const [supported] = useState(() => !!ctor());
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const latest = useRef({ value, onChange, onError });
  useEffect(() => { latest.current = { value, onChange, onError }; });

  // Stop listening when the box is disabled (sending, waiting for a reply) or the page closes.
  useEffect(() => { if (disabled) rec.current?.stop(); }, [disabled]);
  useEffect(() => () => rec.current?.abort(), []);

  if (!supported) return null;

  function start() {
    const R = ctor();
    if (!R) return;
    const r = new R();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;
    const before = latest.current.value;
    let finished = "";
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
      const message = speechErrorMessage(e.error);
      if (message) latest.current.onError?.(message);
    };
    r.onend = () => { setListening(false); rec.current = null; };
    rec.current = r;
    try { r.start(); setListening(true); } catch { setListening(false); }
  }

  return (
    <button type="button" className={`mic${listening ? " on" : ""}`} disabled={disabled && !listening}
      aria-pressed={listening} aria-label={listening ? "Stop talking" : "Talk instead of typing"}
      title={listening ? "Listening… tap to stop" : "Talk instead of typing"}
      onClick={() => (listening ? rec.current?.stop() : start())}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></svg>
      {listening ? <span className="mic-label">Listening… tap to stop</span> : null}
    </button>
  );
}
