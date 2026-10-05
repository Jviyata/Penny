"use client";

import { useState } from "react";
import { VERDICT_LABEL, VERDICT_SYMBOL } from "@/lib/budget";
import { NEXT_MONTH, NEXT_MONTH_FREE } from "@/lib/demoData";
import { money } from "@/lib/format";
import { VERDICT_MOOD } from "@/lib/mood";
import type { CardAction, ResultCard as Card, Verdict } from "@/lib/types";
import { ArrowRightIcon, CheckIcon, ChevronIcon } from "../ui/Icons";
import { Mascot } from "../ui/Mascot";

// Green only means safe. Amber is "you can, but"; muted brown is "not right now". Never red.
const TONE: Record<Verdict, { bg: string; fg: string }> = {
  comfortable: { bg: "var(--v-comfortable-bg)", fg: "var(--v-comfortable)" },
  tight: { bg: "var(--v-tight-bg)", fg: "var(--v-tight)" },
  later: { bg: "var(--v-later-bg)", fg: "var(--v-later)" },
  not_this_month: { bg: "var(--v-not-bg)", fg: "var(--v-not)" },
};

const HEADLINE: Record<Verdict, string> = {
  comfortable: "Yep, this fits comfortably.",
  tight: "You can, but I’d think about it.",
  later: "You can, but I’d wait.",
  not_this_month: "Not right now.",
};

/**
 * Penny's answer as a mini decision card: the verdict, the reason in plain numbers,
 * what happens if you buy now vs. wait, two next steps, and an optional "Why?".
 */
export function ResultCard({
  card,
  reply,
  onAction,
  disabled,
}: {
  card: Card;
  reply: string;
  onAction: (a: CardAction) => void;
  disabled: boolean;
}) {
  const [why, setWhy] = useState(false);
  const tone = TONE[card.verdict];
  const fits = card.openAfter >= 0;
  const nextAfter = NEXT_MONTH_FREE - card.price;
  const [primary, secondary] = card.actions;

  const bestOption =
    card.verdict === "comfortable"
      ? "No goals or bills are affected."
      : card.verdict === "not_this_month"
        ? nextAfter >= 0
          ? `Best option: save it for ${NEXT_MONTH.name}. It fits there without touching your savings.`
          : `Best option: make it a goal and save up for it.`
        : `Best option: wait, unless you need it this month.`;

  return (
    <div className="relative w-full max-w-[350px] pt-10">
      <Mascot mood={VERDICT_MOOD[card.verdict]} size={card.image ? 84 : 100} className="absolute -right-1 top-0 z-10" />

      {/* The answer */}
      <div className="paper-glass rounded-[28px] p-3.5">
        {card.image && (
          <div className="mb-3 aspect-[5/2] w-full overflow-hidden rounded-[18px] bg-fill">
            <img src={card.image} alt={card.name} className="h-full w-full object-cover" draggable={false} />
          </div>
        )}
        <span
          className="inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold"
          style={{ background: tone.bg, color: tone.fg }}
        >
          <span aria-hidden>{VERDICT_SYMBOL[card.verdict]}</span>
          {VERDICT_LABEL[card.verdict]}
        </span>
        <p className="mt-2 text-[21px] font-bold leading-[26px] tracking-[-0.01em] text-label">{HEADLINE[card.verdict]}</p>
        <p className="selectable mt-1 text-[15px] leading-[20px] text-label-2">{reply}</p>
      </div>

      {/* The reason, in numbers */}
      <div className="mt-2 rounded-[24px] bg-card px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-[16px] font-semibold">{card.name}</p>
          <p className="tabular shrink-0 text-[16px] font-semibold">{money(card.price)}</p>
        </div>
        <p className="mt-0.5 text-[14px] text-label-2">
          You have <span className="tabular font-semibold text-label">{money(Math.max(card.openBefore, 0))}</span> free to spend this month.
        </p>

        <div className="mt-2.5 space-y-1.5">
          <Compare label="If you buy it now" from={card.openBefore} to={card.openAfter} good={card.verdict === "comfortable"} />
          {card.verdict !== "comfortable" && (
            <Compare label={`If you wait for ${NEXT_MONTH.name}`} from={NEXT_MONTH_FREE} to={nextAfter} good={nextAfter >= 0} />
          )}
        </div>

        <p className="mt-2.5 text-[14px] leading-[19px] text-label">
          {!fits && <span className="font-semibold">You’re {money(-card.openAfter)} short. </span>}
          {bestOption}
        </p>

        <button
          type="button"
          onClick={() => setWhy((w) => !w)}
          aria-expanded={why}
          className="-mb-1 mt-1.5 flex h-9 items-center gap-1 text-[14px] font-medium text-label-2"
        >
          Why?
          <ChevronIcon size={13} className={`transition-transform ${why ? "rotate-90" : ""}`} />
        </button>
        {why && (
          <p className="pb-1 text-[14px] leading-[19px] text-label-2">
            Your rent, bills and savings are already protected. Penny only compares purchases against the money that’s free to
            spend after your plans, and she won’t pull from savings to make something fit.
          </p>
        )}
      </div>

      {/* Two next steps, never more */}
      <div className="mt-2 flex flex-col gap-2">
        {primary && <ActionButton action={primary} card={card} disabled={disabled} onAction={onAction} primary />}
        {secondary && <ActionButton action={secondary} card={card} disabled={disabled} onAction={onAction} />}
      </div>
    </div>
  );
}

/** "If you buy it now   $115 → $90 left" */
function Compare({ label, from, to, good }: { label: string; from: number; to: number; good: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[14px] bg-fill px-3 py-2 text-[14px]">
      <span className="text-label-2">{label}</span>
      <span className="tabular flex shrink-0 items-center gap-1.5 font-semibold">
        <span className="text-label-2">{money(Math.max(from, 0))}</span>
        <span className="text-label-3" aria-hidden>
          →
        </span>
        <span style={{ color: to < 0 ? "var(--v-not)" : good ? "var(--v-comfortable)" : "var(--label)" }}>
          {to < 0 ? `${money(-to)} short` : `${money(to)} left`}
        </span>
      </span>
    </div>
  );
}

function ActionButton({
  action,
  card,
  disabled,
  onAction,
  primary,
}: {
  action: CardAction;
  card: Card;
  disabled: boolean;
  onAction: (a: CardAction) => void;
  primary?: boolean;
}) {
  const chosen = card.chosen === action.label;
  const muted = !!card.chosen && !chosen;
  return (
    <button
      type="button"
      disabled={disabled || !!card.chosen}
      onClick={() => onAction(action)}
      className={`pressable relative flex items-center justify-center gap-2 rounded-full transition-opacity disabled:active:scale-100 ${
        primary ? "h-[52px] bg-cta px-6 text-[17px] font-semibold text-on-cta" : "paper-glass h-12 px-3 text-[15px] font-semibold text-label"
      } ${muted ? "opacity-45" : ""}`}
    >
      {chosen && <CheckIcon />}
      <span className="truncate">{action.label}</span>
      {primary && !card.chosen && <ArrowRightIcon className="absolute right-5" />}
    </button>
  );
}
