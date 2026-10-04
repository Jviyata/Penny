"use client";

import { useEffect, useState } from "react";
import { useSpeech } from "@/lib/useSpeech";
import { MicIcon, PlusIcon, StopIcon } from "../ui/Icons";

const PROBLEMS: Record<string, string> = {
  "not-allowed": "Penny needs your microphone. Allow it for this site in Safari, then tap to talk again.",
  "service-not-allowed": "Voice isn’t on yet. On iPhone, turn on Dictation in Settings → General → Keyboard, then tap again.",
  "no-speech": "Didn’t catch that. Tap and try again.",
  "audio-capture": "No microphone found. Check that nothing else is using it, then tap again.",
  network: "Voice needs a connection. Check your internet and tap again.",
  aborted: "Stopped listening. Tap to talk again.",
  default: "Couldn’t start listening. Tap to try again.",
};

/**
 * Talk-first input: one big Talk button. Your words show live while you speak and
 * send on their own when you stop. "+ Want to text it instead?" switches to typing.
 */
export function VoiceComposer({
  onSend,
  busy,
  onTextInstead,
  onListening,
}: {
  onSend: (text: string) => void;
  busy: boolean;
  onTextInstead: () => void;
  onListening?: (on: boolean) => void;
}) {
  const [heard, setHeard] = useState("");
  // If the mic can't start, stay in talk mode and say why; the user decides whether to type.
  const [problem, setProblem] = useState<string | null>(null);
  const speech = useSpeech(
    setHeard,
    (finalText) => {
      if (finalText) onSend(finalText);
      setHeard("");
    },
    (code) => setProblem(PROBLEMS[code] ?? PROBLEMS.default),
  );

  useEffect(() => onListening?.(speech.listening), [speech.listening, onListening]);

  const talk = () => {
    if (busy) return;
    if (speech.listening) speech.stop();
    else {
      setHeard("");
      setProblem(null);
      speech.start("");
    }
  };

  return (
    <div className="flex flex-col items-center px-4 pb-2 pt-1">
      {/* Live transcript while talking */}
      {speech.listening && (
        <p className="paper-glass selectable mb-3 max-w-full rounded-[20px] px-4 py-2 text-center text-[16px] leading-[21px] text-label" aria-live="polite">
          {heard || "Listening…"}
        </p>
      )}

      {problem && !speech.listening && (
        <p className="paper-glass mb-3 max-w-full rounded-[20px] px-4 py-2 text-center text-[14px] leading-[19px] text-label" role="alert">
          {problem}
        </p>
      )}

      <button
        type="button"
        onClick={talk}
        disabled={busy}
        aria-label={speech.listening ? "Stop talking and send" : "Talk to Penny"}
        aria-pressed={speech.listening}
        className={`flex h-[84px] w-[84px] items-center justify-center rounded-full bg-cta text-on-cta shadow-[0_14px_30px_-10px_rgba(20,12,4,0.6)] transition-transform active:scale-95 disabled:opacity-50 ${
          speech.listening ? "mic-live" : ""
        }`}
      >
        {speech.listening ? <StopIcon size={26} /> : <MicIcon size={36} />}
      </button>
      <p className="on-photo-shadow mt-2 text-[14px] font-medium text-on-photo">
        {busy ? "Penny’s reading it…" : speech.listening ? "Tap when you’re done" : "Tap to talk"}
      </p>

      <button
        type="button"
        onClick={onTextInstead}
        className="pressable mt-2 flex h-11 items-center gap-2 rounded-full px-3 text-[15px] font-medium text-on-photo"
      >
        <span className="glass flex h-8 w-8 items-center justify-center rounded-full">
          <PlusIcon size={16} />
        </span>
        <span className="on-photo-shadow">Want to text it instead?</span>
      </button>
    </div>
  );
}
