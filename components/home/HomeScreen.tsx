"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { BASE_FREE_TOTAL, JOBS_TOTAL, MONTH, USER_NAME } from "@/lib/demoData";
import { money } from "@/lib/format";
import type { JobId } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { ChevronIcon, GearIcon } from "../ui/Icons";
import { NavButton, Screen } from "../ui/Screen";
import type { Tab } from "../TabBar";
import { CategoryScreen } from "./CategoryScreen";
import { Donut, SLICES, type SliceId } from "./Donut";
import { MonthMenu } from "./MonthMenu";
import { SettingsSheet } from "./SettingsSheet";

/**
 * Home tells one story, top to bottom:
 * available this month → what's actually free after plans → where the paycheck went.
 */
export function HomeScreen({ goTo, resetSignal }: { goTo: (t: Tab) => void; resetSignal: number }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detail, setDetail] = useState<JobId | null>(null);
  const free = useStore().open;
  const open = (id: SliceId) => (id === "free" ? goTo("free") : setDetail(id));
  useEffect(() => setDetail(null), [resetSignal]);
  // Lets the tab bar hide Penny's intro bubble while a category page covers Home.
  useEffect(() => {
    document.documentElement.dataset.homeDetail = detail ? "open" : "closed";
  }, [detail]);

  return (
    <>
      <Screen
        scene="home"
        title={`Hi, ${USER_NAME}`}
        inlineTitle
        trailing={
          <>
            <MonthMenu />
            <NavButton label="Settings" onClick={() => setSettingsOpen(true)}>
              <GearIcon size={22} />
            </NavButton>
          </>
        }
      >
        <div className="px-5">
          {/* 1. Available this month */}
          <section className="on-photo-shadow mt-3">
            <p className="text-[15px] font-medium text-on-photo-2">
              Available this month · {MONTH.daysLeft} days left
            </p>
            <p className="tabular mt-0.5 text-[56px] font-bold leading-none tracking-[-0.025em] text-on-photo">
              {money(BASE_FREE_TOTAL)}
            </p>
          </section>

          {/* 2. What's actually free: the number Penny uses */}
          <button
            type="button"
            onClick={() => goTo("free")}
            className="pressable glass-strong mt-3 flex min-h-12 w-full items-center gap-2.5 rounded-[18px] px-4 py-2.5 text-left text-on-photo"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: free > 0 ? "#a9c27e" : "var(--v-not)" }}
              aria-hidden
            />
            <span className="flex-1 text-[16px] leading-[21px]">
              <span className="tabular text-[19px] font-bold">{money(Math.max(free, 0))}</span> free to spend
              <span className="block text-[13px] text-on-photo-2">after your plans and purchases</span>
            </span>
            <ChevronIcon className="text-on-photo-2" />
          </button>

          {/* 3. Where the paycheck went */}
          <section
            className="mt-3 rounded-[24px] p-3.5 text-on-photo"
            style={{ background: "rgba(28, 18, 10, 0.42)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
          >
            <div className="flex items-center gap-3">
              <Donut onSelect={open} size="min(132px, 34cqw)" />
              <ul className="min-w-0 flex-1" aria-label="Where your paycheck goes">
                {SLICES.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => open(s.id)}
                      className="flex h-[26px] w-full items-center gap-2 text-left text-[14px] active:opacity-60"
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                      <span className={`min-w-0 flex-1 truncate ${s.id === "free" ? "font-semibold" : ""}`}>{s.name}</span>
                      <span className="tabular text-on-photo-2">{money(s.amount)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2.5 text-[14px]">
              <span>
                <span className="tabular font-semibold">{money(JOBS_TOTAL)}</span>
                <span className="text-on-photo-2"> already assigned</span>
              </span>
              <span>
                <span className="tabular font-semibold">{money(BASE_FREE_TOTAL)}</span>
                <span className="text-on-photo-2"> left</span>
              </span>
            </div>
          </section>
        </div>
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
            <CategoryScreen id={detail} onBack={() => setDetail(null)} />
          </motion.div>
        )}
      </AnimatePresence>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
