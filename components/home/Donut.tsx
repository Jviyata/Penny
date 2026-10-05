import { BASE_FREE_TOTAL, MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import type { JobId } from "@/lib/monthDetails";

export type SliceId = JobId | "free";
export type Slice = { id: SliceId; name: string; amount: number; color: string };

// Distinct warm tones so the legend dots are easy to match; green is reserved for your free money.
const COLORS: Record<JobId, string> = {
  rent: "#d9b99a",
  savings: "#9fb7c9",
  loans: "#d7a9a0",
  groceries: "#e2c88e",
  bills: "#b9aed6",
  transit: "#c9b6a3",
};

/** Free to spend first, then everything that's already assigned. Shared with the Home legend. */
export const SLICES: Slice[] = [
  { id: "free", name: "Free to spend", amount: BASE_FREE_TOTAL, color: "#a9c27e" },
  ...(["rent", "savings", "loans", "groceries", "bills", "transit"] as JobId[]).map((id) => {
    const j = MONTH.jobs.find((x) => x.id === id)!;
    return { id, name: j.name === "Student loans" ? "Loans" : j.name, amount: j.amount, color: COLORS[id] };
  }),
];

const SIZE = 340;
const C = SIZE / 2;
const R = 168; // outer radius
const r = 100; // inner radius (pearl center sits here)
const START = (200 * Math.PI) / 180;

// Rounded so the server (V8) and Safari (JavaScriptCore) render identical attributes:
// their Math.sin/cos can differ in the last digit, which breaks hydration.
const r2 = (n: number) => Math.round(n * 100) / 100;

function point(radius: number, angle: number) {
  // angle 0 = 12 o'clock, clockwise
  return [r2(C + radius * Math.sin(angle)), r2(C - radius * Math.cos(angle))] as const;
}

function arc(a0: number, a1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = point(R, a0);
  const [x1, y1] = point(R, a1);
  const [x2, y2] = point(r, a1);
  const [x3, y3] = point(r, a0);
  return `M${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 ${large} 0 ${x3} ${y3}Z`;
}

/**
 * Where the paycheck goes, drawn to scale. No labels on the ring: the legend under it
 * names each slice, and tapping a slice opens it.
 */
export function Donut({ onSelect, size }: { onSelect: (id: SliceId) => void; size: string }) {
  const total = MONTH.income;
  let a = START;
  const slices = SLICES.map((s) => {
    const a0 = a;
    const a1 = a + (s.amount / total) * Math.PI * 2;
    a = a1;
    return { ...s, a0, a1 };
  });

  return (
    <figure
      className="@container relative aspect-square shrink-0"
      style={{ width: size }}
      aria-label={`${money(total)} paycheck. ${slices.map((s) => `${s.name} ${money(s.amount)}`).join(", ")}.`}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full drop-shadow-[0_10px_24px_rgba(30,18,8,0.35)]" aria-hidden>
        {slices.map((s) => (
          <path
            key={s.id}
            d={arc(s.a0, s.a1)}
            fill={s.color}
            stroke="rgba(255,255,255,0.65)"
            strokeWidth={2}
            onClick={() => onSelect(s.id)}
            className="cursor-pointer transition-opacity active:opacity-70"
          />
        ))}
      </svg>

      {/* Center: just the paycheck */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center shadow-[inset_0_2px_10px_rgba(255,255,255,0.7)]"
        style={{
          width: `${r2(((r * 2 - 4) / SIZE) * 100)}%`,
          height: `${r2(((r * 2 - 4) / SIZE) * 100)}%`,
          background: "radial-gradient(circle at 32% 28%, #fffaf4 0%, #f6ece2 55%, #ece2d4 100%)",
        }}
        aria-hidden
      >
        <span className="tabular font-bold leading-none tracking-[-0.01em] text-[#1d1a17]" style={{ fontSize: "clamp(17px, 9cqw, 26px)" }}>
          {money(total)}
        </span>
        <span className="mt-1 font-medium text-[#1d1a17]/65" style={{ fontSize: "clamp(11px, 4.6cqw, 14px)" }}>
          paycheck
        </span>
      </div>
    </figure>
  );
}
