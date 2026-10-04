"use client";

import { useEffect, useState } from "react";
import { parseAmount } from "@/lib/format";
import { Sheet, SheetButton } from "../ui/Sheet";

export type EditorConfig = {
  title: string;
  withName: boolean;
  name?: string;
  amount?: number;
  namePlaceholder?: string;
  note?: string;
  onSave: (name: string, amount: number) => void;
  extra?: { label: string; onClick: () => void }; // e.g. "Remove plan", "Reset to $1,060"
};

/** One sheet for adding/editing a plan and changing the total. */
export function LineEditorSheet({ config, onClose }: { config: EditorConfig | null; onClose: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!config) return;
    setName(config.name ?? "");
    setAmount(config.amount !== undefined ? String(config.amount) : "");
  }, [config]);

  const parsed = parseAmount(amount);
  const valid = parsed !== null && (!config?.withName || name.trim().length > 0);

  const save = () => {
    if (!config || !valid) return;
    config.onSave(name.trim(), parsed!);
    onClose();
  };

  return (
    <Sheet
      open={!!config}
      onClose={onClose}
      title={config?.title}
      leading={<SheetButton onClick={onClose}>Cancel</SheetButton>}
      trailing={<SheetButton strong disabled={!valid} onClick={save}>Save</SheetButton>}
    >
      {config && (
        <form
          className="space-y-3 px-4 pb-4 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="overflow-hidden rounded-[14px] bg-fill">
            {config.withName && (
              <input
                className="h-12 w-full bg-transparent px-4 text-[17px] outline-none placeholder:text-label-3 shadow-[0_0.5px_0_var(--sep)]"
                placeholder={config.namePlaceholder ?? "What's it for?"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={!config.name}
                enterKeyHint="next"
                autoCapitalize="sentences"
                aria-label="Name"
              />
            )}
            <label className="flex h-12 items-center px-4">
              <span className="text-[17px] text-label-2">$</span>
              <input
                className="tabular h-full w-full bg-transparent pl-1 text-[17px] outline-none placeholder:text-label-3"
                placeholder="0"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus={!config.withName}
                enterKeyHint="done"
                aria-label="Amount"
              />
            </label>
          </div>
          {config.note && <p className="px-4 text-[13px] leading-[18px] text-label-2">{config.note}</p>}
          {config.extra && (
            <button
              type="button"
              onClick={() => {
                config.extra!.onClick();
                onClose();
              }}
              className="pressable h-12 w-full rounded-[14px] bg-fill text-[17px] text-label-2"
            >
              {config.extra.label}
            </button>
          )}
          <button type="submit" hidden />
        </form>
      )}
    </Sheet>
  );
}
