"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import { goalExtras, pace } from "@/lib/goalPlan";
import type { Goal } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { LineEditorSheet, type EditorConfig } from "../free/LineEditorSheet";
import { CalendarIcon, ChevronIcon, PencilIcon, PlusIcon, TargetIcon, goalLook } from "../ui/Icons";
import { Mascot } from "../ui/Mascot";

/**
 * One goal up close: its picture, progress, Penny's tip for getting it for less,
 * the next step (shop, book or add money), and what it takes to stay on track.
 */
export function GoalDetail({ goalId, onBack }: { goalId: string; onBack: () => void }) {
  const { state, dispatch } = useStore();
  const goal = state.goals.find((g) => g.id === goalId);
  const [editor, setEditor] = useState<EditorConfig | null>(null);
  if (!goal) return null;

  const look = goalLook(goal.name);
  const photo = goal.image ?? look.photo;
  const fit = goal.image ? "cover" : look.fit;
  const pct = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0;
  const { left, months, extra, atPace } = pace(goal);
  const { tip, action } = goalExtras(goal);
  const Icon = look.Icon;

  const edit = (g: Goal) =>
    setEditor({
      title: "Edit goal",
      withName: true,
      name: g.name,
      amount: g.target,
      note: "The amount is your target.",
      onSave: (name, amount) => dispatch({ type: "editGoal", id: g.id, name, target: amount }),
      extra: {
        label: "Remove goal",
        onClick: () => {
          dispatch({ type: "removeGoal", id: g.id });
          onBack();
        },
      },
    });
  const addMoney = (g: Goal) =>
    setEditor({
      title: `Add to ${g.name}`,
      withName: false,
      note: `${money(g.saved)} of ${money(g.target)} saved so far.`,
      onSave: (_, amount) => dispatch({ type: "addToGoal", id: g.id, amount }),
    });

  const timeLeft =
    left === 0
      ? "Goal reached"
      : months !== null
        ? `About ${months} ${months === 1 ? "month" : "months"} left`
        : atPace !== null
          ? `About ${atPace} months at this pace`
          : "No end date";
  const trackLine =
    left === 0
      ? "You did it. Time to enjoy it."
      : extra !== null && extra > 0
        ? `Add ${money(extra)} more a month to reach it on time.`
        : months !== null
          ? `On pace: ${money(goal.thisMonth)} a month gets you there.`
          : `${money(goal.thisMonth || 50)} a month keeps it growing.`;
  // "You could earn ~$105 back": the amount in green, like the rest of the money that's good news.
  const [benefitLead, benefitAmount] = splitAmount(tip.benefit);

  return (
    <div className="scroll-y absolute inset-0 bg-[var(--bg)] px-4 pb-[calc(var(--tabbar-h)+var(--sab)+16px)] pt-[calc(var(--sat)+6px)]">
      {/* Top bar */}
      <div className="flex h-11 items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Back" className="pressable -ml-1 flex h-11 w-11 items-center justify-center text-label">
          <ChevronIcon size={22} className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => edit(goal)}
          aria-label="Edit or remove goal"
          className="pressable -mr-1 flex h-11 w-11 items-center justify-center text-[22px] font-bold leading-none tracking-[2px] text-label"
        >
          ···
        </button>
      </div>

      {/* The goal */}
      <div className="mt-1 flex items-center gap-4">
        <span
          className="flex h-[104px] w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-[24px] [@media(max-height:720px)]:h-[80px] [@media(max-height:720px)]:w-[80px]"
          style={photo ? { background: `${look.bg} center / ${fit ?? "cover"} no-repeat url(${photo})` } : { background: look.bg, color: look.fg }}
        >
          {!photo && <Icon size={40} />}
        </span>
        <div className="min-w-0">
          <button type="button" onClick={() => edit(goal)} className="flex items-center gap-2 text-left">
            <span className="line-clamp-2 text-[28px] font-bold leading-[32px] tracking-[-0.02em] text-label">{goal.name}</span>
            <PencilIcon size={16} className="shrink-0 text-label-3" />
          </button>
          <p className="mt-1.5 flex items-center gap-1.5 text-[15px] text-label-2">
            <CalendarIcon size={16} />
            {months !== null ? `Target: ${goal.by.replace(/^by\s+/i, "")}` : goal.by}
          </p>
        </div>
      </div>

      {/* Progress */}
      <section className="mt-4 rounded-[22px] bg-card px-5 py-4 [@media(max-height:720px)]:py-3">
        <div className="flex items-baseline justify-between">
          <p className="tabular">
            <span className="text-[32px] font-bold tracking-[-0.02em] text-label">{money(goal.saved)}</span>
            <span className="ml-1.5 text-[17px] text-label-2">of {money(goal.target)}</span>
          </p>
          <span className="tabular text-[19px] font-bold text-label">{Math.round(pct * 100)}%</span>
        </div>
        <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-fill">
          <div className="h-full rounded-full bg-[#4f8a4f] transition-[width] duration-500" style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[13px] text-label-2">
          <span className="tabular">{left > 0 ? `${money(left)} to go` : "Fully saved"}</span>
          <span>{timeLeft}</span>
        </div>
      </section>

      {/* Penny's tip */}
      <section className="mt-3 rounded-[22px] border border-[#dfe8d6] bg-[#f2f6ee] px-4 pb-3.5 pt-3.5">
        <div className="flex items-start gap-3">
          <Mascot mood="approved" size={48} className="-mt-1 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-label-2">Penny’s tip</p>
            <p className="text-[17px] font-semibold leading-[22px] text-label">{tip.title}</p>
            <p className="mt-0.5 text-[15px] text-label-2">
              {benefitLead}
              {benefitAmount && <span className="font-semibold text-[#3f7f3f]">{benefitAmount}</span>}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 rounded-[16px] bg-white/70 p-2 [@media(max-height:720px)]:hidden">
          {/* A generic card graphic: no real bank branding */}
          <div className="relative h-[68px] w-[108px] shrink-0 overflow-hidden rounded-[10px] bg-[linear-gradient(135deg,#1f2b4a,#2f4a7a_60%,#1c2640)] p-2 text-white shadow-[0_6px_14px_-8px_rgba(20,30,60,0.6)]">
            <span className="block text-[7px] font-semibold tracking-[0.12em] opacity-85">{tip.cardLabel}</span>
            <span className="absolute bottom-2.5 left-2 h-3.5 w-5 rounded-[3px] bg-[#d9c27a]/90" />
            <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full border border-white/15" />
            <span className="absolute -right-2 top-4 h-16 w-16 rounded-full border border-white/10" />
          </div>
          <div>
            <p className="text-[17px] font-semibold text-label">{tip.rate}</p>
            <p className="text-[13px] text-label-2">{tip.rateNote}</p>
          </div>
        </div>
      </section>

      {/* The next step */}
      {action.href ? (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable mt-3 flex h-14 items-center justify-center gap-2 rounded-full bg-cta text-[17px] font-semibold text-on-cta"
        >
          {action.label}
          <ExternalIcon />
        </a>
      ) : (
        <button
          type="button"
          onClick={() => addMoney(goal)}
          className="pressable mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-cta text-[17px] font-semibold text-on-cta"
        >
          <PlusIcon size={18} />
          {action.label}
        </button>
      )}

      {/* Staying on track */}
      <button type="button" onClick={() => addMoney(goal)} className="pressable mt-3 flex w-full items-center gap-3.5 rounded-[22px] bg-card px-4 py-3.5 text-left">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fbe6dc] text-[#c4613a]">
          <TargetIcon size={24} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] text-label-2">Staying on track</span>
          <span className="block text-[17px] font-semibold text-label">Keep saving</span>
          <span className="block text-[13px] leading-[17px] text-label-2">{trackLine}</span>
        </span>
        <ChevronIcon size={16} className="shrink-0 text-label-3" />
      </button>

      <LineEditorSheet config={editor} onClose={() => setEditor(null)} />
    </div>
  );
}

/** "You could earn ~$105 back" → ["You could earn ", "~$105 back"] */
function splitAmount(text: string): [string, string] {
  const i = text.search(/~?\$\d/);
  return i < 0 ? [text, ""] : [text.slice(0, i), text.slice(i)];
}

function ExternalIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
