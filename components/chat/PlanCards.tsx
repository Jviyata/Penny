"use client";

import { useState } from "react";
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
 * Penny's answer, the way a chat would show it: a short message, then the three options as a
 * pick-one list (like a poll). Tapping an option shows its trade-offs and one button to act on it.
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
  const [selected, setSelected] = useState<PlanId>(plans.chosen ?? pick);
  const settled = !!plans.chosen;
  const current = options.find((o) => o.id === selected)!;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {/* Penny's take */}
      <div className="flex items-end gap-1">
        <Mascot mood={pick === "now" ? "approved" : pick === "wait2" ? "thinking" : "not_right_now"} size={34} className="-mb-1 shrink-0" />
        <p className="paper-glass max-w-[85%] rounded-[20px] rounded-bl-[6px] px-3.5 py-2 text-[15px] leading-[20px] text-label">
          <span className="font-semibold">{headline}</span> <span className="text-label-2">{detail}</span>
        </p>
      </div>

      {/* The options, pick one */}
      <div className="paper-glass ml-[38px] rounded-[20px] p-1.5">
        {options.map((o) => (
          <Option
            key={o.id}
            option={o}
            pick={o.id === pick}
            selected={o.id === selected}
            chosen={plans.chosen === o.id}
            disabled={settled}
            onSelect={() => setSelected(o.id)}
          />
        ))}

        {/* Trade-offs for the one you're looking at */}
        <ul className="mx-2 mt-1.5 flex flex-col gap-1 [@media(max-height:720px)]:gap-0.5 border-t border-[var(--sep)] pt-2">
          {current.tradeoffs.slice(0, 3).map((t) => (
            <li key={t.text} className="flex items-center gap-2 text-[13px] leading-[17px] text-label">
              <span
                className={`flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none ${
                  t.good ? "bg-[#e1ead0] text-[#4f6b2c]" : "bg-[#f4e6cc] text-[#8a621b]"
                }`}
                aria-label={t.good ? "Good" : "Trade-off"}
              >
                {t.good ? <CheckIcon size={9} /> : "–"}
              </span>
              {t.text}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => onChoose(current)}
          disabled={settled}
          className="pressable mt-2 flex h-10 w-full [@media(max-height:720px)]:h-9 items-center justify-center gap-1.5 rounded-full bg-cta text-[15px] font-semibold text-on-cta disabled:opacity-100"
        >
          {settled ? (
            <>
              <CheckIcon size={15} /> {plans.chosen === "now" ? "Bought" : "Saving started"}
            </>
          ) : current.id === "now" ? (
            `Buy it now · ${money(current.amount)}`
          ) : (
            `Start saving · ${money(current.amount)}/mo`
          )}
        </button>
      </div>

      <p className="ml-[38px] px-1 text-[12px] leading-[16px] text-label-3 [@media(max-height:720px)]:hidden">
        Buying now trades flexibility for immediacy. Waiting gives you more breathing room this month.
      </p>

      {/* Follow-ups, as quick-reply chips */}
      <div className="ml-[38px] grid grid-cols-2 gap-1.5">
        <Chip on={!!plans.remind} onClick={() => onToggle("remind")} label="Remind me when I’m ready to buy" />
        <Chip on={!!plans.priceWatch} onClick={() => onToggle("priceWatch")} label="Tell me if the price drops" />
      </div>
    </div>
  );
}

function Option({
  option: o,
  pick,
  selected,
  chosen,
  disabled,
  onSelect,
}: {
  option: PlanOption;
  pick: boolean;
  selected: boolean;
  chosen: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const impact = IMPACT_STYLE[o.impact];
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex w-full items-center gap-2.5 rounded-[14px] px-2.5 py-[7px] text-left transition-colors [@media(max-height:720px)]:py-[4px] ${
        selected ? "bg-white shadow-[0_0_0_1.5px_#5f7340]" : ""
      } ${disabled && !chosen ? "opacity-45" : ""}`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          selected ? "bg-[#5f7340] text-white" : "border-[1.5px] border-[var(--label-3)]"
        }`}
        aria-hidden
      >
        {selected && <CheckIcon size={11} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-[15px] font-semibold text-label">{o.title}</span>
          {pick && <span className="rounded-full bg-[#5f7340] px-1.5 py-[1px] text-[10.5px] font-semibold text-white">Penny’s Pick</span>}
        </span>
        <span className="tabular block text-[13px] text-label-2">
          {money(o.amount)} {o.id === "now" ? "today" : "/mo"} · leaves {money(o.left)}
        </span>
      </span>
      <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: impact.bg, color: impact.fg }}>
        {o.impact}
      </span>
    </button>
  );
}

function Chip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`pressable flex min-h-[34px] items-center justify-center gap-1 rounded-[14px] px-2.5 py-1 text-center text-[12px] font-medium leading-[15px] ${
        on ? "bg-[#e1ead0] text-[#4f6b2c]" : "paper-glass text-label"
      }`}
    >
      {on && <CheckIcon size={12} />}
      {label}
    </button>
  );
}
