"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MONTH } from "@/lib/demoData";
import { CalendarIcon, CheckIcon, ChevronDownIcon } from "../ui/Icons";

// The demo only has October's numbers; the neighbors show where the app would go next.
const MONTHS = [
  { id: "sep", name: "September", note: "Wrapped up", available: false },
  { id: "oct", name: MONTH.name, note: `${MONTH.daysLeft} days left`, available: true },
  { id: "nov", name: "November", note: "Starts Nov 1", available: false },
];

/** Frosted "Oct ⌄" chip that opens an iOS-style month menu. */
/** `variant="text"`: a plain "October 2026 ⌄" line (Spending header) instead of the glass chip. */
export function MonthMenu({ variant = "chip" }: { variant?: "chip" | "text" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // While open, other floating controls (Demo files) step aside so the menu reads cleanly.
  useEffect(() => {
    document.documentElement.dataset.menu = open ? "open" : "closed";
  }, [open]);

  // Tap anywhere else (or Escape) to close, like a native menu.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Month: ${MONTH.name}`}
        className={
          variant === "text"
            ? "pressable -ml-1 flex h-9 items-center gap-1.5 rounded-full px-1 text-[17px] text-label-2"
            : "pressable glass flex h-11 items-center gap-1.5 rounded-full pl-3.5 pr-3 text-[16px] font-medium text-on-photo"
        }
      >
        {variant === "chip" && <CalendarIcon />}
        {variant === "text" ? `${MONTH.name} 2026` : MONTH.name.slice(0, 3)}
        <ChevronDownIcon className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: "spring", damping: 30, stiffness: 420 }}
            style={{ transformOrigin: "top right" }}
            className={`paper-glass absolute top-[44px] z-50 w-[230px] overflow-hidden rounded-[22px] py-1.5 ${variant === "text" ? "left-0" : "right-0"}`}
          >
            {MONTHS.map((m) => {
              const current = m.available;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={current}
                  disabled={!m.available}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left active:bg-black/5 disabled:active:bg-transparent"
                >
                  <span className="w-4 shrink-0 text-label">{current && <CheckIcon />}</span>
                  <span className="flex-1">
                    <span className={`block text-[17px] ${m.available ? "font-semibold text-label" : "text-label-3"}`}>
                      {m.name}
                    </span>
                    <span className="block text-[13px] text-label-3">{m.note}</span>
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
