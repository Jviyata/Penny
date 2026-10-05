"use client";

import { MotionConfig } from "motion/react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useVisualViewport } from "@/lib/useVisualViewport";
import { TabBar, type Tab } from "./TabBar";
import { HomeScreen } from "./home/HomeScreen";
import { SpendingScreen } from "./spending/SpendingScreen";
import { ChatScreen } from "./chat/ChatScreen";
import { ShelfScreen } from "./shelf/ShelfScreen";
import { GoalsScreen } from "./goals/GoalsScreen";
import { DemoFiles } from "./demo/DemoFiles";

/**
 * All four screens stay mounted so scroll position, drafts and chat survive tab switches.
 * Only the active one is visible and interactive.
 */
export function AppShell() {
  useVisualViewport();
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>("home");
  // Tapping the tab you're already on goes back to its top level (iOS convention).
  const [homeReset, setHomeReset] = useState(0);
  const selectTab = (t: Tab) => {
    if (t === tab && t === "home") setHomeReset((n) => n + 1);
    setTab(t);
  };

  const screens: Record<Tab, React.ReactNode> = {
    home: <HomeScreen goTo={setTab} resetSignal={homeReset} />,
    free: <SpendingScreen goTo={setTab} />,
    chat: <ChatScreen active={tab === "chat"} />,
    goals: <GoalsScreen />,
    shelf: <ShelfScreen goTo={setTab} />,
  };

  return (
    // Springs and slides follow the iPhone's Reduce Motion setting.
    <MotionConfig reducedMotion="user">
      <div className="absolute inset-0">
        {(Object.keys(screens) as Tab[]).map((id) => {
          const on = id === tab;
          return (
            <section
              key={id}
              className="absolute inset-0 transition-[opacity,transform] duration-200 ease-out"
              style={{
                opacity: on ? 1 : 0,
                transform: on ? "none" : "translateY(6px)",
                pointerEvents: on ? "auto" : "none",
                visibility: on ? "visible" : "hidden",
                // Only the incoming screen fades; the outgoing one leaves instantly so two photo scenes never blend.
                transitionDuration: on ? "200ms" : "0ms",
              }}
              inert={!on}
              aria-hidden={!on}
            >
              {screens[id]}
            </section>
          );
        })}
        <TabBar active={tab} onChange={selectTab} shelfCount={state.shelf.length} />
        <DemoFiles goTo={setTab} />
      </div>
    </MotionConfig>
  );
}
