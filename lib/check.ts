import { VERDICT_LABEL } from "./budget";
import { fallbackCheck, type Snapshot } from "./fallback";
import { money } from "./format";
import type { ChatMessage, CheckRequest, CheckResult, Outgoing } from "./types";

const TIMEOUT_MS = 50_000; // the agent can take longer than a single call; the fallback covers anything slower

/**
 * Ask "can I afford this?" via POST /api/check. Any failure (offline, timeout, rate limit,
 * missing key, bad output) quietly falls back to the local engine, so there's never an error screen.
 */
export async function check(
  msg: Outgoing,
  snapshot: Snapshot,
  messages: ChatMessage[],
): Promise<{ result: CheckResult; offline: boolean }> {
  const local = () => fallbackCheck(msg, snapshot);

  let result: CheckResult;
  try {
    result = await callApi(toRequest(msg, snapshot, messages));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.info("[check] using local fallback:", (err as Error).message);
    return { result: local(), offline: true };
  }

  // Saving and buying are recorded by the app itself, the same way every time.
  const kind = msg.action?.kind;
  if (kind === "save_for_later" || kind === "buy_anyway") {
    result = { ...result, updates: local().updates };
  }
  return { result, offline: false };
}

async function callApi(body: CheckRequest): Promise<CheckResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.result) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data.result as CheckResult;
  } finally {
    clearTimeout(timer);
  }
}

function toRequest(msg: Outgoing, s: Snapshot, messages: ChatMessage[]): CheckRequest {
  return {
    message: {
      text: msg.text,
      image: msg.image?.full,
      action: msg.action
        ? { kind: msg.action.kind, item: { name: msg.action.item.name, price: msg.action.item.price } }
        : undefined,
    },
    state: {
      freeTotal: s.freeTotal,
      plans: s.plans.map(({ name, amount }) => ({ name, amount })),
      bought: s.bought.map(({ name, amount }) => ({ name, amount })),
      shelf: s.shelf.map(({ name, price, status }) => ({ name, price, status })),
      currentItem: s.currentItem ? { name: s.currentItem.name, price: s.currentItem.price } : null,
      goals: (s.goals ?? []).map(({ name, target, saved, thisMonth, by }) => ({ name, target, saved, thisMonth, by })),
    },
    // Text-only history; cards are summarized so the model remembers what it showed.
    history: messages.slice(-12).map((m) => ({
      role: m.role,
      text:
        m.role === "user"
          ? m.text || (m.image ? "(sent a photo)" : "")
          : m.card
            ? `${m.text}\n[Card shown: ${m.card.name}, ${money(m.card.price)}, ${VERDICT_LABEL[m.card.verdict]}]`
            : m.text,
    })),
  };
}
