// Fixed demo detail behind each slice of the month: what went out, where, and when.
// Today is October 13 (18 days left). Amounts add up to each category's total in demoData.

export type JobId = "rent" | "bills" | "loans" | "groceries" | "transit" | "savings";

export type Spend = {
  id: string;
  name: string; // where
  what: string; // what it was for
  date: string; // "Oct 12"
  amount: number;
  upcoming?: boolean; // scheduled later this month
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number; // including this month
  thisMonth: number; // part of October's $1,000
  by: string; // "Next spring"
  image?: string; // picture for goals started from Penny (the item's photo)
};

export const SPENDING: Record<Exclude<JobId, "savings">, Spend[]> = {
  rent: [{ id: "r1", name: "Maple Court Apartments", what: "October rent", date: "Oct 1", amount: 1900 }],
  bills: [
    { id: "b1", name: "City Power & Light", what: "Electric", date: "Oct 3", amount: 96 },
    { id: "b2", name: "FiberNet", what: "Home internet", date: "Oct 2", amount: 65 },
    { id: "b3", name: "Mobile plan", what: "Phone", date: "Oct 8", amount: 70 },
    { id: "b4", name: "Streaming bundle", what: "TV and music", date: "Oct 20", amount: 29, upcoming: true },
    { id: "b5", name: "Neighborhood Gym", what: "Membership", date: "Oct 24", amount: 45, upcoming: true },
    { id: "b6", name: "Renters insurance", what: "Monthly premium", date: "Oct 28", amount: 15, upcoming: true },
  ],
  loans: [{ id: "l1", name: "Student loan servicer", what: "Monthly payment", date: "Oct 5", amount: 350 }],
  groceries: [
    { id: "g1", name: "Fresh Market", what: "Weekly groceries", date: "Oct 12", amount: 64.2 },
    { id: "g2", name: "Corner Grocery", what: "Snacks and coffee", date: "Oct 10", amount: 38.75 },
    { id: "g3", name: "Saturday farmers market", what: "Produce and bread", date: "Oct 7", amount: 22 },
    { id: "g4", name: "Fresh Market", what: "Weekly groceries", date: "Oct 5", amount: 71.4 },
    { id: "g5", name: "Bulk Barn", what: "Pantry restock", date: "Oct 2", amount: 45.1 },
  ],
  transit: [
    { id: "t1", name: "City Transit", what: "Monthly pass", date: "Oct 1", amount: 95 },
    { id: "t2", name: "Rideshare", what: "Ride home", date: "Oct 9", amount: 14.5 },
  ],
};

export const GOALS: Goal[] = [
  { id: "emergency", name: "Emergency fund", target: 5000, saved: 2400, thisMonth: 400, by: "Ongoing" },
  { id: "japan", name: "Japan trip", target: 3500, saved: 1750, thisMonth: 350, by: "Next spring" },
  { id: "laptop", name: "New laptop", target: 1400, saved: 900, thisMonth: 250, by: "By January" },
];

export const CATEGORY_NOTE: Record<JobId, string> = {
  rent: "Paid on the 1st. Nothing else due this month.",
  bills: "Three paid, three still coming this month.",
  loans: "This month’s payment is done.",
  groceries: "Spent so far this month.",
  transit: "Monthly pass plus the odd ride.",
  savings: "Set aside on the 1st, split across your goals.",
};
