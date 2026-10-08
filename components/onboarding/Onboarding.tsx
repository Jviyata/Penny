"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useState } from "react";
import { DEMO_ITEMS } from "@/lib/demoItems";
import { money } from "@/lib/format";
import { GOALS, type Goal } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { BagIcon, CheckIcon, ClockIcon, HeartIcon, PlusIcon, goalLook } from "../ui/Icons";
import { GoalOrderList } from "../goals/GoalOrderList";
import { Mascot } from "../ui/Mascot";

/** The app's name on the welcome screen. */
export const BRAND = "SpendQ";
const GREEN = "#2d4a35";

/** Goals you can pick during setup. The first three are the demo's goals, with their progress. */
const GOAL_CHOICES: Goal[] = [
  GOALS.find((g) => g.id === "japan")!,
  GOALS.find((g) => g.id === "laptop")!,
  GOALS.find((g) => g.id === "move")!,
  { id: "heels", name: "Dior heels", target: 1100, saved: 440, thisMonth: 220, by: "By December" },
  { id: "car", name: "Green SUV", target: 8000, saved: 1200, thisMonth: 200, by: "In 2 years" },
  { id: "furniture", name: "Sectional sofa", target: 1200, saved: 150, thisMonth: 75, by: "By spring" },
];

const SLIDES = 4; // the welcome, then three slides on what the app does
const SETUP = 3; // after Log in: your name, your goals, your Overview

/** Goals added during setup start with a $1,000 target, which can be changed on the goal's page. */
const customGoal = (name: string): Goal => ({ id: `custom-${Date.now()}`, name, target: 1000, saved: 0, thisMonth: 0, by: "No date yet" });

