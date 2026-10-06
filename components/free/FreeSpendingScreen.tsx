"use client";

import { useState } from "react";
import { BASE_FREE_TOTAL, MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Line } from "@/lib/types";
import { NavButton, Screen } from "../ui/Screen";
import { ArrowLeftIcon, BagIcon, PencilIcon, PlusIcon, iconForName } from "../ui/Icons";
import type { Tab } from "../TabBar";
import { LineEditorSheet, type EditorConfig } from "./LineEditorSheet";
import { SwipeRow } from "./SwipeRow";

type View = "plans" | "bought";

export function FreeSpendingScreen({ goTo, onBack }: { goTo: (t: Tab) => void; onBack?: () => void }) {
  const { state, dispatch, open } = useStore();
  const { freeTotal, plans, bought } = state;
  const [editor, setEditor] = useState<EditorConfig | null>(null);
  const [view, setView] = useState<View>("plans");
  const adjusted = freeTotal !== BASE_FREE_TOTAL;
  const plannedTotal = plans.reduce((t, p) => t + p.amount, 0);
  const boughtTotal = bought.reduce((t, b) => t + b.amount, 0);
  const over = open < 0;

  const editTotal = () =>
    setEditor({
      title: "Available this month",
      withName: false,
      amount: freeTotal,
      note: `${money(BASE_FREE_TOTAL)} is what's left after everything that already has a job. Change it if your month looks different.`,
      onSave: (_, amount) => dispatch({ type: "setTotal", amount }),
      extra: adjusted
        ? { label: `Reset to ${money(BASE_FREE_TOTAL)}`, onClick: () => dispatch({ type: "setTotal", amount: BASE_FREE_TOTAL }) }
        : undefined,
    });

  const addPlan = () =>
    setEditor({
      title: "New plan",
      withName: true,
      namePlaceholder: "Like “Mom’s birthday dinner”",
      onSave: (name, amount) => dispatch({ type: "addPlan", name, amount }),
    });

  const editPlan = (p: Line) =>
    setEditor({
      title: "Edit plan",
      withName: true,
      name: p.name,
      amount: p.amount,
      onSave: (name, amount) => dispatch({ type: "editPlan", id: p.id, name, amount }),
      extra: { label: "Remove plan", onClick: () => dispatch({ type: "removePlan", id: p.id }) },
    });

  return (
    <>
      <Screen
        scene="free"
        title="Left to spend"
        leading={
          onBack && (
            <NavButton label="Back" onClick={onBack}>
              <ArrowLeftIcon />
            </NavButton>
          )
        }
      >
        <div className="-mt-2 px-5">
          {/* The main number, the same one Overview and Penny use */}
          <section className="flex items-end justify-between gap-3">
            <div>
              <p className="tabular text-[48px] font-bold leading-[52px] tracking-[-0.025em] text-label [@media(max-height:720px)]:text-[40px] [@media(max-height:720px)]:leading-[44px]">{money(freeTotal)}</p>
              <p className="mt-1 text-[15px] text-label-2">
                for the next {MONTH.daysLeft} days{adjusted ? ` · adjusted from ${money(BASE_FREE_TOTAL)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={editTotal}
              aria-label="Change left to spend"
              className="pressable mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fill text-label"
            >
              <PencilIcon />
            </button>
          </section>

          {/* Where it's going, in one row */}
          <dl className="mt-4 grid grid-cols-3 rounded-[20px] bg-card py-3 text-center [@media(max-height:720px)]:mt-3 [@media(max-height:720px)]:py-2">
            <Stat label="Planned" value={money(plannedTotal)} />
            <Stat label="Bought" value={money(boughtTotal)} divider />
            <Stat label="Not planned yet" value={over ? `−${money(-open)}` : money(open)} strong divider tone={over ? "#c4614f" : "#4f6b2c"} />
          </dl>
          {over && (
            <p className="mt-2 text-[14px] leading-[19px] text-label-2">
              Your plans and purchases are {money(-open)} more than you have. Moving or trimming a plan would balance it.
            </p>
          )}

          {/* Plans | Bought */}
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-[var(--fill)] p-1 [@media(max-height:720px)]:mt-3" role="tablist">
            {(["plans", "bought"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`h-10 rounded-full text-[16px] font-medium transition-colors ${
                  view === v ? "bg-[#1d1a17] text-white" : "text-label-2"
                }`}
              >
                {v === "plans" ? "Plans" : `Bought${bought.length ? ` (${bought.length})` : ""}`}
              </button>
            ))}
          </div>
        </div>

        <section className="mx-3 mt-3 overflow-hidden rounded-[26px] bg-card pb-1.5">
          {view === "plans" ? (
            <>
              <div className="flex items-center justify-between px-5 pt-2">
                <span>
                  <h2 className="text-[17px] font-semibold">Plans</h2>
                  <span className="block text-[13px] text-label-3 [@media(max-height:720px)]:hidden">Already set aside this month</span>
                </span>
                <button
                  type="button"
                  onClick={addPlan}
                  className="pressable -mr-2 flex h-11 items-center gap-1 px-2 text-[15px] font-medium text-label-2"
                >
                  <PlusIcon size={16} /> Add
                </button>
              </div>
              {plans.length === 0 ? (
                <p className="px-5 py-4 text-[15px] text-label-2">No plans yet. Add what this money is already meant for.</p>
              ) : (
                plans.map((p) => (
                  <SwipeRow key={p.id} onTap={() => editPlan(p)} actionLabel="Remove" onAction={() => dispatch({ type: "removePlan", id: p.id })}>
                    <IconTile name={p.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px]">{p.name}</span>
                    </span>
                    <span className="tabular text-[16px] font-medium">{money(p.amount)}</span>
                  </SwipeRow>
                ))
              )}
            </>
          ) : (
            <>
              <div className="px-5 pb-1 pt-3">
                <h2 className="text-[17px] font-semibold">Bought</h2>
                <span className="block text-[13px] text-label-3">What you’ve bought this month</span>
              </div>
              {bought.length === 0 ? (
                <p className="px-5 py-4 text-[15px] text-label-2">
                  Nothing yet. When you buy something from Chat, it shows up here.
                </p>
              ) : (
                bought.map((b) => (
                  <SwipeRow key={b.id} onTap={() => {}} actionLabel="Undo" onAction={() => dispatch({ type: "removeBought", id: b.id })}>
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-fill text-label-2">
                      {b.image ? (
                        <img src={b.image} alt="" className="h-full w-full object-cover" draggable={false} />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <BagIcon size={22} />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] leading-[20px]">{b.note ?? b.name}</span>
                      <span className="block truncate text-[13px] text-label-3">
                        {[b.name, b.date].filter(Boolean).join(" · ") || `Bought in ${MONTH.name}`}
                      </span>
                    </span>
                    <span className="tabular text-[17px] font-medium">{money(b.amount)}</span>
                  </SwipeRow>
                ))
              )}
            </>
          )}

        </section>
      </Screen>
      <LineEditorSheet config={editor} onClose={() => setEditor(null)} />
    </>
  );
}

const TILE_TINTS = ["#e9dccb", "#dfe6d3", "#ecd9d6", "#e2deeb", "#f0e2cc"];

function IconTile({ name }: { name: string }) {
  const Icon = iconForName(name);
  const tint = TILE_TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TILE_TINTS.length];
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[#3b3128]" style={{ background: tint }}>
      <Icon size={20} />
    </span>
  );
}

function Stat({ label, value, strong, divider, tone }: { label: string; value: string; strong?: boolean; divider?: boolean; tone?: string }) {
  return (
    <div className={divider ? "border-l border-[var(--sep)]" : ""}>
      <dt className="text-[12px] text-label-2">{label}</dt>
      <dd className={`tabular mt-0.5 text-[17px] ${strong ? "font-bold" : "font-semibold text-label"}`} style={tone ? { color: tone } : undefined}>
        {value}
      </dd>
    </div>
  );
}
