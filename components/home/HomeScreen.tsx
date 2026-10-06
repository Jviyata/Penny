"use client";

import { useState } from "react";
import { BASE_FREE_TOTAL, USER_NAME } from "@/lib/demoData";
import { money } from "@/lib/format";
import type { Goal } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { ArrowRightIcon, ChevronIcon, UserIcon, WalletIcon2, WaveIcon, goalLook } from "../ui/Icons";
import { Mascot } from "../ui/Mascot";
import type { Tab } from "../TabBar";
import { SettingsSheet } from "./SettingsSheet";

/**
 * Overview: greeting, the Talk to Penny card, your goals, and what's left to spend.
 * The paycheck donut and categories live on the Spending tab.
 */
export function HomeScreen({ goTo }: { goTo: (t: Tab) => void; resetSignal?: number }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { goals } = useStore().state;
  const [first, ...others] = goals;

  return (
    <>
      <div className="scroll-y absolute inset-0 bg-[var(--bg)] px-4 pb-[calc(var(--tabbar-h)+var(--sab)+20px)] pt-[calc(var(--sat)+14px)]">
        {/* Greeting */}
        <header className="flex items-start justify-between px-1">
          <div>
            <h1 className="text-[30px] font-bold leading-[36px] tracking-[-0.01em] text-label">Hi, {USER_NAME}</h1>
            <p className="mt-1 text-[17px] leading-[23px] text-label-2">
              Let’s spend smart
              <br />
              so future you is happy.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Profile and settings"
            className="pressable -mr-1 flex h-12 w-12 items-center justify-center rounded-full text-label"
          >
            <UserIcon size={34} />
          </button>
        </header>

        {/* Talk to Penny */}
        <section className="relative mt-5 overflow-hidden rounded-[28px] bg-[#e4e9d8] px-6 pb-6 pt-6">
          <WaveIcon size={28} className="text-[#2f3424]" />
          <h2 className="mt-3 w-[58%] text-[36px] font-bold leading-[38px] tracking-[-0.02em] text-[#151210]">Talk to Penny</h2>
          <p className="mt-2 w-[52%] text-[16px] leading-[21px] text-[#151210]/65">Let’s check before you buy.</p>
          <button
            type="button"
            onClick={() => goTo("chat")}
            className="pressable relative z-10 mt-5 flex h-[52px] items-center gap-3 rounded-full bg-[#3c4230] pl-6 pr-5 text-[17px] font-medium text-white"
          >
            Talk to Penny
            <ArrowRightIcon size={20} />
          </button>
          <Mascot mood="listening" size={190} className="absolute -right-3 bottom-1 drop-shadow-none" />
        </section>

        {/* Your goals */}
        <div className="mt-6 flex items-center justify-between px-1">
          <h2 className="text-[22px] font-bold tracking-[-0.01em] text-label">Your goals</h2>
          <button type="button" onClick={() => goTo("goals")} className="flex h-10 items-center gap-1 text-[15px] text-label-2">
            See all <ChevronIcon size={14} />
          </button>
        </div>
        {first && <GoalCard goal={first} big onClick={() => goTo("goals")} />}
        {others.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {others.slice(0, 2).map((g) => (
              <GoalCard key={g.id} goal={g} onClick={() => goTo("goals")} />
            ))}
          </div>
        )}

        {/* Left to spend */}
        <button
          type="button"
          onClick={() => goTo("free")}
          className="pressable mt-3 flex w-full items-center gap-4 rounded-[24px] bg-card px-4 py-4 text-left shadow-[0_8px_24px_-16px_rgba(30,20,10,0.25)]"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[#efe8dc] text-[#6b5a44]">
            <WalletIcon2 size={26} />
          </span>
          <span className="flex-1">
            <span className="tabular block text-[30px] font-bold leading-none tracking-[-0.02em] text-label">{money(BASE_FREE_TOTAL)}</span>
            <span className="mt-1 block text-[16px] text-label-2">left to spend this month</span>
          </span>
          <ChevronIcon className="text-label-3" />
        </button>
      </div>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

function GoalCard({ goal, big, onClick }: { goal: Goal; big?: boolean; onClick: () => void }) {
  const { Icon, bg, fg } = goalLook(goal.name);
  const pct = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pressable flex w-full items-center rounded-[24px] bg-card text-left shadow-[0_8px_24px_-16px_rgba(30,20,10,0.25)] ${
        big ? "mt-2 gap-4 p-3.5" : "gap-2.5 p-2.5"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center ${big ? "h-[92px] w-[100px] rounded-[18px]" : "h-[56px] w-[46px] rounded-[14px]"}`}
        style={{ background: bg, color: fg }}
      >
        <Icon size={big ? 40 : 22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-semibold text-label ${big ? "text-[18px]" : "text-[14px]"}`}>{goal.name}</span>
        <span className={`tabular block text-label-2 ${big ? "mt-1 text-[16px]" : "mt-0.5 text-[12px]"}`}>
          {money(goal.saved)} of {money(goal.target)}
        </span>
        <span className="mt-2 flex items-center gap-2">
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-fill">
            <span className="block h-full rounded-full bg-[#8fa66b]" style={{ width: `${pct * 100}%` }} />
          </span>
          <span className={`tabular text-label-2 ${big ? "text-[15px]" : "text-[12px]"}`}>{Math.round(pct * 100)}%</span>
        </span>
      </span>
    </button>
  );
}
