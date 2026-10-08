"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { BASE_FREE_TOTAL, STARTING_BOUGHT, STARTING_PLANS, USER_NAME } from "./demoData";
import { GOALS, type Goal } from "./monthDetails";
import { openMoney } from "./budget";
import { newId } from "./format";
import { applyUpdates } from "./updates";
import { dueStep } from "./savings";
import type { ChatMessage, Item, Line, PlansCard, ShelfItem, Update } from "./types";

export type State = {
  userName: string;
  freeTotal: number;
  goals: Goal[];
  plans: Line[];
  bought: Line[];
  messages: ChatMessage[];
  shelf: ShelfItem[];
  demoMode: boolean;
  hydrated: boolean;
  thinking: boolean;
  /** The item the conversation is about (last card, or a photo still waiting for its price). */
  currentItem: Item | null;
  /** Demo clock: on = it's November 1, so Penny's savings reminders come due. */
  nov: boolean;
  /** Goals whose reminder was put off with "Later". */
  snoozed: string[];
};

export type Action =
  | { type: "hydrate"; state: Partial<State> }
  | { type: "setTotal"; amount: number }
  | { type: "addPlan"; name: string; amount: number }
  | { type: "editPlan"; id: string; name: string; amount: number }
  | { type: "removePlan"; id: string }
  | { type: "addBought"; name: string; amount: number }
  | { type: "removeBought"; id: string }
  | { type: "addMessage"; message: ChatMessage }
  | { type: "removeFromShelf"; id: string }
  | { type: "applyUpdates"; updates: Update[] }
  | { type: "chooseAction"; messageId: string; label: string }
  | { type: "setThinking"; on: boolean }
  | { type: "setCurrentItem"; item: Item | null }
  | { type: "setDemoMode"; on: boolean }
  | { type: "addGoal"; name: string; target: number }
  | { type: "editGoal"; id: string; name: string; target: number }
  | { type: "removeGoal"; id: string }
  | { type: "addToGoal"; id: string; amount: number }
  | { type: "updatePlans"; messageId: string; patch: Partial<PlansCard> }
  | { type: "clearChat" }
  | { type: "resetDemo" }
  | { type: "finishOnboarding"; name: string; goals: Goal[] }
  | { type: "startSavingGoal"; goal: Goal }
  | { type: "saveStep"; id: string }
  | { type: "snooze"; id: string }
  | { type: "setNov"; on: boolean }
  | { type: "reorderGoals"; ids: string[] };

const startingBudget = () => ({
  freeTotal: BASE_FREE_TOTAL,
  goals: GOALS.map((g) => ({ ...g })),
  plans: STARTING_PLANS.map((p) => ({ ...p })),
  bought: STARTING_BOUGHT.map((b) => ({ ...b })) as Line[],
  messages: [] as ChatMessage[],
  shelf: [] as ShelfItem[],
  currentItem: null as Item | null,
  nov: false,
  snoozed: [] as string[],
});

