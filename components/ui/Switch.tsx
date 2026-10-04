"use client";

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 after:absolute after:-inset-[7px] after:content-['']"
      style={{ background: checked ? "var(--tint)" : "var(--fill)" }}
    >
      <span
        className="absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-out"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}
