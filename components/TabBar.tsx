"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChartIcon, FlagIcon, HeartIcon, HomeIcon } from "./ui/Icons";
import { Mascot } from "./ui/Mascot";

export type Tab = "home" | "free" | "chat" | "goals" | "shelf";

/**
 * Cream tab bar with Penny in the exact center as the "Can I afford this?" button ("Hi, I’m Penny! Let’s spend smart." bubble).
 * Home · Free spending | Penny | Goals · Wishlist: two tabs each side, so Penny sits dead center.
 */
export function TabBar({ active, onChange, shelfCount }: { active: Tab; onChange: (t: Tab) => void; shelfCount: number }) {
  const onChat = active === "chat";

  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-30 grid h-[calc(var(--tabbar-h)+var(--sab))] grid-cols-[1fr_1fr_88px_1fr_1fr] bg-[var(--bar)] pb-[var(--sab)] shadow-[0_-1px_0_var(--sep),0_-12px_30px_-18px_rgba(30,18,8,0.4)] [html[data-keyboard=open]_&]:hidden"
      aria-label="Tabs"
    >
      <TabButton id="home" label="Home" Icon={HomeIcon} active={active} onChange={onChange} />
      <TabButton id="free" label="Spending" Icon={ChartIcon} active={active} onChange={onChange} />

      {/* Penny */}
      <div className="relative">
        {/* Penny introduces herself on Home only, so she never covers content elsewhere. */}
        <AnimatePresence>
          {active === "home" && (
            <motion.span
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.9 }}
              className="pointer-events-none absolute bottom-[calc(100%+42px)] left-1/2 -translate-x-1/2 [html[data-home-detail=open]_&]:hidden"
              aria-hidden
            >
              <span className="paper-glass block whitespace-nowrap rounded-[16px] px-3.5 py-1.5 text-center text-[14px] font-semibold text-label">
                Hi, I’m Penny! Let’s spend smart.
              </span>
              {/* tail pointing down at Penny */}
              <span className="absolute left-1/2 top-full -mt-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[var(--paper-glass)]" />
            </motion.span>
          )}
        </AnimatePresence>
        {/* Big and raised everywhere else; small and tucked into the bar once you're in the chat,
            so she reads as the selected tab and stays out of the conversation. */}
        <motion.button
          type="button"
          onClick={() => onChange("chat")}
          aria-label="Ask Penny: can I afford this?"
          aria-current={onChat ? "page" : undefined}
          initial={false}
          animate={onChat ? { top: 4, width: 40, height: 40 } : { top: -40, width: 80, height: 80 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="absolute left-1/2 flex -translate-x-1/2 items-end justify-center active:scale-95"
        >
          {/* A soft cream halo so Penny reads as part of the bar (only when she's big) */}
          <motion.span
            initial={false}
            animate={{ opacity: onChat ? 0 : 1, scale: onChat ? 0.6 : 1 }}
            className="absolute bottom-1 h-[64px] w-[64px] rounded-full bg-[var(--card)] shadow-[0_10px_24px_-8px_rgba(20,14,8,0.5)] ring-4 ring-[var(--bar)]"
          />
          <Mascot mood={onChat ? "listening" : "approved"} size={84} className="relative !h-full !w-full" />
        </motion.button>
        {/* One entry point, always the same meaning */}
        <span
          className={`pointer-events-none absolute inset-x-0 bottom-[5px] text-center text-[10px] font-semibold leading-none ${
            onChat ? "text-label" : "text-label-2"
          }`}
          aria-hidden
        >
          Ask Penny
        </span>
      </div>

      <TabButton id="goals" label="Goals" Icon={FlagIcon} active={active} onChange={onChange} />
      <TabButton id="shelf" label="Wishlist" Icon={HeartIcon} active={active} onChange={onChange} badge={shelfCount} />
    </nav>
  );
}

function TabButton({
  id,
  label,
  Icon,
  active,
  onChange,
  badge = 0,
}: {
  id: Tab;
  label: string;
  Icon: typeof HomeIcon;
  active: Tab;
  onChange: (t: Tab) => void;
  badge?: number;
}) {
  const on = id === active;
  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      aria-label={label}
      aria-current={on ? "page" : undefined}
      className={`relative flex h-[var(--tabbar-h)] flex-col items-center justify-center gap-1 transition-colors active:opacity-60 ${
        on ? "text-label" : "text-label-3"
      }`}
    >
      <span className="relative">
        <Icon size={24} filled={on} />
        {badge > 0 && (
          <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cta px-1 text-[11px] font-semibold text-on-cta">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}
