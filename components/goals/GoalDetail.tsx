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
export function GoalDetail({
  goalId,
  onBack,
  onAskPenny,
}: {
  goalId: string;
  onBack: () => void;
  onAskPenny: (question: string) => void;
}) {
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
  // The money in Penny's tip ("~$105") is green, like the rest of the good news.
  const [tipLead, tipAmount, tipRest] = splitAmount(tip.text);

  return (
    <div className="absolute inset-0 bg-[var(--bg)]">
    <div className="scroll-y absolute inset-0 pb-[calc(var(--tabbar-h)+var(--sab)+16px)]">
      {/* The goal's picture, full width, with its name and target on it */}
      <div
        className="relative h-[312px] w-full [@media(max-height:720px)]:h-[198px]"
        style={photo ? { background: `${look.bg} center / cover no-repeat url(${photo})` } : { background: look.bg, color: look.fg }}
      >
        {!photo && (
          <span className="absolute inset-0 flex items-center justify-center pb-10 opacity-60">
            <Icon size={96} />
          </span>
        )}
        {/* Shade so the white text and buttons always read */}
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.72) 100%)" }}
          aria-hidden
        />

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-[calc(var(--sat)+6px)]">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md"
          >
            <ChevronIcon size={20} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => edit(goal)}
            aria-label="Edit or remove goal"
            className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-[20px] font-bold leading-none tracking-[1px] text-white backdrop-blur-md"
          >
            ···
          </button>
        </div>

        {/* Name and target, centered in white over the photo's darker bottom */}
        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center px-6 text-center">
          <button type="button" onClick={() => edit(goal)} className="flex items-center gap-2">
            <span className="line-clamp-2 text-[36px] font-bold leading-[40px] tracking-[-0.025em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.45)]">
              {goal.name}
            </span>
            <PencilIcon size={17} className="shrink-0 text-white/75" />
          </button>
          <p className="mt-1.5 flex items-center gap-1.5 text-[15px] font-medium text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
            <CalendarIcon size={15} />
            {months !== null ? `Target: ${goal.by.replace(/^by\s+/i, "")}` : goal.by}
          </p>
        </div>
      </div>

      {/* Everything else sits on a card over the bottom of the picture */}
      <div className="relative -mt-6 rounded-t-[28px] bg-[var(--bg)] px-4 pt-4">
      {/* 1. Progress: the most important thing on the page */}
      <section className="rounded-[22px] bg-card px-5 pb-4 pt-3.5 [@media(max-height:720px)]:pb-3 [@media(max-height:720px)]:pt-3">
        <p className="text-[13px] font-medium text-label-2">Saved so far</p>
        <div className="mt-0.5 flex items-baseline justify-between">
          <p className="tabular">
            <span className="text-[36px] font-bold leading-[40px] tracking-[-0.025em] text-label">{money(goal.saved)}</span>
            <span className="ml-1.5 text-[17px] text-label-2">of {money(goal.target)}</span>
          </p>
          <span className="tabular rounded-full bg-[#e1ead0] px-2.5 py-0.5 text-[15px] font-bold text-[#3f6b2c]">{Math.round(pct * 100)}%</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-fill">
          <div className="h-full rounded-full bg-[#4f8a4f] transition-[width] duration-500" style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[13px] text-label-2">
          <span className="tabular">{left > 0 ? `${money(left)} to go` : "Fully saved"}</span>
          <span>{timeLeft}</span>
        </div>
      </section>

      {/* 2. The next step */}
      {action.href ? (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable mt-3 flex h-[52px] items-center justify-center gap-2 rounded-full bg-cta text-[17px] font-semibold text-on-cta"
        >
          {action.label}
          <ExternalIcon />
        </a>
      ) : (
        <button
          type="button"
          onClick={() => addMoney(goal)}
          className="pressable mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-cta text-[17px] font-semibold text-on-cta"
        >
          <PlusIcon size={18} />
          {action.label}
        </button>
      )}

      {/* 3. Supporting details, quieter and grouped */}
      <section className="mt-3 overflow-hidden rounded-[22px] bg-card">
        <button
          type="button"
          onClick={() => addMoney(goal)}
          className="pressable flex w-full items-center gap-3 px-4 py-3 text-left [@media(max-height:720px)]:pr-[68px]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbe6dc] text-[#c4613a]">
            <TargetIcon size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-label">Keep saving</span>
            <span className="block text-[13px] leading-[17px] text-label-2">{trackLine}</span>
          </span>
          <ChevronIcon size={15} className="shrink-0 text-label-3 [@media(max-height:720px)]:hidden" />
        </button>
        <div className="flex items-start gap-3 border-t border-[var(--sep)] px-4 py-3 [@media(max-height:720px)]:pr-[68px]">
          <Mascot mood="approved" size={40} className="-mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1 text-[14px] leading-[19px] text-label">
            <span className="block text-[13px] font-medium text-[#4f6b2c]">Penny’s tip</span>
            {tipLead}
            {tipAmount && <span className="font-semibold text-[#3f7f3f]">{tipAmount}</span>}
            {tipRest}
          </p>
        </div>
      </section>

      </div>
    </div>

      {/* Penny in the corner, offering to help with the goals */}
      <button
        type="button"
        onClick={() => onAskPenny(`Can you help me with my goals? I'm looking at ${goal.name}.`)}
        aria-label="Ask Penny for help with your goals"
        className="pressable absolute bottom-[calc(var(--tabbar-h)+var(--sab)+10px)] right-3 z-10 flex items-end gap-1"
      >
        <span className="relative mb-7 rounded-[18px] rounded-br-[6px] bg-white px-3.5 py-2 text-[14px] font-medium leading-[18px] text-label shadow-[0_8px_24px_-10px_rgba(30,40,30,0.4)] [@media(max-height:720px)]:hidden">
          Want help with your goals?
        </span>
        <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#e6ecdf] shadow-[0_10px_24px_-10px_rgba(30,40,30,0.5)] [@media(max-height:720px)]:h-[52px] [@media(max-height:720px)]:w-[52px]">
          <Mascot mood="listening" size={52} className="[@media(max-height:720px)]:!h-[42px] [@media(max-height:720px)]:!w-[42px]" />
        </span>
      </button>

      <LineEditorSheet config={editor} onClose={() => setEditor(null)} />
    </div>
  );
}

/** "…that's ~$105." → ["…that's ", "~$105", "."] */
function splitAmount(text: string): [string, string, string] {
  const m = text.match(/~?\$[\d,]+/);
  if (!m || m.index === undefined) return [text, "", ""];
  return [text.slice(0, m.index), m[0], text.slice(m.index + m[0].length)];
}

function ExternalIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
