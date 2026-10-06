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
  const [first, ...others] = goals;

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
        {first && <GoalCard goal={first} big onClick={() => goTo("goals")} />}
        {others.length > 0 && (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {others.slice(0, 2).map((g) => (
              <GoalCard key={g.id} goal={g} onClick={() => goTo("goals")} />
            ))}
          </div>
        )}

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

function GoalCard({ goal, big, onClick }: { goal: Goal; big?: boolean; onClick: () => void }) {
  const { Icon, bg, fg, photo, fit } = goalLook(goal.name);
  const pct = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pressable flex w-full items-stretch overflow-hidden rounded-[24px] bg-card text-left ${
        big ? "mt-1.5 h-[104px] [@media(max-height:720px)]:h-[88px]" : "h-[96px] [@media(max-height:720px)]:h-[84px]"
      }`}
    >
      {/* The picture fills the left side of the card, edge to edge, with the percent on top */}
      <span
        className={`relative flex shrink-0 items-center justify-center ${big ? "w-[120px]" : "w-[64px]"}`}
        style={photo ? { background: `${bg} center / ${fit ?? "cover"} no-repeat url(${photo})` } : { background: bg, color: fg }}
      >
        {!photo && <Icon size={big ? 36 : 24} />}
        <span
          className={`tabular absolute left-1.5 top-1.5 rounded-full bg-white/90 font-bold text-label shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${
            big ? "px-2 py-0.5 text-[14px]" : "px-1.5 py-[1px] text-[12px]"
          }`}
        >
          {Math.round(pct * 100)}%
        </span>
      </span>
      <span className={`flex min-w-0 flex-1 flex-col justify-center ${big ? "px-4" : "pl-3 pr-2.5"}`}>
        <span className={`block truncate font-semibold text-label ${big ? "text-[17px]" : "text-[14px]"}`}>{goal.name}</span>
        {big ? (
          <span className="tabular mt-0.5 block truncate text-[14px] text-label-2">
            {money(goal.saved)} of {money(goal.target)}
          </span>
        ) : (
          <span className="tabular mt-0.5 block text-[12px] leading-[15px] text-label-2">
            <span className="block font-medium text-label">{money(goal.saved)}</span>
            <span className="block">of {money(goal.target)}</span>
          </span>
        )}
        <span className={`block overflow-hidden rounded-full bg-fill ${big ? "mt-2.5 h-2" : "mt-2 h-1.5"}`}>
          <span className="block h-full rounded-full bg-[#8fa66b]" style={{ width: `${pct * 100}%` }} />
        </span>
      </span>
    </button>
  );
}
