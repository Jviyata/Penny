import type { Mood } from "./mood";

export type Line = { id: string; name: string; amount: number; what?: string; date?: string; image?: string; note?: string };

export type Verdict = "comfortable" | "tight" | "later" | "not_this_month";

export type ActionKind = "save_for_later" | "make_it_work" | "buy_anyway" | "other";

export type CardAction = { label: string; kind: ActionKind };

export type ResultCard = {
  name: string;
  price: number;
  verdict: Verdict;
  openBefore: number;
  openAfter: number;
  image?: string; // thumbnail data URL
  actions: CardAction[];
  chosen?: string; // label of the button the user tapped
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  image?: string; // thumbnail data URL for display
  card?: ResultCard;
  quickReplies?: string[];
  failed?: boolean; // reply came from the offline fallback
  mood?: Mood; // the mascot's expression for this reply
  plans?: PlansCard; // the Buy Now / Wait 2 / Wait 3 cards for a demo gallery item
  ask?: { step: "when" | "use"; item: PlansCard }; // one of Penny's questions before her answer
  checks?: { item: PlansCard }; // "Checking your month…": what Penny looks at before answering
};

/** What you told Penny before her answer. */
export type When = "now" | "wait" | "looking";
export type Use = "daily" | "sometimes" | "once";
export type Answers = { when?: When; use?: Use };

/** Penny's pricing-plan style answer. The options are recomputed from these numbers when shown. */
export type PlansCard = {
  name: string;
  price: number;
  left: number; // left to spend when asked
  image?: string; // the item's picture
  chosen?: "now" | "wait2" | "wait3";
  remind?: boolean;
  priceWatch?: boolean;
  answers?: Answers; // from Penny's questions; they shape her pick
};

export type ShelfItem = {
  id: string;
  name: string;
  price: number;
  status: string; // e.g. "November looks better"
  image?: string;
  savedAt: number;
};

/** Changes the AI (or fallback) can make. Plans are matched by name. */
export type Update =
  | { type: "add_plan"; name: string; amount: number }
  | { type: "edit_plan"; name: string; newName?: string; amount?: number }
  | { type: "remove_plan"; name: string }
  | { type: "set_total"; amount: number }
  | { type: "save_to_shelf"; name: string; price: number; status: string; image?: string }
  | { type: "remove_from_shelf"; name: string }
  | { type: "add_bought"; name: string; amount: number; image?: string };

/** What /api/check (or the local fallback) returns. Numbers on the card are filled in on the client. */
export type CheckResult = {
  reply: string;
  card?: { name: string; price: number; verdict: Verdict; actions: CardAction[] };
  needsPrice?: boolean;
  quickReplies?: string[];
  updates?: Update[];
};

/** An item the chat is currently talking about. */
export type Item = { name: string; price?: number; image?: string };

/** What the user sent. `action` is set when they tapped a card button. */
export type Outgoing = {
  text: string;
  image?: { full: string; thumb: string };
  hint?: { name: string; price: number }; // demo files: lets the offline fallback "read" them
  action?: { kind: ActionKind; item: Item };
};

/** Body of POST /api/check. Images are already resized JPEG data URLs. */
export type CheckRequest = {
  message: { text: string; image?: string; action?: { kind: ActionKind; item: { name: string; price?: number } } };
  state: {
    freeTotal: number;
    plans: { name: string; amount: number }[];
    bought: { name: string; amount: number }[];
    shelf: { name: string; price: number; status: string }[];
    currentItem: { name: string; price?: number } | null;
    goals?: { name: string; target: number; saved: number; thisMonth: number; by: string }[];
  };
  history: { role: "user" | "assistant"; text: string }[];
};
