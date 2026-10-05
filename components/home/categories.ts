import type { JobId } from "@/lib/monthDetails";
import { BoltIcon, BusIcon, CapIcon, CartIcon, HouseIcon, PiggyIcon } from "../ui/Icons";

export const CATEGORY_ICONS: Record<JobId, typeof HouseIcon> = {
  rent: HouseIcon,
  bills: BoltIcon,
  loans: CapIcon,
  groceries: CartIcon,
  transit: BusIcon,
  savings: PiggyIcon,
};

/** Order for the icon row under "Can I afford this?". */
export const CATEGORY_ORDER: JobId[] = ["rent", "bills", "loans", "groceries", "transit", "savings"];

/** One solid color per category, used on the Spending overview (bars, dots, progress). */
export const CATEGORY_COLORS: Record<JobId | "free", string> = {
  rent: "#c4946a",
  bills: "#8e7fc6",
  loans: "#c77d70",
  groceries: "#d2a643",
  transit: "#6b9bc6",
  savings: "#5f8a9e",
  free: "#8aab55",
};
