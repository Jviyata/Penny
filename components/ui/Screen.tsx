"use client";

import type { ReactNode } from "react";

export type SceneName = "home" | "free" | "chat" | "shelf" | "goals";

/** Plain warm-white backdrop for a screen. */
export function Scene({ name }: { name: SceneName }) {
  return <div className={`scene scene-${name}`} aria-hidden />;
}

/**
 * Screen over a photo scene: header buttons and a white large title that all scroll
 * with the content. Nothing stays pinned at the top.
 */
export function Screen({
  scene,
  title,
  subtitle,
  leading,
  trailing,
  inlineTitle,
  children,
}: {
  scene: SceneName;
  title: string;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Put the title in the button row (saves a line; Home uses it to fit on one screen). */
  inlineTitle?: boolean;
  children: ReactNode;
}) {
  return (
    // isolate: this screen's layers (header menus, etc.) stay inside it, under the tab bar.
    <div className="absolute inset-0 isolate overflow-hidden">
      <Scene name={scene} />

      <div className="scroll-y relative h-full pt-[var(--sat)] pb-[calc(var(--tabbar-h)+var(--sab)+20px)]">
        {/* Header buttons sit above the content below them, so menus (Oct ⌄) open over it. */}
        {/* Only reserve the button row when there's something to put in it. */}
        {(leading || trailing || inlineTitle) ? (
        <div className={`relative z-[45] flex h-11 items-center justify-between ${inlineTitle ? "mt-1 pl-5 pr-3" : "px-3"}`}>
          <div className="flex min-w-0 items-center">
            {leading}
            {inlineTitle && (
              <h1 className="on-photo-shadow truncate text-[22px] font-semibold tracking-[-0.01em] text-on-photo">{title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2">{trailing}</div>
        </div>
        ) : (
          <div className="h-3" />
        )}
        {!inlineTitle && (
          <header className="on-photo-shadow px-5 pb-4">
            <h1 className="text-[32px] font-bold leading-[38px] tracking-[-0.01em] text-on-photo">{title}</h1>
            {subtitle && <div className="relative z-[45] mt-1 text-[16px] text-on-photo-2">{subtitle}</div>}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}

/** Round frosted icon button for screen headers (44pt target). */
export function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pressable glass flex h-11 w-11 items-center justify-center rounded-full text-on-photo"
    >
      {children}
    </button>
  );
}

/** Frosted pill chip for small facts in a header ("Oct · 18 days left"). */
export function GlassChip({ children }: { children: ReactNode }) {
  return (
    <span className="glass inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-medium text-on-photo">
      {children}
    </span>
  );
}
