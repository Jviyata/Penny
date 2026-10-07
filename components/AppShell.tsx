"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
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
import { Onboarding } from "./onboarding/Onboarding";
import { GoalDetail } from "./goals/GoalDetail";

/**
 * All four screens stay mounted so scroll position, drafts and chat survive tab switches.
 * Only the active one is visible and interactive.
 */
export function AppShell() {
  useVisualViewport();
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>("home");
  // Overview's "This month" card opens the Left to spend page inside Spending.
  const [openLeft, setOpenLeft] = useState(0);
  // Tapping a goal (on Overview or Goals) opens its page on top, with the tabs still showing.
  const [goalId, setGoalId] = useState<string | null>(null);

  // This is a demo app: every visit starts with onboarding.
  const [onboarding, setOnboarding] = useState(true);
  const finishOnboarding = () => {
    setTab("home");
    setOnboarding(false);
  };
  // Tapping the tab you're already on goes back to its top level (iOS convention).
  const [homeReset, setHomeReset] = useState(0);
  const selectTab = (t: Tab) => {
    setGoalId(null);
    if (t === tab && t === "home") setHomeReset((n) => n + 1);
    setTab(t);
  };

  const screens: Record<Tab, React.ReactNode> = {
    home: (
      <HomeScreen
        goTo={setTab}
        resetSignal={homeReset}
        openGoal={setGoalId}
        openLeftToSpend={() => {
          setTab("free");
          setOpenLeft((n) => n + 1);
        }}
      />
    ),
    free: <SpendingScreen goTo={setTab} openLeftSignal={openLeft} />,
    chat: <ChatScreen active={tab === "chat"} onBack={() => setTab("home")} />,
    goals: <GoalsScreen goTo={setTab} openGoal={setGoalId} />,
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
        <AnimatePresence>
          {goalId && (
            <motion.div
              key={goalId}
              className="absolute inset-0 z-20"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 34, stiffness: 340 }}
            >
              <GoalDetail goalId={goalId} onBack={() => setGoalId(null)} />
            </motion.div>
          )}
        </AnimatePresence>
        <TabBar active={tab} onChange={selectTab} shelfCount={state.shelf.length} />
        <DemoFiles goTo={setTab} />
        {onboarding && <Onboarding onDone={finishOnboarding} />}
      </div>
    </MotionConfig>
  );
}
