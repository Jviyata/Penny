"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import { planFor, type Impact, type PlanId, type PlanOption } from "@/lib/planOptions";
import type { PlansCard } from "@/lib/types";
import { CheckIcon } from "../ui/Icons";
import { Mascot } from "../ui/Mascot";

const IMPACT_DOT: Record<Impact, string> = { Low: "#7d9a5c", Medium: "#d29a3c", High: "#c4614f" };
const TITLE: Record<PlanId, string> = { now: "Buy now", wait2: "Wait 2 mo", wait3: "Wait 3 mo" };

/**
 * Penny's answer, kept calm and easy to read: the item and Penny, one sentence,
 * your money before → after, three options, one line about the one you picked, one button.
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
  const { headline, pick, reason, options } = planFor(plans.name, plans.price, plans.left, plans.answers);
  const [selected, setSelected] = useState<PlanId>(plans.chosen ?? pick);
  const settled = !!plans.chosen;
  const current = options.find((o) => o.id === selected)!;

  return (
    <div className="flex w-full flex-col gap-4 px-1 [@media(max-height:720px)]:gap-2">
      {/* The item, with Penny */}
      <div className="flex items-center gap-3">
        {plans.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plans.image} alt="" className="h-[64px] w-[64px] shrink-0 rounded-[18px] [@media(max-height:720px)]:h-[40px] [@media(max-height:720px)]:w-[40px] [@media(max-height:720px)]:rounded-[12px]" draggable={false} />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] text-label-2 [@media(max-height:720px)]:text-[13px]">{plans.name}</p>
          <p className="tabular text-[28px] font-bold leading-[32px] tracking-[-0.02em] text-label [@media(max-height:720px)]:text-[20px] [@media(max-height:720px)]:leading-[22px]">{money(plans.price)}</p>
        </div>
        <Mascot
          mood={pick === "now" ? "approved" : pick === "wait2" ? "thinking" : "not_right_now"}
          size={68}
          className="shrink-0 [@media(max-height:720px)]:!h-[40px] [@media(max-height:720px)]:!w-[40px]"
        />
      </div>

      {/* Penny's verdict, one line */}
      <div>
        <p className="text-[19px] font-semibold leading-[24px] tracking-[-0.01em] text-label">{headline}</p>
        {/* Why, from what you told Penny */}
        {reason && <p className="mt-1 text-[15px] leading-[20px] text-label-2 [@media(max-height:720px)]:text-[13px] [@media(max-height:720px)]:leading-[17px]">{reason}</p>}
      </div>

      {/* Money: now → after */}
      <div className="flex items-center justify-between rounded-[20px] bg-card px-5 py-3.5 [@media(max-height:720px)]:py-2">
        <div>
          <p className="text-[13px] text-label-2">Left to spend</p>
          <p className="tabular text-[22px] font-semibold leading-[26px] text-label">{money(plans.left)}</p>
        </div>
        <span className="text-[20px] text-label-3" aria-hidden>
          →
        </span>
        <div className="text-right">
          <p className="text-[13px] text-label-2">After</p>
          <p className="tabular text-[22px] font-bold leading-[26px]" style={{ color: current.left < 0 ? "#c4614f" : "#4f6b2c" }}>
            {money(current.left)}
          </p>
        </div>
      </div>

      {/* Three options */}
      <div className="grid grid-cols-3 gap-2.5 pt-1.5">
        {options.map((o) => {
          const on = o.id === selected;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o.id)}
              disabled={settled}
              aria-pressed={on}
              className={`pressable relative flex flex-col items-center rounded-[18px] px-2 pb-3 pt-3.5 text-center transition-colors ${
                on ? "bg-cta text-on-cta" : "bg-card text-label"
              } ${settled && !on ? "opacity-40" : ""}`}
            >
              {o.id === pick && (
                <span className="absolute -top-2.5 rounded-full bg-[#b9c46f] px-2 py-[1px] text-[10.5px] font-semibold text-[#1d1a17]">
                  Penny’s pick
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[14px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: IMPACT_DOT[o.impact] }} aria-label={`${o.impact} impact`} />
                {TITLE[o.id]}
              </span>
              <span className="tabular mt-1 text-[19px] font-bold leading-[23px]">
                {money(o.amount)}
                {o.id !== "now" && <span className="text-[12px] font-medium">/mo</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* The trade-offs for the selected option (they change as you tap), then the button */}
      <div>
        <div className="rounded-[18px] bg-card px-4 py-3 [@media(max-height:720px)]:py-2">
          <p className="text-[13px] font-medium text-label-2">
            {current.impact} impact · {current.getIt} · you’d cut back:
          </p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {current.tradeoffs.slice(0, 3).map((t, i) => (
              <li
                key={t.text}
                className={`flex items-center gap-2.5 text-[14px] leading-[19px] text-label ${i === 2 ? "[@media(max-height:720px)]:hidden" : ""}`}
              >
                <span
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    t.good ? "bg-[#e1ead0] text-[#4f6b2c]" : "bg-[#f4e6cc] text-[#8a621b]"
                  }`}
                  aria-label={t.good ? "Good" : "Trade-off"}
                >
                  {t.good ? <CheckIcon size={11} /> : "–"}
                </span>
                {t.text}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => onChoose(current)}
          disabled={settled}
          className="pressable mt-2.5 flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-[#5f7340] text-[16px] font-semibold text-white disabled:opacity-100 [@media(max-height:720px)]:h-10"
        >
          {settled ? (
            <>
              <CheckIcon size={16} />
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
      <div className="grid grid-cols-2 gap-2">
        <Chip on={!!plans.remind} onClick={() => onToggle("remind")} label="Save to Wishlist" done="On your Wishlist" />
        <Chip on={!!plans.priceWatch} onClick={() => onToggle("priceWatch")} label="Tell me if the price drops" done="Watching the price" />
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
      className={`pressable flex h-10 items-center justify-center gap-1 whitespace-nowrap [@media(max-height:720px)]:h-9 rounded-full px-1.5 text-[12.5px] font-medium tracking-[-0.01em] ${
        on ? "bg-[#e1ead0] text-[#4f6b2c]" : "border border-[var(--sep)] bg-card text-label"
      }`}
    >
      {on && <CheckIcon size={13} />}
      {on ? done : label}
    </button>
  );
}
