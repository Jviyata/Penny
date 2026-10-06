"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { BASE_FREE_TOTAL, STARTING_BOUGHT, STARTING_PLANS } from "./demoData";
import { GOALS, type Goal } from "./monthDetails";
import { openMoney } from "./budget";
import { newId } from "./format";
import { applyUpdates } from "./updates";
import type { ChatMessage, Item, Line, PlansCard, ShelfItem, Update } from "./types";

export type State = {
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
  | { type: "resetDemo" };

const startingBudget = () => ({
  freeTotal: BASE_FREE_TOTAL,
  goals: GOALS.map((g) => ({ ...g })),
  plans: STARTING_PLANS.map((p) => ({ ...p })),
  bought: STARTING_BOUGHT.map((b) => ({ ...b })) as Line[],
  messages: [] as ChatMessage[],
  shelf: [] as ShelfItem[],
  currentItem: null as Item | null,
});

const initialState: State = { ...startingBudget(), demoMode: false, hydrated: false, thinking: false };

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
    const { freeTotal, goals, plans, bought, messages, shelf, currentItem } = state;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ freeTotal, goals, plans, bought, messages, shelf, currentItem }));
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
