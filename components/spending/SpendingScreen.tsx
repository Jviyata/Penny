"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import { SPENDING, type JobId } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { FreeSpendingScreen } from "../free/FreeSpendingScreen";
import { CategoryScreen } from "../home/CategoryScreen";
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

  const paidBills = BILLS.flatMap((id) => SPENDING[id as Exclude<JobId, "savings">].filter((s) => !s.upcoming).map((s) => ({ ...s, cat: id })));
  const dueBills = BILLS.flatMap((id) => SPENDING[id as Exclude<JobId, "savings">].filter((s) => s.upcoming).map((s) => ({ ...s, cat: id })));

  const activity = [
    ...(["groceries", "transit"] as const).flatMap((id) =>
      SPENDING[id].filter((s) => !s.upcoming).map((s) => ({ key: s.id, name: s.name, what: s.what, date: s.date, amount: s.amount, cat: id as CatId })),
    ),
    ...state.bought.map((b) => ({ key: b.id, name: b.name, what: b.what ?? "Bought", date: b.date ?? "", amount: b.amount, cat: "free" as CatId })),
  ].sort((a, b) => day(b.date) - day(a.date));

  return (
    <>
      <Screen scene="free" title="Spending" subtitle={`Everything that’s gone out in ${MONTH.name}.`}>
        <div className="px-5">
          {/* Spent so far, with one bar split by category */}
          <section className="on-photo-shadow">
            <p className="text-[15px] font-semibold uppercase tracking-[0.06em] text-on-photo-2">Spent so far</p>
            <p className="tabular mt-1 text-[56px] font-bold leading-none tracking-[-0.03em] text-on-photo">{money(totalSpent)}</p>
            <p className="mt-2 text-[15px] text-on-photo-2">
              of your {money(income)} paycheck · {MONTH.daysLeft} days left
            </p>
          </section>
          <div className="mt-4 flex h-4 gap-[2px] overflow-hidden rounded-full bg-white/15" aria-hidden>
            {rows
              .filter((r) => r.spent > 0)
              .map((r) => (
                <span key={r.id} className="h-full" style={{ width: `${(r.spent / income) * 100}%`, background: CATEGORY_COLORS[r.id] }} />
              ))}
          </div>
          <p className="on-photo-shadow mt-2 text-[13px] text-on-photo-2">
            {money(Math.max(income - totalSpent, 0))} hasn’t gone out yet.
          </p>
        </div>

        {/* By category */}
        <Card title="By category">
          {rows.map((r) => {
            const Icon = r.id === "free" ? SparklesIcon : CATEGORY_ICONS[r.id];
            const color = CATEGORY_COLORS[r.id];
            const share = r.budget > 0 ? Math.min(1, r.spent / r.budget) : 0;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setDetail(r.id)}
                className="flex w-full items-center gap-3 px-5 py-2.5 text-left active:bg-fill"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-white"
                  style={{ background: color }}
                >
                  <Icon size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[16px] font-medium">{r.name}</span>
                    <span className="tabular shrink-0 text-[15px]">
                      <span className="font-semibold">{money(r.spent)}</span>
                      <span className="text-label-3"> / {money(r.budget)}</span>
                    </span>
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-fill">
                    <span className="block h-full rounded-full" style={{ width: `${share * 100}%`, background: color }} />
                  </span>
                </span>
                <ChevronIcon size={14} className="shrink-0 text-label-3" />
              </button>
            );
          })}
        </Card>

        {/* Bills */}
        <Card title="Bills" subtitle={`${paidBills.length} paid · ${dueBills.length} coming up`}>
          {paidBills.map((b) => (
            <Row key={b.id} color={CATEGORY_COLORS[b.cat]} name={b.name} sub={`${b.what} · Paid ${b.date}`} amount={b.amount} paid />
          ))}
          {dueBills.length > 0 && <p className="px-5 pb-1 pt-3 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-3">Coming up</p>}
          {dueBills.map((b) => (
            <Row key={b.id} color={CATEGORY_COLORS[b.cat]} name={b.name} sub={`${b.what} · Due ${b.date}`} amount={b.amount} muted />
          ))}
        </Card>

        {/* Everything else, newest first */}
        <Card title="Recent activity">
          {activity.map((a) => (
            <Row key={a.key} color={CATEGORY_COLORS[a.cat]} name={a.name} sub={[NAME[a.cat], a.date].filter(Boolean).join(" · ")} amount={a.amount} />
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
    <section className="mx-3 mt-4 overflow-hidden rounded-[26px] bg-card pb-2">
      <div className="px-5 pb-1 pt-4">
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
    <div className="flex min-h-[58px] items-center gap-3 px-5 py-2">
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color, opacity: muted ? 0.45 : 1 }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[16px] ${muted ? "text-label-2" : ""}`}>{name}</span>
        <span className="block truncate text-[13px] text-label-3">{sub}</span>
      </span>
      {paid && <CheckIcon size={15} className="shrink-0 text-[var(--v-comfortable)]" />}
      <span className={`tabular shrink-0 text-[16px] font-medium ${muted ? "text-label-2" : ""}`}>{money(amount)}</span>
    </div>
  );
}