/**
 * First run. Before Log in: a swipeable slideshow (the welcome, then what the app does) with the
 * Log in button always underneath. After it: your name, your goals (pick or add your own),
 * and the order they show in (the top three are on Overview, the rest under More goals).
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { dispatch } = useStore();
  const [phase, setPhase] = useState<"intro" | "setup">("intro");
  const [slide, setSlide] = useState(0);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [custom, setCustom] = useState<Goal[]>([]);
  // The goals you picked, in the order they'll show.
  const [order, setOrder] = useState<string[]>(["japan", "laptop", "move"]);
  const all = [...GOAL_CHOICES, ...custom];

  const goSlide = (to: number) => {
    if (to < 0 || to >= SLIDES) return;
    setDir(to > slide ? 1 : -1);
    setSlide(to);
  };
  const logIn = () => {
    setDir(1);
    setStep(1);
    setPhase("setup");
  };
  const goStep = (to: number) => {
    if (to < 1) {
      setDir(-1);
      setPhase("intro");
      return;
    }
    setDir(to > step ? 1 : -1);
    setStep(Math.min(SETUP, to));
  };
  const toggle = (id: string) => setOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const addCustom = (label: string) => {
    const g = customGoal(label);
    setCustom((c) => [...c, g]);
    setOrder((o) => [...o, g.id]); // new goals go last, so they start under More goals
  };
  const finish = () => {
    const goals = order.map((id) => all.find((g) => g.id === id)).filter((g): g is Goal => !!g).map((g) => ({ ...g }));
    dispatch({ type: "finishOnboarding", name: name.trim(), goals });
    onDone();
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50) goSlide(slide + 1);
    else if (info.offset.x > 50) goSlide(slide - 1);
  };

  const intro = phase === "intro";
  const dots = (count: number, at: number, onPick?: (i: number) => void) => (
    <div className="flex gap-2" aria-label={`${at + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          tabIndex={onPick ? 0 : -1}
          onClick={() => onPick?.(i)}
          aria-label={onPick ? `Slide ${i + 1}` : undefined}
          className={`h-2 rounded-full transition-all ${i === at ? "w-5" : "w-2 bg-[#d9dcd5]"}`}
          style={i === at ? { background: GREEN } : undefined}
        />
      ))}
    </div>
  );

  return (
    <div className="absolute inset-0 z-[60] flex flex-col overflow-hidden bg-[#fbfaf7] pb-[calc(var(--sab)+16px)] pt-[calc(var(--sat)+12px)]">
      <div className="flex h-8 justify-end px-5">
        {!intro && (
          <span className="flex items-center rounded-full bg-[#e6ecdf] px-3 text-[12px] font-semibold tracking-[0.04em] text-[#3d5a44]">
            DEMO SETUP
          </span>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={intro ? `slide-${slide}` : `step-${step}`}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d * 60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            // Only the slideshow swipes; setup steps use the buttons (and the goal list drags up and down).
            drag={intro ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={onDragEnd}
            className="absolute inset-0 flex flex-col px-6"
          >
            {intro && slide === 0 && <Welcome />}
            {intro && slide === 1 && <Intention />}
            {intro && slide === 2 && <Fits />}
            {intro && slide === 3 && <GoalsInView />}
            {!intro && step === 1 && <Name name={name} onName={setName} onNext={() => goStep(2)} />}
            {!intro && step === 2 && <PickGoals all={all} picked={order} onToggle={toggle} onAdd={addCustom} />}
            {!intro && step === 3 && <Arrange goals={all} order={order} onOrder={setOrder} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {intro ? (
        // The slideshow's dots, then Log in, always in reach
        <div className="flex flex-col items-center gap-3 px-6 pt-3">
          {/* Arrows on either side of the dots, for anyone who doesn't swipe */}
          <div className="flex items-center gap-4">
            <SlideArrow dir={-1} disabled={slide === 0} onClick={() => goSlide(slide - 1)} />
            {dots(SLIDES, slide, goSlide)}
            <SlideArrow dir={1} disabled={slide === SLIDES - 1} onClick={() => goSlide(slide + 1)} />
          </div>
          <span className="rounded-full bg-[#e6ecdf] px-3 py-1 text-[12px] font-semibold tracking-[0.06em] text-[#3d5a44]">DEMO</span>
          <button type="button" onClick={logIn} className="pressable h-[56px] w-full rounded-full text-[17px] font-semibold text-white" style={{ background: GREEN }}>
            Log in
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 px-6 pt-3">
          {dots(SETUP, step - 1)}
          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={() => goStep(step - 1)}
              className="pressable h-[52px] rounded-full border border-[#cfd5cb] px-6 text-[16px] font-medium text-label"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => (step === SETUP ? finish() : goStep(step + 1))}
              disabled={step >= 2 && order.length === 0}
              className="pressable h-[52px] flex-1 rounded-full text-[17px] font-semibold text-white disabled:opacity-40"
              style={{ background: GREEN }}
            >
              {step === SETUP ? "Start with Penny" : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SlideArrow({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir > 0 ? "Next slide" : "Previous slide"}
      className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-white text-label shadow-[inset_0_0_0_1px_#dfe2db] transition-opacity disabled:opacity-0"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir > 0 ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"} />
      </svg>
    </button>
  );
}

function Heading({ title, sub }: { title: React.ReactNode; sub?: string }) {
  return (
    <div className="pt-6 [@media(max-height:720px)]:pt-2">
      <h1 className="text-[40px] font-bold leading-[44px] tracking-[-0.03em] text-[#1a1f1b] [@media(max-height:720px)]:text-[34px] [@media(max-height:720px)]:leading-[38px]">
        {title}
      </h1>
      {sub && <p className="mt-3 text-[18px] leading-[23px] text-label-2">{sub}</p>}
    </div>
  );
}

/**
 * 0. Welcome. One clear order: Penny says hi (speech bubble right above her), then the name,
 * then the promise, then the one button.
 */
function Welcome() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      {/* Penny, with her greeting as a speech bubble pointing down at her */}
      <div className="relative rounded-[20px] bg-white px-5 py-2.5 text-[18px] font-semibold text-label shadow-[0_8px_24px_-12px_rgba(30,40,30,0.35)]">
        Hi, I’m Penny!
        <span className="absolute -bottom-[7px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px] bg-white" aria-hidden />
      </div>
      <div className="relative mt-4 flex items-center justify-center">
        <span className="absolute h-[230px] w-[230px] rounded-full bg-[#e9efe2] [@media(max-height:720px)]:h-[150px] [@media(max-height:720px)]:w-[150px]" aria-hidden />
        <Mascot mood="go_for_it" size={230} className="relative [@media(max-height:720px)]:!h-[150px] [@media(max-height:720px)]:!w-[150px]" />
      </div>

      <p className="mt-8 text-[52px] font-bold leading-[56px] tracking-[-0.04em] [@media(max-height:720px)]:mt-5 [@media(max-height:720px)]:text-[44px]" style={{ color: GREEN }}>
        {BRAND}
      </p>
      <p className="mt-2 text-[19px] leading-[24px] text-label-2">Know what to spend on.</p>
      <p className="mt-6 text-[14px] text-label-3 [@media(max-height:720px)]:hidden">Swipe to see how it works</p>
    </div>
  );
}

