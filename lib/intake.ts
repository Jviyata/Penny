import { MONTH } from "./demoData";
import { DEMO_ITEMS } from "./demoItems";
import { money, newId } from "./format";
import { checkingMessage, isExperience, pronoun, useQuestion } from "./interview";
import type { AskStep, ChatMessage, Draft, PlansCard, When } from "./types";

/**
 * Penny's intake: pulling the item, price and timeframe out of whatever the user says
 * (typed or spoken, preset or brand new), and asking for only what's still missing, one
 * question at a time, in this order: item → price → timeframe → how often → her answer.
 * Nothing here invents a price or a date; unclear values get a quick check instead.
 */

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const NOW = MONTHS.indexOf(MONTH.name.toLowerCase());

// ---------- money ----------

export type MoneyRead =
  | { kind: "amount"; value: number; fromWords?: boolean }
  | { kind: "range"; low: number; high: number }
  | { kind: "invalid"; reason: "negative" | "zero" }
  | { kind: "none" };

const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

/** "two fifty" → 250, "two hundred and fifty" → 250, "a hundred" → 100, "fifteen hundred" → 1500. */
function wordsToNumber(t: string): number | undefined {
  const words = t.replace(/-/g, " ").replace(/\band\b/g, " ").split(/\s+/).filter(Boolean);
  let total = 0;
  let cur = 0;
  let seen = false;
  const chunks: number[] = []; // for "two fifty"
  for (const w of words) {
    if (w === "a" && !seen) {
      cur = 1;
      continue;
    }
    if (w in SMALL) {
      seen = true;
      const v = SMALL[w];
      if (cur > 0 && cur < 10 && v >= 20 && !chunks.length && total === 0 && words.indexOf(w) > 0 && !/hundred|thousand/.test(t)) {
        chunks.push(cur, v); // "two fifty"
        cur = 0;
        continue;
      }
      cur += v;
    } else if (w === "hundred") {
      seen = true;
      cur = (cur || 1) * 100;
    } else if (w === "thousand" || w === "grand") {
      seen = true;
      total += (cur || 1) * 1000;
      cur = 0;
    } else if (seen) break;
  }
  if (chunks.length === 2) return chunks[0] * 100 + chunks[1];
  const n = total + cur;
  return seen && n > 0 ? n : undefined;
}

const num = (s: string) => {
  const k = /k$/i.test(s);
  const v = Number(s.replace(/[$,k\s]/gi, ""));
  return k ? v * 1000 : v;
};

/**
 * Reads a price. `loose` (when Penny just asked for one) also accepts a bare number or words;
 * otherwise it needs a $ sign or "dollars"/"bucks", so "2 months" never becomes a price.
 */
export function readMoney(text: string, loose = false): MoneyRead {
  const t = text.toLowerCase().replace(/(\d),(\d{3})/g, "$1$2");
  const AMT = String.raw`\$?\s?\d+(?:\.\d{1,2})?\s?k?`;
  const range = t.match(new RegExp(String.raw`(?:between\s+)?(${AMT})\s*(?:-|–|to|and|or)\s*(${AMT})(?:\s*(?:dollars|bucks))?`));
  if (range && (loose || /\$|dollars|bucks/.test(range[0]))) {
    const low = num(range[1]);
    const high = num(range[2]);
    if (low > 0 && high > 0 && high !== low && !/month|week|day|year|time/.test(t.slice(range.index! + range[0].length, range.index! + range[0].length + 8)))
      return { kind: "range", low: Math.min(low, high), high: Math.max(low, high) };
  }
  const neg = t.match(/(?:-|minus|negative)\s*\$?\s?(\d+)/);
  if (neg && (loose || /\$/.test(t))) return { kind: "invalid", reason: "negative" };
  const m = t.match(new RegExp(String.raw`(\$\s?\d+(?:\.\d{1,2})?\s?k?\b)|(\d+(?:\.\d{1,2})?\s?k?)\s*(?:dollars|bucks|usd)`));
  const bare = loose ? t.match(/(?:^|[^\w.])(\d+(?:\.\d{1,2})?\s?k?)\b(?!\s*(?:months?|weeks?|days?|years?|times?|x|pairs?|th|st|nd|rd))/) : null;
  const hit = m?.[1] ?? m?.[2] ?? bare?.[1];
  if (hit) {
    const v = num(hit);
    if (v === 0) return { kind: "invalid", reason: "zero" };
    return { kind: "amount", value: Math.round(v * 100) / 100 };
  }
  if (loose || /dollars|bucks/.test(t)) {
    const w = wordsToNumber(t.replace(/dollars|bucks/g, ""));
    if (w !== undefined) return { kind: "amount", value: w, fromWords: true };
    if (/\bfree\b|nothing|zero/.test(t)) return { kind: "invalid", reason: "zero" };
  }
  return { kind: "none" };
}

