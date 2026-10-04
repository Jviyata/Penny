"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { BASE_FREE_TOTAL, JOBS_TOTAL, MONTH, USER_NAME } from "@/lib/demoData";
import { money } from "@/lib/format";
import { useStore } from "@/lib/store";
import { NavButton, Screen } from "../ui/Screen";
import { ChevronIcon, GearIcon } from "../ui/Icons";
import type { Tab } from "../TabBar";
import type { JobId } from "@/lib/monthDetails";
import { CATEGORY_ICONS, CATEGORY_ORDER } from "./categories";
import { CategoryScreen, YoursScreen } from "./CategoryScreen";
import { Donut } from "./Donut";
import { MonthMenu } from "./MonthMenu";
import { SettingsSheet } from "./SettingsSheet";

export function HomeScreen({ goTo, resetSignal }: { goTo: (t: Tab) => void; resetSignal: number }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jobsOpen, setJobsOpen] = useState(false);
  const [detail, setDetail] = useState<JobId | "yours" | null>(null);
  const free = useStore().open;
  const open = (id: JobId | "yours") => setDetail(id);
  useEffect(() => setDetail(null), [resetSignal]);

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
        {/* Sized to fit one iPhone screen without scrolling; the donut takes whatever height is left. */}
        <div className="px-5">
          {/* The number that matters most */}
          <section className="on-photo-shadow mt-2">
            <p className="tabular text-[54px] font-bold leading-none tracking-[-0.025em] text-on-photo">{money(BASE_FREE_TOTAL)}</p>
            <p className="mt-1 text-[17px] text-on-photo-2">
              yours to work with · {MONTH.daysLeft} days left
            </p>
            {/* After plans and purchases, this is what's actually free; it's the number Penny uses. */}
            <button
              type="button"
              onClick={() => open("yours")}
              className="pressable glass-strong mt-2 flex h-9 items-center gap-1.5 rounded-full pl-3.5 pr-2.5 text-[15px] font-semibold text-on-photo"
            >
              <span className="tabular">{money(Math.max(free, 0))}</span>
              <span className="font-medium text-on-photo-2">free now, after plans</span>
              <ChevronIcon size={14} className="text-on-photo-2" />
            </button>
          </section>

          <div className="mt-3">
            <Donut onSelect={open} />
          </div>

          {/* What already has a job */}
          <section className="glass mt-3 overflow-hidden rounded-[22px]">
            <button
              type="button"
              onClick={() => setJobsOpen((o) => !o)}
              aria-expanded={jobsOpen}
              className="flex h-[52px] w-full items-center gap-2 px-4 text-left text-on-photo"
            >
              <span className="tabular text-[20px] font-bold">{money(JOBS_TOTAL)}</span>
              <span className="flex-1 text-[15px] text-on-photo-2">already has a job</span>
              <span className="text-[14px] text-on-photo-2">{jobsOpen ? "Hide" : "See all"}</span>
              <ChevronIcon className={`text-on-photo-2 transition-transform ${jobsOpen ? "rotate-90" : ""}`} />
            </button>
            {jobsOpen && (
              <ul className="px-4 pb-2">
                {MONTH.jobs.map((job) => (
                  <li key={job.id} className="shadow-[0_-1px_0_rgba(255,255,255,0.18)]">
                    <button
                      type="button"
                      onClick={() => open(job.id as JobId)}
                      className="flex min-h-11 w-full items-center gap-2 text-left text-on-photo active:opacity-60"
                    >
                      <span className="flex-1 text-[16px]">{job.name}</span>
                      <span className="tabular text-[16px] text-on-photo-2">{money(job.amount)}</span>
                      <ChevronIcon className="text-on-photo-2" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Jump into any part of the month */}
          <nav className="mt-3 grid grid-cols-6 gap-1" aria-label="Where your money goes">
            {CATEGORY_ORDER.map((id) => {
              const Icon = CATEGORY_ICONS[id];
              const job = MONTH.jobs.find((j) => j.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => open(id)}
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
            {detail === "yours" ? (
              <YoursScreen onBack={() => setDetail(null)} />
            ) : (
              <CategoryScreen id={detail} onBack={() => setDetail(null)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
