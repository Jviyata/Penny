export const USER_NAME = "Viyata";

// Fixed demo month. Home always shows these numbers; the user can't edit them.
export const MONTH = {
  name: "October",
  daysLeft: 18,
  income: 5200,
  jobs: [
    { id: "rent", name: "Rent", amount: 1900 },
    { id: "bills", name: "Bills", amount: 320 },
    { id: "loans", name: "Student loans", amount: 350 },
    { id: "groceries", name: "Groceries", amount: 450 },
    { id: "transit", name: "Transit", amount: 120 },
    { id: "savings", name: "Savings", amount: 1000 },
  ],
} as const;

export const JOBS_TOTAL = MONTH.jobs.reduce((sum, j) => sum + j.amount, 0); // 4,140
export const BASE_FREE_TOTAL = MONTH.income - JOBS_TOTAL; // 1,060

// Starting point for the only section the user can personalize.
export const STARTING_PLANS = [
  { id: "chicago", name: "Chicago trip", amount: 480 },
  { id: "gift", name: "Birthday gift", amount: 150 },
  { id: "dentist", name: "Dentist", amount: 200 },
  { id: "concert", name: "Concert", amount: 90 },
];

// Already bought out of free spending this month ($25 total → $115 open).
// Demo answers with $115 open: jacket $320 Not right now, lamp $145 Not right now, sunglasses $25 Comfortable.
export const STARTING_BOUGHT = [
  { id: "coffee", name: "Corner café", what: "Coffee with Maya", date: "Oct 4", amount: 9.5, image: "/bought/coffee.jpg", note: "You grabbed coffee with Maya." },
  { id: "movie", name: "Cinema", what: "Movie night", date: "Oct 8", amount: 15.5, image: "/bought/movie.jpg", note: "You treated yourself to a movie night." },
];

// Sample screenshots for Demo mode. Placeholders live in /public/demo; swap in real ones with the same
// file names (and update name/price here so the offline fallback matches).
export const DEMO_FILES = [
  { id: "jacket", name: "Leather Jacket", price: 320, src: "/demo/jacket.jpg" },
  { id: "lamp", name: "Vintage Brass Lamp", price: 145, src: "/demo/lamp.jpg" },
  { id: "sunglasses", name: "Tortoise Sunglasses", price: 25, src: "/demo/sunglasses.jpg" },
];
