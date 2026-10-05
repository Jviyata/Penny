"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useSend } from "@/lib/useSend";
import { prepareImage } from "@/lib/image";
import type { CardAction, ChatMessage } from "@/lib/types";
import { Mascot } from "../ui/Mascot";
import { MicIcon, PlusIcon } from "../ui/Icons";
import { Scene } from "../ui/Screen";
import { Composer } from "./Composer";
import { VoiceComposer } from "./VoiceComposer";
import { speechAvailable } from "@/lib/useSpeech";
import { ResultCard } from "./ResultCard";

type Mode = "talk" | "text";

export function ChatScreen({ active }: { active: boolean }) {
  const { state, dispatch, open } = useStore();
  const send = useSend();
  const { messages, thinking } = state;
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [composerH, setComposerH] = useState(64);
  const [listening, setListening] = useState(false);
  const onListening = useCallback((on: boolean) => setListening(on), []);

  // Every visit starts talk-first (where the phone supports speech); typing is one tap away.
  const [mode, setMode] = useState<Mode>("text");
  // Checked after mount: the server can't know whether this browser has speech recognition.
  const [canTalk, setCanTalk] = useState(false);
  useEffect(() => setCanTalk(speechAvailable()), []);
  // A fresh chat opens on the four choices (Talk, Type, Photo, Screenshot); the input bar appears once one is picked.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (active) {
      setMode(speechAvailable() ? "talk" : "text");
      setStarted(false);
    }
  }, [active]);
  const textInstead = () => {
    // Render the text bar now and focus it within the same tap, so iOS brings the keyboard up.
    flushSync(() => {
      setStarted(true);
      setMode("text");
    });
    composerRef.current?.querySelector("textarea")?.focus();
  };
  const voice = useRef<{ talk: () => void } | null>(null);
  const talkNow = () => {
    flushSync(() => {
      setStarted(true);
      setMode("talk");
    });
    voice.current?.talk(); // same tap, so Safari allows the microphone
  };
  const photoRef = useRef<HTMLInputElement>(null);
  const sendPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setStarted(true);
      send({ text: "", image: await prepareImage(file) });
    } finally {
      if (photoRef.current) photoRef.current.value = "";
    }
  };
  const empty = messages.length === 0 && !thinking;
  const showChoices = empty && !started && !listening;

  // Messages restored from the session appear instantly; only new ones animate in.
  const restored = useRef<number | null>(null);
  if (restored.current === null && state.hydrated) restored.current = messages.length;

  useLayoutEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setComposerH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Stay pinned to the newest message, including when the keyboard opens and the screen shrinks.
  const scrollToEnd = (smooth: boolean) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };
  // A new result card scrolls to its top, so the photo and headline lead; anything else goes to the end.
  useEffect(() => {
    const el = scrollRef.current;
    const lastMsg = messages[messages.length - 1];
    if (el && lastMsg?.card && !thinking) {
      const node = el.querySelector<HTMLElement>(`[data-msg="${lastMsg.id}"]`);
      const top = parseFloat(getComputedStyle(el).paddingTop) || 0;
      if (node) {
        el.scrollTo({ top: Math.max(0, node.offsetTop - top + 8), behavior: "smooth" });
        return;
      }
    }
    scrollToEnd(true);
  }, [messages.length, thinking]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let lastH = el.clientHeight;
    const ro = new ResizeObserver(() => {
      if (el.clientHeight < lastH) scrollToEnd(false);
      lastH = el.clientHeight;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onAction = (m: ChatMessage, a: CardAction) => {
    if (!m.card) return;
    // Saving or buying settles the card; asking how to make it work keeps every option open.
    if (a.kind === "save_for_later" || a.kind === "buy_anyway") {
      dispatch({ type: "chooseAction", messageId: m.id, label: a.label });
    }
    send({
      text: a.label,
      action: { kind: a.kind, item: { name: m.card.name, price: m.card.price, image: m.card.image } },
    });
  };

  const last = messages[messages.length - 1];
  const fadeTop = "calc(var(--sat) + 96px)";

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Scene name="chat" />
      {/* Photo and screenshot choices. No `capture`: iOS offers Take Photo, Photo Library or Choose File. */}
      <input
        ref={photoRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => sendPhoto(e.target.files?.[0])}
      />

      {/* Context, not competition: the page name and the number Penny works from */}
      <header className="absolute inset-x-0 top-0 z-20 px-5 pt-[calc(var(--sat)+10px)]">
        <h1 className="on-photo-shadow text-[22px] font-semibold leading-[28px] tracking-[-0.01em] text-on-photo">Can I afford this?</h1>
        <p className="glass tabular mt-2 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[14px] text-on-photo">
          <span className="h-2 w-2 rounded-full" style={{ background: open > 0 ? "#a9c27e" : "var(--v-not)" }} aria-hidden />
          <span className="font-semibold">{money(Math.max(open, 0))}</span> free to spend · {MONTH.daysLeft} days left
        </p>
      </header>

      <div
        ref={scrollRef}
        className="scroll-y absolute inset-0 px-3"
        style={{
          paddingTop: `calc(var(--sat) + 96px)`,
          paddingBottom: `calc(${composerH + 16}px + var(--tabbar-h) + var(--sab))`, // Penny is small in the bar here
          // Messages fade out under the title instead of colliding with it.
          WebkitMaskImage: `linear-gradient(to bottom, transparent calc(var(--sat) + 70px), #000 ${fadeTop})`,
          maskImage: `linear-gradient(to bottom, transparent calc(var(--sat) + 70px), #000 ${fadeTop})`,
        }}
      >
        {empty ? (
          showChoices ? (
            <AskChoices
              canTalk={canTalk}
              onTalk={talkNow}
              onType={textInstead}
              onPhoto={() => photoRef.current?.click()}
            />
          ) : (
            <EmptyState />
          )
        ) : (
          <div className="flex min-h-full flex-col justify-end gap-2.5">
            {messages.map((m, i) => (
              <Message
                key={m.id}
                m={m}
                animate={restored.current !== null && i >= restored.current}
                showReplies={m === last && !thinking}
                busy={thinking}
                onAction={(a) => onAction(m, a)}
                onReply={(t) => send({ text: t })}
              />
            ))}
            {thinking && <Thinking />}
          </div>
        )}
      </div>

      <div
        ref={composerRef}
        className={`absolute inset-x-0 z-20 bottom-[calc(var(--tabbar-h)+var(--sab))] [html[data-keyboard=open]_&]:bottom-0 ${
          showChoices ? "invisible" : ""
        }`}
      >
        {/* Backdrop: messages fade out behind the controls instead of showing through them */}
        <div
          className="pointer-events-none absolute inset-x-0 -top-10 bottom-0 -z-10 backdrop-blur-md"
          style={{
            background: "linear-gradient(to top, rgba(40,27,17,0.94) 0%, rgba(40,27,17,0.82) 70%, rgba(40,27,17,0) 100%)",
            WebkitMaskImage: "linear-gradient(to top, #000 75%, transparent)",
            maskImage: "linear-gradient(to top, #000 75%, transparent)",
          }}
          aria-hidden
        />
        <AnimatePresence>
          {listening && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="pointer-events-none absolute bottom-full left-0 right-0 flex items-end justify-center gap-1"
              role="status"
            >
              <Mascot mood="listening" size={92} />
              {mode === "text" && (
                <span className="paper-glass mb-6 rounded-full px-3.5 py-1.5 text-[14px] font-medium text-label">Listening…</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {mode === "talk" ? (
          <VoiceComposer
            handle={voice}
            busy={thinking}
            onListening={onListening}
            onSend={(text, image) => send({ text, image })}
            onTextInstead={textInstead}
          />
        ) : (
          <>
            {canTalk && (
              <div className="flex justify-end px-3 pb-1">
                <button
                  type="button"
                  onClick={() => setMode("talk")}
                  className="pressable glass flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium text-on-photo"
                >
                  <MicIcon size={16} />
                  Talk instead
                </button>
              </div>
            )}
            <Composer busy={thinking} onListening={onListening} onSend={(text, image) => send({ text, image })} />
          </>
        )}
      </div>
    </div>
  );
}

function Message({
  m,
  animate,
  showReplies,
  busy,
  onAction,
  onReply,
}: {
  m: ChatMessage;
  animate: boolean;
  showReplies: boolean;
  busy: boolean;
  onAction: (a: CardAction) => void;
  onReply: (t: string) => void;
}) {
  const mine = m.role === "user";
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 12, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 340 }}
      className={`flex flex-col gap-2 ${mine ? "items-end" : "items-start"}`}
      data-msg={m.id}
    >
      {m.image && (
        <img
          src={m.image}
          alt="Your photo"
          className="max-h-60 max-w-[62%] rounded-[22px] object-cover shadow-[0_8px_24px_-10px_rgba(20,12,4,0.5)]"
          draggable={false}
        />
      )}

      {m.card ? (
        <div className="flex w-full justify-center">
          <ResultCard card={m.card} reply={m.text} disabled={busy} onAction={onAction} />
        </div>
      ) : mine ? (
        m.text && (
          <p className="selectable max-w-[78%] whitespace-pre-wrap rounded-[22px] bg-cta px-4 py-2.5 text-[17px] leading-[22px] text-on-cta">
            {m.text}
          </p>
        )
      ) : (
        <div className="flex max-w-[88%] items-end gap-1">
          <Mascot mood={m.mood ?? "calm_neutral"} size={48} className="-mb-1 shrink-0" />
          <p className="paper-glass selectable whitespace-pre-wrap rounded-[22px] px-4 py-2.5 text-[17px] leading-[22px] text-label">
            {m.text}
          </p>
        </div>
      )}

      {showReplies && m.quickReplies && m.quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-12">
          {m.quickReplies.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onReply(q)}
              className="pressable glass-strong h-11 rounded-full px-4 text-[15px] font-semibold text-on-photo"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function Thinking() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end gap-1"
      role="status"
      aria-live="polite"
    >
      <Mascot mood="thinking" size={64} className="-mb-1" />
      <span className="paper-glass flex h-11 items-center gap-2 rounded-[22px] px-4">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="typing-dot h-2 w-2 rounded-full bg-label-2" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
        <span className="text-[15px] text-label-2">Reading it…</span>
      </span>
    </motion.div>
  );
}

/** The Ask Penny screen: talking is the hero; adding a photo or typing are quieter options. */
function AskChoices({
  canTalk,
  onTalk,
  onType,
  onPhoto,
}: {
  canTalk: boolean;
  onTalk: () => void;
  onType: () => void;
  onPhoto: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center px-2 text-center">
      {/* Primary: Penny asks one question */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <Mascot mood="calm_neutral" size={84} label />
        <p className="on-photo-shadow mt-2 text-[28px] font-bold leading-[33px] tracking-[-0.01em] text-on-photo">
          What are you thinking of buying?
        </p>
        <p className="on-photo-shadow mt-1.5 text-[15px] leading-[20px] text-on-photo-2">
          I’ll show you what it means for the rest of {MONTH.name}.
        </p>

        {/* Hero action: talk */}
        {canTalk ? (
          <>
            <button
              type="button"
              onClick={onTalk}
              aria-label="Talk to Penny"
              className="relative mt-9 flex h-[124px] w-[124px] items-center justify-center rounded-full bg-cta text-on-cta shadow-[0_18px_40px_-12px_rgba(20,12,4,0.7)] transition-transform active:scale-95"
            >
              <span className="absolute -inset-3 rounded-full ring-1 ring-white/25" aria-hidden />
              <span className="absolute -inset-6 rounded-full ring-1 ring-white/12" aria-hidden />
              <MicIcon size={52} />
            </button>
            <p className="on-photo-shadow mt-6 text-[17px] font-semibold text-on-photo">Tap to talk to Penny</p>
          </>
        ) : (
          <button
            type="button"
            onClick={onType}
            className="pressable mt-9 h-14 rounded-full bg-cta px-8 text-[17px] font-semibold text-on-cta"
          >
            Type it
          </button>
        )}
      </div>

      {/* Secondary: quieter ways in, grouped on one row */}
      <div className="mb-3 mt-6 flex items-center gap-2 rounded-full bg-black/20 py-1.5 pl-1.5 pr-2 backdrop-blur-md">
        <button
          type="button"
          onClick={onPhoto}
          className="pressable flex h-10 items-center gap-2 rounded-full pl-1 pr-3 text-[14px] font-medium text-on-photo"
        >
          <span className="glass flex h-9 w-9 items-center justify-center rounded-full">
            <PlusIcon size={18} />
          </span>
          Photo, screenshot or file
        </button>
        {canTalk && (
          <>
            <span className="h-4 w-px bg-white/25" aria-hidden />
            <button type="button" onClick={onType} className="h-10 px-3 text-[14px] font-medium text-on-photo-2">
              or type it
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** After picking Talk or Type, before the first message. */
function EmptyState() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 pb-4 text-center">
      <Mascot mood="calm_neutral" size={120} label />
      <p className="on-photo-shadow mt-3 text-[22px] font-bold leading-[28px] text-on-photo">What are you thinking of buying?</p>
      <p className="on-photo-shadow mt-1.5 text-[15px] leading-[21px] text-on-photo-2">
        Say or type the item and its price, or add a photo.
      </p>
    </div>
  );
}
