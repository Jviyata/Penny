import { MONTH } from "./demoData";
import { money } from "./format";
import type { Answers, PlansCard } from "./types";

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

export type PlanSummary = { headline: string; detail: string; pick: PlanId; reason?: string; options: PlanOption[] };

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

export function planFor(name: string, price: number, left: number, answers?: Answers): PlanSummary {
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
  const base: PlanId = nowImpact === "Low" ? "now" : nowImpact === "Medium" ? "wait2" : "wait3";
  const pick = pickWithAnswers(base, nowImpact, answers);
  const pct = Math.round((price / left) * 100);

  const headline =
    base === "now"
      ? "This one fits comfortably."
      : base === "wait2"
        ? `You can, but it squeezes ${MONTH.name}.`
        : "That’s a lot for this month.";
  const detail =
    pick === "now"
      ? `${money(price)} is ${pct}% of your ${money(left)} left to spend.`
      : pick === "wait2"
        ? `${money(price)} is ${pct}% of your ${money(left)}.`
        : `${money(price)} is ${pct}% of your ${money(left)}.`;

  return { headline, detail, pick, reason: reasonFor(name, pick, answers), options };
}

const ORDER: PlanId[] = ["now", "wait2", "wait3"];
const shift = (p: PlanId, by: number) => ORDER[Math.min(2, Math.max(0, ORDER.indexOf(p) + by))];

/**
 * Your answers move Penny's pick: using it every day makes it worth getting sooner, a one-time thing
 * makes her more careful, needing it this week means buying now (unless it's a real squeeze),
 * and "it can wait" or "just looking" means saving up.
 */
function pickWithAnswers(base: PlanId, impact: Impact, a?: Answers): PlanId {
  if (!a) return base;
  let pick = base;
  if (a.use === "daily" && impact !== "High") pick = shift(pick, -1);
  if (a.use === "once" && impact !== "Low") pick = shift(pick, 1);
  if (a.when === "now" && impact !== "High") pick = "now";
  if ((a.when === "wait" || a.when === "looking") && pick === "now") pick = "wait2";
  return pick;
}

const themOrIt = (name: string) => (/s$/i.test(name.trim().split(/\s+/).pop() ?? "") ? "them" : "it");

/** "It can wait, and you'd wear them every day, so I'd save for 2 months." */
function reasonFor(name: string, pick: PlanId, a?: Answers): string | undefined {
  if (!a || (!a.when && !a.use)) return undefined;
  const it = themOrIt(name);
  const wear = /boot|heel|shoe|sneaker|bag|sunglass|jacket|coat|dress|watch|jean/i.test(name) ? "wear" : "use";
  const parts: string[] = [];
  if (a.when === "now") parts.push("You need it soon");
  if (a.when === "wait") parts.push("It can wait");
  if (a.when === "looking") parts.push("You’re just looking");
  if (a.use === "daily") parts.push(`you’d ${wear} ${it} every day`);
  if (a.use === "sometimes") parts.push(`you’d ${wear} ${it} sometimes`);
  if (a.use === "once" && !/ticket|concert|dinner|trip|show|flight|tour|class/i.test(name)) parts.push("it’s a one-time thing");
  if (!parts.length) return undefined;
  parts[0] = parts[0][0].toUpperCase() + parts[0].slice(1);
  const action = pick === "now" ? `I’d buy ${it} now` : pick === "wait2" ? "I’d save for 2 months" : "I’d spread it over 3 months";
  return `${parts.join(", and ")}, so ${action}.`;
}

/** What Penny says out loud with her answer: the verdict, why, what it means, then a question back. */
export function spokenAnswer(plans: PlansCard): string {
  const { headline, pick, reason, options } = planFor(plans.name, plans.price, plans.left, plans.answers);
  const o = options.find((x) => x.id === pick)!;
  const why = reason ? ` ${reason}` : "";
  const ask = plans.answers ? " Want to go with that?" : "";
  if (pick === "now") return `${headline}${why} You'd still have ${money(o.left)} left this month.${ask}`;
  const per = `${money(o.amount)} a month, and it's ${o.getIt}`;
  if (why) return `${headline}${why} That's ${per}.${ask}`;
  if (pick === "wait2") return `${headline} If you wait two months, it's ${per}.`;
  return `${headline} I'd spread it over three months. ${per}.`;
}
