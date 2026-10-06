"use client";

import { useState } from "react";
import { BASE_FREE_TOTAL, USER_NAME } from "@/lib/demoData";
import { money } from "@/lib/format";
import type { Goal } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { ArrowRightIcon, ChevronIcon, UserIcon, WalletIcon2, WaveIcon, goalLook } from "../ui/Icons";
import { Mascot } from "../ui/Mascot";
import { Scene } from "../ui/Screen";
import type { Tab } from "../TabBar";
import { SettingsSheet } from "./SettingsSheet";

/**
 * Overview: greeting, the Talk to Penny card, your goals, and what's left to spend.
 * The paycheck donut and categories live on the Spending tab.
 */
export function HomeScreen({ goTo }: { goTo: (t: Tab) => void; resetSignal?: number }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { goals } = useStore().state;

  return (
    <>
      <Scene name="home" />
      <div className="scroll-y absolute inset-0 px-4 pb-[calc(var(--tabbar-h)+var(--sab)+12px)] pt-[calc(var(--sat)+10px)]">
        {/* Greeting */}
        <header className="flex items-start justify-between px-1">
          <div>
            <h1 className="text-[26px] font-bold leading-[31px] tracking-[-0.01em] text-label">Hi, {USER_NAME}</h1>
            <p className="mt-0.5 text-[15px] leading-[20px] text-label-2 [@media(max-height:720px)]:hidden">
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
            <UserIcon size={30} />
          </button>
        </header>

        {/* Talk to Penny */}
        <section className="relative mt-4 glass-tint overflow-hidden rounded-[26px] bg-[rgba(214,226,190,0.62)] px-5 pb-5 pt-5 [@media(max-height:720px)]:mt-3 [@media(max-height:720px)]:py-4">
          <WaveIcon size={22} className="text-[#2f3424]" />
          <h2 className="mt-2 w-[58%] text-[28px] font-bold leading-[31px] tracking-[-0.02em] text-[#151210]">Talk to Penny</h2>
          <p className="mt-1.5 w-[52%] text-[14px] leading-[19px] text-[#151210]/65 [@media(max-height:720px)]:hidden">Let’s check before you buy.</p>
          <button
            type="button"
            onClick={() => goTo("chat")}
            className="pressable relative z-10 mt-4 flex h-11 items-center gap-2.5 rounded-full bg-[#3c4230] pl-5 pr-4 text-[15px] font-medium text-white"
          >
            Talk to Penny
            <ArrowRightIcon size={18} />
          </button>
          <Mascot mood="listening" size={150} className="absolute -right-2 bottom-1 drop-shadow-none [@media(max-height:720px)]:!h-[120px] [@media(max-height:720px)]:!w-[120px]" />
        </section>

        {/* Your goals */}
        <div className="mt-4 flex items-center justify-between px-1 [@media(max-height:720px)]:mt-2.5">
          <h2 className="text-[19px] font-bold tracking-[-0.01em] text-label">Your goals</h2>
          <button type="button" onClick={() => goTo("goals")} className="flex h-9 items-center gap-1 text-[14px] text-label-2">
            See all <ChevronIcon size={14} />
          </button>
        </div>
        <div className="mt-1.5 grid grid-cols-3 gap-2.5">
          {goals.slice(0, 3).map((g) => (
            <GoalCard key={g.id} goal={g} onClick={() => goTo("goals")} />
          ))}
        </div>

        {/* Left to spend */}
        <button
          type="button"
          onClick={() => goTo("free")}
          className="pressable mt-2.5 flex w-full items-center gap-3.5 rounded-[22px] bg-card px-4 py-3 text-left shadow-[0_8px_24px_-16px_rgba(30,20,10,0.25)]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#efe8dc] text-[#6b5a44]">
            <WalletIcon2 size={23} />
          </span>
          <span className="flex-1">
            <span className="tabular block text-[24px] font-bold leading-none tracking-[-0.02em] text-label">{money(BASE_FREE_TOTAL)}</span>
            <span className="mt-1 block text-[14px] text-label-2">left to spend this month</span>
          </span>
          <ChevronIcon className="text-label-3" />
        </button>
      </div>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

/** One goal: its picture, its name, and how far along it is. Amounts live on the Goals tab. */
function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const { Icon, bg, fg, photo, fit } = goalLook(goal.name);
  const pct = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0;
  return (
    <button type="button" onClick={onClick} className="pressable flex flex-col overflow-hidden rounded-[22px] bg-card text-left">
      <span
        className="flex h-[96px] w-full items-center justify-center [@media(max-height:720px)]:h-[72px]"
        style={photo ? { background: `${bg} center / ${fit ?? "cover"} no-repeat url(${photo})` } : { background: bg, color: fg }}
      >
        {!photo && <Icon size={30} />}
      </span>
      <span className="block w-full px-3 pb-3 pt-2.5">
        <span className="block truncate text-[14px] font-semibold text-label">{shortName(goal.name)}</span>
        <span className="mt-1.5 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill">
            <span className="block h-full rounded-full bg-[#8fa66b]" style={{ width: `${pct * 100}%` }} />
          </span>
          <span className="tabular text-[12px] font-semibold text-label-2">{Math.round(pct * 100)}%</span>
        </span>
      </span>
    </button>
  );
}

/** Short tile label: "Emergency fund" → "Emergency". */
function shortName(name: string) {
  return name.replace(/\s+fund$/i, "");
}
