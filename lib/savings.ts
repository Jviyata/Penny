import { MONTH } from "./demoData";
import { money } from "./format";
import type { Goal, SaveStep } from "./monthDetails";

/**
 * Goals Penny starts ("Wait 2 months") come with a savings plan: this month's share is set aside
 * right away, and each later month comes due on the 1st. Penny reminds you on Overview, in her hello,
 * and (if you add it) in your iPhone Calendar.
 */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEAR = 2026;

/** $189 over 2 months → $95 now, $94 on Nov 1. */
export function scheduleFor(price: number, months: number): SaveStep[] {
  const per = Math.ceil(price / months);
  return Array.from({ length: months }, (_, i) => ({
    month: i,
    amount: i < months - 1 ? per : price - per * (months - 1),
    done: i === 0, // this month's share is set aside when the goal starts
  }));
}

const monthIndex = (m: number) => (MONTHS.indexOf(MONTH.name) + m) % 12;
/** "Today", "Nov 1", "Dec 1". */
export const stepDate = (m: number) => (m === 0 ? "Today" : `${MONTHS[monthIndex(m)].slice(0, 3)} 1`);
/** "Oct", "Nov". */
export const stepMonth = (m: number) => MONTHS[monthIndex(m)].slice(0, 3);
/** 2026-11-01, for the calendar. */
export function stepISO(m: number) {
  const idx = MONTHS.indexOf(MONTH.name) + m;
  const year = YEAR + Math.floor(idx / 12);
  return `${year}-${String((idx % 12) + 1).padStart(2, "0")}-01`;
}

export const nextStep = (g: Goal) => g.schedule?.find((s) => !s.done);
/** The step you can set aside now: this month's, or November's once the demo clock says Nov 1. */
export function dueStep(g: Goal, nov: boolean) {
  const s = nextStep(g);
  return s && s.month <= (nov ? 1 : 0) ? s : undefined;
}
export const isPaidOff = (g: Goal) => !!g.schedule && g.schedule.every((s) => s.done);

/** The reminder Penny shows first (one at a time). */
export function dueReminder(goals: Goal[], nov: boolean, snoozed: string[] = []) {
  for (const goal of goals) {
    if (snoozed.includes(goal.id)) continue;
    const step = dueStep(goal, nov);
    if (step) return { goal, step };
  }
  return undefined;
}

/** "Next: $94 on Nov 1", "Ready to buy". */
export function nextLine(g: Goal): string | undefined {
  if (!g.schedule) return undefined;
  const s = nextStep(g);
  return s ? `Next: ${money(s.amount)} on ${stepDate(s.month)}` : "Ready to buy";
}

export const pronounFor = (name: string) => (/[^s]s$/i.test(name.trim().split(/\s+/).pop() ?? "") ? "them" : "it");
export const needs = (name: string) => (pronounFor(name) === "them" ? "need" : "needs");
export const isAre = (name: string) => (pronounFor(name) === "them" ? "They're" : "It's");

/** Link that opens an iPhone Calendar event for this step, with an alert at 9am. */
export function calendarLink(g: Goal, s: SaveStep) {
  const q = new URLSearchParams({ name: g.name, amount: String(s.amount), date: stepISO(s.month) });
  return `/api/reminder?${q}`;
}
