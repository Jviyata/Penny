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
  tradeoffs: { good: boolean; text: string }[];
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
 * What a cost actually comes out of, smallest sacrifice first: the cushion, then extra shopping,
 * then eating out, then weekend plans. Rough monthly amounts for each, scaled to the month.
 */
function whatItCosts(cost: number, left: number): string[] {
  const scale = left / 1060;
  const buckets = [
    { name: "spending cushion", size: Math.round(100 * scale) },
    { name: "extra shopping", size: Math.round(150 * scale) },
    { name: "eating out", size: Math.round(250 * scale) },
    { name: "weekend plans", size: Math.round(200 * scale) },
  ];
  const out: string[] = [];
  let rest = cost;
  for (const b of buckets) {
    if (rest <= 0) break;
    const take = Math.min(rest, b.size);
    rest -= take;
    if (take >= b.size) out.push(`Uses up your ${money(b.size)} ${b.name}`);
    else if (take >= 15) out.push(`Trims ${b.name} by ${money(take)}`);
  }
  return out;
}

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
      tradeoffs: [
        { good: true, text: "You have it right away" },
        ...(nowImpact === "Low"
          ? [{ good: true, text: `Barely dents ${MONTH.name}` }]
          : whatItCosts(now, left)
              .slice(0, 2)
              .map((text) => ({ good: false, text }))),
        { good: nowImpact !== "High", text: `${money(left - now)} left for ${MONTH.daysLeft} days` },
      ],
      cta: "Buy it now",
    },
    {
      id: "wait2",
      title: "Wait 2 Months",
      amount: per2,
      amountNote: "a month, for 2 months",
      left: left - per2,
      impact: impactOf(per2, left),
      tradeoffs: [
        { good: true, text: `Keeps ${money(left - per2)} free this month` },
        ...whatItCosts(per2, left)
          .slice(0, 1)
          .map((text) => ({ good: false, text })),
        { good: false, text: `You’ll have it in ${later2}` },
      ],
      cta: "Start saving",
    },
    {
      id: "wait3",
      title: "Wait 3 Months",
      amount: per3,
      amountNote: "a month, for 3 months",
      left: left - per3,
      impact: impactOf(per3, left),
      tradeoffs: [
        { good: true, text: "The most breathing room" },
        { good: true, text: `Keeps ${money(left - per3)} free this month` },
        { good: false, text: `Longest wait, until ${later3}` },
      ],
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
