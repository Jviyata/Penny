"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import { planFor, type Impact, type PlanId, type PlanOption } from "@/lib/planOptions";
import type { PlansCard } from "@/lib/types";
import { CheckIcon } from "../ui/Icons";
import { Mascot } from "../ui/Mascot";

const IMPACT: Record<Impact, { dot: string; text: string }> = {
  Low: { dot: "#7d9a5c", text: "Low impact" },
  Medium: { dot: "#d29a3c", text: "Medium impact" },
  High: { dot: "#c4614f", text: "High impact" },
};

const SHORT: Record<PlanId, string> = { now: "Buy now", wait2: "Wait 2 mo", wait3: "Wait 3 mo" };
const LONG: Record<PlanId, string> = { now: "Buy now", wait2: "Wait 2 months", wait3: "Wait 3 months" };

/**
 * Penny's answer for an item, on one screen:
 * the item → Penny's take → your money now and after → three options → what it means → confirm.
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
  const impact = IMPACT[current.impact];
  const after = current.left;
  const usedShare = plans.left > 0 ? Math.min(1, Math.max(0, current.amount / plans.left)) : 1;

  return (
    <div className="flex w-full flex-col gap-2.5 px-1 [@media(max-height:720px)]:gap-1.5">
      {/* The item (on short phones it moves into Penny's bubble to save room) */}
      <div className="flex items-center gap-3 [@media(max-height:720px)]:hidden">
        {plans.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plans.image} alt="" className="h-[60px] w-[60px] shrink-0 rounded-[16px] [@media(max-height:720px)]:h-[48px] [@media(max-height:720px)]:w-[48px]" draggable={false} />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] text-label-2">{plans.name}</p>
          <p className="tabular text-[28px] font-bold leading-[32px] tracking-[-0.02em] text-label">{money(plans.price)}</p>
        </div>
      </div>

      {/* Penny's take */}
      <div className="flex items-end gap-1.5">
        <Mascot
          mood={pick === "now" ? "approved" : pick === "wait2" ? "thinking" : "not_right_now"}
          size={58}
          className="-mb-1 shrink-0 [@media(max-height:720px)]:!h-[46px] [@media(max-height:720px)]:!w-[46px]"
        />
        <p className="paper-glass rounded-[18px] rounded-bl-[6px] px-3.5 py-2 text-[14px] leading-[19px] text-label">
          <span className="hidden font-semibold [@media(max-height:720px)]:block">
            {plans.name} · {money(plans.price)}
          </span>
          <span className="font-semibold">{headline}</span> <span className="text-label-2">{detail}</span>
        </p>
      </div>

      {/* Your money: now → after the option you're looking at */}
      <div className="rounded-[18px] bg-card px-4 py-3 [@media(max-height:720px)]:py-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12px] text-label-2">Left to spend now</p>
            <p className="tabular text-[20px] font-semibold leading-[24px] text-label">{money(plans.left)}</p>
          </div>
          <span className="pb-1 text-[18px] text-label-3" aria-hidden>
            →
          </span>
          <div className="text-right">
            <p className="text-[12px] text-label-2">{current.id === "now" ? "After buying" : "After this month’s saving"}</p>
            <p className="tabular text-[20px] font-bold leading-[24px]" style={{ color: after < 0 ? "#c4614f" : "#4f6b2c" }}>
              {money(after)}
            </p>
          </div>
        </div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-fill" aria-hidden>
          <span className="h-full rounded-l-full bg-[#9db27f]" style={{ width: `${(1 - usedShare) * 100}%` }} />
          <span className="h-full" style={{ width: `${usedShare * 100}%`, background: impact.dot }} />
        </div>
      </div>

      {/* Three options, side by side */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        {options.map((o) => {
          const on = o.id === selected;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o.id)}
              disabled={settled}
              aria-pressed={on}
              className={`pressable relative flex flex-col items-start rounded-[16px] px-3 pb-2.5 pt-3 text-left transition-colors [@media(max-height:720px)]:pb-2 [@media(max-height:720px)]:pt-2.5 ${
                on ? "bg-cta text-on-cta" : "bg-card text-label"
              } ${settled && !on ? "opacity-45" : ""}`}
            >
              {o.id === pick && (
                <span className="absolute -top-2.5 left-2 rounded-full bg-[#b9c46f] px-2 py-[1px] text-[10.5px] font-semibold text-[#1d1a17]">
                  Penny’s pick
                </span>
              )}
              <span className="text-[13px] font-semibold">{SHORT[o.id]}</span>
              <span className="tabular mt-0.5 text-[18px] font-bold leading-[22px]">
                {money(o.amount)}
                {o.id !== "now" && <span className="text-[12px] font-medium">/mo</span>}
              </span>
              <span className={`mt-1 flex items-center gap-1 text-[11px] ${on ? "text-on-cta/75" : "text-label-2"}`}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: IMPACT[o.impact].dot }} />
                {o.impact}
              </span>
            </button>
          );
        })}
      </div>

      {/* What the selected option means, and the one button */}
      <div className="rounded-[18px] bg-card px-4 pb-3 pt-2.5 [@media(max-height:720px)]:pb-2.5 [@media(max-height:720px)]:pt-2">
        <p className="text-[13px] font-semibold text-label">
          {LONG[current.id]} <span className="font-normal text-label-2">· {impact.text}</span>
        </p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {current.tradeoffs.slice(0, 3).map((t) => (
            <li key={t.text} className="flex items-center gap-2 text-[13px] leading-[18px] text-label">
              <span className={`shrink-0 text-[12px] font-bold ${t.good ? "text-[#4f6b2c]" : "text-[#a7741f]"}`} aria-label={t.good ? "Good" : "Trade-off"}>
                {t.good ? "✓" : "–"}
              </span>
              {t.text}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onChoose(current)}
          disabled={settled}
          className="pressable mt-2.5 flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#5f7340] [@media(max-height:720px)]:mt-2 text-[15px] font-semibold text-white disabled:opacity-100 [@media(max-height:720px)]:h-10"
        >
          {settled ? (
            <>
              <CheckIcon size={15} />
              {plans.chosen === "now" ? `Bought · ${money(plans.left - plans.price)} left` : "Saving started · added to Goals"}
            </>
          ) : current.id === "now" ? (
            `Buy it · ${money(current.amount)}`
          ) : (
            `Start saving · ${money(current.amount)}/mo`
          )}
        </button>
      </div>

      {/* Follow-ups */}
      <div className="flex justify-center gap-2">
        <Chip on={!!plans.remind} onClick={() => onToggle("remind")} label="Remind me when ready" done="On your Wishlist" />
        <Chip on={!!plans.priceWatch} onClick={() => onToggle("priceWatch")} label="Tell me if price drops" done="Watching the price" />
      </div>
    </div>
  );
}

function Chip({ on, onClick, label, done }: { on: boolean; onClick: () => void; label: string; done: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`pressable flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] font-medium [@media(max-height:720px)]:h-7 ${
        on ? "bg-[#e1ead0] text-[#4f6b2c]" : "bg-card text-label"
      }`}
    >
      {on && <CheckIcon size={12} />}
      {on ? done : label}
    </button>
  );
}