/** 1. Spend with intention: Penny asks the question the whole app is about. */
function Intention() {
  const boots = DEMO_ITEMS.find((i) => i.id === "boots")!;
  return (
    <div className="flex h-full flex-col">
      <Heading
        title={
          <>
            Spend with
            <br />
            intention.
          </>
        }
        sub="Decide before you buy."
      />
      <div className="relative flex flex-1 items-start justify-end pt-6 [@media(max-height:720px)]:pt-3">
        <div className="relative w-[80%] rotate-[3deg] rounded-[28px] bg-white p-3.5 shadow-[0_22px_48px_-22px_rgba(30,40,30,0.45)] [@media(max-height:720px)]:w-[56%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={boots.art} alt="" className="aspect-square w-full rounded-[18px]" draggable={false} />
          <span className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-label">
            <HeartIcon size={20} />
          </span>
          <div className="mt-3 flex items-baseline justify-between px-1 pb-1">
            <p className="text-[19px] font-semibold text-label">Zara Boots</p>
            <p className="tabular text-[17px] font-semibold text-label">{money(boots.price)}</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 flex items-end">
          <Mascot mood="thinking" size={112} className="[@media(max-height:720px)]:!h-[88px] [@media(max-height:720px)]:!w-[88px]" />
          <span className="mb-14 -ml-2 rounded-[18px] rounded-bl-[6px] bg-white px-3.5 py-2 text-[15px] leading-[19px] text-label shadow-[0_6px_20px_-10px_rgba(30,40,30,0.35)] [@media(max-height:720px)]:mb-10">
            Buy now
            <br />
            or wait?
          </span>
        </div>
      </div>
    </div>
  );
}

/** 2. Know what fits: tap an answer and Penny shows what it means for the boots. */
const FIT_CHOICES = [
  {
    id: "now",
    Icon: BagIcon,
    label: "Buy now",
    tint: "#e3ecd8",
    ink: "#2d4a35",
    mood: "approved" as const,
    say: "It’s yours today, and you still have $871 for the month.",
    chip: "Yours today",
  },
  {
    id: "wait",
    Icon: ClockIcon,
    label: "Wait",
    tint: "#f6ecd6",
    ink: "#8a5d12",
    mood: "thinking" as const,
    say: "Set aside $95 a month and they’re yours in December.",
    chip: "$95 a month",
  },
  {
    id: "later",
    Icon: HeartIcon,
    label: "Save for later",
    tint: "#f8e1dd",
    ink: "#a8423a",
    mood: "listening" as const,
    say: "I’ll keep them on your Wishlist and remind you when it fits.",
    chip: "On your Wishlist",
  },
];

