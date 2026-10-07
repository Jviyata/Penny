import { MONTH } from "./demoData";
import { money } from "./format";
import type { Goal } from "./monthDetails";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Months from now until the goal's target ("By January" → 3 in October). Null when there's no end date. */
export function monthsUntil(by: string): number | null {
  const b = by.toLowerCase();
  if (/ongoing|no date/.test(b)) return null;
  const now = MONTHS.indexOf(MONTH.name);
  const named = MONTHS.findIndex((m) => b.includes(m.toLowerCase()));
  if (named >= 0) return ((named - now + 12) % 12) || 12;
  if (b.includes("spring")) return ((2 - now + 12) % 12) || 12; // March
  if (b.includes("summer")) return ((5 - now + 12) % 12) || 12; // June
  const years = b.match(/(\d+)\s*year/);
  if (years) return Number(years[1]) * 12;
  return null;
}

export type GoalTip = {
  title: string; // "Book with a travel rewards card"
  benefit: string; // "You could earn ~$105 back"
  cardLabel: string; // text on the little card graphic
  rate: string; // "3% back"
  rateNote: string; // "on flights and hotels"
};

export type GoalAction = { label: string; href?: string }; // no href → "Add money"

/** Penny's tip and the main button for a goal, chosen by what the goal is for. */
export function goalExtras(goal: Goal): { tip: GoalTip; action: GoalAction } {
  const n = goal.name.toLowerCase();
  const search = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

  if (/trip|travel|japan|flight|vacation/.test(n))
    return {
      tip: {
        title: "Book with a travel rewards card",
        benefit: `You could earn ~${money(Math.round(goal.target * 0.03))} back`,
        cardLabel: "TRAVEL REWARDS",
        rate: "3% back",
        rateNote: "on flights and hotels",
      },
      action: { label: "Find flights", href: "https://www.google.com/travel/flights?q=flights%20to%20Tokyo" },
    };
  if (/laptop|computer|macbook/.test(n))
    return {
      tip: {
        title: "Use student pricing",
        benefit: `You could save ~${money(100)}`,
        cardLabel: "STUDENT PRICING",
        rate: "Up to $100 off",
        rateNote: "with education discounts",
      },
      action: { label: "Shop laptops", href: "https://www.apple.com/us-edu/shop/buy-mac" },
    };
  if (/emergency|safety|rainy|fund/.test(n))
    return {
      tip: {
        title: "Keep it in high-yield savings",
        benefit: `It could earn ~${money(Math.round(goal.saved * 0.04))} a year`,
        cardLabel: "HIGH-YIELD SAVINGS",
        rate: "~4% APY",
        rateNote: "vs. almost 0% in checking",
      },
      action: { label: "Add money" },
    };
  if (/move|apartment|house|home|rent/.test(n))
    return {
      tip: {
        title: "Move in the off-season",
        benefit: `You could save ~${money(Math.round(goal.target * 0.1))}`,
        cardLabel: "OFF-SEASON",
        rate: "~10% less",
        rateNote: "winter leases and movers",
      },
      action: { label: "Find apartments", href: search("apartments for rent near me") },
    };
  if (/\bcar\b|vehicle/.test(n))
    return {
      tip: {
        title: "Get pre-approved first",
        benefit: "Know your rate before you shop",
        cardLabel: "PRE-APPROVED",
        rate: "Lower APR",
        rateNote: "than most dealer financing",
      },
      action: { label: "Browse cars", href: search("used cars near me") },
    };
  if (/furniture|sofa|couch|desk|bed\b/.test(n))
    return {
      tip: {
        title: "Wait for end-of-season sales",
        benefit: `You could save ~${money(Math.round(goal.target * 0.2))}`,
        cardLabel: "SEASONAL SALE",
        rate: "~20% off",
        rateNote: "in January and July",
      },
      action: { label: "Shop furniture", href: search("sofa sale") },
    };
  // Anything else (often something saved for from Penny's answer)
  return {
    tip: {
      title: "Watch for a price drop",
      benefit: `Prices like this often dip ~${money(Math.round(goal.target * 0.15))}`,
      cardLabel: "PRICE WATCH",
      rate: "~15% off",
      rateNote: "is common during sales",
    },
    action: { label: `Shop for ${goal.name.toLowerCase()}`, href: search(goal.name) },
  };
}

/** What it takes to finish on time: the monthly amount needed, and how that compares to now. */
export function pace(goal: Goal) {
  const left = Math.max(0, goal.target - goal.saved);
  const months = monthsUntil(goal.by);
  const perMonth = goal.thisMonth;
  const needed = months ? Math.ceil(left / months) : null;
  const extra = needed !== null ? Math.max(0, needed - perMonth) : null;
  // How long at the current pace, when there's no target date.
  const atPace = perMonth > 0 ? Math.ceil(left / perMonth) : null;
  return { left, months, needed, extra, atPace };
}
