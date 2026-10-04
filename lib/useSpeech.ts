"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typing for Safari's prefixed Web Speech API.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function getRecognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => Recognition) | null;
}

/** True where the browser has speech recognition (Safari on iPhone does). */
export function speechAvailable(): boolean {
  return !!getRecognitionCtor();
}

/**
 * Talk-to-type. `supported` is false where the browser has no speech recognition,
 * so the mic button can simply not render. Text streams into `onText` as it's heard.
 */
export function useSpeech(onText: (text: string) => void, onDone?: (finalText: string) => void, onError?: (code: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => setSupported(!!getRecognitionCtor()), []);
  useEffect(() => () => rec.current?.abort(), []);

  const stop = useCallback(() => rec.current?.stop(), []);

  const start = useCallback((prefix: string) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = navigator.language || "en-US";
    r.interimResults = true;
    r.continuous = false;
    const base = prefix ? prefix.replace(/\s*$/, " ") : "";
    let heard = base;
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      heard = base + text;
      onTextRef.current(heard);
    };
    r.onend = () => {
      setListening(false);
      onDoneRef.current?.(heard.trim());
    };
    r.onerror = (e) => {
      setListening(false);
      onErrorRef.current?.(e.error);
    };
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
      onErrorRef.current?.("start-failed");
    }
  }, []);

  return { supported, listening, start, stop };
}