const initialState: State = { ...startingBudget(), userName: USER_NAME, demoMode: false, hydrated: false, thinking: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.state, hydrated: true };
    case "setTotal":
      return { ...state, freeTotal: action.amount };
    case "addPlan":
      return { ...state, plans: [...state.plans, { id: newId(), name: action.name, amount: action.amount }] };
    case "editPlan":
      return {
        ...state,
        plans: state.plans.map((p) => (p.id === action.id ? { ...p, name: action.name, amount: action.amount } : p)),
      };
    case "removePlan":
      return { ...state, plans: state.plans.filter((p) => p.id !== action.id) };
    case "addBought":
      return { ...state, bought: [...state.bought, { id: newId(), name: action.name, amount: action.amount }] };
    case "removeBought":
      return { ...state, bought: state.bought.filter((b) => b.id !== action.id) };
    case "addMessage":
      return { ...state, messages: [...state.messages, action.message] };
    case "removeFromShelf":
      return { ...state, shelf: state.shelf.filter((s) => s.id !== action.id) };
    case "applyUpdates":
      return applyUpdates(state, action.updates);
    case "chooseAction":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.messageId && m.card ? { ...m, card: { ...m.card, chosen: action.label } } : m,
        ),
      };
    case "setThinking":
      return { ...state, thinking: action.on };
    case "setCurrentItem":
      return { ...state, currentItem: action.item };
    case "setDemoMode":
      return { ...state, demoMode: action.on };
    case "addGoal":
      return {
        ...state,
        goals: [...state.goals, { id: newId(), name: action.name, target: action.target, saved: 0, thisMonth: 0, by: "No date yet" }],
      };
    case "editGoal":
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.id ? { ...g, name: action.name, target: action.target } : g)),
      };
    case "removeGoal":
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case "addToGoal":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.id ? { ...g, saved: g.saved + action.amount, thisMonth: g.thisMonth + action.amount } : g,
        ),
      };
    case "updatePlans":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.messageId && m.plans ? { ...m, plans: { ...m.plans, ...action.patch } } : m,
        ),
      };
    case "clearChat":
      return { ...state, messages: [], currentItem: null };
    case "resetDemo":
      return { ...state, ...startingBudget() };
    case "saveStep": {
      // Set aside the next amount that's due: it leaves Left to spend and goes into the goal.
      const goal = state.goals.find((g) => g.id === action.id);
      const step = goal && dueStep(goal, state.nov);
      if (!goal || !step) return state;
      return {
        ...state,
        freeTotal: state.freeTotal - step.amount,
        snoozed: state.snoozed.filter((id) => id !== goal.id),
        goals: state.goals.map((g) =>
          g.id === goal.id
            ? {
                ...g,
                saved: g.saved + step.amount,
                thisMonth: g.thisMonth + step.amount,
                schedule: g.schedule!.map((x) => (x === step ? { ...x, done: true } : x)),
              }
            : g,
        ),
      };
    }
    case "snooze":
      return { ...state, snoozed: [...state.snoozed.filter((id) => id !== action.id), action.id] };
    case "reorderGoals": {
      // Overview shows the first three; the rest are under More goals.
      const byId = new Map(state.goals.map((g) => [g.id, g]));
      const ordered = action.ids.map((id) => byId.get(id)).filter((g): g is Goal => !!g);
      return { ...state, goals: [...ordered, ...state.goals.filter((g) => !action.ids.includes(g.id))] };
    }
    case "setNov":
      return { ...state, nov: action.on, snoozed: [] };
    case "startSavingGoal":
      // Newest first, so it shows on Overview right away.
      return { ...state, goals: [action.goal, ...state.goals.filter((g) => g.name !== action.goal.name)] };
    case "finishOnboarding":
      // Every visit is a fresh demo: start from the October numbers with the goals just picked.
      return {
        ...state,
        ...startingBudget(),
        userName: action.name, // blank is fine: Overview then just says "Hi there"
        goals: action.goals.length ? action.goals : startingBudget().goals,
      };
  }
}

// Budget, chat and Shelf last for the browser session; Demo mode is a device preference.
const SESSION_KEY = "ciat:session:v1";
const DEMO_KEY = "ciat:demo";

function readStored(): Partial<State> {
  const out: Partial<State> = {};
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) Object.assign(out, JSON.parse(raw));
  } catch {}
  try {
    out.demoMode = localStorage.getItem(DEMO_KEY) === "1";
  } catch {}

  // ?demo=1 / ?demo=0 sets the preference, then disappears from the address bar.
  try {
    const url = new URL(window.location.href);
    const flag = url.searchParams.get("demo");
    if (flag === "1" || flag === "0") {
      out.demoMode = flag === "1";
      // Save right away so a second read (React dev re-runs effects) still sees it.
      localStorage.setItem(DEMO_KEY, flag);
      url.searchParams.delete("demo");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  } catch {}
  return out;
}

type Store = {
  state: State;
  dispatch: React.Dispatch<Action>;
  open: number;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: "hydrate", state: readStored() });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const { userName, freeTotal, goals, plans, bought, messages, shelf, currentItem, nov, snoozed } = state;
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ userName, freeTotal, goals, plans, bought, messages, shelf, currentItem, nov, snoozed }),
      );
    } catch {
      // Storage full (images) or blocked: the app keeps working in memory.
    }
    try {
      localStorage.setItem(DEMO_KEY, state.demoMode ? "1" : "0");
    } catch {}
  }, [state]);

  const open = openMoney(state.freeTotal, state.plans, state.bought);
  const value = useMemo(() => ({ state, dispatch, open }), [state, open]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
