"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import { SPENDING, type JobId } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { FreeSpendingScreen } from "../free/FreeSpendingScreen";
import { CategoryScreen } from "../home/CategoryScreen";
import { MonthMenu } from "../home/MonthMenu";
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ORDER } from "../home/categories";
import { CheckIcon, ChevronIcon, SparklesIcon } from "../ui/Icons";
import { Screen } from "../ui/Screen";
import type { Tab } from "../TabBar";

type CatId = JobId | "free";

const NAME: Record<CatId, string> = {
  rent: "Rent & housing",
  bills: "Utilities",
  loans: "Student loans",
  groceries: "Groceries",
  transit: "Transit",
  savings: "Savings",
  free: "Free spending",
};
const BILLS: JobId[] = ["rent", "bills", "loans"];

const day = (date?: string) => Number(date?.replace(/\D/g, "") || 0);

/** Spending: how the month splits by category (ring + list), or your bills. */
export function SpendingScreen({ goTo }: { goTo: (t: Tab) => void }) {
  const { state } = useStore();
  const [detail, setDetail] = useState<CatId | null>(null);

  // How the month's money is split, biggest first (this month's budget per category).
  const income = MONTH.income;
  const rows = [...CATEGORY_ORDER, "free" as const]
    .map((id) => ({
      id: id as CatId,
      name: NAME[id],
      amount: id === "free" ? state.freeTotal : MONTH.jobs.find((j) => j.id === id)!.amount,
    }))
    .sort((x, y) => y.amount - x.amount);
  const total = rows.reduce((t, r) => t + r.amount, 0);
  const [view, setView] = useState<"categories" | "bills">("categories");

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

  return (
    <>
      <Screen
        scene="free"
        title="Spending"
        subtitle={<MonthMenu variant="text" />}
      >
        <div className="-mt-2 px-4">
          {/* Categories | Bills */}
          <div className="grid grid-cols-2 gap-1 rounded-full bg-[var(--fill)] p-1" role="tablist">
            {(["categories", "bills"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`h-10 rounded-full text-[16px] font-medium transition-colors ${
                  view === v ? "bg-[#5f7340] text-white" : "text-label-2"
                }`}
              >
                {v === "categories" ? "Categories" : "Bills"}
              </button>
            ))}
          </div>
        </div>

        {view === "categories" ? (
          <>
            {/* The ring: tap a slice to open it */}
            <div
              className="mx-auto mt-3 flex items-center justify-center"
              style={{ height: "clamp(150px, calc(100cqh - var(--sat) - var(--sab) - 572px), 230px)" }}
            >
              <Ring rows={rows} total={total} onSelect={setDetail} />
            </div>

            <section className="mx-3 mt-3 rounded-[26px] bg-card px-4 py-1.5">
              {rows.map((r) => {
                const Icon = r.id === "free" ? SparklesIcon : CATEGORY_ICONS[r.id];
                const color = CATEGORY_COLORS[r.id];
                const pct = total > 0 ? r.amount / total : 0;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setDetail(r.id)}
                    className="flex w-full items-center gap-3 py-[4px] text-left active:opacity-60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: color }}>
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{r.name}</span>
                        <span className="tabular text-[15px] font-semibold">{money(r.amount)}</span>
                        <span className="tabular w-9 text-right text-[13px] text-label-3">{Math.round(pct * 100)}%</span>
                      </span>
                      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-fill">
                        <span className="block h-full rounded-full" style={{ width: `${Math.max(pct * 100, 3)}%`, background: color }} />
                      </span>
                    </span>
                    <ChevronIcon size={14} className="shrink-0 text-label-3" />
                  </button>
                );
              })}
            </section>
          </>
        ) : (
          <Card title="Your bills" subtitle={`${paidBills.length} paid · ${dueBills.length} coming up`}>
            {paidBills.map((b) => (
              <Row key={b.id} color={CATEGORY_COLORS[b.cat]} name={b.name} sub={`${b.what} · Paid ${b.date}`} amount={b.amount} paid />
            ))}
            {dueBills.length > 0 && <p className="px-5 pb-0.5 pt-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-3">Coming up</p>}
            {dueBills.map((b) => (
              <Row key={b.id} color={CATEGORY_COLORS[b.cat]} name={b.name} sub={`${b.what} · Due ${b.date}`} amount={b.amount} muted />
            ))}
          </Card>
        )}
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

/** Clean ring: one arc per category, no labels on the slices; the total sits in the middle. */
function Ring({
  rows,
  total,
  onSelect,
}: {
  rows: { id: CatId; amount: number }[];
  total: number;
  onSelect: (id: CatId) => void;
}) {
  const SIZE = 200;
  const R = 92;
  const W = 26; // ring thickness
  const C = SIZE / 2;
  const r2 = (n: number) => Math.round(n * 100) / 100; // identical server/Safari output
  const pt = (rad: number, a: number) => [r2(C + rad * Math.sin(a)), r2(C - rad * Math.cos(a))] as const;
  const GAP = 0.025;
  let a = 0;
  return (
    <div className="relative aspect-square h-full">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full" aria-hidden>
        {rows.map((r) => {
          const span = (r.amount / total) * Math.PI * 2;
          const a0 = a + GAP / 2;
          const a1 = a + span - GAP / 2;
          a += span;
          const [x0, y0] = pt(R, a0);
          const [x1, y1] = pt(R, a1);
          const [x2, y2] = pt(R - W, a1);
          const [x3, y3] = pt(R - W, a0);
          const large = a1 - a0 > Math.PI ? 1 : 0;
          return (
            <path
              key={r.id}
              d={`M${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${R - W} ${R - W} 0 ${large} 0 ${x3} ${y3}Z`}
              fill={CATEGORY_COLORS[r.id]}
              onClick={() => onSelect(r.id)}
              className="cursor-pointer active:opacity-70"
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="tabular text-[28px] font-bold leading-none tracking-[-0.02em] text-label">{money(total)}</span>
        <span className="mt-1 text-[14px] leading-[18px] text-label-2">
          in {MONTH.name}
        </span>
      </div>
    </div>
  );
}
