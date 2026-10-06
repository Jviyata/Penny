"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import type { Goal } from "@/lib/monthDetails";
import { useStore } from "@/lib/store";
import { LineEditorSheet, type EditorConfig } from "../free/LineEditorSheet";
import { PencilIcon, PlusIcon, FlagIcon } from "../ui/Icons";
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
        <div className="px-5">
          <section className="on-photo-shadow">
            <p className="tabular text-[56px] font-bold leading-none tracking-[-0.025em] text-on-photo">{money(saved)}</p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className="text-[19px] text-on-photo-2">saved of {money(target)}</p>
              <span className="glass tabular flex h-10 shrink-0 items-center rounded-full px-4 text-[17px] font-semibold text-on-photo">
                {Math.round(share * 100)}%
              </span>
            </div>
          </section>
          <div className="glass mt-4 h-3.5 overflow-hidden rounded-full" aria-hidden>
            <div className="h-full rounded-full bg-[#8fa66b] transition-[width] duration-500" style={{ width: `${share * 100}%` }} />
          </div>
        </div>

        <section className="mx-3 mt-5 overflow-hidden rounded-[30px] bg-card pb-2">
          <div className="flex items-center justify-between px-5 pb-1 pt-4">
            <h2 className="text-[19px] font-semibold">Your goals</h2>
            <button
              type="button"
              onClick={addGoal}
              className="pressable -mr-2 flex h-11 items-center gap-1 px-2 text-[15px] font-medium text-label-2"
            >
              <PlusIcon size={16} /> Add
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="flex flex-col items-center px-8 pb-6 pt-2 text-center">
              <Mascot mood="calm_neutral" size={96} />
              <p className="mt-1 text-[15px] leading-[20px] text-label-2">No goals yet. Add one to start tracking it.</p>
            </div>
          ) : (
            <ul>
              {goals.map((g) => {
                const p = g.target > 0 ? Math.min(1, g.saved / g.target) : 0;
                const done = g.saved >= g.target;
                return (
                  <li key={g.id} className="px-5 py-3 [&:not(:last-child)]:shadow-[0_1px_0_var(--sep)]">
                    <div className="flex items-center gap-3.5">
                      {(() => {
                        const { Icon, bg, fg, photo } = goalLook(g.name);
                        return (
                          <span
                            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px]"
                            style={photo ? { background: `center / cover url(${photo})` } : { background: bg, color: fg }}
                          >
                            {!photo && <Icon size={22} />}
                          </span>
                        );
                      })()}
                      <button type="button" onClick={() => editGoal(g)} className="min-w-0 flex-1 text-left">
                        <span className="flex items-center gap-1.5 text-[17px]">
                          <span className="truncate">{g.name}</span>
                          <PencilIcon size={13} className="shrink-0 text-label-3" />
                        </span>
                        <span className="block text-[14px] text-label-3">
                          {done ? "Reached" : `${money(g.target - g.saved)} to go`} · {g.by}
                        </span>
                      </button>
                      <span className="text-right">
                        <span className="tabular block text-[17px] font-medium">{money(g.saved)}</span>
                        <span className="tabular block text-[13px] text-label-3">of {money(g.target)}</span>
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3 pl-[62px]">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-fill" aria-label={`${Math.round(p * 100)}% of the way`}>
                        <div className="h-full rounded-full bg-[var(--v-comfortable)] transition-[width] duration-500" style={{ width: `${p * 100}%` }} />
                      </div>
                      <button
                        type="button"
                        onClick={() => addMoney(g)}
                        aria-label={`Add money to ${g.name}`}
                        className="pressable flex h-9 items-center gap-1 rounded-full bg-fill px-3 text-[14px] font-semibold text-label"
                      >
                        <PlusIcon size={14} /> Add
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Wishlist lives here now (it's not a tab) */}
        <button
          type="button"
          onClick={() => goTo("shelf")}
          className="pressable mx-3 mt-3 flex w-[calc(100%-24px)] items-center gap-3.5 rounded-[24px] bg-card px-5 py-4 text-left shadow-[0_8px_24px_-16px_rgba(30,20,10,0.25)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#f4e3e3] text-[#9b4a4a]">
            <HeartIcon size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-semibold">Wishlist</span>
            <span className="block text-[14px] text-label-2">Things you want, just not right now.</span>
          </span>
          <ChevronIcon className="text-label-3" />
        </button>
      </Screen>
      <LineEditorSheet config={editor} onClose={() => setEditor(null)} />
    </>
  );
}
