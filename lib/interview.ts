import { MONTH } from "./demoData";
import { money, newId } from "./format";
import { pace } from "./goalPlan";
import { SPENDING, type Goal } from "./monthDetails";
import type { ChatMessage, PlansCard, Use, When } from "./types";

/**
 * Penny's short interview before she answers: when do you need it, and how often will you use it.
 * Each answer can be tapped or said out loud. Then she shows what she's checking, then her answer.
 */

/** "them" for boots, AirPods, sunglasses; "it" for a bag or a ticket. */
export const pronoun = (name: string) => (/s$/i.test(name.trim().split(/\s+/).pop() ?? "") ? "them" : "it");
/** Things you wear vs. things you use. */
export const verb = (name: string) => (/boot|heel|shoe|sneaker|bag|sunglass|jacket|coat|dress|watch|jean/i.test(name) ? "wear" : "use");
/** A one-time thing (a ticket, a dinner) doesn't need "how often". */
export const isExperience = (name: string) => /ticket|concert|dinner|trip|show|flight|tour|class/i.test(name);

export const WHEN_CHIPS: { label: string; value: When }[] = [
  { label: "This week", value: "now" },
  { label: "It can wait", value: "wait" },
  { label: "Just looking", value: "looking" },
];
export const USE_CHIPS: { label: string; value: Use }[] = [
  { label: "Every day", value: "daily" },
  { label: "Sometimes", value: "sometimes" },
  { label: "Just once", value: "once" },
];

export function parseWhen(t: string): When | undefined {
  if (/look|brows|curious|just seeing/.test(t)) return "looking";
  if (/wait|no rush|later|not urgent|whenever|next month/.test(t)) return "wait";
  if (/week|today|tomorrow|\bnow\b|asap|soon|right away|weekend|need (it|them)/.test(t)) return "now";
  return undefined;
}
export function parseUse(t: string): Use | undefined {
  if (/every ?day|daily|all the time|a lot|constantly/.test(t)) return "daily";
  if (/once|one time|one-time|special|single/.test(t)) return "once";
  if (/sometimes|often|week|occasion|now and then|few times|here and there/.test(t)) return "sometimes";
  return undefined;
}
export const isSkip = (t: string) => /\bskip\b|just tell me|whatever/.test(t);

/** Penny's first question, with the item shown in her bubble. */
export function firstQuestion(item: PlansCard): ChatMessage {
  return {
    id: newId(),
    role: "assistant",
    text: `Ooh, ${item.name} for ${money(item.price)}. When do you need ${pronoun(item.name)}?`,
    mood: "listening",
    ask: { step: "when", item },
  };
}

export function useQuestion(item: PlansCard): ChatMessage {
  return {
    id: newId(),
    role: "assistant",
    text: `Got it. How often will you ${verb(item.name)} ${pronoun(item.name)}?`,
    mood: "listening",
    ask: { step: "use", item },
  };
}

export function checkingMessage(item: PlansCard): ChatMessage {
  return { id: newId(), role: "assistant", text: "Let me check your month.", mood: "thinking", checks: { item } };
}

/** What Penny looks at, from the app's real numbers. */
export function checkLines(item: PlansCard, goals: Goal[]): { label: string; value: string }[] {
  const due = (["rent", "bills", "loans"] as const).flatMap((id) => SPENDING[id].filter((s) => s.upcoming)).reduce((t, s) => t + s.amount, 0);
  const goal = goals
    .filter((g) => g.name !== item.name)
    .map((g) => ({ g, p: pace(g) }))
    .filter((x) => x.p.needed && x.p.months)
    .sort((a, b) => a.p.months! - b.p.months!)[0];
  const a = item.answers ?? {};
  const said =
    a.when === "now"
      ? "you need it soon"
      : a.when === "looking"
        ? "you're just looking"
        : a.when === "wait"
          ? "it can wait"
          : "no rush";
  const use = a.use === "daily" ? "every day" : a.use === "once" ? "one time" : a.use === "sometimes" ? "sometimes" : "";
  return [
    { label: "Left to spend", value: `${money(item.left)} for ${MONTH.daysLeft} days` },
    { label: "Bills still coming", value: money(due) },
    ...(goal ? [{ label: goal.g.name, value: `needs ${money(goal.p.needed!)}/mo` }] : []),
    { label: "You said", value: use ? `${said}, ${use}` : said },
  ];
}
