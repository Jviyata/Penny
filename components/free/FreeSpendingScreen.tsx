"use client";

import { useState } from "react";
import { BASE_FREE_TOTAL, MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Line } from "@/lib/types";
import { Screen } from "../ui/Screen";
import { BagIcon, PencilIcon, PlusIcon, iconForName } from "../ui/Icons";
import type { Tab } from "../TabBar";
import { LineEditorSheet, type EditorConfig } from "./LineEditorSheet";
import { SwipeRow } from "./SwipeRow";

type View = "plans" | "bought";

export function FreeSpendingScreen({ goTo }: { goTo: (t: Tab) => void }) {
  const { state, dispatch, open } = useStore();
  const { freeTotal, plans, bought } = state;
  const [editor, setEditor] = useState<EditorConfig | null>(null);
  const [view, setView] = useState<View>("plans");
  const adjusted = freeTotal !== BASE_FREE_TOTAL;
  const used = freeTotal - open;
  const usedShare = freeTotal > 0 ? Math.min(1, Math.max(0, used / freeTotal)) : 1;
  const over = open < 0;

  const editTotal = () =>
    setEditor({
      title: "Total to work with",
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
      <Screen scene="free" title="Free spending">
        <div className="px-5">
          <section className="on-photo-shadow -mt-1">
            <p className="tabular text-[60px] font-bold leading-none tracking-[-0.025em] text-on-photo">
              {money(Math.max(open, 0))}
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className="text-[19px] text-on-photo-2">
                open of {money(freeTotal)}
                {adjusted && <span className="block text-[13px]">Adjusted from {money(BASE_FREE_TOTAL)}</span>}
              </p>
              <span className="glass tabular flex h-10 shrink-0 items-center rounded-full px-4 text-[17px] font-semibold text-on-photo">
                {Math.round(usedShare * 100)}% used
              </span>
            </div>
          </section>

          <div className="glass mt-4 h-3.5 overflow-hidden rounded-full" aria-hidden>
            <div
              className="h-full rounded-full bg-[#f1ead9] transition-[width] duration-500 ease-out"
              style={{ width: `${usedShare * 100}%` }}
            />
          </div>
          <p className="on-photo-shadow mt-2.5 text-[14px] leading-[19px] text-on-photo-2">
            {over
              ? `Your plans and purchases add up to ${money(-open)} more than you have. Moving or trimming a plan would balance it.`
              : `The only part of ${MONTH.name} that’s yours to shape.`}
          </p>

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
            <span className="flex-1 text-[16px] text-label-2">Total to work with</span>
            <span className="tabular text-[17px] font-semibold">{money(freeTotal)}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fill text-label">
              <PencilIcon />
            </span>
          </button>

          {view === "plans" ? (
            <>
              <div className="flex items-center justify-between px-5 pb-1 pt-2">
                <h2 className="text-[19px] font-semibold">Plans</h2>
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
              <h2 className="px-5 pb-1 pt-2 text-[19px] font-semibold">Bought</h2>
              {bought.length === 0 ? (
                <p className="px-5 py-4 text-[15px] text-label-2">
                  Nothing yet. When you buy something from Chat, it shows up here.
                </p>
              ) : (
                bought.map((b) => (
                  <SwipeRow key={b.id} onTap={() => {}} actionLabel="Undo" onAction={() => dispatch({ type: "removeBought", id: b.id })}>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-fill text-label-2">
                      <BagIcon size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[17px]">{b.name}</span>
                      <span className="block truncate text-[14px] text-label-3">{[b.what, b.date].filter(Boolean).join(" · ") || `Bought in ${MONTH.name}`}</span>
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
