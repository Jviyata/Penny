"use client";

import { DEMO_ITEMS, type DemoItem } from "@/lib/demoItems";
import { money } from "@/lib/format";
import { Sheet } from "../ui/Sheet";

/** A phone-style photo picker with the six demo items. Tapping one sends it to Penny. */
export function DemoGallery({
  open,
  onClose,
  onPick,
  onBrowse,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (item: DemoItem) => void;
  onBrowse: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Recents">
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        {DEMO_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item)}
            className="pressable flex flex-col overflow-hidden rounded-[16px] bg-card text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.art} alt="" className="aspect-square w-full" draggable={false} />
            <span className="block px-2 pb-2 pt-1.5">
              <span className="line-clamp-2 block h-[32px] text-[12px] font-medium leading-[16px] text-label">{item.name}</span>
              <span className="tabular mt-0.5 block text-[13px] font-semibold text-label">{money(item.price)}</span>
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onBrowse}
        className="mx-auto mb-[calc(var(--sab)+12px)] flex h-11 items-center px-4 text-[15px] font-medium text-label-2"
      >
        Browse your own photos…
      </button>
    </Sheet>
  );
}
