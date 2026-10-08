"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { prepareImage, type PreparedImage } from "@/lib/image";
import { useSpeech } from "@/lib/useSpeech";
import { stopSpeaking } from "@/lib/pennyVoice";
import { ArrowUpIcon, MicIcon, PhotoIcon, StopIcon, XIcon } from "../ui/Icons";

/**
 * iMessage-style input bar. Sits at the bottom of the chat; because the whole app follows
 * the visual viewport, that's always directly above the iPhone keyboard.
 */
export function Composer({
  onSend,
  busy,
  onListening,
  onAdd,
}: {
  onSend: (text: string, image?: PreparedImage) => void;
  busy: boolean;
  onListening?: (on: boolean) => void;
  /** Opens the demo gallery instead of the file picker. */
  onAdd?: () => void;
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  // Talking into the box sends when you stop, like answering Penny out loud (no photo attached).
  const imageRef = useRef<PreparedImage | null>(null);
  imageRef.current = image;
  const speech = useSpeech(setText, (finalText) => {
    if (!finalText || imageRef.current || busy) return;
    onSend(finalText);
    setText("");
  });
  useEffect(() => onListening?.(speech.listening), [speech.listening, onListening]);

  // Grow with the text, up to ~5 lines.
  useLayoutEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const hasContent = text.trim().length > 0 || !!image;
  const canSend = hasContent && !busy && !preparing;

  const send = () => {
    if (!canSend) return;
    if (speech.listening) speech.stop();
    onSend(text.trim(), image ?? undefined);
    setText("");
    setImage(null);
    setNote(null);
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setPreparing(true);
    setNote(null);
    try {
      setImage(await prepareImage(file));
    } catch {
      setNote("Couldn’t open that photo. A screenshot usually works.");
    } finally {
      setPreparing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Keep the keyboard up when tapping buttons next to the field (like iMessage).
  const keepFocus = (e: React.PointerEvent) => {
    if (document.activeElement === fieldRef.current) e.preventDefault();
  };

  return (
    <div className="px-2 pb-2 pt-1.5">
      {note && <p className="on-photo-shadow px-3 pb-1.5 text-[13px] text-on-photo">{note}</p>}
      <div className="flex items-end gap-1.5">
        <button
          type="button"
          aria-label="Add a photo or screenshot"
          onPointerDown={keepFocus}
          onClick={() => (onAdd ? onAdd() : fileRef.current?.click())}
          className="pressable paper-glass flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-label"
        >
          <PhotoIcon size={24} />
        </button>
        {/* No `capture` attribute: iOS then offers Take Photo, Photo Library or Choose File. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />

        <div className="paper-glass min-w-0 flex-1 rounded-[24px]">
          {(image || preparing) && (
            <div className="px-2 pt-2">
              <div className="relative h-24 w-24 overflow-hidden rounded-[16px] bg-fill">
                {image ? (
                  <img src={image.thumb} alt="Attached" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[12px] text-label-2">Opening…</div>
                )}
                {image && (
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setImage(null)}
                    className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end p-1.5"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white">
                      <XIcon size={12} />
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="flex items-end">
            <textarea
              ref={fieldRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={speech.listening ? "Listening…" : image ? "Add a note (optional)" : "What do you want to buy?"}
              enterKeyHint="send"
              autoComplete="off"
              aria-label="Message"
              className="max-h-[120px] min-h-12 flex-1 resize-none bg-transparent py-[13px] pl-4 pr-1 text-[17px] leading-[22px] text-label outline-none placeholder:text-label-3"
            />
            {!speech.listening && (hasContent || !speech.supported) ? (
              <button
                type="button"
                aria-label="Send"
                onPointerDown={keepFocus}
                onClick={send}
                disabled={!canSend}
                className="flex h-12 w-12 shrink-0 items-center justify-center"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-[opacity,transform] ${
                    canSend ? "bg-cta text-on-cta active:scale-90" : "bg-fill text-label-3"
                  }`}
                >
                  <ArrowUpIcon />
                </span>
              </button>
            ) : (
              <button
                type="button"
                aria-label={speech.listening ? "Stop listening" : "Talk instead of typing"}
                aria-pressed={speech.listening}
                onPointerDown={keepFocus}
                onClick={() => {
                  if (speech.listening) return speech.stop();
                  stopSpeaking(); // so the mic hears you, not Penny
                  speech.start(text);
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center text-label-2"
              >
                {speech.listening ? (
                  <span className="mic-live flex h-9 w-9 items-center justify-center rounded-full bg-cta text-on-cta">
                    <StopIcon size={12} />
                  </span>
                ) : (
                  <MicIcon />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
