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
        title="Free to spend"
        leading={
          onBack && (
            <NavButton label="Back" onClick={onBack}>
              <ArrowLeftIcon />
            </NavButton>
          )
        }
      >
        <div className="px-5">
          {/* The hero: what you can actually spend */}
          <section className="on-photo-shadow -mt-1">
            <p className="text-[17px] text-on-photo-2">You can freely spend</p>
            <p className="tabular text-[60px] font-bold leading-none tracking-[-0.025em] text-on-photo">
              {money(Math.max(open, 0))}
            </p>
            <p className="mt-1.5 text-[15px] leading-[20px] text-on-photo-2">
              After rent, bills, savings, and your planned purchases.
            </p>
          </section>

          {/* The whole calculation, in one place */}
          <dl
            className="mt-4 rounded-[20px] px-4 py-1 text-[15px] text-on-photo"
            style={{ background: "rgba(28, 18, 10, 0.4)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
          >
            <MathRow label="Available this month" value={money(freeTotal)} />
            <MathRow label="Planned" value={`− ${money(plannedTotal)}`} muted />
            <MathRow label="Already bought" value={`− ${money(boughtTotal)}`} muted />
            <div className="flex h-11 items-center justify-between border-t border-white/20 font-semibold">
              <dt>Actually free</dt>
              <dd className="tabular flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: over ? "var(--v-not)" : "#a9c27e" }} aria-hidden />
                {over ? `${money(-open)} over` : money(open)}
              </dd>
            </div>
          </dl>
          {adjusted && (
            <p className="on-photo-shadow mt-2 text-[13px] text-on-photo-2">Available adjusted from {money(BASE_FREE_TOTAL)}.</p>
          )}
          {over && (
            <p className="on-photo-shadow mt-2 text-[14px] leading-[19px] text-on-photo-2">
              Your plans and purchases add up to {money(-open)} more than you have. Moving or trimming a plan would balance it.
            </p>
          )}

          {/* Segmented control */}
          <div className="glass mt-5 grid grid-cols-2 rounded-full p-1" role="tablist">
            {(["plans", "bought"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`h-11 rounded-full text-[16px] font-semibold transition-colors ${
                  view === v ? "bg-card text-label shadow-sm" : "text-on-photo"
                }`}
              >
                {v === "plans" ? "Plans" : `Bought${bought.length ? ` (${bought.length})` : ""}`}
              </button>
            ))}
          </div>
        </div>

        <section className="mx-3 mt-4 overflow-hidden rounded-[30px] bg-card pb-2">
          <button
            type="button"
            onClick={editTotal}
            className="flex min-h-14 w-full items-center gap-3 px-5 pt-3 text-left"
          >
            <span className="flex-1 text-[16px] text-label-2">Change available amount</span>
            <span className="tabular text-[17px] font-semibold">{money(freeTotal)}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fill text-label">
              <PencilIcon />
            </span>
          </button>

          {view === "plans" ? (
            <>
              <div className="flex items-center justify-between px-5 pb-1 pt-3">
                <span>
                  <h2 className="text-[19px] font-semibold">Plans</h2>
                  <span className="block text-[13px] text-label-3">Money you’ve set aside this month.</span>
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
                      <span className="block truncate text-[17px]">{p.name}</span>
                      <span className="block text-[14px] text-label-3">Planned</span>
                    </span>
                    <span className="tabular text-[17px] font-medium">{money(p.amount)}</span>
                  </SwipeRow>
                ))
              )}
            </>
          ) : (
            <>
              <div className="px-5 pb-1 pt-3">
                <h2 className="text-[19px] font-semibold">Bought</h2>
                <span className="block text-[13px] text-label-3">What you’ve bought for yourself this month.</span>
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

          <button
            type="button"
            onClick={() => goTo("chat")}
            className="block w-full px-5 pb-3 pt-3 text-left text-[13px] leading-[18px] text-label-2"
          >
            You can also change this in Chat. Try “move the concert to November” or “I got $200 back from a refund.”
          </button>
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
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-[#3b3128]" style={{ background: tint }}>
      <Icon size={22} />
    </span>
  );
}

function MathRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex h-10 items-center justify-between">
      <dt className={muted ? "text-on-photo-2" : ""}>{label}</dt>
      <dd className={`tabular ${muted ? "text-on-photo-2" : "font-semibold"}`}>{value}</dd>
    </div>
  );
}
