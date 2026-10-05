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
 * Home hierarchy: the available number (primary) → where the paycheck went (secondary) → categories (tertiary).
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
        {/* Fills the screen below the header; the donut flexes to take the leftover height. */}
        <div className="flex h-[calc(100%-48px)] flex-col px-5 pb-3">
          {/* Primary: the one number that matters */}
          <section className="on-photo-shadow mt-4 [@media(max-height:720px)]:mt-2">
            <p className="text-[15px] font-semibold uppercase tracking-[0.06em] text-on-photo-2">Available this month</p>
            <p className="tabular mt-1 text-[64px] font-bold leading-none tracking-[-0.03em] text-on-photo [@media(max-height:720px)]:text-[52px]">
              {money(BASE_FREE_TOTAL)}
            </p>
            <p className="mt-2 text-[15px] text-on-photo-2">
              of your {money(MONTH.income)} paycheck · {MONTH.daysLeft} days left
            </p>
          </section>

          {/* Secondary: where the paycheck went (chart + its caption read as one unit) */}
          <div className="mt-4 flex min-h-[150px] flex-1 items-center justify-center [container-type:size] [@media(max-height:720px)]:mt-3">
            <Donut onSelect={(id) => (id === "yours" ? goTo("free") : setDetail(id))} />
          </div>
          <div className="mx-auto mt-2.5 flex h-9 items-center gap-4 rounded-full bg-black/25 px-4 text-[14px] text-on-photo-2 backdrop-blur-md">
            <span>
              <span className="tabular text-[17px] font-semibold text-on-photo">{money(JOBS_TOTAL)}</span> already assigned
            </span>
            <span className="h-3 w-px bg-white/35" aria-hidden />
            <span>
              <span className="tabular text-[17px] font-semibold text-on-photo">{money(BASE_FREE_TOTAL)}</span> left
            </span>
          </div>

          {/* 3. Jump into any part of the month */}
          {/* Tertiary: categories */}
          <p className="on-photo-shadow mt-5 [@media(max-height:720px)]:mt-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-on-photo-2">Categories</p>
          <nav className="mt-2 grid grid-cols-6 gap-1" aria-label="Categories">
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
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/25 backdrop-blur-md">
                    <Icon size={19} />
                  </span>
                  <span className="on-photo-shadow text-[11px] font-medium text-on-photo-2">
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
