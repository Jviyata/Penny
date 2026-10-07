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

/** Penny's tip, in her voice. The money in it (e.g. "~$105") is highlighted on screen. */
export type GoalTip = { text: string };

export type GoalAction = { label: string; href?: string }; // no href → "Add money"

/** Penny's tip and the main button for a goal, chosen by what the goal is for. */
export function goalExtras(goal: Goal): { tip: GoalTip; action: GoalAction } {
  const n = goal.name.toLowerCase();
  const search = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  const pct = (p: number) => money(Math.round(goal.target * p));

  if (/trip|travel|japan|flight|vacation/.test(n))
    return {
      tip: { text: `Book it with one of your cards that earns travel rewards. At 3% back, that’s ~${pct(0.03)}.` },
      action: { label: "Find flights", href: "https://www.google.com/travel/flights?q=flights%20to%20Tokyo" },
    };
  if (/laptop|computer|macbook/.test(n))
    return {
      tip: { text: "Check student pricing before you buy. It’s often ~$100 off." },
      action: { label: "Shop laptops", href: "https://www.apple.com/us-edu/shop/buy-mac" },
    };
  if (/emergency|safety|rainy|fund/.test(n))
    return {
      tip: { text: `Keep this in a high-yield savings account. At ~4%, it could earn ~${money(Math.round(goal.saved * 0.04))} a year.` },
      action: { label: "Add money" },
    };
  if (/move|apartment|house|home|rent/.test(n))
    return {
      tip: { text: `Look at moving in the off-season. Winter leases and movers can be ~${pct(0.1)} cheaper.` },
      action: { label: "Find apartments", href: search("apartments for rent near me") },
    };
  if (/\bcar\b|vehicle/.test(n))
    return {
      tip: { text: "Get pre-approved with your bank first, so you know your rate before you shop." },
      action: { label: "Browse cars", href: search("used cars near me") },
    };
  if (/furniture|sofa|couch|desk|bed\b/.test(n))
    return {
      tip: { text: `Wait for end-of-season sales in January or July. That’s often ~${pct(0.2)} off.` },
      action: { label: "Shop furniture", href: search("sofa sale") },
    };
  return {
    tip: { text: `Set a price-drop alert. Things like this often dip ~${pct(0.15)} during sales.` },
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
