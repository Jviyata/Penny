"use client";

import { ChartIcon, FlagIcon, HomeIcon } from "./ui/Icons";

/** Screens. "chat" (Talk to Penny) and "shelf" (Wishlist) are opened from Home and Goals, not tabs. */
export type Tab = "home" | "free" | "chat" | "goals" | "shelf";

const TABS: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "home", label: "Overview", Icon: HomeIcon },
  { id: "goals", label: "Goals", Icon: FlagIcon },
  { id: "free", label: "Spending", Icon: ChartIcon },
];

/** White tab bar: Overview · Goals · Spending. */
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void; shelfCount?: number }) {
  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-30 grid h-[calc(var(--tabbar-h)+var(--sab))] grid-cols-3 rounded-t-[24px] bg-[var(--bar)] pb-[var(--sab)] shadow-[0_-1px_0_var(--sep),0_-10px_30px_-20px_rgba(30,18,8,0.35)] [html[data-keyboard=open]_&]:hidden"
      aria-label="Tabs"
    >
      {TABS.map(({ id, label, Icon }) => {
        const on = id === active || (id === "goals" && active === "shelf");
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={on ? "page" : undefined}
            className={`flex h-[var(--tabbar-h)] flex-col items-center justify-center gap-1 transition-colors active:opacity-60 ${
              on ? "text-label" : "text-label-3"
            }`}
          >
            <Icon size={25} filled={on} />
            <span className={`text-[12px] leading-none ${on ? "font-semibold" : "font-medium"}`}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
