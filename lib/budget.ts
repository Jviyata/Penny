import type { CardAction, Line, Verdict } from "./types";

const sum = (lines: Line[]) => lines.reduce((s, l) => s + l.amount, 0);

/** Money that isn't planned or already spent. Can go below zero; the UI shows that calmly. */
export function openMoney(total: number, plans: Line[], bought: Line[]): number {
  return round(total - sum(plans) - sum(bought));
}

export function openAfter(open: number, price: number): number {
  return round(open - price);
}

/** Share of Free to Spend Remaining a purchase would use (Penny's training, step 2). */
export function shareOfOpen(open: number, price: number): number {
  return open > 0 ? price / open : Infinity;
}

/**
 * The four answers, following Penny's training:
 *  over budget → Not right now; ≤25% → Comfortable; 25–40% → Tight (ask if it's needed now);
 *  over 40% → Better later (slow down, likely wait for November).
 */
export function verdictFor(open: number, price: number): Verdict {
  if (price > open) return "not_this_month";
  const share = shareOfOpen(open, price);
  if (share <= 0.25) return "comfortable";
  if (share <= 0.4) return "tight";
  return "later";
}

/** Penny's three learnable answers (tight and later both read as "You can, but…"). */
export const VERDICT_LABEL: Record<Verdict, string> = {
  comfortable: "Go for it",
  tight: "You can, but…",
  later: "You can, but…",
  not_this_month: "Not right now",
};

export const VERDICT_SYMBOL: Record<Verdict, string> = {
  comfortable: "✓",
  tight: "△",
  later: "△",
  not_this_month: "×",
};

export const SHELF_STATUS: Record<Verdict, string> = {
  comfortable: "Fits whenever you’re ready",
  tight: "Worth a second look",
  later: "November looks better",
  not_this_month: "November looks better",
};

export const NEED_IT = "I need it this month";
export const JUST_WANT_IT = "I just want it";

export function defaultActions(verdict: Verdict): CardAction[] {
  const save: CardAction = { label: "Save for November", kind: "save_for_later" };
  const need: CardAction = { label: NEED_IT, kind: "other" };
  switch (verdict) {
    case "comfortable":
      return [{ label: "Buy it", kind: "buy_anyway" }, { label: "Save for later", kind: "save_for_later" }];
    case "tight":
    case "later":
      return [need, save];
    case "not_this_month":
      return [save, { label: "Buy anyway", kind: "buy_anyway" }];
  }
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
