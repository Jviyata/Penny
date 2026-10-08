"use client";

import { useEffect, useRef } from "react";
import { MONTH } from "@/lib/demoData";
import { money, newId } from "@/lib/format";
import type { PreparedImage } from "@/lib/image";
import {
  demoIn,
  isComplete,
  nextStep,
  priceCheck,
  rangeNote,
  readItem,
  readMoney,
  readTime,
  wantsToBuy,
} from "@/lib/intake";
import { checkingMessage, isSkip, parseUse, parseWhen } from "@/lib/interview";
import type { Goal } from "@/lib/monthDetails";
import { monthAfter, planFor, type PlanId } from "@/lib/planOptions";
import { isAre, pronounFor, scheduleFor, stepDate } from "@/lib/savings";
import { useStore } from "@/lib/store";
import type { ChatMessage, Draft, Outgoing, PlansCard } from "@/lib/types";
import { sameName } from "@/lib/updates";

/**
 * Penny's conversation brain. Every typed or spoken message goes through `handleSend`, which works
 * out where the conversation is (a question she asked, her answer card, a correction, a new item)
 * and moves it forward: asking only for what's missing, checking values that look wrong, never
 * restarting or losing what the user already said. Saves only report success after they happen,
 * and every save is safe to repeat.
 */

// Demo/testing hook: open the app with ?fail=save and the next save fails once, to show recovery.
const FAIL_KEY = "ciat:fail-next";
function consumeFailure(): boolean {
  try {
    if (sessionStorage.getItem(FAIL_KEY) === "1") {
      sessionStorage.removeItem(FAIL_KEY);
      return true;
    }
  } catch {}
  return false;
}

