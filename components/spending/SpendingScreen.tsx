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
import { CATEGORY_ICONS, CATEGORY_ORDER } from "../home/categories";
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
                color={FOLDER[r.id]}
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
                color={FOLDER[b.cat]}
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
                color={FOLDER_DUE}
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

/** Folder colors: soft but deep enough that white text stays easy to read. */
const FOLDER: Record<CatId, string> = {
  rent: "#6b8547",
  free: "#929d42",
  savings: "#9a8a78",
  groceries: "#5f8d68",
  loans: "#c26b5d",
  bills: "#c08b3e",
  transit: "#5f86a6",
};
const FOLDER_DUE = "#a59a8e"; // bills still coming up

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

/** The scoop at the top of each card: an ellipse punched out of the top edge, centered. */
const NOTCH = "radial-gradient(ellipse 34px 15px at 50% 0, transparent 96%, #000 100%)";

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden>
      <path d="M3 7.5 8 3l5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StackCard({
  index,
  color,
  Icon,
  title,
  sub,
  onClick,
}: {
  index: number;
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
      className="relative flex w-full flex-col text-left text-white active:brightness-95"
      style={{
        height: `calc(var(--step) + ${TUCK}px)`,
        marginTop: index === 0 ? 0 : -TUCK,
        zIndex: index + 1,
        filter: "drop-shadow(0 -4px 10px rgba(30, 20, 10, 0.14))",
      }}
    >
      {/* Rounded card with a scoop cut out of the top middle; the card above peeks through it */}
      <span
        className="absolute inset-0 rounded-[24px]"
        style={{
          background: color,
          WebkitMaskImage: index > 0 ? NOTCH : undefined,
          maskImage: index > 0 ? NOTCH : undefined,
        }}
        aria-hidden
      />
      {index > 0 && <ChevronUpIcon className="absolute left-1/2 top-[1px] -translate-x-1/2 text-white/80" />}

      <span className="relative flex h-[var(--step)] w-full items-center gap-3 pl-5 pr-4 pt-1">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[19px] font-bold leading-[24px] tracking-[-0.01em]">{title}</span>
          <span className="tabular mt-0.5 block truncate text-[14px] leading-[18px] text-white/85">{sub}</span>
        </span>
        <span
          className="flex h-[min(42px,calc(var(--step)-16px))] w-[min(42px,calc(var(--step)-16px))] shrink-0 items-center justify-center rounded-full bg-white/20"
        >
          <Icon size={19} />
        </span>
      </span>
    </button>
  );
}
