import type { CheckResult, Verdict } from "./types";

/** The mascot's ten expressions (files in /public/mascot). */
export type Mood =
  | "approved"
  | "calm_neutral"
  | "celebrating"
  | "concerned"
  | "confused"
  | "go_for_it"
  | "listening"
  | "not_right_now"
  | "oops"
  | "thinking";

/** Each answer gets an expression that shows feeling, not judgment. */
export const VERDICT_MOOD: Record<Verdict, Mood> = {
  comfortable: "approved",
  tight: "thinking",
  later: "not_right_now",
  not_this_month: "concerned",
};

/** Pick the expression for an assistant reply. */
export function moodFor(result: CheckResult, openBefore: number, openAfterUpdates: number): Mood {
  if (result.card) return VERDICT_MOOD[result.card.verdict];
  if (result.needsPrice) return "confused";
  const types = (result.updates ?? []).map((u) => u.type);
  if (types.includes("add_bought")) return "go_for_it";
  if (types.includes("save_to_shelf")) return "approved";
  if (types.length && openAfterUpdates > openBefore) return "celebrating";
  return "calm_neutral";
}
