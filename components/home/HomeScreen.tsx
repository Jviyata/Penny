"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { BASE_FREE_TOTAL, JOBS_TOTAL, MONTH, USER_NAME } from "@/lib/demoData";
import { money } from "@/lib/format";
import type { JobId } from "@/lib/monthDetails";
import { GearIcon } from "../ui/Icons";
import { NavButton, Screen } from "../ui/Screen";
import type { Tab } from "../TabBar";
import { CategoryScreen } from "./CategoryScreen";
import { CATEGORY_ICONS, CATEGORY_ORDER } from "./categories";
import { Donut } from "./Donut";
import { MonthMenu } from "./MonthMenu";
import { SettingsSheet } from "./SettingsSheet";

/**
 * Home: available this month, then where the paycheck went.
 */
export function HomeScreen({ goTo, resetSignal }: { goTo: (t: Tab) => void; resetSignal: number }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detail, setDetail] = useState<JobId | null>(null);
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

          {/* 2. Where the paycheck went */}
          <div className="mt-3">
            <Donut onSelect={(id) => (id === "yours" ? goTo("free") : setDetail(id))} />
          </div>

          <section className="glass mt-3 flex h-[52px] items-center justify-between rounded-[22px] px-4 text-[15px] text-on-photo">
            <span>
              <span className="tabular text-[18px] font-bold">{money(JOBS_TOTAL)}</span>
              <span className="text-on-photo-2"> already assigned</span>
            </span>
            <span>
              <span className="tabular text-[18px] font-bold">{money(BASE_FREE_TOTAL)}</span>
              <span className="text-on-photo-2"> left</span>
            </span>
          </section>

          {/* 3. Jump into any part of the month */}
          <nav className="mt-3 grid grid-cols-6 gap-1" aria-label="Where your money goes">
            {CATEGORY_ORDER.map((id) => {
              const Icon = CATEGORY_ICONS[id];
              const job = MONTH.jobs.find((j) => j.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDetail(id)}
                  className="pressable flex flex-col items-center gap-1 text-on-photo"
                >
                  <span className="glass flex h-11 w-11 items-center justify-center rounded-full">
                    <Icon size={20} />
                  </span>
                  <span className="on-photo-shadow text-[11px] font-medium">
                    {job.name === "Student loans" ? "Loans" : job.name}
                  </span>
                </button>
              );
            })}
          </nav>
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
