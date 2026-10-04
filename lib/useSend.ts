"use client";

import { useCallback, useRef } from "react";
import { openMoney } from "./budget";
import { check } from "./check";
import { fallbackCheck } from "./fallback";
import { newId } from "./format";
import { useStore } from "./store";
import { moodFor } from "./mood";
import { applyUpdates, sameName } from "./updates";
import type { CheckResult, Item, Outgoing, ResultCard } from "./types";

const MIN_THINKING_MS = 700; // long enough to read "Reading it…", short enough to feel quick

/** Send a chat message (typed, spoken, photo, card button or demo file) and show the answer. */
export function useSend() {
  const { state, dispatch } = useStore();
  const latest = useRef(state);
  latest.current = state;
  const busy = useRef(false); // guards double taps before React re-renders

  return useCallback(
    async (msg: Outgoing) => {
      const s = latest.current;
      if (busy.current || s.thinking) return;
      busy.current = true;

      dispatch({ type: "addMessage", message: { id: newId(), role: "user", text: msg.text, image: msg.image?.thumb } });
      dispatch({ type: "setThinking", on: true });

      // A new photo becomes the item we're talking about, even before we know its price.
      const currentItem: Item | null = msg.image
        ? { name: msg.hint?.name ?? "This item", price: msg.hint?.price, image: msg.image.thumb }
        : s.currentItem;
      const snapshot = { freeTotal: s.freeTotal, plans: s.plans, bought: s.bought, shelf: s.shelf, currentItem };
      dispatch({ type: "setCurrentItem", item: currentItem });

      const started = Date.now();
      let result: CheckResult;
      let offline = false;
      try {
        ({ result, offline } = await check(msg, snapshot, s.messages));
      } catch {
        result = fallbackCheck(msg, snapshot);
        offline = true;
      }
      const wait = MIN_THINKING_MS - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));

      // Items saved to the Shelf keep their photo: from the card that was tapped, or the item being discussed.
      const photoFor = (name: string) =>
        msg.action && sameName(msg.action.item.name, name)
          ? msg.action.item.image
          : currentItem && (sameName(currentItem.name, name) || currentItem.name === "This item")
            ? currentItem.image
            : undefined;
      const updates = (result.updates ?? []).map((u) =>
        (u.type === "save_to_shelf" || u.type === "add_bought") && !u.image ? { ...u, image: photoFor(u.name) } : u,
      );

      // Numbers on the card always come from the budget math, never from the model.
      const next = applyUpdates(snapshot, updates);
      const open = openMoney(next.freeTotal, next.plans, next.bought);
      const mood = moodFor(result, openMoney(snapshot.freeTotal, snapshot.plans, snapshot.bought), open);

      let card: ResultCard | undefined;
      if (result.card) {
        const image =
          msg.image?.thumb ??
          (currentItem && (sameName(currentItem.name, result.card.name) || currentItem.name === "This item")
            ? currentItem.image
            : undefined);
        card = { ...result.card, image, openBefore: open, openAfter: Math.round((open - result.card.price) * 100) / 100 };
      }

      if (updates.length) dispatch({ type: "applyUpdates", updates });
      dispatch({
        type: "addMessage",
        message: { id: newId(), role: "assistant", text: result.reply, card, quickReplies: result.quickReplies, failed: offline, mood },
      });

      if (card) dispatch({ type: "setCurrentItem", item: { name: card.name, price: card.price, image: card.image } });
      else if (updates.some((u) => u.type === "add_bought")) dispatch({ type: "setCurrentItem", item: null });

      dispatch({ type: "setThinking", on: false });
      busy.current = false;
    },
    [dispatch],
  );
}
