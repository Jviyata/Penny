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
