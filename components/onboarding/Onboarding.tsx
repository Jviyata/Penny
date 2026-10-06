"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useState } from "react";
import { DEMO_ITEMS } from "@/lib/demoItems";
import { money } from "@/lib/format";
import { GOALS, type Goal } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { BagIcon, CheckIcon, ClockIcon, HeartIcon, goalLook } from "../ui/Icons";
import { Mascot } from "../ui/Mascot";

/** The app's name on the welcome screen. */
export const BRAND = "SpendQ";
const GREEN = "#2d4a35";

/** Goals you can pick during setup. The first three are the demo's goals, with their progress. */
const GOAL_CHOICES: Goal[] = [
  GOALS.find((g) => g.id === "japan")!,
  GOALS.find((g) => g.id === "laptop")!,
  GOALS.find((g) => g.id === "emergency")!,
  { id: "move", name: "Move out", target: 3000, saved: 0, thisMonth: 0, by: "Next summer" },
  { id: "car", name: "Car", target: 8000, saved: 0, thisMonth: 0, by: "In 2 years" },
  { id: "furniture", name: "New furniture", target: 1200, saved: 0, thisMonth: 0, by: "By spring" },
];

const STEPS = 5; // after the welcome screen

/**
 * First-run onboarding: a welcome screen, three screens on what the app does (with Penny),
 * then a quick demo setup (your name and your goals).
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState(0); // 0 = welcome, 1..5 = steps
  const [dir, setDir] = useState(1);
  const [name, setName] = useState(state.userName);
  const [picked, setPicked] = useState<string[]>(["japan", "laptop", "emergency"]);

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(Math.max(0, Math.min(STEPS, to)));
  };
  const finish = () => {
    const goals = GOAL_CHOICES.filter((g) => picked.includes(g.id)).map((g) => ({ ...g }));
    dispatch({ type: "finishOnboarding", name: name.trim(), goals });
    onDone();
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (step === 0) return;
    if (info.offset.x < -60 && step < STEPS) go(step + 1);
    else if (info.offset.x > 60 && step > 1) go(step - 1);
  };

  return (
    <div className="absolute inset-0 z-[60] flex flex-col overflow-hidden bg-[#fbfaf7] pb-[calc(var(--sab)+16px)] pt-[calc(var(--sat)+12px)]">
      {/* Demo setup tag on the setup screens */}
      <div className="flex h-8 justify-end px-5">
        {step >= 4 && (
          <span className="flex items-center rounded-full bg-[#e6ecdf] px-3 text-[12px] font-semibold tracking-[0.04em] text-[#3d5a44]">
            {step === 4 ? "DEMO SETUP" : "DEMO"}
          </span>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={step}
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
            drag={step === 0 ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={onDragEnd}
            className="absolute inset-0 flex flex-col px-6"
          >
            {step === 0 && <Welcome onStart={() => go(1)} />}
            {step === 1 && <Intention />}
            {step === 2 && <Fits />}
            {step === 3 && <GoalsInView />}
            {step === 4 && <Name name={name} onName={setName} onNext={() => go(5)} />}
            {step === 5 && (
              <PickGoals picked={picked} onToggle={(id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {step > 0 && (
        <div className="flex flex-col items-center gap-4 px-6 pt-3">
          <div className="flex gap-2" aria-label={`Step ${step} of ${STEPS}`}>
            {Array.from({ length: STEPS }, (_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${i + 1 === step ? "w-5" : "w-2 bg-[#d9dcd5]"}`}
                style={i + 1 === step ? { background: GREEN } : undefined}
              />
            ))}
          </div>
          <div className="flex w-full gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => go(step - 1)}
                className="pressable h-[52px] rounded-full border border-[#cfd5cb] px-6 text-[16px] font-medium text-label"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (step === STEPS ? finish() : go(step + 1))}
              disabled={step === STEPS && picked.length === 0}
              className="pressable h-[52px] flex-1 rounded-full text-[17px] font-semibold text-white disabled:opacity-40"
              style={{ background: GREEN }}
            >
              {step === STEPS ? "Start with Penny" : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
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
function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex h-full flex-col items-center text-center">
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* Penny, with her greeting as a speech bubble pointing down at her */}
        <div className="relative rounded-[20px] bg-white px-5 py-2.5 text-[18px] font-semibold text-label shadow-[0_8px_24px_-12px_rgba(30,40,30,0.35)]">
          Hi, I’m Penny!
          <span className="absolute -bottom-[7px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px] bg-white" aria-hidden />
        </div>
        <div className="relative mt-4 flex items-center justify-center">
          <span className="absolute h-[230px] w-[230px] rounded-full bg-[#e9efe2] [@media(max-height:720px)]:h-[170px] [@media(max-height:720px)]:w-[170px]" aria-hidden />
          <Mascot mood="go_for_it" size={230} className="relative [@media(max-height:720px)]:!h-[170px] [@media(max-height:720px)]:!w-[170px]" />
        </div>

        <p className="mt-8 text-[52px] font-bold leading-[56px] tracking-[-0.04em] [@media(max-height:720px)]:mt-5 [@media(max-height:720px)]:text-[44px]" style={{ color: GREEN }}>
          {BRAND}
        </p>
        <p className="mt-2 text-[19px] leading-[24px] text-label-2">Know what to spend on.</p>
      </div>

      <div className="w-full pb-1">
        <p className="mb-3 flex justify-center">
          <span className="rounded-full bg-[#e6ecdf] px-3 py-1 text-[12px] font-semibold tracking-[0.06em] text-[#3d5a44]">DEMO</span>
        </p>
        <button type="button" onClick={onStart} className="pressable h-[56px] w-full rounded-full text-[17px] font-semibold text-white" style={{ background: GREEN }}>
          Get started
        </button>
      </div>
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
      <div className="relative flex flex-1 items-start justify-end pr-2 pt-8 [@media(max-height:720px)]:pt-3">
        <div className="relative w-[58%] rotate-[3deg] [@media(max-height:720px)]:w-[46%] rounded-[26px] bg-white p-3 shadow-[0_18px_40px_-20px_rgba(30,40,30,0.4)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={boots.art} alt="" className="aspect-square w-full rounded-[18px]" draggable={false} />
          <HeartIcon size={22} className="absolute right-6 top-6 text-label" />
          <p className="mt-2.5 px-1 text-[17px] font-semibold text-label">Zara Boots</p>
          <p className="px-1 pb-1 text-[15px] text-label-2">{money(boots.price)}</p>
        </div>
        <div className="absolute bottom-0 left-0 flex items-end">
          <Mascot mood="thinking" size={130} className="[@media(max-height:720px)]:!h-[96px] [@media(max-height:720px)]:!w-[96px]" />
          <span className="mb-16 -ml-2 rounded-[18px] rounded-bl-[6px] bg-white px-3.5 py-2 text-[15px] leading-[19px] text-label shadow-[0_6px_20px_-10px_rgba(30,40,30,0.35)] [@media(max-height:720px)]:mb-10">
            Buy now
            <br />
            or wait?
          </span>
        </div>
      </div>
    </div>
  );
}

/** 2. Know what fits: the three answers Penny gives. */
function Fits() {
  const rows = [
    { Icon: BagIcon, label: "Buy now", bg: "#e8eedf", fg: GREEN },
    { Icon: ClockIcon, label: "Wait", bg: "#f3efe3", fg: "#1d1a17" },
    { Icon: HeartIcon, label: "Save for later", bg: "#f8e4e0", fg: "#a8423a" },
  ];
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
        sub="Buy now, wait, or save it."
      />
      <div className="mt-7 flex flex-col gap-3 [@media(max-height:720px)]:mt-4">
        {rows.map(({ Icon, label, bg, fg }) => (
          <div key={label} className="flex h-[84px] items-center gap-5 rounded-[20px] px-6 [@media(max-height:720px)]:h-[68px]" style={{ background: bg }}>
            <span className="shrink-0" style={{ color: fg }}>
              <Icon size={36} />
            </span>
            <span className="text-[19px] font-semibold text-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-1 items-end justify-end">
        <div className="flex items-end">
          <span className="mb-12 -mr-1 rounded-[18px] rounded-br-[6px] bg-white px-3.5 py-2 text-[15px] leading-[19px] text-label shadow-[0_6px_20px_-10px_rgba(30,40,30,0.35)]">
            I’ll show you which.
          </span>
          <Mascot mood="approved" size={110} className="[@media(max-height:720px)]:!h-[80px] [@media(max-height:720px)]:!w-[80px]" />
        </div>
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
          const { Icon, bg, photo, fit } = goalLook(g.name);
          return (
            <div key={g.id} className="overflow-hidden rounded-[20px] bg-white shadow-[0_10px_30px_-20px_rgba(30,40,30,0.4)]">
              <div
                className="h-[96px] w-full [@media(max-height:720px)]:h-[64px]"
                style={{ background: photo ? `${bg} center / ${fit === "100% auto" ? "50% auto" : "cover"} no-repeat url(${photo})` : bg }}
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

/** 5. Demo setup: pick a few goals. */
function PickGoals({ picked, onToggle }: { picked: string[]; onToggle: (id: string) => void }) {
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
        sub="Pick a few goals."
      />
      <div className="mt-5 grid grid-cols-2 gap-2.5 [@media(max-height:720px)]:mt-3 [@media(max-height:720px)]:gap-2">
        {GOAL_CHOICES.map((g) => {
          const on = picked.includes(g.id);
          const { Icon, bg, fg, photo, fit } = goalLook(g.name);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onToggle(g.id)}
              aria-pressed={on}
              className={`pressable relative overflow-hidden rounded-[18px] bg-white text-left ${
                on ? "shadow-[0_0_0_2px_#2d4a35]" : "shadow-[0_0_0_1px_#e3e5df]"
              }`}
            >
              <span
                className="flex h-[78px] w-full items-center justify-center [@media(max-height:720px)]:h-[56px]"
                style={photo ? { background: `${bg} center / ${fit === "100% auto" ? "62% auto" : "cover"} no-repeat url(${photo})` } : { background: bg, color: fg }}
              >
                {!photo && <Icon size={34} />}
              </span>
              <span className="block px-3 py-2.5 text-[15px] font-medium text-label [@media(max-height:720px)]:py-1.5">{g.name}</span>
              {on && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: GREEN }}>
                  <CheckIcon size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
