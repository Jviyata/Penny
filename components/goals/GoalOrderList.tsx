"use client";

import { Reorder } from "motion/react";

/**
 * Goals in a list you drag to reorder, each tagged "Overview" (shown on the dashboard) or "More goals".
 */
export function GoalOrderList({
  ids,
  name,
  onOverview,
  onOrder,
}: {
  ids: string[];
  name: (id: string) => string;
  onOverview: (id: string) => boolean; // shown on Overview, or under More goals
  onOrder: (ids: string[]) => void;
}) {
  return (
    <Reorder.Group axis="y" values={ids} onReorder={onOrder} className="flex flex-col gap-2">
      {ids.map((id, i) => (
        <Reorder.Item
          key={id}
          value={id}
          className="flex h-14 cursor-grab touch-none select-none items-center gap-3 rounded-[16px] bg-white px-4 shadow-[inset_0_0_0_1px_#e3e5df] active:cursor-grabbing"
          whileDrag={{ scale: 1.02, boxShadow: "0 12px 28px -12px rgba(30,40,30,0.35)" }}
        >
          <span className="tabular w-5 text-[15px] font-semibold text-label-3">{i + 1}</span>
          <span className="min-w-0 flex-1 truncate text-[16px] font-medium text-label">{name(id)}</span>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
              onOverview(id) ? "bg-[#e6ecdf] text-[#3d5a44]" : "bg-fill text-label-2"
            }`}
          >
            {onOverview(id) ? "Overview" : "More goals"}
          </span>
          <GripIcon />
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

function GripIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-label-3" aria-hidden>
      {[6, 12, 18].map((y) => (
        <g key={y}>
          <circle cx="9" cy={y} r="1.6" />
          <circle cx="15" cy={y} r="1.6" />
        </g>
      ))}
    </svg>
  );
}
