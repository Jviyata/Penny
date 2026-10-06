import { MONTH } from "./demoData";
import { SHELF_STATUS, defaultActions, openMoney, verdictFor } from "./budget";
import { money } from "./format";
import { applyUpdates, sameName } from "./updates";
import type { CheckResult, Item, Line, Outgoing, ShelfItem, Update } from "./types";

export type Snapshot = {
  freeTotal: number;
  plans: Line[];
  bought: Line[];
  shelf: ShelfItem[];
  currentItem: Item | null;
};

const NEXT_MONTH = "November";
const days = MONTH.daysLeft;

/**
 * The offline brain. Used in step 2 for everything, and later whenever /api/check fails,
 * so an interviewer always gets a sensible answer. Never judges, only shows what changes.
 */
export function fallbackCheck(msg: Outgoing, s: Snapshot): CheckResult {
  const open = openMoney(s.freeTotal, s.plans, s.bought);
  const text = msg.text.trim();
  const lower = text.toLowerCase();

  // 1. Card buttons (or the same words typed out)
  const kind =
    msg.action?.kind ??
    (/^save (it )?(for )?(november|later|next month)/.test(lower)
      ? "save_for_later"
      : /^(buy (it|anyway)|i('ll| will) buy it)/.test(lower)
        ? "buy_anyway"
        : /make (this|it) work/.test(lower)
          ? "make_it_work"
          : null);
  const item = msg.action?.item ?? s.currentItem;
  const need = /\bneed\b|broke|wedding|trip|work|gift|birthday|event/.test(lower) && !/don.?t need|just want/.test(lower);
  const want = /just want|it.?s cute|on sale|bored|everyone has|might use|don.?t know/.test(lower);
  if ((need || want) && item?.price !== undefined && (!kind || kind === "other")) {
    return reasonAnswer(need, { ...item, price: item.price }, open);
  }
  if (kind && kind !== "other" && item?.price !== undefined) {
    return handleAction(kind, { ...item, price: item.price }, open, s.plans, lower);
  }

  // 2. Changes to Free spending
  const change = parseBudgetChange(lower, s);
  if (change) {
    const next = applyUpdates(s, change.updates);
    const after = openMoney(next.freeTotal, next.plans, next.bought);
    const pending = s.currentItem?.price !== undefined ? s.currentItem : null;
    if (pending) {
      const result = itemResult({ ...pending, price: pending.price! }, after);
      return { ...result, reply: `${change.reply} ${result.reply}`, updates: change.updates };
    }
    return { reply: `${change.reply} You now have ${money(after)} open.`, updates: change.updates };
  }

  // 3. Something they want to buy
  const awaitingPrice = s.currentItem && s.currentItem.price === undefined ? s.currentItem : null;
  const price = msg.hint?.price ?? parsePrice(text, !!awaitingPrice);
  const name = msg.hint?.name ?? extractName(text) ?? awaitingPrice?.name ?? (msg.image ? "This item" : null);

  if (price !== null && name) return itemResult({ name, price }, open);

  if (msg.image || (awaitingPrice && price === null)) {
    return {
      reply: msg.image
        ? "Nice find. I can’t make out a price on this one. How much is it?"
        : "How much is it? Just the number works.",
      needsPrice: true,
    };
  }

  if (price !== null) {
    return { reply: `${money(price)} for what? Tell me what it is, or add a photo.` };
  }

  return {
    reply: `Tell me what you’re thinking of buying and what it costs, or add a photo or screenshot. You have ${money(open)} open right now.`,
    quickReplies: ["Concert tickets for $60", "New sneakers, $95"],
  };
}

export function itemResult(item: { name: string; price: number }, open: number): CheckResult {
  const verdict = verdictFor(open, item.price);
  const after = open - item.price;
  const n = item.name === "This item" ? "this" : `the ${item.name.toLowerCase()}`;
  const pct = Math.round((item.price / Math.max(open, 1)) * 100);
  const reply = {
    comfortable:
      pct < 10
        ? `Easy one. You’ll still have plenty of breathing room for the next ${days} days.`
        : `It’ll use about ${pct}% of what you have left, so you’re still in a comfortable spot.`,
    tight: `It’s a pretty big chunk of what you have left (about ${pct}%). Do you need it this month, or do you just want it?`,
    later: `This would use about ${pct}% of what you have left to spend. Is there a reason you need it right now?`,
    not_this_month: `I’d move this to ${NEXT_MONTH} rather than pull from money you’ve already set aside.`,
  }[verdict];
  return { reply, card: { name: item.name, price: item.price, verdict, actions: defaultActions(verdict) } };
}

function handleAction(
  kind: "save_for_later" | "make_it_work" | "buy_anyway",
  item: { name: string; price: number },
  open: number,
  plans: Line[],
  said = "",
): CheckResult {
  const verdict = verdictFor(open, item.price);
  const name = item.name === "This item" ? "it" : `the ${item.name.toLowerCase()}`;

  if (kind === "save_for_later") {
    const forNextMonth = /november|next month/.test(said);
    const status = !forNextMonth && (verdict === "comfortable" || verdict === "tight") ? SHELF_STATUS[verdict] : SHELF_STATUS.later;
    return {
      reply: `Saved ${name} to your wishlist. It’ll be there when you want to look again.`,
      updates: [{ type: "save_to_shelf", name: item.name, price: item.price, status }],
    };
  }

  if (kind === "buy_anyway") {
    const after = open - item.price;
    return {
      reply:
        after >= 0
          ? `Done. I added ${name} to Bought. You have ${money(after)} open for the rest of ${MONTH.name}.`
          : `Done. I added ${name} to Bought. Your plans are now ${money(-after)} over, so one of them may need to move.`,
      updates: [{ type: "add_bought", name: item.name, amount: item.price }],
    };
  }

  // make_it_work: Penny doesn't pull from money already set aside; waiting is the way to make it work.
  const gap = item.price - open;
  if (gap <= 0) {
    return { reply: `It already fits. You’d still have ${money(-gap)} open after ${name}.` };
  }
  return {
    reply: `You’re ${money(gap)} short, and I wouldn’t pull from money you’ve already set aside for it. The way to make it work is ${NEXT_MONTH}: you’ll have a fresh budget, and it won’t squeeze the rest of this month.`,
    quickReplies: [`Save for ${NEXT_MONTH}`],
  };
}

/** Penny's training, step 4: a strong reason can approve an affordable purchase; a weak one means wait. */
function reasonAnswer(strong: boolean, item: { name: string; price: number }, open: number): CheckResult {
  const after = open - item.price;
  const pct = Math.round((item.price / Math.max(open, 1)) * 100);
  if (after < 0) {
    return {
      reply: `I get it, but it would still put you ${money(-after)} over this month. I’d plan it for ${NEXT_MONTH} instead of pulling from money you’ve set aside.`,
      quickReplies: [`Save for ${NEXT_MONTH}`],
    };
  }
  if (strong) {
    return {
      reply: `That makes sense. Since you actually need it this month and it still fits within your spending budget, you’re good to buy it. You’ll have about ${money(after)} left afterward, so just keep that in mind.`,
      quickReplies: ["Buy it", `Save for ${NEXT_MONTH}`],
    };
  }
  return {
    reply:
      pct < 25
        ? `Fair enough, it’s a small one. You’d still have ${money(after)} left.`
        : `You can afford it, but since there’s no real reason you need it right now, I’d probably wait. Let’s see how you feel about it later.`,
    quickReplies: pct < 25 ? ["Buy it", "Save for later"] : [`Save for ${NEXT_MONTH}`, "Buy anyway"],
  };
}

function parseBudgetChange(lower: string, s: Snapshot): { reply: string; updates: Update[] } | null {
  const plan = (name: string) =>
    s.plans.find((p) => sameName(p.name, name)) ??
    s.plans.find((p) => name.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(name));

  let m = lower.match(/move (?:the |my )?(.+?) to (?:november|next month)/);
  if (m) {
    const p = plan(m[1]);
    if (p) return { reply: `Moved ${p.name.toLowerCase()} to ${NEXT_MONTH}. That frees up ${money(p.amount)}.`, updates: [{ type: "remove_plan", name: p.name }] };
  }
  m = lower.match(/^(?:remove|drop|cancel|skip|delete) (?:the |my )?(.+?)(?: plan)?[.!]?$/);
  if (m) {
    const p = plan(m[1]);
    if (p) return { reply: `Removed ${p.name.toLowerCase()} from your plans. That frees up ${money(p.amount)}.`, updates: [{ type: "remove_plan", name: p.name }] };
  }
  m = lower.match(/add (?:a )?plan (?:for )?(.+?)(?:,| for| at)? \$?(\d[\d,]*(?:\.\d{1,2})?)/);
  if (m) {
    const name = capitalize(m[1]);
    const amount = num(m[2]);
    return { reply: `Added ${name.toLowerCase()} (${money(amount)}) to your plans.`, updates: [{ type: "add_plan", name, amount }] };
  }
  m = lower.match(/(?:got|getting|received|have) (?:an extra |another )?\$?(\d[\d,]*(?:\.\d{1,2})?) (?:back|extra|more|refund)/);
  if (m) {
    const amount = s.freeTotal + num(m[1]);
    return { reply: `Nice. I added ${money(num(m[1]))} to what you have to work with.`, updates: [{ type: "set_total", amount }] };
  }
  m = lower.match(/(?:my total is|i actually have|i have) \$?(\d[\d,]*(?:\.\d{1,2})?)(?: to work with)?/);
  if (m) {
    const amount = num(m[1]);
    return { reply: `Updated. You have ${money(amount)} to work with.`, updates: [{ type: "set_total", amount }] };
  }
  return null;
}

const PRICE = String.raw`(\d[\d,]*(?:\.\d{1,2})?)`;

export function parsePrice(text: string, bareNumberOk: boolean): number | null {
  const m =
    text.match(new RegExp(String.raw`\$\s?${PRICE}`)) ??
    text.match(new RegExp(String.raw`${PRICE}\s?(?:dollars|bucks|usd)\b`, "i")) ??
    (bareNumberOk ? text.match(new RegExp(String.raw`^\D{0,24}?${PRICE}\D{0,12}$`)) : null);
  return m ? num(m[1]) : null;
}

const FILLER =
  /(?<![\w-])(can i afford|could i afford|should i (?:buy|get)|is it (?:ok|okay) to (?:buy|get)|i want(?: to (?:buy|get))?|i(?:'m| am) (?:thinking about|looking at|eyeing)|thinking (?:about|of)|how about|what about|buying|getting|buy|get|it's|its|it is|costs?|for|at|about|now|please)(?![\w-])/g;

export function extractName(text: string): string | null {
  let t = text
    .toLowerCase()
    .replace(new RegExp(String.raw`\$\s?${PRICE}`, "g"), " ")
    .replace(new RegExp(String.raw`${PRICE}\s?(?:dollars|bucks|usd)`, "g"), " ")
    .replace(/[?!.,]/g, " ")
    .replace(FILLER, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:(?:a|an|the|this|that|some|my|these|those|new pair of|pair of)\s+)+/, "")
    .trim();
  if (!t || t.length < 2 || /^\d+$/.test(t)) return null;
  if (t.length > 40) t = t.slice(0, 40).replace(/\s\S*$/, "");
  return capitalize(t);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function num(s: string) {
  return Number(s.replace(/,/g, ""));
}
