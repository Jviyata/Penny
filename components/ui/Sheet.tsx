"use client";

import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { useEffect, type ReactNode } from "react";

const spring = { type: "spring", damping: 34, stiffness: 380, mass: 0.9 } as const;

/**
 * iOS-style bottom sheet. Lives inside the device screen (absolute, not fixed),
 * so it follows the keyboard and the desktop frame. Drag the grabber/header down to close.
 */
export function Sheet({
  open,
  onClose,
  title,
  leading,
  trailing,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--scrim)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 flex max-h-[calc(100%-var(--sat)-12px)] flex-col rounded-t-[28px] bg-card pb-[calc(var(--sab)+12px)] shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring}
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.8 }}
            onDragEnd={onDragEnd}
          >
            <div className="shrink-0 touch-none" onPointerDown={(e) => drag.start(e)}>
              <div className="mx-auto mt-2 h-[5px] w-9 rounded-full bg-label-3" />
              {(title || leading || trailing) && (
                <div className="relative flex h-12 items-center justify-center px-4">
                  <div className="absolute left-2 flex h-11 items-center">{leading}</div>
                  {title && <h2 className="text-[17px] font-semibold">{title}</h2>}
                  <div className="absolute right-2 flex h-11 items-center">{trailing}</div>
                </div>
              )}
            </div>
            <div className="scroll-y min-h-0 flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Text button for sheet headers ("Cancel", "Save"). */
export function SheetButton({
  children,
  onClick,
  strong,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  strong?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`pressable h-11 min-w-11 px-2 text-[17px] text-tint disabled:opacity-35 ${strong ? "font-semibold" : ""}`}
    >
      {children}
    </button>
  );
}
