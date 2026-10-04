"use client";

import { motion, useAnimation } from "motion/react";
import type { ReactNode } from "react";

const REVEAL = 88;

/** List row you can tap, or swipe left to reveal one action. */
export function SwipeRow({
  children,
  onTap,
  actionLabel,
  onAction,
}: {
  children: ReactNode;
  onTap: () => void;
  actionLabel: string;
  onAction: () => void;
}) {
  const controls = useAnimation();

  return (
    <div className="relative overflow-hidden">
      <button
        type="button"
        onClick={onAction}
        className="absolute inset-y-0 right-0 flex w-[88px] items-center justify-center bg-fill text-[15px] font-medium text-label-2"
        tabIndex={-1}
      >
        {actionLabel}
      </button>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -REVEAL, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        animate={controls}
        onDragEnd={(_, info) => {
          const open = info.offset.x < -REVEAL / 2 || info.velocity.x < -400;
          controls.start({ x: open ? -REVEAL : 0, transition: { type: "spring", damping: 32, stiffness: 400 } });
        }}
        className="relative bg-card"
        style={{ touchAction: "pan-y" }}
      >
        <button type="button" onClick={onTap} className="flex min-h-[72px] w-full items-center gap-3.5 px-5 py-2.5 text-left active:bg-fill">
          {children}
        </button>
      </motion.div>
    </div>
  );
}
