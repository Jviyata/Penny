"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import { SPENDING, type JobId } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { FreeSpendingScreen } from "../free/FreeSpendingScreen";
import { CategoryScreen } from "../home/CategoryScreen";
import { MonthMenu } from "../home/MonthMenu";
import { CATEGORY_ORDER } from "../home/categories";
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
  free: "Left to spend",
};
const BILLS: JobId[] = ["rent", "bills", "loans"];

const day = (date?: string) => Number(date?.replace(/\D/g, "") || 0);

/** Spending: how the month splits by category, or your bills, as a stack of pastel cards. */
export function SpendingScreen({ goTo, openLeftSignal = 0 }: { goTo: (t: Tab) => void; openLeftSignal?: number }) {
  const { state } = useStore();
  const [detail, setDetail] = useState<CatId | null>(null);
  useEffect(() => {
    if (openLeftSignal > 0) setDetail("free");
  }, [openLeftSignal]);

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
                last={i === rows.length - 1}
                color={TAB_COLORS[i % TAB_COLORS.length]}
                title={r.name}
                note={`${Math.round((total > 0 ? r.amount / total : 0) * 100)}% of your month`}
                amount={money(r.amount)}
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
                last={i === paidBills.length - 1 && dueBills.length === 0}
                color={PAID_COLORS[i % PAID_COLORS.length]}
                title={b.name}
                note={`Paid ${b.date}`}
                amount={money(b.amount)}
                onClick={() => setDetail(b.cat)}
              />
            ))}
            {dueBills.map((b, i) => (
              <StackCard
                key={b.id}
                index={paidBills.length + i}
                last={i === dueBills.length - 1}
                color={DUE_COLORS[i % DUE_COLORS.length]}
                title={b.name}
                note={`Due ${b.date}`}
                amount={money(b.amount)}
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

/** Bills: green when paid, red when still due. Neighboring shades so each card's scoop still shows. */
const PAID_COLORS = ["#7fb08a", "#6fa37b", "#60966d"];
const DUE_COLORS = ["#e08a80", "#d6766b", "#c96358"];

/** Card colors, top to bottom of the stack: soft blue through to soft olive. */
const TAB_COLORS = [
  "#B7C9E2", // soft blue
  "#9EC3D5", // dusty sky
  "#8DBFC4", // muted aqua
  "#86B7A7", // soft teal
  "#9DBA91", // sage
  "#B3C486", // pistachio
  "#C4C98A", // soft olive
];

/** How much of each card hides under the next one. */
const TUCK = 28;

/**
 * Cards stacked like a deck: each one tucks under the next, so every card shows one band.
 * The band height (--step) is shared out of whatever height the phone has left, so it never scrolls.
 */
function Stack({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <div
      className="mx-4 mt-4 [--stack-top:242px] [@media(max-height:720px)]:[--stack-top:196px]"
      style={
        {
          "--step": `clamp(50px, calc((100cqh - var(--sat) - var(--sab) - var(--tabbar-h) - var(--stack-top) - 12px) / ${count}), 76px)`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

/**
 * The C-shaped scoop at the top middle of each card, with soft shoulders.
 * It's punched out of the card with a mask, so the card above shows through.
 */
const SCOOP_W = 92;
const SCOOP_H = 15;
const SCOOP_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='${SCOOP_W}' height='${SCOOP_H}' viewBox='0 0 ${SCOOP_W} ${SCOOP_H}'><path d='M0 0 C12 0 15 ${SCOOP_H} 30 ${SCOOP_H} H62 C77 ${SCOOP_H} 80 0 92 0 Z'/></svg>`;
const SCOOP_MASK = {
  WebkitMaskImage: `url("data:image/svg+xml,${encodeURIComponent(SCOOP_SVG)}"), linear-gradient(#000 0 0)`,
  WebkitMaskPosition: "top center, 0 0",
  WebkitMaskSize: `${SCOOP_W}px ${SCOOP_H}px, 100% 100%`,
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskComposite: "xor",
  maskImage: `url("data:image/svg+xml,${encodeURIComponent(SCOOP_SVG)}"), linear-gradient(#000 0 0)`,
  maskPosition: "top center, 0 0",
  maskSize: `${SCOOP_W}px ${SCOOP_H}px, 100% 100%`,
  maskRepeat: "no-repeat",
  maskComposite: "exclude",
} as React.CSSProperties;

function StackCard({
  index,
  last,
  color,
  title,
  note,
  amount,
  onClick,
}: {
  index: number;
  last: boolean;
  color: string;
  title: string;
  note: string;
  amount: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex w-full flex-col text-left text-white transition-transform active:scale-[0.99]"
      style={{
        height: last ? "var(--step)" : `calc(var(--step) + ${TUCK}px)`,
        marginTop: index === 0 ? 0 : -TUCK,
        zIndex: index + 1,
      }}
    >
      <span
        className="absolute inset-0 rounded-[22px]"
        style={{ background: color, ...(index > 0 ? SCOOP_MASK : {}) }}
        aria-hidden
      />

      <span className="relative flex h-[var(--step)] w-full items-center gap-4 px-5 pt-1">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold leading-[22px]">{title}</span>
          <span className="block truncate text-[13px] leading-[17px] text-white/90">{note}</span>
        </span>
        <span className="tabular shrink-0 rounded-full bg-[rgba(29,26,23,0.22)] px-3 py-1 text-[14px] font-semibold leading-[18px] text-white">{amount}</span>
      </span>
    </button>
  );
}
