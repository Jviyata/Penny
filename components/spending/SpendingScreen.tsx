"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BASE_FREE_TOTAL, JOBS_TOTAL, MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import { SPENDING, type JobId } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { FreeSpendingScreen } from "../free/FreeSpendingScreen";
import { CategoryScreen } from "../home/CategoryScreen";
import { Donut } from "../home/Donut";
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ORDER } from "../home/categories";
import { CheckIcon, ChevronIcon, SparklesIcon } from "../ui/Icons";
import { Screen } from "../ui/Screen";
import type { Tab } from "../TabBar";

type CatId = JobId | "free";

const NAME: Record<CatId, string> = {
  rent: "Rent",
  bills: "Bills",
  loans: "Student loans",
  groceries: "Groceries",
  transit: "Transit",
  savings: "Savings",
  free: "Free spending",
};
const BILLS: JobId[] = ["rent", "bills", "loans"];

const day = (date?: string) => Number(date?.replace(/\D/g, "") || 0);

/** One page that answers "where did my money go this month?", color-coded by category. */
export function SpendingScreen({ goTo }: { goTo: (t: Tab) => void }) {
  const { state } = useStore();
  const [detail, setDetail] = useState<CatId | null>(null);

  // Spent so far per category (Savings counts once it's moved to your goals).
  const rows = [...CATEGORY_ORDER, "free" as const].map((id) => {
    const budget = id === "free" ? state.freeTotal : MONTH.jobs.find((j) => j.id === id)!.amount;
    const spent =
      id === "free"
        ? state.bought.reduce((t, b) => t + b.amount, 0)
        : id === "savings"
          ? budget
          : SPENDING[id].filter((s) => !s.upcoming).reduce((t, s) => t + s.amount, 0);
    return { id, name: NAME[id], budget, spent };
  });
  const totalSpent = rows.reduce((t, r) => t + r.spent, 0);
  const income = MONTH.income;

  // Paid bills, with electric, internet and phone combined into one Utilities line.
  const paidUtilities = SPENDING.bills.filter((s) => !s.upcoming);
  const paidBills = [
    ...SPENDING.rent.filter((s) => !s.upcoming).map((s) => ({ ...s, cat: "rent" as JobId })),
    ...(paidUtilities.length
      ? [
          {
            id: "utilities",
            name: "Utilities",
            what: "Power, internet, phone",
            date: paidUtilities.map((u) => u.date).sort((x, y) => day(y) - day(x))[0],
            amount: paidUtilities.reduce((t, u) => t + u.amount, 0),
            cat: "bills" as JobId,
          },
        ]
      : []),
    ...SPENDING.loans.filter((s) => !s.upcoming).map((s) => ({ ...s, cat: "loans" as JobId })),
  ];
  const dueBills = BILLS.flatMap((id) => SPENDING[id as Exclude<JobId, "savings">].filter((s) => s.upcoming).map((s) => ({ ...s, cat: id })));

  const activity = [
    ...(["groceries", "transit"] as const).flatMap((id) =>
      SPENDING[id].filter((s) => !s.upcoming).map((s) => ({ key: s.id, name: s.name, what: s.what, date: s.date, amount: s.amount, cat: id as CatId })),
    ),
    ...state.bought.map((b) => ({ key: b.id, name: b.name, what: b.what ?? "Bought", date: b.date ?? "", amount: b.amount, cat: "free" as CatId })),
  ].sort((a, b) => day(b.date) - day(a.date));

  return (
    <>
      <Screen scene="free" title="Spending" inlineTitle>
        {/* Where the paycheck went: tap a slice to open it */}
        <div className="px-5">
          <div
            className="mx-auto mt-1 flex items-center justify-center [container-type:size]"
            // Takes whatever height the bills leave on this phone, so the page fits without scrolling.
            style={{ height: "clamp(118px, calc(100cqh - var(--sat) - var(--sab) - 592px), 250px)" }}
          >
            <Donut onSelect={(id) => setDetail(id === "yours" ? "free" : id)} />
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[14px] text-label-2">
            <span>
              <span className="tabular text-[17px] font-semibold text-label">{money(JOBS_TOTAL)}</span> already assigned
            </span>
            <span className="h-3 w-px bg-black/15" aria-hidden />
            <span>
              <span className="tabular text-[17px] font-semibold text-label">{money(BASE_FREE_TOTAL)}</span> left
            </span>
          </div>
          <p className="mt-1 text-center text-[13px] text-label-3 [@media(max-height:720px)]:hidden">
            Tap a slice to see what went into it, like your groceries.
          </p>
        </div>

        {/* Bills */}
        <Card title="Your bills" subtitle={`${paidBills.length} paid · ${dueBills.length} coming up`}>
          {paidBills.map((b) => (
            <Row key={b.id} color={CATEGORY_COLORS[b.cat]} name={b.name} sub={`${b.what} · Paid ${b.date}`} amount={b.amount} paid />
          ))}
          {dueBills.length > 0 && <p className="px-5 pb-0.5 pt-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-3">Coming up</p>}
          {dueBills.map((b) => (
            <Row key={b.id} color={CATEGORY_COLORS[b.cat]} name={b.name} sub={`${b.what} · Due ${b.date}`} amount={b.amount} muted />
          ))}
        </Card>

      </Screen>

      <AnimatePresence>
        {detail && (
          <motion.div
            key={detail}
            className="absolute inset-0 z-10"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 340 }}
          >
            {detail === "free" ? (
              <FreeSpendingScreen goTo={goTo} onBack={() => setDetail(null)} />
            ) : (
              <CategoryScreen id={detail} onBack={() => setDetail(null)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mx-3 mt-3 overflow-hidden rounded-[26px] bg-card pb-1.5">
      <div className="flex items-baseline justify-between px-5 pb-0.5 pt-3">
        <h2 className="text-[19px] font-semibold">{title}</h2>
        {subtitle && <p className="text-[13px] text-label-3">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({
  color,
  name,
  sub,
  amount,
  paid,
  muted,
}: {
  color: string;
  name: string;
  sub: string;
  amount: number;
  paid?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex min-h-[46px] items-center gap-3 px-5 py-1 [@media(max-height:720px)]:min-h-[36px]">
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color, opacity: muted ? 0.45 : 1 }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[16px] ${muted ? "text-label-2" : ""}`}>{name}</span>
        <span className="block truncate text-[13px] text-label-3 [@media(max-height:720px)]:hidden">{sub}</span>
      </span>
      {paid && <CheckIcon size={15} className="shrink-0 text-[var(--v-comfortable)]" />}
      <span className={`tabular shrink-0 text-[16px] font-medium ${muted ? "text-label-2" : ""}`}>{money(amount)}</span>
    </div>
  );
}
