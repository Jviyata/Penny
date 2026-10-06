"use client";

import { useEffect, useRef } from "react";
import { money } from "@/lib/format";
import { planFor, type Impact, type PlanId, type PlanOption } from "@/lib/planOptions";
import type { PlansCard } from "@/lib/types";
import { Mascot } from "../ui/Mascot";
import { CheckIcon } from "../ui/Icons";

const IMPACT_STYLE: Record<Impact, { bg: string; fg: string }> = {
  Low: { bg: "#e1ead0", fg: "#4f6b2c" },
  Medium: { bg: "#f4e6cc", fg: "#8a621b" },
  High: { bg: "#f4dbd3", fg: "#a2493b" },
};

/**
 * Penny's answer as three plans side by side (swipe between them), like choosing a pricing plan:
 * Buy Now, Wait 2 Months, Wait 3 Months. Penny's pick is highlighted and scrolled into view.
 */
export function PlanCards({
  plans,
  onChoose,
  onToggle,
}: {
  plans: PlansCard;
  onChoose: (o: PlanOption) => void;
  onToggle: (key: "remind" | "priceWatch") => void;
}) {
  const { headline, detail, pick, options } = planFor(plans.name, plans.price, plans.left);
  const rowRef = useRef<HTMLDivElement>(null);

  // Start on Penny's pick, so the recommended plan is the first thing you see.
  useEffect(() => {
    const row = rowRef.current;
    const card = row?.querySelector<HTMLElement>(`[data-plan="${pick}"]`);
    if (row && card) row.scrollLeft = card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2;
  }, [pick]);

  return (
    <div className="w-full">
      {/* Penny's short take */}
      <div className="flex items-end gap-1 pr-6">
        <Mascot mood={pick === "now" ? "approved" : pick === "wait2" ? "thinking" : "not_right_now"} size={48} className="-mb-1 shrink-0" />
        <div className="paper-glass rounded-[22px] px-4 py-2.5">
          <p className="text-[16px] font-semibold leading-[21px] text-label">{headline}</p>
          <p className="mt-0.5 text-[14px] leading-[19px] text-label-2">{detail}</p>
        </div>
      </div>

      {/* The three plans */}
      <div ref={rowRef} className="no-scrollbar -mx-3 mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3 pb-2 pt-3">
        {options.map((o) => (
          <Plan
            key={o.id}
            option={o}
            picked={o.id === pick}
            chosen={plans.chosen}
            onChoose={() => onChoose(o)}
          />
        ))}
      </div>

      <p className="mx-2 mt-1 text-center text-[14px] leading-[19px] text-label-2">
        Buying now trades flexibility for immediacy. Waiting gives you more breathing room this month.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Toggle on={!!plans.remind} onClick={() => onToggle("remind")} label="Remind me when I’m ready to buy" done="I’ll remind you" />
        <Toggle on={!!plans.priceWatch} onClick={() => onToggle("priceWatch")} label="Tell me if the price drops" done="Watching the price" />
      </div>
    </div>
  );
}

function Plan({ option: o, picked, chosen, onChoose }: { option: PlanOption; picked: boolean; chosen?: PlanId; onChoose: () => void }) {
  const isChosen = chosen === o.id;
  const settled = !!chosen;
  const impact = IMPACT_STYLE[o.impact];
  return (
    <section
      data-plan={o.id}
      className={`relative flex w-[78%] shrink-0 snap-center flex-col rounded-[24px] bg-card px-4 pb-4 pt-4 ${
        picked ? "outline outline-2 outline-[#5f7340]" : ""
      } ${settled && !isChosen ? "opacity-55" : ""}`}
    >
      {picked && (
        <span className="absolute -top-3 left-4 rounded-full bg-[#5f7340] px-2.5 py-1 text-[12px] font-semibold text-white">
          ★ Penny’s Pick
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[17px] font-bold text-label">{o.title}</h3>
        <span className="rounded-full px-2 py-0.5 text-[12px] font-semibold" style={{ background: impact.bg, color: impact.fg }}>
          {o.impact} impact
        </span>
      </div>

      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="tabular text-[32px] font-bold leading-none tracking-[-0.02em] text-label">{money(o.amount)}</span>
        <span className="text-[13px] text-label-2">{o.amountNote}</span>
      </p>
      <p className="mt-1.5 flex items-baseline justify-between text-[14px]">
        <span className="text-label-2">Left to spend</span>
        <span className="tabular font-semibold text-label">{money(o.left)}</span>
      </p>

      <ul className="mt-3 flex flex-1 flex-col gap-1.5 border-t border-[var(--sep)] pt-3">
        {o.tradeoffs.map((t) => (
          <li key={t.text} className="flex items-start gap-2 text-[14px] leading-[19px] text-label">
            <span
              className={`mt-[2px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold leading-none ${
                t.good ? "bg-[#e1ead0] text-[#4f6b2c]" : "bg-[#f4e6cc] text-[#8a621b]"
              }`}
              aria-label={t.good ? "Good" : "Trade-off"}
            >
              {t.good ? <CheckIcon size={10} /> : "–"}
            </span>
            {t.text}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onChoose}
        disabled={settled}
        className={`pressable mt-4 flex h-11 items-center justify-center gap-1.5 rounded-full text-[15px] font-semibold ${
          isChosen || (!settled && picked) ? "bg-cta text-on-cta" : "bg-fill text-label"
        }`}
      >
        {isChosen ? (
          <>
            <CheckIcon size={16} /> {o.id === "now" ? "Bought" : "Saving started"}
          </>
        ) : (
          o.cta
        )}
      </button>
    </section>
  );
}

function Toggle({ on, onClick, label, done }: { on: boolean; onClick: () => void; label: string; done: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`pressable flex min-h-[48px] items-center justify-center gap-1.5 rounded-[16px] px-3 py-2 text-center text-[13px] font-medium leading-[17px] ${
        on ? "bg-[#e1ead0] text-[#4f6b2c]" : "bg-card text-label"
      }`}
    >
      {on && <CheckIcon size={14} className="shrink-0" />}
      {on ? done : label}
    </button>
  );
}