function Fits() {
  const boots = DEMO_ITEMS.find((i) => i.id === "boots")!;
  const [pick, setPick] = useState("wait");
  const choice = FIT_CHOICES.find((c) => c.id === pick)!;
  return (
    <div className="flex h-full flex-col">
      <Heading
        title={
          <>
            Know what
            <br />
            fits.
          </>
        }
        sub="Buy now, wait, or save it. Try one."
      />

      {/* The item we're deciding on */}
      <div className="mt-5 flex items-center gap-3 rounded-[18px] bg-white p-2 pr-4 shadow-[0_8px_20px_-14px_rgba(30,40,30,0.35)] [@media(max-height:720px)]:mt-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={boots.art} alt="" className="h-12 w-12 rounded-[12px] object-cover" draggable={false} />
        <span className="flex-1 text-[16px] font-semibold text-label">Zara Boots</span>
        <span className="tabular text-[16px] font-semibold text-label">{money(boots.price)}</span>
      </div>

      {/* The three answers: tap one */}
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {FIT_CHOICES.map((c) => {
          const on = c.id === pick;
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => setPick(c.id)}
              aria-pressed={on}
              animate={{ scale: on ? 1.04 : 1, y: on ? -4 : 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 320 }}
              className="relative flex h-[168px] flex-col items-center justify-center gap-3 rounded-[24px] text-center [@media(max-height:720px)]:h-[104px]"
              style={{
                background: on ? c.ink : c.tint,
                color: on ? "#fff" : c.ink,
                boxShadow: on ? "0 16px 30px -16px rgba(30,40,30,0.55)" : "none",
              }}
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full [@media(max-height:720px)]:h-11 [@media(max-height:720px)]:w-11"
                style={{ background: on ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.7)" }}
              >
                <c.Icon size={28} />
              </span>
              <span className="px-1 text-[16px] font-semibold leading-[19px]">{c.label}</span>
              {on && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white" style={{ color: c.ink }}>
                  <CheckIcon size={12} />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* What that choice means, from Penny */}
      <div className="flex flex-1 items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={choice.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex w-full items-end gap-2"
          >
            <Mascot mood={choice.mood} size={112} className="shrink-0 [@media(max-height:720px)]:!h-[72px] [@media(max-height:720px)]:!w-[72px]" />
            <div className="mb-6 flex-1 rounded-[20px] rounded-bl-[6px] bg-white px-4 py-3.5 shadow-[0_8px_24px_-12px_rgba(30,40,30,0.35)] [@media(max-height:720px)]:mb-3">
              <span className="inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold text-white" style={{ background: choice.ink }}>
                {choice.chip}
              </span>
              <p className="mt-1.5 text-[15px] leading-[20px] text-label">{choice.say}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** 3. Keep goals in view. */
function GoalsInView() {
  const goals = GOAL_CHOICES.slice(0, 3);
  return (
    <div className="flex h-full flex-col">
      <Heading
        title={
          <>
            Keep goals
            <br />
            in view.
          </>
        }
        sub="Save for what matters."
      />
      <div className="mt-6 flex flex-col gap-3 [@media(max-height:720px)]:mt-4 [@media(max-height:720px)]:gap-2">
        {goals.map((g) => {
          const { Icon, bg, photo } = goalLook(g.name);
          return (
            <div key={g.id} className="overflow-hidden rounded-[20px] bg-white shadow-[0_10px_30px_-20px_rgba(30,40,30,0.4)]">
              <div
                className="h-[96px] w-full [@media(max-height:720px)]:h-[64px]"
                style={{ background: photo ? `${bg} center / cover no-repeat url(${photo})` : bg }}
              />
              <div className="flex items-center gap-3 px-4 py-3 [@media(max-height:720px)]:py-2">
                <Icon size={20} className="text-label-2" />
                <span className="text-[17px] font-semibold text-label">{g.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 4. Demo setup: your name. */
function Name({ name, onName, onNext }: { name: string; onName: (n: string) => void; onNext: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Heading
        title={
          <>
            What should
            <br />
            we call you?
          </>
        }
      />
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onNext()}
        placeholder="Your first name"
        autoComplete="given-name"
        enterKeyHint="next"
        className="mt-10 h-[64px] w-full rounded-[18px] border border-[#d8dbd4] bg-white px-5 text-[22px] text-label outline-none focus:border-[#2d4a35] [@media(max-height:720px)]:mt-6"
      />
      <div className="flex flex-1 items-end">
        <div className="flex items-end">
          <Mascot mood="celebrating" size={110} className="[@media(max-height:720px)]:!h-[80px] [@media(max-height:720px)]:!w-[80px]" />
          <span className="mb-12 -ml-1 rounded-[18px] rounded-bl-[6px] bg-white px-3.5 py-2 text-[15px] leading-[19px] text-label shadow-[0_6px_20px_-10px_rgba(30,40,30,0.35)]">
            {name.trim() ? `Nice to meet you, ${name.trim()}!` : "I’m Penny. And you?"}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Setup 2: pick goals as simple labels, or add your own. */
function PickGoals({
  all,
  picked,
  onToggle,
  onAdd,
}: {
  all: Goal[];
  picked: string[];
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const save = () => {
    const label = draft.trim();
    if (label) onAdd(label);
    setDraft("");
    setAdding(false);
  };
  return (
    <div className="flex h-full flex-col">
      <Heading
        title={
          <>
            What are you
            <br />
            saving for?
          </>
        }
        sub="Pick a few, or add your own."
      />
      <div className="scroll-y -mx-1 mt-6 min-h-0 flex-1 px-1 pb-2 [@media(max-height:720px)]:mt-4">
        <div className="flex flex-wrap gap-2.5">
          {all.map((g) => {
            const on = picked.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onToggle(g.id)}
                aria-pressed={on}
                className={`pressable flex h-12 items-center gap-2 rounded-full px-5 text-[16px] font-medium transition-colors ${
                  on ? "text-white" : "bg-white text-label shadow-[inset_0_0_0_1px_#dfe2db]"
                }`}
                style={on ? { background: GREEN } : undefined}
              >
                {on && <CheckIcon size={15} />}
                {g.name}
              </button>
            );
          })}
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="pressable flex h-12 items-center gap-1.5 rounded-full px-5 text-[16px] font-medium text-[#3d5a44] shadow-[inset_0_0_0_1.5px_#b9c7b3]"
              style={{ borderStyle: "dashed" }}
            >
              <PlusIcon size={16} /> Add a goal
            </button>
          )}
        </div>
        {adding && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="mt-3 flex gap-2"
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 32))}
              placeholder="Name your goal"
              enterKeyHint="done"
              className="h-12 min-w-0 flex-1 rounded-full border border-[#d8dbd4] bg-white px-5 text-[16px] text-label outline-none focus:border-[#2d4a35]"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="pressable h-12 rounded-full px-5 text-[16px] font-semibold text-white disabled:opacity-40"
              style={{ background: GREEN }}
            >
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/** Setup 3: put your goals in order. The top three show on Overview; the rest go under More goals. */
function Arrange({ goals, order, onOrder }: { goals: Goal[]; order: string[]; onOrder: (ids: string[]) => void }) {
  const name = (id: string) => goals.find((g) => g.id === id)?.name ?? "";
  return (
    <div className="flex h-full flex-col">
      <Heading title="Make it yours." sub="Drag to reorder. Your top three show on Overview." />
      <div className="scroll-y -mx-1 mt-5 min-h-0 flex-1 px-1 pb-2 [@media(max-height:720px)]:mt-3">
        <GoalOrderList ids={order} name={name} onOrder={onOrder} />
      </div>
    </div>
  );
}