// ---------- timeframe ----------

export type TimeRead =
  | { kind: "time"; when: When; months?: number; label?: string }
  | { kind: "invalid"; reason: "past" | "impossible" | "conflict"; label?: string }
  | { kind: "none" };

/** "this week", "next month", "before December", "whenever I can afford it", "by the 31st of February" (invalid). */
export function readTime(text: string): TimeRead {
  const t = text.toLowerCase();
  if (/yesterday|last (week|month|year)|already passed|in the past/.test(t)) return { kind: "invalid", reason: "past" };
  const imp = t.match(/(february|feb)\s+(3[01]|29th|30th|31st|30|31)|(april|june|september|november)\s+31|\b(3[2-9]|[4-9]\d)(st|nd|rd|th)\b/);
  if (imp) return { kind: "invalid", reason: "impossible", label: cap(imp[0]) };

  const soon = /this week|this month|today|tonight|tomorrow|\bnow\b|asap|right away|this weekend|soon|urgent|in a few days|next week/.test(t);
  const monthHit = MONTHS.map((m, i) => ({ m, i })).find(({ m }) => new RegExp(`\\b${m}\\b|\\b${m.slice(0, 3)}\\b(?!\\w)`).test(t) && !(m === "may" && /\bmay\b(?! \d)/.test(t) && !/in may|by may|before may|until may/.test(t)));
  if (monthHit) {
    const months = (monthHit.i - NOW + 12) % 12;
    if (soon && months > 0) return { kind: "invalid", reason: "conflict", label: `${t.match(/this week|today|tomorrow|this weekend|next week|now|soon/)?.[0]} or ${cap(monthHit.m)}` };
    const label = cap(monthHit.m);
    return months === 0 ? { kind: "time", when: "now", months: 0, label } : { kind: "time", when: "wait", months, label };
  }
  if (soon) return { kind: "time", when: "now", months: 0 };
  if (/next month/.test(t)) return { kind: "time", when: "wait", months: 1, label: cap(MONTHS[(NOW + 1) % 12]) };
  if (/(in|within) (a )?(couple|few|two|three|2|3) months/.test(t)) return { kind: "time", when: "wait", months: /three|3|few/.test(t) ? 3 : 2 };
  if (/holiday|christmas/.test(t)) return { kind: "time", when: "wait", months: (11 - NOW + 12) % 12, label: "December" };
  if (/whenever|when i can afford|no rush|not in a rush|no hurry|can wait|later|eventually|someday|not urgent|in a while/.test(t)) return { kind: "time", when: "wait" };
  if (/look|brows|just seeing|window shop|curious/.test(t)) return { kind: "time", when: "looking" };
  return { kind: "none" };
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

// ---------- item ----------

const VAGUE = /^(something|stuff|things?|anything|it|one|some|a thing|smth|sth|something nice|a few things|that|this)$/;
const STOP = String.raw`\s+(?:for|next|this|by|before|in|that|which|on|at|from|with|around|about|under|over|because|so|but|and|if|when|maybe|soon|today|tomorrow)\b|\$|\d|[,.!?]`;

/** The item from a request: "I'm thinking about getting a new jacket" → "Jacket". Undefined if vague or absent. */
export function readItem(text: string, loose = false): { name?: string; vague: boolean } {
  const demo = demoIn(text);
  if (demo) return { name: demo.name, vague: false };
  const t = text.toLowerCase().replace(/[“”"]/g, "").trim();
  const m = t.match(/(?:buy|buying|get|getting|purchase|purchasing|afford|want|wanting|need|eyeing|looking at|thinking (?:about|of)|treat myself to|splurge on|order|ordering)\s+(.+)/);
  let phrase = m ? m[1] : loose ? t : "";
  // Prices and times aren't part of the name ("a $1500 couch", "a jacket next week").
  phrase = phrase
    .replace(/\$\s?\d[\d,.]*\s?k?|\b\d[\d,.]*\s?k?\s*(?:dollars|bucks)\b/g, " ")
    .replace(/\b(?:this|next|last)\s+(?:week|weekend|month|year)\b|\b(?:today|tonight|tomorrow|soon|whenever|asap|right now|for now)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  phrase = phrase
    .replace(/^(?:to\s+)?(?:buy|get|getting|buying|purchase|order)\s+/, "")
    .replace(/^(?:a|an|the|some|new|a new|pair of|a pair of|these|those|this|that|my|another|cute|nice|really|super)\s+/g, "")
    .replace(/^(?:a|an|the|some|new|pair of|a pair of|cute|nice)\s+/g, "")
    .replace(/^(?:of)\s+/, "");
  const cut = phrase.search(new RegExp(STOP));
  if (cut >= 0) phrase = phrase.slice(0, cut);
  phrase = phrase.replace(/\s+(please|now|lol|haha)$/, "").trim();
  const words = phrase.split(/\s+/).filter(Boolean).slice(0, 4);
  const name = words.join(" ");
  if (!name || VAGUE.test(name) || /^(i|me|you|to|a|an|the|is|it's|they're)$/.test(name)) return { vague: !!m || loose, name: undefined };
  return { name: cap(name), vague: false };
}

export function demoIn(text: string) {
  const t = text.toLowerCase();
  const keys: Record<string, RegExp> = {
    ticket: /taylor swift|concert ticket|eras/,
    boots: /zara|boots/,
    bag: /suede|shoulder bag|\bbag\b/,
    sunglasses: /sunglasses|shades/,
    dinner: /musaafer|dinner/,
    airpods: /airpods|air pods/,
  };
  return DEMO_ITEMS.find((i) => keys[i.id]?.test(t));
}

/** Someone wants to buy something (as opposed to asking about goals, the budget, or chatting). */
export function wantsToBuy(text: string): boolean {
  const t = text.toLowerCase();
  if (/goal|rearrange|prioriti|how am i|budget look|spent so far|bills?\b/.test(t)) return false;
  return /\b(buy|buying|get|getting|purchase|purchasing|afford|want|wanna|eyeing|thinking (about|of)|looking at|treat myself|splurge|order)\b/.test(t) || !!demoIn(t);
}

// ---------- Penny's next question ----------

const low = (name: string) => (/^[A-Z][a-z]/.test(name) && !/^(Zara|Dior|Taylor|AirPods|MacBook|Musaafer)/.test(name) ? name[0].toLowerCase() + name.slice(1) : name);
const wearable = (name: string) => /boot|heel|shoe|sneaker|bag|sunglass|jacket|coat|dress|jean|shirt|sweater|top|skirt|watch|necklace|ring|earring/i.test(name);
const isAre = (name: string) => (pronoun(name) === "them" ? "are" : "is");

export const isComplete = (d: Draft): d is PlansCard => !!d.name && typeof d.price === "number" && d.price > 0;

const ask = (step: AskStep, item: Draft, text: string, extra?: Partial<NonNullable<ChatMessage["ask"]>>): ChatMessage => ({
  id: newId(),
  role: "assistant",
  text,
  mood: "listening",
  ask: { step, item, ...extra },
});

/**
 * The next thing Penny needs, in priority order. `lead` is a short reaction to what the user
 * just said ("Next week, got it!"), so it feels like a conversation rather than a form.
 */
export function nextStep(d: Draft, lead = ""): ChatMessage {
  const pre = lead ? `${lead} ` : "";
  if (!Number.isFinite(d.left)) {
    // Never happens with the demo's budget, but Penny never invents one.
    return ask("finance", d, `${pre}I can help you plan for that! Do you want to use your current budget or just work out a savings timeline?`);
  }
  if (!d.name) return ask("item", d, `${pre || "Of course! "}What are you thinking of getting?`);
  if (!(typeof d.price === "number" && d.price > 0)) {
    const react = pre || (wearable(d.name) ? "Cute! " : "Love that! ");
    return ask("price", d, `${react}About how much ${isAre(d.name)} the ${low(d.name)}?`);
  }
  if (!d.answers?.when) {
    if (d.image && !pre) return ask("when", d, `Ooh, ${d.name} for ${money(d.price)}! Love that pick. When were you hoping to get ${pronoun(d.name)}?`);
    return ask("when", d, `${pre || "Got it! "}When were you hoping to get ${pronoun(d.name)}?`);
  }
  const item = d as PlansCard;
  if (!d.answers.use && !isExperience(d.name)) {
    const q = useQuestion(item);
    return pre ? { ...q, text: `${pre}${q.text.slice(q.text.indexOf("How often"))}` } : q;
  }
  return checkingMessage(item);
}

/** Phrases for checking a value without losing anything else. */
export const priceCheck = (v: number) => `Just checking, did you mean ${money(v)}? I want to make sure I get your plan right.`;
export const rangeNote = (low: number, high: number) => `Between ${money(low)} and ${money(high)}, got it. I'll plan for ${money(high)} to be safe.`;
