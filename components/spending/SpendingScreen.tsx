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
import { CalendarIcon, CheckIcon, SparklesIcon } from "../ui/Icons";
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

/** Spending: how the month splits by category, or your bills, as a stack of pastel cards. */
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

  const paidTotal = paidBills.reduce((t, b) => t + b.amount, 0);
  const dueTotal = dueBills.reduce((t, b) => t + b.amount, 0);

  return (
    <>
      <Screen scene="free" title="Spending" subtitle={<MonthMenu variant="text" />}>
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
                  view === v ? "bg-[#1d1a17] text-white" : "text-label-2"
                }`}
              >
                {v === "categories" ? "Categories" : "Bills"}
              </button>
            ))}
          </div>

          <p className="mt-3 flex items-baseline gap-2 px-1 [@media(max-height:720px)]:hidden">
            {view === "categories" ? (
              <>
                <span className="tabular text-[28px] font-bold tracking-[-0.02em]">{money(total)}</span>
                <span className="text-[15px] text-label-2">planned for {MONTH.name}</span>
              </>
            ) : (
              <>
                <span className="tabular text-[28px] font-bold tracking-[-0.02em]">{money(paidTotal)}</span>
                <span className="text-[15px] text-label-2">paid · {money(dueTotal)} coming up</span>
              </>
            )}
          </p>
        </div>

        {view === "categories" ? (
          <Stack count={rows.length}>
            {rows.map((r, i) => (
              <StackCard
                key={r.id}
                index={i}
                tint={TINT[r.id]}
                color={CATEGORY_COLORS[r.id]}
                Icon={r.id === "free" ? SparklesIcon : CATEGORY_ICONS[r.id]}
                title={r.name}
                sub={`${money(r.amount)} · ${Math.round((total > 0 ? r.amount / total : 0) * 100)}% of your month`}
                onClick={() => setDetail(r.id)}
              />
            ))}
          </Stack>
        ) : (
          <Stack count={paidBills.length + dueBills.length}>
            {paidBills.map((b, i) => (
              <StackCard
                key={b.id}
                index={i}
                tint={TINT[b.cat]}
                color={CATEGORY_COLORS[b.cat]}
                Icon={CheckIcon}
                title={b.name}
                sub={`${money(b.amount)} · Paid ${b.date}`}
                onClick={() => setDetail(b.cat)}
              />
            ))}
            {dueBills.map((b, i) => (
              <StackCard
                key={b.id}
                index={paidBills.length + i}
                tint="#ffffff"
                color="#bdb2a5"
                Icon={CalendarIcon}
                title={b.name}
                sub={`${money(b.amount)} · Due ${b.date}`}
                onClick={() => setDetail(b.cat)}
              />
            ))}
          </Stack>
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

/** Soft pastel card color per category (the solid CATEGORY_COLORS stay for icons and rings). */
const TINT: Record<CatId, string> = {
  rent: "#dfe7cc",
  free: "#eef1c6",
  savings: "#ece6dd",
  groceries: "#d9e9d1",
  loans: "#f4dbd3",
  bills: "#f6e8c6",
  transit: "#d8e5ef",
};

/** How much of each card hides under the next one. */
const TUCK = 30;

/**
 * Cards stacked like a deck: each one tucks under the next, so every card shows one band.
 * The band height (--step) is shared out of whatever height the phone has left, so it never scrolls.
 */
function Stack({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <div
      className="mx-3 mt-4 [--stack-top:242px] [@media(max-height:720px)]:[--stack-top:196px]"
      style={
        {
          "--step": `clamp(50px, calc((100cqh - var(--sat) - var(--sab) - var(--tabbar-h) - var(--stack-top) - ${TUCK}px) / ${count}), 84px)`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

function StackCard({
  index,
  tint,
  color,
  Icon,
  title,
  sub,
  onClick,
}: {
  index: number;
  tint: string;
  color: string;
  Icon: typeof CheckIcon;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative block w-full text-left active:brightness-[0.97]"
      style={{ height: `calc(var(--step) + ${TUCK}px)`, marginTop: index === 0 ? 0 : -TUCK, zIndex: index + 1 }}
    >
      {/* The tab on top of each card, like a folder */}
      <svg className="absolute -top-[11px] left-1/2 -translate-x-1/2" width="128" height="12" viewBox="0 0 128 12" aria-hidden>
        <path d="M0 12 C16 12 18 0 34 0 H94 C110 0 112 12 128 12 Z" fill={tint} />
      </svg>
      <span className="absolute -top-[6px] left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-full bg-black/10" aria-hidden />

      <span
        className="absolute inset-0 overflow-hidden rounded-[30px] shadow-[0_-8px_20px_-14px_rgba(40,30,15,0.35)]"
        style={{ background: tint }}
      >
        {/* Dashed rings around the badge */}
        <svg className="absolute -right-[46px] top-[calc(var(--step)/2-88px)]" width="176" height="176" viewBox="0 0 176 176" aria-hidden>
          {[40, 58, 76].map((r) => (
            <circle key={r} cx="88" cy="88" r={r} fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="2.5" strokeDasharray="4 7" strokeLinecap="round" />
          ))}
        </svg>

        <span className="relative flex h-[calc(var(--step)-6px)] items-center gap-3 pl-5 pr-4">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[19px] font-bold leading-[24px] tracking-[-0.01em] text-[#1d1a17]">{title}</span>
            <span className="tabular mt-0.5 block truncate text-[14px] leading-[18px] text-[#1d1a17]/60">{sub}</span>
          </span>
          <span className="flex h-[min(50px,calc(var(--step)-8px))] w-[min(50px,calc(var(--step)-8px))] shrink-0 items-center justify-center rounded-full p-[4px]" style={{ background: `${color}55` }}>
            <span className="flex h-full w-full items-center justify-center rounded-full text-white" style={{ background: color }}>
              <Icon size={20} />
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
