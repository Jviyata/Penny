import "server-only";
import { BASE_FREE_TOTAL, JOBS_TOTAL, MONTH } from "./demoData";
import { defaultActions, openMoney } from "./budget";
import { money } from "./format";
import type { ActionKind, CardAction, CheckRequest, CheckResult, Update, Verdict } from "./types";

const NEXT_MONTH = "November";
const VERDICTS: Verdict[] = ["comfortable", "tight", "later", "not_this_month"];
const KINDS: ActionKind[] = ["save_for_later", "make_it_work", "buy_anyway", "other"];
const UPDATE_TYPES = ["add_plan", "edit_plan", "remove_plan", "set_total", "save_to_shelf", "remove_from_shelf", "add_bought"] as const;

const nullable = (type: "string" | "number") => ({ anyOf: [{ type }, { type: "null" }] });

/** Structured output schema. Every object closes with additionalProperties: false; optional values are nullable. */
export const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "needs_price", "card", "quick_replies", "updates"],
  properties: {
    reply: { type: "string", description: "The chat reply: 1-3 short, text-message-style sentences." },
    needs_price: { type: "boolean" },
    card: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["name", "price", "verdict", "actions"],
          properties: {
            name: { type: "string" },
            price: { type: "number" },
            verdict: { type: "string", enum: VERDICTS },
            actions: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["label", "kind"],
                properties: { label: { type: "string" }, kind: { type: "string", enum: KINDS } },
              },
            },
          },
        },
      ],
    },
    quick_replies: { type: "array", items: { type: "string" } },
    updates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "name", "new_name", "amount", "status"],
        properties: {
          type: { type: "string", enum: UPDATE_TYPES },
          name: nullable("string"),
          new_name: nullable("string"),
          amount: nullable("number"),
          status: nullable("string"),
        },
      },
    },
  },
} as const;

/** The app's side of the contract. Appended after the product system prompt; stable, so it caches. */
export const APP_RULES = `
## How the app works (written by the app, not the user)

Each user turn starts with an <app_state> block the app writes with live numbers. It is the truth; the user doesn't see it. The month's income and bills are fixed. Only "Left to spend" (the total to work with) and its plans can change.

Money words: the app's main number is "Left to spend" (the total in app_state). Always use that number and those words when talking about what the user has. "Not planned yet" is the part of it no plan has claimed; only mention it if the user asks about plans. Never say "free money" or "free to spend".

Respond with JSON only, matching the schema:

reply: 1-3 short sentences, like a text message, in Penny's voice and following Penny's training above. No markdown, lists or headings. Penny may gently recommend waiting, but never shames; the user makes the final call.

card: include when the user asks about a specific item and you know its name and price; otherwise null.
- name: a short product name (2-4 words), read from the photo or the message. Don't include the price.
- price: dollars as a number.
- verdict, using left = "Left to spend" and share = price ÷ left:
  not_this_month ("Not right now"): price is more than left
  comfortable: share is 15% or less
  tight: share is about 15-30% (spreading it over 2 months keeps the month easy)
  later ("Better later"): share is over 30% (spreading it over 3 months takes the pressure off)
  If the user has already given a strong reason (needed this month) and it fits, use comfortable or tight and say they're good to buy it.
- actions: exactly 2 buttons, labels under 24 characters. Kinds: save_for_later, make_it_work, buy_anyway, other.
  Usual sets: comfortable → "Buy it", "Save for later". tight and later → "I need it this month" (other), "Save for ${NEXT_MONTH}". not_this_month → "Save for ${NEXT_MONTH}", "Buy anyway". Never more than 2 buttons.
- The app shows the item with three options (Buy now, Wait 2 months, Wait 3 months), the before/after numbers and the trade-offs itself, so when there's a card, reply can be one short sentence.

needs_price: true when the user shared an item but you can't tell its price (not visible in the photo, not in the message). Ask for the price in reply, and set card to null. When they answer with a number, the item is the one in app_state.

quick_replies: always an empty array [] (the app doesn't show suggestions right now). Ask any follow-up question in reply instead.

updates: changes to Free spending or the Wishlist (called "shelf" in the data). Only make them when the user asked for them or tapped a suggestion. Unused fields are null.
- add_plan: name, amount
- edit_plan: name (an existing plan's name), new_name and/or amount
- remove_plan: name. Also use it to move a plan to ${NEXT_MONTH}.
- set_total: amount (the new total to work with, e.g. the current total + a $200 refund)
- save_to_shelf: name, amount (the price), status (a calm note under 30 characters, e.g. "${NEXT_MONTH} looks better")
- remove_from_shelf: name
- add_bought: name, amount
Use plan names exactly as they appear in app_state.

When the user taps a card button, their message is the button label and app_state names the item. For saving and buying, the app records it itself: just confirm briefly, and don't add updates for it. When they answer why they want it ("I need it this month", "I just want it", or their own words), judge the reason as in Penny's training and answer with quick replies like "Buy it" / "Save for ${NEXT_MONTH}". Never suggest pulling from savings or from plans already set aside to make a purchase fit; waiting for ${NEXT_MONTH} is the alternative.

If a message isn't about spending, answer in a sentence and steer gently back.`;