const lowName = (name: string) => (/^[A-Z][a-z]/.test(name) && !/^(Zara|Dior|Taylor|AirPods|MacBook|Musaafer)/.test(name) ? name[0].toLowerCase() + name.slice(1) : name);
const it = (name: string) => pronounFor(name);
const yes = (t: string) => /^(yes|yeah|yep|yup|sure|ok|okay|right|correct|exactly|that's right|mhm|uh huh|definitely|please)\b/.test(t);
const no = (t: string) => /^(no|nope|nah|not really|wrong|that's not)\b/.test(t);

export function useConversation(send: (msg: Outgoing) => void) {
  const { state, dispatch } = useStore();
  const latest = useRef(state);
  latest.current = state;
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("fail") === "save") sessionStorage.setItem(FAIL_KEY, "1");
    } catch {}
  }, []);
  // Message ids whose save already went through, so double taps and retries never duplicate.
  const committed = useRef(new Set<string>());

  const say = (text: string, extra: Partial<ChatMessage> = {}) =>
    dispatch({ type: "addMessage", message: { id: newId(), role: "assistant", text, mood: "calm_neutral", ...extra } });
  const user = (text: string) => dispatch({ type: "addMessage", message: { id: newId(), role: "user", text } });
  const findMsg = (id?: string) => latest.current.messages.find((x) => x.id === id);

  // ---------- saving: goals, purchases, Wishlist ----------

  const choosePlan = (m: ChatMessage, id: PlanId, opts: { update?: boolean } = {}) => {
    const plans = findMsg(m.id)?.plans ?? m.plans;
    if (!plans || plans.chosen || committed.current.has(m.id)) return;
    // A timeline needs a real price; never build one from a missing or broken value.
    if (!(plans.price > 0)) {
      say("I can put together a timeline! I just need to know the price first. About how much is it?", {
        ask: { step: "price", item: { name: plans.name, left: plans.left, image: plans.image, answers: plans.answers } },
      });
      return;
    }
    const s = latest.current;
    const existing = id !== "now" ? s.goals.find((g) => sameName(g.name, plans.name)) : undefined;
    if (existing && !opts.update) {
      say(`You already have a goal for ${it(plans.name) === "them" ? "those" : "the"} ${lowName(plans.name)}! Want me to update it?`, {
        mood: "thinking",
        ask: { step: "dup", item: plans, plan: id, ref: m.id },
      });
      return;
    }
    if (consumeFailure()) {
      say("Looks like that didn't save properly. Your plan is still here. Want to try again?", { retry: { messageId: m.id, action: id } });
      return;
    }
    const o = planFor(plans.name, plans.price, plans.left, plans.answers).options.find((x) => x.id === id)!;
    const months = id === "wait2" ? 2 : 3;
    const getIt = monthAfter(months);
    committed.current.add(m.id);
    if (id === "now") {
      dispatch({ type: "setTotal", amount: s.freeTotal - o.amount });
      say(`Yay, enjoy ${it(plans.name)}! You still have ${money(o.left)} left for ${MONTH.name}.`, { mood: "celebrating" });
    } else if (existing) {
      // Update the plan, keeping what's already saved; nothing new leaves Left to spend.
      const rest = Math.max(0, plans.price - existing.saved);
      const later = scheduleFor(rest, months - 1).map((x) => ({ ...x, month: x.month + 1, done: false }));
      const goal: Goal = { ...existing, target: plans.price, by: `By ${getIt}`, getIt, image: existing.image ?? plans.image, schedule: [{ month: 0, amount: existing.saved, done: true }, ...later] };
      dispatch({ type: "startSavingGoal", goal });
      const next = later[0];
      say(
        `Done! I updated your ${lowName(plans.name)} goal.${next ? ` Next is ${money(next.amount)} on ${stepDate(next.month)},` : ""} and ${isAre(plans.name).toLowerCase()} yours in ${getIt}.`,
        { mood: "celebrating", tracking: { goalId: existing.id } },
      );
    } else {
      // A goal with a savings plan: this month's share now, the rest on the 1st of each month.
      const schedule = scheduleFor(plans.price, months);
      const goalId = newId();
      dispatch({ type: "setTotal", amount: s.freeTotal - o.amount });
      dispatch({
        type: "startSavingGoal",
        goal: { id: goalId, name: plans.name, target: plans.price, saved: o.amount, thisMonth: o.amount, by: `By ${getIt}`, image: plans.image, schedule, getIt },
      });
      const next = schedule[1];
      say(
        `Yay, it's a plan! I made a goal for your ${lowName(plans.name)} and set aside ${money(o.amount)} today. I'll remind you here on ${stepDate(next.month)} for the next ${money(next.amount)}, and ${isAre(plans.name).toLowerCase()} yours in ${getIt}!`,
        { mood: "celebrating", tracking: { goalId } },
      );
    }
    dispatch({ type: "updatePlans", messageId: m.id, patch: { chosen: id } });
  };

  /** Wishlist on/off. `talk` adds Penny's confirmation (for spoken/typed requests and offers). */
  const setWishlist = (m: ChatMessage, on: boolean, talk = false) => {
    const plans = findMsg(m.id)?.plans ?? m.plans;
    if (!plans) return;
    if (on) {
      if (latest.current.shelf.some((x) => sameName(x.name, plans.name))) {
        dispatch({ type: "updatePlans", messageId: m.id, patch: { remind: true } });
        if (talk) say(`${isAre(plans.name)} already on your Wishlist!`, { mood: "approved" });
        return;
      }
      if (consumeFailure()) {
        say("Looks like that didn't save to your Wishlist. Your item is still here. Want to try again?", { retry: { messageId: m.id, action: "remind" } });
        return;
      }
      dispatch({ type: "applyUpdates", updates: [{ type: "save_to_shelf", name: plans.name, price: plans.price, image: plans.image, status: "Saved for later" }] });
      dispatch({ type: "updatePlans", messageId: m.id, patch: { remind: true } });
      if (talk) say("Saved! It's on your Wishlist whenever you're ready. Just ask me again and I'll check if it fits.", { mood: "celebrating" });
    } else {
      dispatch({ type: "applyUpdates", updates: [{ type: "remove_from_shelf", name: plans.name }] });
      dispatch({ type: "updatePlans", messageId: m.id, patch: { remind: false } });
    }
  };

  /** The two chips under her answer. Price tracking isn't something the demo can do, so she says so. */
  const togglePlans = (m: ChatMessage, key: "remind" | "priceWatch") => {
    const plans = findMsg(m.id)?.plans ?? m.plans;
    if (!plans) return;
    if (key === "remind") return setWishlist(m, !plans.remind);
    if (plans.remind) {
      say("It's on your Wishlist, but I can't track its price automatically just yet.");
      return;
    }
    say("I can save that to your Wishlist, but I can't track its price automatically just yet. Want me to save it?", {
      ask: { step: "wishlist-offer", item: plans, ref: m.id },
    });
  };

  const retry = (m: ChatMessage) => {
    if (!m.retry) return;
    const target = findMsg(m.retry.messageId);
    if (!target) return;
    if (m.retry.action === "remind") setWishlist(target, true, true);
    else choosePlan(target, m.retry.action);
  };

  // ---------- starting and correcting a purchase ----------

  /** A new purchase from free text: capture every detail given, then ask for the first missing one. */
  const start = (text: string) => {
    const s = latest.current;
    const demo = demoIn(text);
    const item = readItem(text);
    const d: Draft = { left: s.freeTotal, name: item.name, image: demo?.art, price: demo?.price, answers: {} };
    let lead = "";
    const cash = readMoney(text);
    if (cash.kind === "amount" && !cash.fromWords) d.price = cash.value;
    if (cash.kind === "range") {
      d.price = cash.high;
      lead = rangeNote(cash.low, cash.high);
    }
    const time = readTime(text);
    if (time.kind === "time") d.answers = { when: time.when, months: time.months, label: time.label };
    user(text);
    if (cash.kind === "invalid") {
      say(`Hmm, that price doesn't look quite right. ${d.name ? `About how much ${isAre(d.name).toLowerCase() === "they're" ? "are" : "is"} the ${lowName(d.name)}?` : "What are you thinking of getting?"}`, {
        ask: { step: d.name ? "price" : "item", item: d },
      });
      return;
    }
    if (cash.kind === "amount" && cash.fromWords && d.name) {
      say(priceCheck(cash.value), { ask: { step: "confirm-price", item: { ...d, price: cash.value } } });
      return;
    }
    if (time.kind === "invalid" && d.name && d.price) return askWhenFix(d, time);
    dispatch({ type: "addMessage", message: nextStep(d, lead) });
  };

  const askWhenFix = (d: Draft, time: Extract<ReturnType<typeof readTime>, { kind: "invalid" }>) => {
    const msg =
      time.reason === "past"
        ? `Just checking, that's already passed. When were you hoping to get ${it(d.name ?? "it")}?`
        : time.reason === "impossible"
          ? `Just checking, ${time.label} isn't a real date. When were you hoping to get ${it(d.name ?? "it")}?`
          : `Just checking, did you mean ${time.label}? I want to make sure I get your plan right.`;
    say(msg, { mood: "thinking", ask: { step: "fix-when", item: d } });
  };

  /** "Actually it's $450, and I want it in December": recalculate and show the revised plan before saving. */
  const revise = (p: PlansCard, text: string): boolean => {
    const cash = readMoney(text);
    const time = readTime(text);
    const d: PlansCard = { name: p.name, price: p.price, left: p.left, image: p.image, answers: { ...p.answers } };
    if (cash.kind === "invalid") {
      user(text);
      say(`Hmm, that price doesn't look quite right. About how much is the ${lowName(p.name)} now?`, { ask: { step: "price", item: { ...d, price: undefined } } });
      return true;
    }
    if (cash.kind === "amount") d.price = cash.value;
    if (cash.kind === "range") d.price = cash.high;
    if (time.kind === "invalid") {
      user(text);
      askWhenFix(d, time);
      return true;
    }
    if (time.kind === "time") d.answers = { ...d.answers, when: time.when, months: time.months, label: time.label };
    if (d.price === p.price && JSON.stringify(d.answers) === JSON.stringify(p.answers)) return false;
    user(text);
    const label = d.answers?.label ?? (time.kind === "time" && time.when === "now" ? "this month" : undefined);
    dispatch({
      type: "addMessage",
      message: { id: newId(), role: "assistant", text: `Got it! I'll adjust the plan for ${money(d.price)}${label ? ` ${label === "this month" ? label : `in ${label}`}` : ""}.`, plans: d },
    });
    return true;
  };

  const isCorrection = (t: string, p: PlansCard) => {
    const cash = readMoney(t);
    const time = readTime(t);
    const aboutIt = /actually|instead|wait|change|correction|it's|its|they're|theyre|it is|they are|now|price|want (it|them)|need (it|them)/.test(t) || (p.name && t.includes(p.name.toLowerCase().split(" ").pop()!));
    return aboutIt && (cash.kind !== "none" || time.kind !== "none") && !wantsNewItem(t, p.name);
  };
  const wantsNewItem = (t: string, current?: string) => {
    const r = readItem(t);
    return !!r.name && wantsToBuy(t) && !(current && sameName(r.name, current)) && !/^(it|them)$/i.test(r.name);
  };

  // ---------- answering Penny's questions ----------

  const answer = (m: ChatMessage, text: string): boolean => {
    const a = m.ask!;
    const t = text.toLowerCase().trim();
    const d: Draft = { ...a.item, answers: { ...a.item.answers } };
    const tries = a.tries ?? 0;
    const again = (step: typeof a.step, msg: string, item: Draft = d) => {
      user(text);
      say(msg, { mood: "thinking", ask: { ...a, step, item, tries: tries + 1 } });
      return true;
    };
    const go = (item: Draft, lead = "") => {
      user(text);
      dispatch({ type: "addMessage", message: nextStep(item, lead) });
      return true;
    };

    // Switching to a different item mid-way starts fresh (the old one isn't saved anywhere).
    if (a.step !== "item" && a.step !== "dup" && a.step !== "decide" && /actually|instead|rather|never ?mind|no,? i want/.test(t) && wantsNewItem(t, d.name)) {
      start(text);
      return true;
    }

    // Details given out of order are kept: a price mentioned while she asks "when", and so on.
    let lead = "";
    if (!["price", "confirm-price", "dup", "decide", "wishlist-offer"].includes(a.step)) {
      const cash = readMoney(text);
      if (cash.kind === "amount" && !cash.fromWords && d.name) {
        d.price = cash.value;
        lead = `Got it, ${money(cash.value)}.`;
      }
      if (cash.kind === "range") {
        d.price = cash.high;
        lead = rangeNote(cash.low, cash.high);
      }
    }
    if (!["when", "fix-when", "dup", "decide", "wishlist-offer"].includes(a.step)) {
      const time = readTime(text);
      if (time.kind === "time") d.answers = { ...d.answers, when: time.when, months: time.months, label: time.label };
    }

    switch (a.step) {
      case "item": {
        const r = readItem(text, true);
        const demo = demoIn(text);
        if (r.name) {
          d.name = r.name;
          if (demo && !d.price) {
            d.price = demo.price;
            d.image = demo.art;
          }
          return go(d, lead);
        }
        return again("item", tries >= 1 ? "No worries! Tell me what it is, or tap + to pick something from the gallery." : "Sorry, I missed what it is. What are you thinking of getting?");
      }
      case "price":
      case "confirm-price": {
        if (a.step === "confirm-price") {
          if (yes(t)) return go(d);
          if (no(t) && readMoney(text, true).kind === "none") return again("price", `No problem! What's the price of the ${lowName(d.name ?? "item")}?`, { ...d, price: undefined });
        }
        const cash = readMoney(text, true);
        if (cash.kind === "amount") {
          if (cash.fromWords) return again("confirm-price", priceCheck(cash.value), { ...d, price: cash.value });
          return go({ ...d, price: cash.value });
        }
        if (cash.kind === "range") return go({ ...d, price: cash.high }, rangeNote(cash.low, cash.high));
        if (cash.kind === "invalid")
          return again("price", `Hmm, ${cash.reason === "negative" ? "a price can't be negative" : "that comes out to $0"}. About how much ${it(d.name ?? "") === "them" ? "are" : "is"} the ${lowName(d.name ?? "item")}?`);
        const name = lowName(d.name ?? "something");
        if (tries === 0) return again("price", `I caught that you're looking at ${it(d.name ?? "") === "them" ? "some" : "a"} ${name}, but I missed the price. How much ${it(d.name ?? "") === "them" ? "were they" : "was it"}?`);
        if (tries === 1) return again("price", "No problem! Even a rough guess works, like $50 or $200.");
        return again("price", "You can also type the price with the keyboard button, and I'll take it from there.");
      }
      case "when":
      case "fix-when": {
        if (isSkip(t)) {
          user(text);
          dispatch({ type: "addMessage", message: checkingMessage(d as PlansCard) });
          return true;
        }
        const time = readTime(text);
        if (time.kind === "time") {
          d.answers = { ...d.answers, when: time.when, months: time.months, label: time.label };
          return go(d, lead || (time.label ? `${time.label}, got it!` : ""));
        }
        if (time.kind === "invalid") {
          user(text);
          askWhenFix(d, time);
          return true;
        }
        const w = parseWhen(t);
        if (w) {
          d.answers = { ...d.answers, when: w };
          return go(d, lead);
        }
        if (tries >= 1) {
          d.answers = { ...d.answers, when: "wait" };
          return go(d, "No problem, I'll plan it so there's no rush.");
        }
        return again(a.step, `Sorry, I didn't catch when. Do you need ${it(d.name ?? "it")} this week, or is there no rush?`);
      }
      case "use": {
        if (isSkip(t)) {
          user(text);
          dispatch({ type: "addMessage", message: checkingMessage(d as PlansCard) });
          return true;
        }
        d.answers = { ...d.answers, use: parseUse(t) ?? "sometimes" };
        user(text);
        dispatch({ type: "addMessage", message: lead ? { ...checkingMessage(d as PlansCard), text: `${lead} Let me take a quick look at your month.` } : checkingMessage(d as PlansCard) });
        return true;
      }
      case "finance":
        return go({ ...d, left: latest.current.freeTotal });
      case "decide": {
        const card = findMsg(a.ref);
        if (!card?.plans) return false;
        user(text);
        if (/wish|later|keep|hold|not now|save it for/.test(t)) setWishlist(card, true, true);
        else if (/sav|wait|plan|goal|set aside/.test(t)) {
          const pick = planFor(card.plans.name, card.plans.price, card.plans.left, card.plans.answers).pick;
          choosePlan(card, pick === "now" ? "wait2" : pick);
        } else if (/buy|now|get (it|them)/.test(t)) choosePlan(card, "now");
        else say("No problem! You can tap any option on the card whenever you're ready.");
        return true;
      }
      case "dup": {
        const card = findMsg(a.ref);
        if (!card || !a.plan) return false;
        if (/update|yes|yeah|yep|sure|replace|change|okay|ok\b/.test(t)) {
          user(text);
          choosePlan(card, a.plan, { update: true });
          return true;
        }
        if (/keep|no|nope|don'?t|leave|current/.test(t) || tries >= 1) {
          user(text);
          say(`Okay! I'll keep your current plan for the ${lowName(d.name ?? "item")}.`, { mood: "approved" });
          return true;
        }
        return again("dup", "Just to be sure, should I update your goal with this new plan, or keep the one you have?");
      }
      case "wishlist-offer": {
        const card = findMsg(a.ref);
        user(text);
        if (card && (yes(t) || /save|wish/.test(t))) setWishlist(card, true, true);
        else say("No problem!", { mood: "approved" });
        return true;
      }
    }
    return false;
  };

  /** Replies to her answer card: choices, "sounds good", "maybe", corrections. */
  const replyToPlans = (m: ChatMessage, text: string): boolean => {
    const p = m.plans!;
    const t = text.toLowerCase().trim();
    if (isCorrection(t, p)) return revise(p, text);
    if (/wish ?list|remind|later|not now|hold off/.test(t)) {
      user(text);
      setWishlist(m, true, true);
      return true;
    }
    const pick = planFor(p.name, p.price, p.left, p.answers).pick;
    // "Maybe I'll do that" isn't a yes: ask one short question instead of saving anything.
    if (/\b(maybe|might|not sure|i don'?t know|idk|hmm+|probably)\b/.test(t)) {
      user(text);
      say(`Sounds good! Did you want to ${pick === "now" ? "buy it now" : "start saving for it"} or keep it on your Wishlist?`, {
        mood: "thinking",
        ask: { step: "decide", item: p, ref: m.id },
      });
      return true;
    }
    // A yes to her one suggestion ("Does that sound good?") goes with her pick.
    const agree =
      /^(yes|yeah|yep|yup|sure|ok|okay|sounds (good|great|perfect)|let'?s (do|go with) (it|that)|let'?s go|go with (it|that)|do it|perfect|deal|that works|works for me|i guess that works|alright|all right)\b/.test(t);
    const id: PlanId | null = agree
      ? pick
      : /three|3 month/.test(t)
        ? "wait3"
        : /wait|two|2 month|save up|saving|start saving/.test(t)
          ? "wait2"
          : /\bbuy\b|get (it|them)|go (for it|ahead)|purchase/.test(t)
            ? "now"
            : null;
    if (id) {
      user(text);
      choosePlan(m, id);
      return true;
    }
    if (wantsNewItem(t, p.name)) {
      start(text);
      return true;
    }
    return false;
  };

  /** Everything the user types or says comes here first; anything that isn't about a purchase goes to the AI. */
  const handleSend = (text: string, image?: PreparedImage) => {
    const s = latest.current;
    const t = text.trim();
    if (image || !t || s.thinking) return send({ text, image });
    const last = s.messages[s.messages.length - 1];
    if (last?.ask && answer(last, t)) return;
    // Typing while she's still checking: show her answer now and treat the message as a reply to it.
    if (last?.checks && isComplete(last.checks.item)) {
      const card: ChatMessage = { id: newId(), role: "assistant", text: "", plans: last.checks.item };
      dispatch({ type: "addMessage", message: card });
      if (replyToPlans(card, t)) return;
    }
    if (last?.plans && !last.plans.chosen && replyToPlans(last, t)) return;
    if (last?.retry && /try again|retry|again|yes|yeah|ok/.test(t.toLowerCase())) {
      user(t);
      retry(last);
      return;
    }
    // A change to a plan that was already decided: show the revised plan before saving anything.
    const planMsg = [...s.messages].reverse().find((x) => x.plans);
    const lastPlans = planMsg?.plans;
    if (planMsg && lastPlans && isCorrection(t.toLowerCase(), lastPlans)) {
      // Already bought: fix the price on the purchase instead of buying it again.
      const cash = readMoney(t);
      if (lastPlans.chosen === "now" && cash.kind === "amount" && cash.value > 0 && cash.value !== lastPlans.price) {
        user(t);
        const left = s.freeTotal + lastPlans.price - cash.value;
        dispatch({ type: "setTotal", amount: left });
        dispatch({ type: "updatePlans", messageId: planMsg.id, patch: { price: cash.value } });
        say(`Got it! I updated the ${lowName(lastPlans.name)} to ${money(cash.value)}, so you have ${money(left)} left for ${MONTH.name}.`, { mood: "approved" });
        return;
      }
      if (lastPlans.chosen !== "now" && revise(lastPlans, t)) return;
    }
    if (wantsToBuy(t) || (readMoney(t).kind !== "none" && readItem(t).name)) return start(t);
    send({ text, image });
  };

  /** The gallery: a known item with its photo and price; Penny starts with "when". */
  const startWith = (d: Draft) => dispatch({ type: "addMessage", message: nextStep(d) });

  const finishChecks = (m: ChatMessage) => {
    const s = latest.current;
    const last = s.messages[s.messages.length - 1];
    if (!m.checks || last?.id !== m.id || !isComplete(m.checks.item)) return;
    dispatch({ type: "addMessage", message: { id: newId(), role: "assistant", text: "", plans: m.checks.item } });
  };

  return { handleSend, choosePlan, togglePlans, retry, startWith, finishChecks, setWishlist };
}
