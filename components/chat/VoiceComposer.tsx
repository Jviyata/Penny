"use client";

import { useEffect, useRef, useState } from "react";
import { prepareImage, type PreparedImage } from "@/lib/image";
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
  handle,
  onAdd,
}: {
  onSend: (text: string, image?: PreparedImage) => void;
  busy: boolean;
  onTextInstead: () => void;
  onListening?: (on: boolean) => void;
  /** Lets the "Talk" option on the Ask Penny screen start listening within the same tap. */
  handle?: React.RefObject<{ talk: () => void } | null>;
  /** Opens the demo gallery instead of the file picker. */
  onAdd?: () => void;
}) {
  const [heard, setHeard] = useState("");
  // If the mic can't start, stay in talk mode and say why; the user decides whether to type.
  const [problem, setProblem] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Photos and screenshots work in talk mode too: pick one and it sends straight away.
  const pickPhoto = async (file: File | undefined) => {
    if (!file || busy) return;
    try {
      onSend("", await prepareImage(file));
    } catch {
      setProblem("Couldn’t open that photo. A screenshot usually works.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };
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
  if (handle) handle.current = { talk };

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

      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
      <div className="flex justify-end pr-6">
        <button
          type="button"
          onClick={() => (onAdd ? onAdd() : fileRef.current?.click())}
          disabled={busy || speech.listening}
          aria-label="Add a photo, screenshot or file"
          className="pressable glass flex h-12 w-12 items-center justify-center rounded-full text-on-photo disabled:opacity-40"
        >
          <PlusIcon size={22} />
        </button>
        {/* No `capture` attribute: iOS offers Take Photo, Photo Library or Choose File. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => pickPhoto(e.target.files?.[0])}
        />
      </div>
      <button
        type="button"
        onClick={talk}
        disabled={busy}
        aria-label={speech.listening ? "Stop talking and send" : "Talk to Penny"}
        aria-pressed={speech.listening}
        className={`flex h-[76px] w-[76px] items-center justify-center rounded-full bg-cta text-on-cta shadow-[0_14px_30px_-10px_rgba(20,12,4,0.6)] transition-transform active:scale-95 disabled:opacity-50 ${
          speech.listening ? "mic-live" : ""
        }`}
      >
        {speech.listening ? <StopIcon size={26} /> : <MicIcon size={36} />}
      </button>
      <div />
      </div>
      <p className="on-photo-shadow mt-1.5 text-[14px] font-medium text-on-photo">
        {busy ? "Penny’s reading it…" : speech.listening ? "Tap when you’re done" : "Tap to talk"}
      </p>

      <button
        type="button"
        onClick={onTextInstead}
        className="on-photo-shadow h-9 px-3 text-[13px] font-medium text-on-photo-2 underline-offset-2 active:underline"
      >
        or type it
      </button>
    </div>
  );
}