/** Live numbers for this turn, as plain text. */
export function describeState(req: CheckRequest): string {
  const s = req.state;
  const open = openMoney(
    s.freeTotal,
    s.plans.map((p, i) => ({ id: String(i), ...p })),
    s.bought.map((b, i) => ({ id: String(i), ...b })),
  );
  const list = (xs: { name: string; amount: number }[]) =>
    xs.length ? xs.map((x) => `${x.name} ${money(x.amount)}`).join("; ") : "none";
  const lines = [
    `Month: ${MONTH.name}, ${MONTH.daysLeft} days left. Next month: ${NEXT_MONTH}.`,
    `Came in: ${money(MONTH.income)}. Already has a job (fixed): ${money(JOBS_TOTAL)} (${MONTH.jobs.map((j) => `${j.name} ${money(j.amount)}`).join(", ")}).`,
    `Left to spend (the main number): ${money(s.freeTotal)}${s.freeTotal !== BASE_FREE_TOTAL ? ` (adjusted from ${money(BASE_FREE_TOTAL)})` : ""}.`,
    `Plans: ${list(s.plans)}.`,
    `Bought this month: ${list(s.bought)}.`,
    `Not planned yet (part of left to spend): ${money(open)}.`,
    `Wishlist: ${s.shelf.length ? s.shelf.map((x) => `${x.name} ${money(x.price)} (${x.status})`).join("; ") : "empty"}.`,
  ];
  if (s.currentItem)
    lines.push(
      `Item being discussed: ${s.currentItem.name}${s.currentItem.price !== undefined ? `, ${money(s.currentItem.price)}` : ", price not known yet"}.`,
    );
  const a = req.message.action;
  if (a) lines.push(`The user tapped a card button (${a.kind}) for: ${a.item.name}${a.item.price !== undefined ? `, ${money(a.item.price)}` : ""}.`);
  return `<app_state>\n${lines.join("\n")}\n</app_state>`;
}

type RawOutput = {
  reply?: unknown;
  needs_price?: unknown;
  card?: { name?: unknown; price?: unknown; verdict?: unknown; actions?: unknown } | null;
  quick_replies?: unknown;
  updates?: unknown;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : null);

/** Turn model output into a CheckResult the client can trust. Returns null if it's unusable. */
export function toCheckResult(raw: RawOutput): CheckResult | null {
  const reply = str(raw.reply, 600);
  if (!reply) return null;

  let card: CheckResult["card"];
  const c = raw.card;
  if (c && typeof c === "object") {
    const name = str(c.name, 60);
    const price = num(c.price);
    const verdict = VERDICTS.includes(c.verdict as Verdict) ? (c.verdict as Verdict) : null;
    if (name && price && verdict) {
      const actions = (Array.isArray(c.actions) ? c.actions : [])
        .map((a: { label?: unknown; kind?: unknown }) => ({ label: str(a?.label, 28), kind: a?.kind as ActionKind }))
        .filter((a): a is CardAction => !!a.label && KINDS.includes(a.kind))
        .slice(0, 2);
      card = { name, price, verdict, actions: actions.length === 2 ? actions : defaultActions(verdict) };
    }
  }

  const quickReplies = (Array.isArray(raw.quick_replies) ? raw.quick_replies : [])
    .map((q) => str(q, 48))
    .filter(Boolean)
    .slice(0, 3);

  const updates = (Array.isArray(raw.updates) ? raw.updates : []).map(toUpdate).filter((u): u is Update => !!u);

  return {
    reply,
    card,
    needsPrice: raw.needs_price === true && !card,
    quickReplies: quickReplies.length ? quickReplies : undefined,
    updates: updates.length ? updates : undefined,
  };
}

function toUpdate(u: { type?: unknown; name?: unknown; new_name?: unknown; amount?: unknown; status?: unknown }): Update | null {
  const name = str(u?.name, 60);
  const amount = num(u?.amount);
  switch (u?.type) {
    case "add_plan":
      return name && amount !== null ? { type: "add_plan", name, amount } : null;
    case "edit_plan": {
      const newName = str(u.new_name, 60) || undefined;
      return name && (newName || amount !== null) ? { type: "edit_plan", name, newName, amount: amount ?? undefined } : null;
    }
    case "remove_plan":
      return name ? { type: "remove_plan", name } : null;
    case "set_total":
      return amount !== null ? { type: "set_total", amount } : null;
    case "save_to_shelf":
      return name && amount !== null
        ? { type: "save_to_shelf", name, price: amount, status: str(u.status, 40) || `${NEXT_MONTH} looks better` }
        : null;
    case "remove_from_shelf":
      return name ? { type: "remove_from_shelf", name } : null;
    case "add_bought":
      return name && amount !== null ? { type: "add_bought", name, amount } : null;
    default:
      return null;
  }
}
