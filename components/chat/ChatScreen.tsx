"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useSend } from "@/lib/useSend";
import { prepareImage } from "@/lib/image";
import type { CardAction, ChatMessage, PlansCard } from "@/lib/types";
import { Mascot } from "../ui/Mascot";
import { ArrowLeftIcon, MicIcon, PlusIcon, ResetIcon } from "../ui/Icons";
import { Scene } from "../ui/Screen";
import { Composer } from "./Composer";
import { VoiceComposer } from "./VoiceComposer";
import { speechAvailable } from "@/lib/useSpeech";
import { ResultCard } from "./ResultCard";
import { DemoGallery } from "./DemoGallery";
import { PlanCards } from "./PlanCards";
import { newId } from "@/lib/format";
import type { DemoItem } from "@/lib/demoItems";
import type { PlanOption } from "@/lib/planOptions";

type Mode = "talk" | "text";

export function ChatScreen({ active, onBack }: { active: boolean; onBack: () => void }) {
  const { state, dispatch } = useStore();
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
  // The + button opens the demo gallery; tapping an item sends it to Penny like an uploaded photo.
  const [galleryOpen, setGalleryOpen] = useState(false);
  const pickDemo = (item: DemoItem) => {
    if (thinking) return;
    setGalleryOpen(false);
    setStarted(true);
    dispatch({ type: "addMessage", message: { id: newId(), role: "user", text: `${item.name} · ${money(item.price)}`, image: item.art } });
    dispatch({ type: "setThinking", on: true });
    const left = state.freeTotal;
    window.setTimeout(() => {
      dispatch({
        type: "addMessage",
        message: { id: newId(), role: "assistant", text: "", plans: { name: item.name, price: item.price, left } },
      });
      dispatch({ type: "setThinking", on: false });
    }, 1100);
  };
  const choosePlan = (m: ChatMessage, o: PlanOption) => {
    if (!m.plans || m.plans.chosen) return;
    const { name, price } = m.plans;
    // Left to Spend drops by what this choice costs this month (the whole price, or the first month's saving).
    dispatch({ type: "setTotal", amount: state.freeTotal - o.amount });
    if (o.id !== "now") {
      dispatch({
        type: "applyUpdates",
        updates: [{ type: "save_to_shelf", name, price, status: `Saving ${money(o.amount)} a month` }],
      });
    }
    dispatch({ type: "updatePlans", messageId: m.id, patch: { chosen: o.id } });
  };
  const togglePlans = (m: ChatMessage, key: "remind" | "priceWatch") =>
    m.plans && dispatch({ type: "updatePlans", messageId: m.id, patch: { [key]: !m.plans[key] } as Partial<PlansCard> });

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
    if (el && messages.length === 0) {
      el.scrollTo({ top: 0 }); // fresh chat: start at the top
      return;
    }
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
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Overview"
            className="pressable -ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-card text-label shadow-[0_4px_14px_-8px_rgba(30,20,10,0.35)]"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="flex-1 text-[22px] font-semibold leading-[28px] tracking-[-0.01em] text-on-photo">Talk to Penny</h1>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                dispatch({ type: "clearChat" });
                setStarted(false);
                scrollRef.current?.scrollTo({ top: 0 });
              }}
              disabled={thinking}
              className="pressable flex h-10 items-center gap-1.5 rounded-full bg-card px-3.5 text-[14px] font-semibold text-label shadow-[0_4px_14px_-8px_rgba(30,20,10,0.35)] disabled:opacity-40"
            >
              <ResetIcon size={16} />
              New chat
            </button>
          )}
        </div>
        <p className={`glass tabular mt-2 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[14px] text-on-photo ${messages.length > 0 ? "[@media(max-height:720px)]:hidden" : ""}`}>
          <span className="h-2 w-2 rounded-full" style={{ background: state.freeTotal > 0 ? "#a9c27e" : "var(--v-not)" }} aria-hidden />
          <span className="font-semibold">{money(Math.max(state.freeTotal, 0))}</span> left to spend · {MONTH.daysLeft} days left
        </p>
      </header>

      <div
        ref={scrollRef}
        className={`scroll-y absolute inset-0 px-3 ${messages.length > 0 ? "[@media(max-height:720px)]:[--chat-top:74px]" : ""}`}
        style={{
          paddingTop: `calc(var(--sat) + var(--chat-top, 104px))`,
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
              onPhoto={() => setGalleryOpen(true)}
            />
          ) : (
            <EmptyState />
          )
        ) : (
          <div className="flex min-h-full flex-col justify-end gap-2.5 [@media(max-height:720px)]:gap-1.5">
            {messages.map((m, i) => (
              <Message
                key={m.id}
                m={m}
                animate={restored.current !== null && i >= restored.current}
                showReplies={m === last && !thinking}
                busy={thinking}
                onAction={(a) => onAction(m, a)}
                onChoose={(o) => choosePlan(m, o)}
                onToggle={(k) => togglePlans(m, k)}
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
            background: "linear-gradient(to top, rgba(248,246,241,0.98) 0%, rgba(248,246,241,0.9) 70%, rgba(248,246,241,0) 100%)",
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
            onAdd={() => setGalleryOpen(true)}
            compact={messages.length > 0 || thinking}
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
            <Composer
              busy={thinking}
              onListening={onListening}
              onSend={(text, image) => send({ text, image })}
              onAdd={() => setGalleryOpen(true)}
            />
          </>
        )}
      </div>

      <DemoGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onPick={pickDemo}
        onBrowse={() => {
          setGalleryOpen(false);
          photoRef.current?.click();
        }}
      />
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
  onChoose,
  onToggle,
}: {
  m: ChatMessage;
  animate: boolean;
  showReplies: boolean;
  busy: boolean;
  onAction: (a: CardAction) => void;
  onReply: (t: string) => void;
  onChoose: (o: PlanOption) => void;
  onToggle: (key: "remind" | "priceWatch") => void;
}) {
  const mine = m.role === "user";
  // Demo gallery items: the picture rides inside the bubble, like a shared product.
  if (mine && m.image?.startsWith("data:image/svg")) {
    return (
      <motion.div
        initial={animate ? { opacity: 0, y: 12, scale: 0.98 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 28, stiffness: 340 }}
        className="flex justify-end"
        data-msg={m.id}
      >
        <p className="flex max-w-[80%] items-center gap-2.5 rounded-[20px] rounded-br-[6px] bg-cta py-1.5 pl-1.5 pr-4 text-on-cta">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.image} alt="" className="h-11 w-11 shrink-0 rounded-[14px] [@media(max-height:720px)]:h-9 [@media(max-height:720px)]:w-9" draggable={false} />
          <span className="text-[15px] leading-[19px]">{m.text}</span>
        </p>
      </motion.div>
    );
  }
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

      {m.plans ? (
        <PlanCards plans={m.plans} onChoose={onChoose} onToggle={onToggle} />
      ) : m.card ? (
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

      {/* Suggestion chips are turned off for now (showReplies / onReply kept for later). */}
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
              <span className="absolute -inset-3 rounded-full ring-1 ring-black/10" aria-hidden />
              <span className="absolute -inset-6 rounded-full ring-1 ring-black/5" aria-hidden />
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
      <div className="mb-3 mt-6 flex items-center gap-2 rounded-full bg-[var(--fill)] py-1.5 pl-1.5 pr-2 backdrop-blur-md">
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
            <span className="h-4 w-px bg-black/15" aria-hidden />
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
