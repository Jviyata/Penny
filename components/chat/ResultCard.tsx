"use client";

import { VERDICT_LABEL } from "@/lib/budget";
import { money } from "@/lib/format";
import { VERDICT_MOOD } from "@/lib/mood";
import type { CardAction, ResultCard as Card, Verdict } from "@/lib/types";
import { ArrowRightIcon, CheckIcon } from "../ui/Icons";
import { Mascot } from "../ui/Mascot";

const DOT: Record<Verdict, string> = {
  comfortable: "var(--v-comfortable)",
  tight: "var(--v-tight)",
  later: "var(--v-later)",
  not_this_month: "var(--v-not)",
};

/** One calm line that states what changes. Never "good" or "bad". */
function headline(card: Card): string {
  switch (card.verdict) {
    case "comfortable":
      return "This fits comfortably.";
    case "tight":
      return "A big chunk of what’s left.";
    case "later":
      return "Could this wait?";
    case "not_this_month":
      return "Not right now.";
  }
}

/**
 * What buying it would change: the mascot, a headline, the AI's reply,
 * the numbers (always computed by the app), and the choices. The user decides.
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
  const short = card.openAfter < 0;
  const [primary, ...rest] = card.actions;

  return (
    <div className="relative w-full max-w-[350px] pt-12">
      <Mascot
        mood={VERDICT_MOOD[card.verdict]}
        size={card.image ? 96 : 116}
        className={`absolute z-10 ${card.image ? "-right-1 top-2" : "left-1/2 top-0 -translate-x-1/2 -translate-y-6"}`}
      />

      {/* Headline */}
      <div className="paper-glass rounded-[30px] px-4 pb-4 pt-4 text-center">
        {card.image && (
          <div className="mb-3 aspect-[2/1] w-full overflow-hidden rounded-[20px] bg-fill">
            <img src={card.image} alt={card.name} className="h-full w-full object-cover" draggable={false} />
          </div>
        )}
        <p className={`text-[23px] font-bold leading-[28px] tracking-[-0.01em] text-label ${card.image ? "" : "pt-6"}`}>
          {headline(card)}
        </p>
        <p className="selectable mt-1.5 text-[15px] leading-[20px] text-label-2">{reply}</p>
      </div>

      {/* The numbers */}
      <dl className="mt-2 rounded-[24px] bg-card px-4 py-1 text-[16px]">
        <Row label={card.name} strong>
          {money(card.price)}
        </Row>
        <Row label="Open now">{money(card.openBefore)}</Row>
        <Row label={short ? "Short by" : "Left after"}>{money(Math.abs(card.openAfter))}</Row>
        <Row label="This month" last>
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: DOT[card.verdict] }} />
            {VERDICT_LABEL[card.verdict]}
          </span>
        </Row>
      </dl>

      {/* Choices */}
      <div className="mt-2.5 flex flex-col gap-2">
        {primary && (
          <ActionButton action={primary} card={card} disabled={disabled} onAction={onAction} primary />
        )}
        {rest.length > 0 && (
          <div className={`grid gap-2 ${rest.length > 1 && rest.every((a) => a.label.length <= 16) ? "grid-cols-2" : "grid-cols-1"}`}>
            {rest.map((a) => (
              <ActionButton key={a.label} action={a} card={card} disabled={disabled} onAction={onAction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children, strong, last }: { label: string; children: React.ReactNode; strong?: boolean; last?: boolean }) {
  return (
    <div className={`flex min-h-11 items-center justify-between gap-3 ${last ? "" : "shadow-[0_1px_0_var(--sep)]"}`}>
      <dt className={`min-w-0 truncate ${strong ? "font-semibold text-label" : "text-label-2"}`}>{label}</dt>
      <dd className={`tabular shrink-0 ${strong ? "font-semibold" : "font-medium"}`}>{children}</dd>
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
      className={`pressable flex items-center justify-center gap-2 rounded-full transition-opacity disabled:active:scale-100 ${
        primary
          ? "relative h-14 bg-cta px-6 text-[17px] font-semibold text-on-cta"
          : "paper-glass h-12 px-3 text-[15px] font-semibold text-label"
      } ${muted ? "opacity-45" : ""}`}
    >
      {chosen && <CheckIcon />}
      <span className="truncate">{action.label}</span>
      {primary && !card.chosen && <ArrowRightIcon className="absolute right-5" />}
    </button>
  );
}
