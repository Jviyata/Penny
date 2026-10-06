"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import type { Goal } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { LineEditorSheet, type EditorConfig } from "../free/LineEditorSheet";
import { PencilIcon, PlusIcon } from "../ui/Icons";
import { Mascot } from "../ui/Mascot";
import { Screen } from "../ui/Screen";
import type { Tab } from "../TabBar";
import { ChevronIcon, HeartIcon, goalLook } from "../ui/Icons";

/** Goals: what you're saving toward, how far along each one is, and adding to them. */
export function GoalsScreen({ goTo }: { goTo: (t: Tab) => void }) {
  const { state, dispatch } = useStore();
  const { goals } = state;
  const [editor, setEditor] = useState<EditorConfig | null>(null);

  const saved = goals.reduce((t, g) => t + g.saved, 0);
  const target = goals.reduce((t, g) => t + g.target, 0);
  const share = target > 0 ? Math.min(1, saved / target) : 0;

  const addGoal = () =>
    setEditor({
      title: "New goal",
      withName: true,
      namePlaceholder: "Like “Concert fund”",
      note: "Enter how much you want to save in total.",
      onSave: (name, amount) => dispatch({ type: "addGoal", name, target: amount }),
    });

  const editGoal = (g: Goal) =>
    setEditor({
      title: "Edit goal",
      withName: true,
      name: g.name,
      amount: g.target,
      note: "The amount is your target.",
      onSave: (name, amount) => dispatch({ type: "editGoal", id: g.id, name, target: amount }),
      extra: { label: "Remove goal", onClick: () => dispatch({ type: "removeGoal", id: g.id }) },
    });

  const addMoney = (g: Goal) =>
    setEditor({
      title: `Add to ${g.name}`,
      withName: false,
      note: `${money(g.saved)} of ${money(g.target)} saved so far.`,
      onSave: (_, amount) => dispatch({ type: "addToGoal", id: g.id, amount }),
    });

  return (
    <>
      <Screen scene="goals" title="Goals" subtitle="What you’re saving toward.">
        <div className="-mt-1 px-5">
          {/* Total saved, with the overall percent */}
          <section className="flex items-end justify-between gap-3">
            <div>
              <p className="tabular text-[44px] font-bold leading-none tracking-[-0.025em] text-label">{money(saved)}</p>
              <p className="mt-1 text-[16px] text-label-2">saved of {money(target)}</p>
            </div>
            <span className="tabular mb-0.5 flex h-9 shrink-0 items-center rounded-full bg-fill px-3.5 text-[16px] font-semibold text-label">
              {Math.round(share * 100)}%
            </span>
          </section>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-fill" aria-hidden>
            <div className="h-full rounded-full bg-[#8fa66b] transition-[width] duration-500" style={{ width: `${share * 100}%` }} />
          </div>
        </div>

        {/* Wishlist: right under the bar so it's easy to reach */}
        <button
          type="button"
          onClick={() => goTo("shelf")}
          className="pressable mx-3 mt-4 flex w-[calc(100%-24px)] items-center gap-3 rounded-[22px] bg-card px-4 py-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#f4e3e3] text-[#9b4a4a]">
            <HeartIcon size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold">Wishlist</span>
            <span className="block truncate text-[13px] text-label-2">
              {state.shelf.length > 0
                ? `${state.shelf.length} ${state.shelf.length === 1 ? "thing" : "things"} you want, just not right now`
                : "Things you want, just not right now"}
            </span>
          </span>
          <ChevronIcon className="text-label-3" />
        </button>

        <section className="mx-3 mt-3 overflow-hidden rounded-[26px] bg-card pb-1">
          <div className="flex items-center justify-between px-4 pt-2">
            <h2 className="text-[18px] font-semibold">Your goals</h2>
            <button
              type="button"
              onClick={addGoal}
              className="pressable -mr-2 flex h-10 items-center gap-1 px-2 text-[15px] font-medium text-label-2"
            >
              <PlusIcon size={16} /> Add
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="flex flex-col items-center px-8 pb-5 pt-1 text-center">
              <Mascot mood="calm_neutral" size={80} />
              <p className="mt-1 text-[15px] leading-[20px] text-label-2">No goals yet. Add one to start tracking it.</p>
            </div>
          ) : (
            <ul>
              {goals.map((g) => {
                const p = g.target > 0 ? Math.min(1, g.saved / g.target) : 0;
                const done = g.saved >= g.target;
                const { Icon, bg, fg, photo, fit } = goalLook(g.name);
                return (
                  <li key={g.id} className="flex items-center gap-3 px-4 py-3 [@media(max-height:720px)]:py-2 [&:not(:last-child)]:shadow-[0_1px_0_var(--sep)]">
                    <span
                      className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] [@media(max-height:720px)]:h-[56px] [@media(max-height:720px)]:w-[56px]"
                      style={photo ? { background: `${bg} center / ${fit ?? "cover"} no-repeat url(${photo})` } : { background: bg, color: fg }}
                    >
                      {!photo && <Icon size={24} />}
                    </span>
                    <button type="button" onClick={() => editGoal(g)} className="min-w-0 flex-1 text-left">
                      <span className="flex items-baseline gap-2">
                        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[16px] font-medium">
                          <span className="truncate">{g.name}</span>
                          <PencilIcon size={12} className="shrink-0 text-label-3" />
                        </span>
                        <span className="tabular shrink-0 text-[15px] font-semibold">{Math.round(p * 100)}%</span>
                      </span>
                      <span className="tabular block truncate text-[13px] text-label-2">
                        {money(g.saved)} of {money(g.target)} · {done ? "Reached" : g.by}
                      </span>
                      <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-fill" aria-label={`${Math.round(p * 100)}% of the way`}>
                        <span className="block h-full rounded-full bg-[#8fa66b] transition-[width] duration-500" style={{ width: `${p * 100}%` }} />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addMoney(g)}
                      aria-label={`Add money to ${g.name}`}
                      className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fill text-label"
                    >
                      <PlusIcon size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </Screen>
      <LineEditorSheet config={editor} onClose={() => setEditor(null)} />
    </>
  );
}
