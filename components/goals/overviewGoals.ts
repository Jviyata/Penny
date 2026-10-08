import type { Goal } from "@/lib/monthDetails";
import { goalLook } from "../ui/Icons";

/** The three goals Overview shows: goals with photos first (in your order), then the rest. */
export function overviewGoals(goals: Goal[]): Goal[] {
  const hasPhoto = (g: Goal) => !!(g.image ?? goalLook(g.name).photo);
  return [...goals.filter(hasPhoto), ...goals.filter((g) => !hasPhoto(g))].slice(0, 3);
}
