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
  rent: "#5f7340", // olive
  free: "#b9c46f", // chartreuse
  groceries: "#8faa80", // sage
  bills: "#c9a560", // mustard (utilities)
  loans: "#c27565", // terracotta
  transit: "#7d9bb0", // slate
  savings: "#bdb2a5", // warm gray
};
