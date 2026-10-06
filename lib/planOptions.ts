import { MONTH } from "./demoData";
import { money } from "./format";

/**
 * Penny's three ways to get something: buy it now, or set money aside over 2 or 3 months.
 * Everything is worked out from the price and what's left to spend this month, so the numbers
 * on the cards always add up.
 */
export type PlanId = "now" | "wait2" | "wait3";
export type Impact = "Low" | "Medium" | "High";

export type PlanOption = {
  id: PlanId;
  title: string;
  amount: number; // paid now (Buy Now) or set aside each month (Wait)
  amountNote: string; // "today" or "a month for 2 months"
  left: number; // left to spend this month after this choice
  getIt: string; // "yours today" / "yours in December"
  tradeoffs: { good: boolean; text: string }[]; // what you'd cut to afford it
  impact: Impact;
  cta: string;
};

export type PlanSummary = { headline: string; detail: string; pick: PlanId; options: PlanOption[] };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const monthAfter = (n: number) => MONTHS[(MONTHS.indexOf(MONTH.name) + n) % 12];

/** Share of this month's money a choice uses → how much it changes the month. */
function impactOf(costThisMonth: number, left: number): Impact {
  const share = left > 0 ? costThisMonth / left : 1;
  if (share <= 0.15) return "Low";
  if (share <= 0.3) return "Medium";
  return "High";
}

/**
 * What a cost means in real life: the everyday things you'd cut to cover it, in the order most
 * people trim first (a bit less on groceries, your nails, dinners out, coffee runs, a weekend plan,
 * then extra shopping). Returns the three biggest cuts, so pricier things show bigger sacrifices.
 * `when` says which months it applies to ("this month", "in Oct & Nov").
 */
function giveUps(cost: number, when: string): string[] {
  const cuts: { text: string; amount: number }[] = [];
  let rest = Math.round(cost);
  const take = (amount: number, text: string) => {
    cuts.push({ text: `${text} ${when}`, amount });
    rest -= amount;
  };

  if (rest >= 15) take(Math.min(rest, 50), `${money(Math.min(rest, 50))} less on groceries`);
  if (rest >= 30) take(45, "Skip getting your nails done");
  if (rest >= 25) {
    const dinners = Math.min(3, Math.max(1, Math.round(rest / 35)));
    take(dinners * 35, dinners === 1 ? "One fewer dinner out" : `${dinners} fewer dinners out`);
  }
  if (rest >= 40) take(80, "Sit out a weekend plan");
  if (rest >= 10 && rest < 40) {
    const coffees = Math.min(6, Math.ceil(rest / 6));
    take(coffees * 6, `Skip ${coffees} coffee runs`);
  }
  if (rest >= 10) take(rest, `${money(rest)} less on extra shopping`); // tiny leftovers aren't worth a line

  return cuts
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((c) => c.text);
}

const short = (m: string) => m.slice(0, 3);

export function planFor(name: string, price: number, left: number): PlanSummary {
  const now = price;
  const per2 = Math.ceil(price / 2);
  const per3 = Math.ceil(price / 3);
  const later2 = monthAfter(2);
  const later3 = monthAfter(3);

  const nowImpact = impactOf(now, left);
  const options: PlanOption[] = [
    {
      id: "now",
      title: "Buy Now",
      amount: now,
      amountNote: "today",
      left: left - now,
      impact: nowImpact,
      getIt: "yours today",
      tradeoffs: giveUps(now, "this month").map((text) => ({ good: false, text })),
      cta: "Buy it now",
    },
    {
      id: "wait2",
      title: "Wait 2 Months",
      amount: per2,
      amountNote: "a month, for 2 months",
      left: left - per2,
      impact: impactOf(per2, left),
      getIt: `yours in ${later2}`,
      tradeoffs: giveUps(per2, `in ${short(MONTH.name)} & ${short(monthAfter(1))}`).map((text) => ({ good: false, text })),
      cta: "Start saving",
    },
    {
      id: "wait3",
      title: "Wait 3 Months",
      amount: per3,
      amountNote: "a month, for 3 months",
      left: left - per3,
      impact: impactOf(per3, left),
      getIt: `yours in ${later3}`,
      tradeoffs: giveUps(per3, `${short(MONTH.name)}–${short(monthAfter(2))}`).map((text) => ({
        good: false,
        text,
      })),
      cta: "Start saving",
    },
  ];

  // Cheap enough → just buy it. A real squeeze → spread it out the most.
  const pick: PlanId = nowImpact === "Low" ? "now" : nowImpact === "Medium" ? "wait2" : "wait3";
  const pct = Math.round((price / left) * 100);

  const headline =
    pick === "now"
      ? "This one fits comfortably."
      : pick === "wait2"
        ? `You can, but it squeezes ${MONTH.name}.`
        : "That’s a lot for this month.";
  const detail =
    pick === "now"
      ? `${money(price)} is ${pct}% of your ${money(left)} left to spend.`
      : pick === "wait2"
        ? `${money(price)} is ${pct}% of your ${money(left)}.`
        : `${money(price)} is ${pct}% of your ${money(left)}.`;

  return { headline, detail, pick, options };
}
