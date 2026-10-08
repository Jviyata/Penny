"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useSend } from "@/lib/useSend";
import { prepareImage, type PreparedImage } from "@/lib/image";
import { isMuted, setMuted, speak, stopSpeaking, unlockVoice, voiceAvailable } from "@/lib/pennyVoice";
import type { CardAction, ChatMessage, PlansCard } from "@/lib/types";
import { Mascot } from "../ui/Mascot";
import { ChevronIcon, KeyboardIcon, MicIcon, PlusIcon, ResetIcon } from "../ui/Icons";
import { Scene } from "../ui/Screen";
import { Composer } from "./Composer";
import { VoiceComposer } from "./VoiceComposer";
import { speechAvailable } from "@/lib/useSpeech";
import { ResultCard } from "./ResultCard";
import { DemoGallery } from "./DemoGallery";
import { PlanCards } from "./PlanCards";
import { newId } from "@/lib/format";
import type { DemoItem } from "@/lib/demoItems";
import { monthAfter, planFor, spokenAnswer, type PlanId, type PlanOption } from "@/lib/planOptions";
import {
  USE_CHIPS,
  WHEN_CHIPS,
  checkLines,
  checkingMessage,
  firstQuestion,
  isExperience,
  isSkip,
  parseUse,
  parseWhen,
  useQuestion,
} from "@/lib/interview";
import type { Goal } from "@/lib/monthDetails";
import { calendarLink, dueReminder, isAre, needs, nextStep, scheduleFor, stepDate, stepMonth } from "@/lib/savings";

type Mode = "talk" | "text";

