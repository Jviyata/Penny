"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import { planFor, type Impact, type PlanId, type PlanOption } from "@/lib/planOptions";
import type { PlansCard } from "@/lib/types";
import { CalendarIcon, CheckIcon, ChevronIcon } from "../ui/Icons";

const IMPACT_STYLE: Record<Impact, { bg: string; fg: string }> = {
  Low: { bg: "#e1ead0", fg: "#4f6b2c" },
  Medium: { bg: "#f4e6cc", fg: "#8a621b" },
  High: { bg: "#f4dbd3", fg: "#a2493b" },
};

const LABEL: Record<PlanId, string> = { now: "Buy", wait2: "Wait 2 months", wait3: "Wait 3 months" };

/**
 * Penny's answer for an item: the item and its price, how much of what's left it would take,
 * then three ways to go. Penny's pick leads as the dark button; the other two sit under it.
 * Tapping an option shows what it means; one more tap confirms it.
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
  const { pick, options } = planFor(plans.name, plans.price, plans.left);
  const [selected, setSelected] = useState<PlanId>(plans.chosen ?? pick);
  const settled = !!plans.chosen;
  const current = options.find((o) => o.id === selected)!;
  const pct = plans.left > 0 ? Math.round((plans.price / plans.left) * 100) : 100;
  const ordered = [options.find((o) => o.id === pick)!, ...options.filter((o) => o.id !== pick)];
  const impact = IMPACT_STYLE[current.impact];

  return (
    <div className="flex w-full flex-col px-1">
      {/* The item */}
      <div className="flex items-center gap-3.5">
        {plans.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plans.image}
            alt=""
            className="h-[96px] w-[96px] shrink-0 rounded-[22px] [@media(max-height:720px)]:h-[76px] [@media(max-height:720px)]:w-[76px]"
            draggable={false}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[16px] leading-[20px] text-label">{plans.name}</p>
          <p className="tabular mt-0.5 text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-label">{money(plans.price)}</p>
        </div>
        <Ring pct={pct} />
      </div>

      <p className="mt-3 text-[15px] leading-[20px] text-label-2">
        This is <span className="font-semibold text-label">{pct}%</span> of your{" "}
        <span className="font-semibold text-label">{money(plans.left)} left</span> to spend.
      </p>

      {/* Three ways to go: Penny's pick first and dark, the other two side by side */}
      <div className="mt-3 flex flex-col gap-2">
        <OptionButton option={ordered[0]} primary pick selected={selected === ordered[0].id} disabled={settled} onClick={() => setSelected(ordered[0].id)} />
        <div className="grid grid-cols-2 gap-2">
          {ordered.slice(1).map((o) => (
            <OptionButton key={o.id} option={o} selected={selected === o.id} disabled={settled} onClick={() => setSelected(o.id)} />
          ))}
        </div>
      </div>

      {/* What the selected option means */}
      <div className="mt-2.5 rounded-[20px] bg-card px-4 pb-3 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[14px] font-semibold text-label">
            {LABEL[current.id]}
            {current.id !== "now" && <span className="font-normal text-label-2"> · {money(current.amount)}/mo</span>}
          </p>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: impact.bg, color: impact.fg }}>
            {current.impact} impact
          </span>
        </div>
        <ul className="mt-1.5 flex flex-col gap-1">
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
          className="pressable mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[#5f7340] text-[15px] font-semibold text-white disabled:opacity-100"
        >
          {settled ? (
            <>
              <CheckIcon size={15} /> {plans.chosen === "now" ? "Bought" : "Saving started"}
            </>
          ) : current.id === "now" ? (
            `Confirm: buy for ${money(current.amount)}`
          ) : (
            `Confirm: save ${money(current.amount)}/mo`
          )}
        </button>
      </div>

      <p className="mt-2 text-center text-[12px] leading-[16px] text-label-3 [@media(max-height:720px)]:hidden">
        Buying now trades flexibility for immediacy. Waiting gives you more breathing room this month.
      </p>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Chip on={!!plans.remind} onClick={() => onToggle("remind")} label="Remind me when I’m ready to buy" />
        <Chip on={!!plans.priceWatch} onClick={() => onToggle("priceWatch")} label="Tell me if the price drops" />
      </div>
    </div>
  );
}

function OptionButton({
  option: o,
  primary,
  pick,
  selected,
  disabled,
  onClick,
}: {
  option: PlanOption;
  primary?: boolean;
  pick?: boolean;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const label = o.id === "now" ? `Buy for ${money(o.amount)}` : LABEL[o.id];
  // The big button has room for both numbers; the small ones keep to the one that matters.
  const sub =
    o.id === "now"
      ? `leaves ${money(o.left)}`
      : primary
        ? `${money(o.amount)}/mo · leaves ${money(o.left)}`
        : `${money(o.amount)} a month`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`pressable relative flex items-center gap-2.5 rounded-full text-left transition-shadow ${
        primary ? "h-[58px] bg-cta pl-5 pr-4 text-on-cta [@media(max-height:720px)]:h-[50px]" : "h-[54px] bg-fill pl-3.5 pr-2.5 text-label [@media(max-height:720px)]:h-[48px]"
      } ${selected ? (primary ? "shadow-[0_0_0_3px_#b9c46f]" : "shadow-[0_0_0_2px_#5f7340]") : ""} ${disabled && !selected ? "opacity-45" : ""}`}
    >
      {o.id === "now" ? (
        <span className={`shrink-0 text-[19px] font-semibold ${primary ? "" : "text-label-2"}`}>$</span>
      ) : (
        <CalendarIcon size={primary ? 20 : 17} className="shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-semibold ${primary ? "text-[16px]" : "text-[14px]"}`}>{label}</span>
        <span className={`tabular block truncate ${primary ? "text-[12.5px] text-on-cta/70" : "text-[11.5px] text-label-2"}`}>{sub}</span>
      </span>
      {pick && <span className="shrink-0 rounded-full bg-[#b9c46f] px-2 py-0.5 text-[11px] font-semibold text-[#1d1a17]">Penny’s pick</span>}
      <ChevronIcon size={14} className={`shrink-0 ${primary ? "text-on-cta/60" : "text-label-3"}`} />
    </button>
  );
}

/** How much of what's left this item would take. */
function Ring({ pct }: { pct: number }) {
  const R = 38;
  const C = 2 * Math.PI * R;
  const shown = Math.min(100, Math.max(0, pct));
  return (
    <div className="relative h-[92px] w-[92px] shrink-0 [@media(max-height:720px)]:h-[76px] [@media(max-height:720px)]:w-[76px]">
      <svg viewBox="0 0 92 92" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="46" cy="46" r={R} fill="none" stroke="var(--fill)" strokeWidth="9" />
        <circle
          cx="46"
          cy="46"
          r={R}
          fill="none"
          stroke="#7d9a5c"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${Math.round((shown / 100) * C * 100) / 100} ${Math.round(C * 100) / 100}`}
        />
      </svg>
      <span className="tabular absolute inset-0 flex items-center justify-center text-[19px] font-semibold text-label">{pct}%</span>
    </div>
  );
}

function Chip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`pressable flex min-h-[34px] items-center justify-center gap-1 rounded-[14px] px-2.5 py-1 text-center text-[12px] font-medium leading-[15px] ${
        on ? "bg-[#e1ead0] text-[#4f6b2c]" : "bg-card text-label"
      }`}
    >
      {on && <CheckIcon size={12} />}
      {label}
    </button>
  );
}
