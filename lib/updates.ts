import { newId } from "./format";

const TODAY = "Oct 13"; // demo "today" (18 days left in October)

/** "You bought the vintage brass lamp." */
function boughtNote(name: string) {
  const n = name.trim();
  return n.toLowerCase() === "this item" ? "You bought something for yourself." : `You bought the ${n.toLowerCase()}.`;
}
import type { Line, ShelfItem, Update } from "./types";

type Budget = { freeTotal: number; plans: Line[]; bought: Line[]; shelf: ShelfItem[] };

export const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const findLine = (lines: Line[], name: string) =>
  lines.find((l) => sameName(l.name, name)) ??
  lines.find((l) => l.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(l.name.toLowerCase()));

/** Apply AI/fallback updates. Pure, so the chat can preview the result before dispatching. */
export function applyUpdates<T extends Budget>(s: T, updates: Update[]): T {
  let next = { ...s };
  for (const u of updates) {
    switch (u.type) {
      case "add_plan":
        next.plans = [...next.plans, { id: newId(), name: u.name, amount: u.amount }];
        break;
      case "edit_plan": {
        const hit = findLine(next.plans, u.name);
        if (hit)
          next.plans = next.plans.map((p) =>
            p.id === hit.id ? { ...p, name: u.newName ?? p.name, amount: u.amount ?? p.amount } : p,
          );
        break;
      }
      case "remove_plan": {
        const hit = findLine(next.plans, u.name);
        if (hit) next.plans = next.plans.filter((p) => p.id !== hit.id);
        break;
      }
      case "set_total":
        next.freeTotal = u.amount;
        break;
      case "add_bought":
        next.bought = [
          ...next.bought,
          { id: newId(), name: u.name, amount: u.amount, what: "Bought from chat", date: TODAY, image: u.image, note: boughtNote(u.name) },
        ];
        next.shelf = next.shelf.filter((x) => !sameName(x.name, u.name));
        break;
      case "save_to_shelf":
        next.shelf = [
          { id: newId(), name: u.name, price: u.price, status: u.status, image: u.image, savedAt: Date.now() },
          ...next.shelf.filter((x) => !sameName(x.name, u.name)),
        ];
        break;
      case "remove_from_shelf":
        next.shelf = next.shelf.filter((x) => !sameName(x.name, u.name));
        break;
    }
  }
  return next;
}