export function ChatScreen({
  active,
  onBack,
  onOpenGoal,
}: {
  active: boolean;
  onBack: () => void;
  onOpenGoal: (id: string) => void;
}) {
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
    dispatch({ type: "setThinking", on: true });
    const left = state.freeTotal;
    window.setTimeout(() => {
      dispatch({ type: "addMessage", message: firstQuestion({ name: item.name, price: item.price, left, image: item.art }) });
      dispatch({ type: "setThinking", on: false });
    }, 1100);
  };
  // Penny's three choices change the real numbers:
  // Buy now spends the price; waiting sets this month's share aside into a new goal for the item.
  const choosePlan = (m: ChatMessage, o: PlanOption) => {
    if (!m.plans || m.plans.chosen) return;
    const { name, price, image } = m.plans;
    dispatch({ type: "setTotal", amount: state.freeTotal - o.amount });
    if (o.id === "now") {
      dispatch({
        type: "addMessage",
        message: {
          id: newId(),
          role: "assistant",
          text: `Done! ${isAre(name)} yours. You still have ${money(o.left)} left for ${MONTH.name}.`,
          mood: "celebrating",
        },
      });
    } else {
      // Waiting makes a goal with a savings plan: this month's share now, the rest on the 1st of each month.
      const months = o.id === "wait2" ? 2 : 3;
      const schedule = scheduleFor(price, months);
      const goalId = newId();
      const getIt = monthAfter(months);
      dispatch({
        type: "startSavingGoal",
        goal: { id: goalId, name, target: price, saved: o.amount, thisMonth: o.amount, by: `By ${getIt}`, image, schedule, getIt },
      });
      const next = schedule[1];
      dispatch({
        type: "addMessage",
        message: {
          id: newId(),
          role: "assistant",
          text: `Done! I made a goal for your ${name}. I set aside ${money(o.amount)} today, and I'll remind you on ${stepDate(next.month)} for the next ${money(next.amount)}. ${isAre(name)} yours in ${getIt}.`,
          mood: "celebrating",
          tracking: { goalId },
        },
      });
    }
    dispatch({ type: "updatePlans", messageId: m.id, patch: { chosen: o.id } });
  };
  // "Remind me when I'm ready to buy" keeps the item on the Wishlist; tapping again takes it off.
  const togglePlans = (m: ChatMessage, key: "remind" | "priceWatch") => {
    if (!m.plans) return;
    const on = !m.plans[key];
    if (key === "remind") {
      const { name, price, image } = m.plans;
      dispatch({
        type: "applyUpdates",
        updates: on
          ? [{ type: "save_to_shelf", name, price, image, status: "Penny will remind you" }]
          : [{ type: "remove_from_shelf", name }],
      });
    }
    dispatch({ type: "updatePlans", messageId: m.id, patch: { [key]: on } as Partial<PlansCard> });
  };

  // Penny talks: each new reply is read aloud (her answer card gets a short spoken version).
  const [muted, setMutedState] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  useEffect(() => {
    setMutedState(isMuted());
    setCanSpeak(voiceAvailable());
  }, []);
  // Penny says hello when Talk to Penny opens: the full hello once per visit, then a shorter one.
  useEffect(() => {
    document.addEventListener("pointerdown", unlockVoice, true); // any first tap lets iPhone play her voice
    return () => document.removeEventListener("pointerdown", unlockVoice, true);
  }, []);
  const [greeted, setGreeted] = useState(false);
  useEffect(() => {
    try {
      setGreeted(sessionStorage.getItem(GREETED_KEY) === "1");
    } catch {}
  }, []);
  useEffect(() => {
    if (!active) {
      stopSpeaking();
      return;
    }
    if (!state.hydrated || messages.length > 0) return;
    let first = true;
    try {
      first = sessionStorage.getItem(GREETED_KEY) !== "1";
      sessionStorage.setItem(GREETED_KEY, "1");
    } catch {}
    const name = state.userName ? ` ${state.userName}` : "";
    const due = dueReminder(state.goals, state.nov, state.snoozed);
    const reminder = due ? ` Quick reminder: your ${due.goal.name} ${needs(due.goal.name)} ${money(due.step.amount)} this month.` : "";
    speak(
      first
        ? `Hi${name}! I'm Penny.${reminder} What are you thinking of buying?`
        : `${reminder ? `Hi again!${reminder}` : "What's next?"} Tell me what you're thinking of buying.`,
    );
    if (!first) setGreeted(true);
  }, [active, state.hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const spokenUpTo = useRef<number | null>(null);
  // Her newest reply stays hidden until her voice starts, so she's heard first and the text follows.
  const [holdId, setHoldId] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (!state.hydrated) return;
    if (spokenUpTo.current === null || messages.length < spokenUpTo.current) {
      spokenUpTo.current = messages.length; // don't read out old messages
      setHoldId(null);
      return;
    }
    if (messages.length === spokenUpTo.current) return;
    spokenUpTo.current = messages.length;
    const m = messages[messages.length - 1];
    if (m.role !== "assistant") return;
    if (!canSpeak || isMuted()) {
      setHoldId(null);
      return;
    }
    setHoldId(m.id);
    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setHoldId((h) => (h === m.id ? null : h));
    };
    const cap = setTimeout(reveal, 5000); // never keep the answer waiting on a slow connection
    speak(m.plans ? spokenAnswer(m.plans) : m.text).then(() => {
      clearTimeout(cap);
      setTimeout(reveal, 650); // a beat of her talking, then the words appear
    });
  }, [messages.length, state.hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Answering Penny's answer by voice (or typing): "let's wait", "buy it", "remind me later".
  const handleSend = (text: string, image?: PreparedImage) => {
    if (!image && text.trim() && answerAsk(text)) return;
    const lastMsg = messages[messages.length - 1];
    const t = text.toLowerCase();
    if (!image && t.trim() && lastMsg?.plans && !lastMsg.plans.chosen) {
      const remind = /remind|wishlist|later|not now/.test(t);
      const id: PlanId | null = remind
        ? null
        : /three|3 month/.test(t)
          ? "wait3"
          : /wait|two|2 month|save up|saving/.test(t)
            ? "wait2"
            : /\bbuy\b|get (it|them)|go (for it|ahead)|purchase/.test(t)
              ? "now"
              : null;
      if (remind || id) {
        dispatch({ type: "addMessage", message: { id: newId(), role: "user", text } });
        if (id) {
          // Penny's confirmation comes from choosePlan, same as tapping.
          choosePlan(lastMsg, planFor(lastMsg.plans.name, lastMsg.plans.price, lastMsg.plans.left).options.find((x) => x.id === id)!);
        } else {
          if (!lastMsg.plans.remind) togglePlans(lastMsg, "remind");
          const reply = "Got it. I saved it to your Wishlist, and I'll remind you when it fits.";
          dispatch({ type: "addMessage", message: { id: newId(), role: "assistant", text: reply, mood: "celebrating" } });
        }
        return;
      }
    }
    send({ text, image });
  };

  // Answering Penny's questions (a chip, or said out loud). Anything unclear gets a sensible default,
  // so the conversation always moves forward.
  const answerAsk = (text: string): boolean => {
    const m = messages[messages.length - 1];
    if (!m?.ask || thinking) return false;
    const t = text.toLowerCase();
    const skip = isSkip(t);
    const answers = { ...m.ask.item.answers };
    if (m.ask.step === "when" && !skip) answers.when = parseWhen(t) ?? "wait";
    if (m.ask.step === "use" && !skip) answers.use = parseUse(t) ?? "sometimes";
    if (m.ask.step === "when" && isExperience(m.ask.item.name)) answers.use = "once";
    const item = { ...m.ask.item, answers };
    dispatch({ type: "addMessage", message: { id: newId(), role: "user", text } });
    dispatch({
      type: "addMessage",
      message: m.ask.step === "when" && !skip && !answers.use ? useQuestion(item) : checkingMessage(item),
    });
    return true;
  };
  // When the checklist finishes (or is tapped), Penny's answer follows.
  const finishChecks = (m: ChatMessage) => {
    const lastMsg = messages[messages.length - 1];
    if (!m.checks || lastMsg?.id !== m.id) return;
    dispatch({ type: "addMessage", message: { id: newId(), role: "assistant", text: "", plans: m.checks.item } });
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
    if (el && messages.length === 0) {
      el.scrollTo({ top: 0 }); // fresh chat: start at the top
      return;
    }
    const lastMsg = messages[messages.length - 1];
    if (el && (lastMsg?.card || lastMsg?.plans) && !thinking) {
      const node = el.querySelector<HTMLElement>(`[data-msg="${lastMsg.id}"]`);
      const top = parseFloat(getComputedStyle(el).paddingTop) || 0;
      if (node) {
        el.scrollTo({ top: Math.max(0, node.offsetTop - top + 8), behavior: "smooth" });
        return;
      }
    }
    scrollToEnd(true);
  }, [messages.length, thinking, holdId]); // eslint-disable-line react-hooks/exhaustive-deps
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
  const fadeTop = "calc(var(--sat) + 62px)";

  return (
    <div className="absolute inset-0 overflow-hidden" onPointerDown={unlockVoice}>
      <Scene name="chat" />
      {/* Photo and screenshot choices. No `capture`: iOS offers Take Photo, Photo Library or Choose File. */}
      <input
        ref={photoRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => sendPhoto(e.target.files?.[0])}
      />

      {/* One slim row: back, the page name, and the number Penny works from */}
      <header className="absolute inset-x-0 top-0 z-20 px-3 pt-[calc(var(--sat)+8px)]">
        <div className="flex h-10 items-center gap-1">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Overview"
            className="pressable flex h-10 w-9 shrink-0 items-center justify-center text-label"
          >
            <ChevronIcon size={20} className="rotate-180" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold text-on-photo">Talk to Penny</h1>
          <p className="paper-glass tabular flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-label-2">
            <span className="h-2 w-2 rounded-full" style={{ background: state.freeTotal > 0 ? "#a9c27e" : "var(--v-not)" }} aria-hidden />
            <span className="font-semibold text-label">{money(Math.max(state.freeTotal, 0))}</span> left to spend
            {messages.length === 0 && <span className="[@media(max-width:380px)]:hidden">· {MONTH.daysLeft} days</span>}
          </p>
          {canSpeak && (
            <button
              type="button"
              onClick={() => {
                setMuted(!muted);
                setMutedState(!muted);
              }}
              aria-label={muted ? "Let Penny talk" : "Mute Penny"}
              aria-pressed={!muted}
              className="pressable paper-glass ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label"
            >
              <SpeakerIcon off={muted} />
            </button>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                dispatch({ type: "clearChat" });
                setStarted(false);
                scrollRef.current?.scrollTo({ top: 0 });
              }}
              disabled={thinking}
              aria-label="New chat"
              className="pressable paper-glass ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label disabled:opacity-40"
            >
              <ResetIcon size={16} />
            </button>
          )}
        </div>
      </header>

      <div
        ref={scrollRef}
        className="scroll-y absolute inset-0 px-3"
        style={{
          paddingTop: `calc(var(--sat) + 62px)`,
          // The start screen has no input bar, so its corner buttons sit just above the tabs.
          paddingBottom: showChoices
            ? "calc(var(--tabbar-h) + var(--sab) + 4px)"
            : `calc(${composerH + 40}px + var(--tabbar-h) + var(--sab))`, // clear of the bar's fade, so the last buttons stay crisp
          // Messages fade out under the title instead of colliding with it.
          WebkitMaskImage: `linear-gradient(to bottom, transparent calc(var(--sat) + 48px), #000 ${fadeTop})`,
          maskImage: `linear-gradient(to bottom, transparent calc(var(--sat) + 48px), #000 ${fadeTop})`,
        }}
      >
        {empty ? (
          showChoices ? (
            <AskChoices
              hello={greeted ? "Hi again!" : `Hi${state.userName ? ` ${state.userName}` : ""}! I’m Penny.`}
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
            {messages.map((m, i) =>
              // Penny's full answer starts with the item itself, so the question right before it would repeat it.
              m.id === holdId || (m.role === "user" && messages[i + 1]?.plans) ? null : (
              <Message
                key={m.id}
                m={m}
                animate={restored.current !== null && i >= restored.current}
                showReplies={m === last && !thinking && !holdId}
                busy={thinking}
                goals={state.goals}
                onOpenGoal={onOpenGoal}
                onAnswer={answerAsk}
                onChecksDone={() => finishChecks(m)}
                onAction={(a) => onAction(m, a)}
                onChoose={(o) => choosePlan(m, o)}
                onToggle={(k) => togglePlans(m, k)}
                onReply={(t) => send({ text: t })}
              />
              ),
            )}
            {(thinking || holdId) && <Thinking />}
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
            onSend={handleSend}
            onTextInstead={textInstead}
            onAdd={() => setGalleryOpen(true)}
            compact={messages.length > 0 || thinking}
          />
        ) : (
          <>
            {/* Once a chat is going, the mic inside the text box is enough */}
            {canTalk && messages.length === 0 && (
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
              onSend={handleSend}
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
  goals,
  onOpenGoal,
  onAnswer,
  onChecksDone,
  onAction,
  onReply,
  onChoose,
  onToggle,
}: {
  m: ChatMessage;
  animate: boolean;
  showReplies: boolean;
  busy: boolean;
  goals: Goal[];
  onOpenGoal: (id: string) => void;
  onAnswer: (text: string) => void;
  onChecksDone: () => void;
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

      {m.tracking ? (
        <div className="flex w-full flex-col gap-2">
          <div className="flex max-w-[92%] items-end gap-1">
            <Mascot mood={m.mood ?? "celebrating"} size={48} className="-mb-1 shrink-0" />
            <p className="paper-glass rounded-[22px] px-4 py-2.5 text-[17px] leading-[22px] text-label">{m.text}</p>
          </div>
          {(() => {
            const g = goals.find((x) => x.id === m.tracking!.goalId);
            return g ? <TrackingCard goal={g} onOpen={() => onOpenGoal(g.id)} /> : null;
          })()}
        </div>
      ) : m.checks ? (
        <Checks item={m.checks.item} goals={goals} live={showReplies} onDone={onChecksDone} />
      ) : m.ask ? (
        <div className="flex w-full flex-col items-start gap-2">
          <div className="flex max-w-[92%] items-end gap-1">
            <Mascot mood={m.mood ?? "listening"} size={48} className="-mb-1 shrink-0" />
            <div className="paper-glass rounded-[22px] px-4 py-2.5">
              {m.ask.step === "when" && (
                <div className="mb-2 flex items-center gap-2.5">
                  {m.ask.item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.ask.item.image} alt="" className="h-12 w-12 shrink-0 rounded-[12px] object-cover" draggable={false} />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] text-label-2">{m.ask.item.name}</span>
                    <span className="tabular block text-[19px] font-bold leading-[22px] text-label">{money(m.ask.item.price)}</span>
                  </span>
                </div>
              )}
              {/* The item is shown above, so only the question is written out (Penny says the whole line) */}
              <p className="text-[17px] leading-[22px] text-label">{m.ask.step === "when" ? m.text.replace(/^.*?\.\s+/, "") : m.text}</p>
            </div>
          </div>
          {showReplies && (
            <div className="flex flex-wrap gap-2 pl-[52px]">
              {(m.ask.step === "when" ? WHEN_CHIPS : USE_CHIPS).map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onAnswer(c.label)}
                  className="pressable h-10 rounded-full bg-cta px-4 text-[15px] font-medium text-on-cta"
                >
                  {c.label}
                </button>
              ))}
              <button type="button" onClick={() => onAnswer("Skip")} className="pressable h-10 px-2 text-[14px] font-medium text-label-2 underline-offset-2 hover:underline">
                Skip
              </button>
            </div>
          )}
        </div>
      ) : m.plans ? (
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

const GREETED_KEY = "ciat:penny-greeted";

/** The goal Penny just made: progress, the savings timeline, and where to find it or get a reminder. */
function TrackingCard({ goal, onOpen }: { goal: Goal; onOpen: () => void }) {
  const pct = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0;
  const next = nextStep(goal);
  return (
    <div className="ml-[52px] rounded-[22px] bg-card p-3.5">
      <div className="flex items-center gap-3">
        {goal.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={goal.image} alt="" className="h-12 w-12 shrink-0 rounded-[12px] object-cover" draggable={false} />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-label">{goal.name}</p>
          <p className="tabular text-[13px] text-label-2">
            {money(goal.saved)} of {money(goal.target)} saved
          </p>
        </div>
        <span className="tabular rounded-full bg-[#e1ead0] px-2 py-0.5 text-[13px] font-bold text-[#3f6b2c]">{Math.round(pct * 100)}%</span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-fill">
        <div className="h-full rounded-full bg-[#4f8a4f] transition-[width] duration-500" style={{ width: `${pct * 100}%` }} />
      </div>

      {/* Timeline: each month's set-aside, then the month it's yours */}
      <ol className="mt-3 flex items-start">
        {goal.schedule?.map((s) => (
          <li key={s.month} className="flex flex-1 flex-col items-center text-center">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                s.done ? "bg-[#4f8a4f] text-white" : "border-2 border-[#4f8a4f]/40 text-transparent"
              }`}
              aria-hidden
            >
              ✓
            </span>
            <span className="mt-1 text-[12px] text-label-2">{s.done ? stepMonth(s.month) : stepDate(s.month)}</span>
            <span className="tabular text-[13px] font-semibold text-label">{money(s.amount)}</span>
          </li>
        ))}
        <li className="flex flex-1 flex-col items-center text-center">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fbe6dc] text-[12px]" aria-hidden>
            ★
          </span>
          <span className="mt-1 text-[12px] text-label-2">{goal.getIt?.slice(0, 3)}</span>
          <span className="text-[13px] font-semibold text-label">Yours</span>
        </li>
      </ol>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onOpen} className="pressable h-10 rounded-full bg-cta text-[14px] font-semibold text-on-cta">
          See goal
        </button>
        {next ? (
          <a
            href={calendarLink(goal, next)}
            className="pressable flex h-10 items-center justify-center rounded-full bg-fill text-[14px] font-semibold text-label"
          >
            Add to Calendar
          </a>
        ) : (
          <span className="flex h-10 items-center justify-center text-[14px] font-semibold text-[#3f6b2c]">Fully saved</span>
        )}
      </div>
    </div>
  );
}

/**
 * "Checking your month…": the numbers Penny looks at, ticked off one by one, then her answer follows.
 * Tap to skip ahead. Restored from an earlier visit, it just shows every line.
 */
function Checks({ item, goals, live, onDone }: { item: PlansCard; goals: Goal[]; live: boolean; onDone: () => void }) {
  const lines = checkLines(item, goals);
  const [shown, setShown] = useState(live ? 0 : lines.length);
  const done = useRef(false);
  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setShown(lines.length);
    onDone();
  }, [lines.length, onDone]);
  useEffect(() => {
    if (!live) return;
    if (shown < lines.length) {
      const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 350 : 650);
      return () => clearTimeout(t);
    }
    const t = setTimeout(finish, 800);
    return () => clearTimeout(t);
  }, [shown, live]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button type="button" onClick={live ? finish : undefined} className="flex w-full items-end gap-1 text-left" aria-label="Checking your month">
      <Mascot mood="thinking" size={48} className="-mb-1 shrink-0" />
      <div className="paper-glass min-w-0 flex-1 rounded-[22px] px-4 py-3">
        <p className="flex items-center gap-2 text-[15px] font-semibold text-label">
          {shown < lines.length ? "Checking your month…" : "Here’s what I see"}
          {shown < lines.length && (
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-label-2" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          )}
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {lines.map((l, i) => (
            <motion.li
              key={l.label}
              initial={false}
              animate={{ opacity: i < shown ? 1 : 0.25 }}
              className="flex items-center gap-2 text-[14px] leading-[18px]"
            >
              <span
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                  i < shown ? "bg-[#4f8a4f] text-white" : "bg-fill text-transparent"
                }`}
                aria-hidden
              >
                ✓
              </span>
              <span className="min-w-0 flex-1 truncate text-label-2">{l.label}</span>
              <span className="tabular shrink-0 font-semibold text-label">{l.value}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </button>
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

/**
 * The Talk to Penny start screen: Penny asks one question and the mic sits right under it.
 * Quieter ways in sit in the bottom corners: + (photo or demo item) on the left, keyboard on the right.
 */
function AskChoices({
  hello,
  canTalk,
  onTalk,
  onType,
  onPhoto,
}: {
  hello: string;
  canTalk: boolean;
  onTalk: () => void;
  onType: () => void;
  onPhoto: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center text-center">
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        {/* Penny's hello, in a speech bubble over her */}
        <span className="paper-glass relative mb-2 rounded-[18px] px-4 py-2 text-[16px] font-semibold text-label after:absolute after:left-1/2 after:top-full after:-ml-[7px] after:border-[7px] after:border-transparent after:border-t-[var(--card,#fff)] after:content-['']">
          {hello}
        </span>
        <Mascot mood="listening" size={104} />
        <p className="mt-3 text-[32px] font-bold leading-[37px] tracking-[-0.02em] text-label">
          What are you
          <br />
          thinking of buying?
        </p>
        <p className="mt-2 text-[15px] leading-[20px] text-label-2">Tell me and I’ll help you decide.</p>

        <button
          type="button"
          onClick={canTalk ? onTalk : onType}
          aria-label={canTalk ? "Talk to Penny" : "Type to Penny"}
          className="relative mt-9 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-cta text-on-cta shadow-[0_0_0_10px_rgba(169,194,126,0.22),0_0_44px_8px_rgba(169,194,126,0.55)] transition-transform active:scale-95"
        >
          {canTalk ? <MicIcon size={28} /> : <KeyboardIcon size={28} />}
        </button>
        <p className="mt-5 text-[14px] font-medium text-label-2">{canTalk ? "Tap to talk" : "Tap to type"}</p>
      </div>

      {/* Secondary ways in, one per corner */}
      <div className="flex w-full items-end justify-between px-1.5 pb-2">
        <CornerButton onClick={onPhoto} label="Add a photo or pick an item" caption="Add photo">
          <PlusIcon size={22} />
        </CornerButton>
        <CornerButton onClick={onType} label="Type instead" caption="Type">
          <KeyboardIcon size={22} />
        </CornerButton>
      </div>
    </div>
  );
}

function CornerButton({
  onClick,
  label,
  caption,
  children,
}: {
  onClick: () => void;
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="pressable flex w-16 flex-col items-center gap-1">
      <span className="paper-glass flex h-12 w-12 items-center justify-center rounded-full text-label">{children}</span>
      <span className="text-[12px] font-medium text-label-2">{caption}</span>
    </button>
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

function SpeakerIcon({ off }: { off: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" />
      {off ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
    </svg>
  );
}
