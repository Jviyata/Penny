import { BASE_FREE_TOTAL, MONTH } from "@/lib/demoData";
import { money } from "@/lib/format";
import type { JobId } from "@/lib/monthDetails";
import { HouseIcon, SparklesIcon } from "../ui/Icons";
import { CATEGORY_ICONS } from "./categories";

type Slice = { id: string; name: string; amount: number; color: string; Icon: typeof HouseIcon; hero?: boolean };

const COLORS: Record<string, string> = {
  rent: "rgba(240, 214, 190, 0.38)",
  savings: "rgba(206, 232, 212, 0.42)",
  loans: "rgba(246, 206, 206, 0.42)",
  groceries: "rgba(240, 220, 182, 0.4)",
  bills: "rgba(222, 212, 244, 0.42)",
  transit: "rgba(178, 208, 232, 0.5)", // soft blue so it doesn't blend into Groceries
};

// "Yours to work with" first, then the bills around the ring.
const SLICES: Slice[] = [
  { id: "yours", name: "Yours", amount: BASE_FREE_TOTAL, color: "rgba(176, 202, 128, 0.82)", Icon: SparklesIcon, hero: true },
  ...["rent", "savings", "loans", "groceries", "bills", "transit"].map((id) => {
    const j = MONTH.jobs.find((x) => x.id === id)!;
    return { id, name: j.name === "Student loans" ? "Loans" : j.name, amount: j.amount, color: COLORS[id], Icon: CATEGORY_ICONS[id as JobId] };
  }),
];

const SIZE = 340;
const C = SIZE / 2;
const R = 168; // outer radius
const r = 84; // inner radius (pearl center sits here)
const START = (200 * Math.PI) / 180; // "Yours" sits lower-left, like the mockup

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

const MIN_SHARE = 0.06; // ~22°: room for an icon, amount and name

/**
 * Tiny slices (Transit is 2.3%) get a minimum width so they're tappable and can hold a label;
 * the space comes proportionally out of the larger slices. Labels always show the exact amounts.
 */
function displayShares(shares: number[]): number[] {
  const small = shares.map((v) => v < MIN_SHARE);
  const reserved = small.filter(Boolean).length * MIN_SHARE;
  const rest = shares.reduce((t, v, i) => (small[i] ? t : t + v), 0);
  return shares.map((v, i) => (small[i] ? MIN_SHARE : (v / rest) * (1 - reserved)));
}

/** Where the month goes: your free money plus everything that already has a job. Tap a slice to open it. */
export function Donut({ onSelect }: { onSelect: (id: JobId | "yours") => void }) {
  const total = MONTH.income;
  const widths = displayShares(SLICES.map((s) => s.amount / total));
  let a = START;
  const slices = SLICES.map((s, i) => {
    const a0 = a;
    const a1 = a + widths[i] * Math.PI * 2;
    a = a1;
    return { ...s, a0, a1 };
  });

  return (
    <figure
      className="@container relative mx-auto aspect-square max-w-full"
      // Fills whatever height Home has left on this phone, so Home fits on one screen.
      // 478px = everything else on Home (header, $1,060, free-now chip, the $4,140 row, icon row, room for Penny's bubble).
      style={{ width: "clamp(176px, calc(100cqh - 478px - var(--sat) - var(--sab)), 340px)" }}
      aria-label={`${money(total)} came in. ${slices.map((s) => `${s.name} ${money(s.amount)}`).join(", ")}.`}
    >
      <div className="glass absolute inset-0 rounded-full" aria-hidden />
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full" aria-hidden>
        {slices.map((s) => (
          <path
            key={s.id}
            d={arc(s.a0, s.a1)}
            fill={s.color}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1.2}
            onClick={() => onSelect(s.id as JobId | "yours")}
            className="cursor-pointer transition-opacity active:opacity-70"
          />
        ))}
      </svg>

      {/* Every slice gets its icon and amount */}
      {slices.map((s) => {
        const [x, y] = point((R + r) / 2, (s.a0 + s.a1) / 2);
        return (
          <div
            key={s.id}
            className="on-photo-shadow pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center leading-tight text-on-photo [&_svg]:h-[clamp(12px,5cqw,17px)] [&_svg]:w-[clamp(12px,5cqw,17px)]"
            style={{ left: `${r2((x / SIZE) * 100)}%`, top: `${r2((y / SIZE) * 100)}%` }}
            aria-hidden
          >
            <s.Icon size={s.hero ? 20 : 17} />
            <span
              className="tabular mt-0.5 font-semibold"
              style={{ fontSize: s.hero ? "clamp(13px, 5cqw, 17px)" : "clamp(11px, 4.1cqw, 14px)" }}
            >
              {money(s.amount)}
            </span>
          </div>
        );
      })}

      {/* Pearl center */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center shadow-[inset_0_2px_10px_rgba(255,255,255,0.7),0_10px_30px_-10px_rgba(30,18,8,0.45)]"
        style={{
          width: `${r2(((r * 2 + 2) / SIZE) * 100)}%`,
          height: `${r2(((r * 2 + 2) / SIZE) * 100)}%`,
          background: "radial-gradient(circle at 32% 28%, #fffaf4 0%, #f6e3e2 42%, #e7d9e6 68%, #d9e4d0 100%)",
        }}
        aria-hidden
      >
        <span className="tabular font-bold leading-none tracking-[-0.01em] text-[#1d1a17]" style={{ fontSize: "clamp(18px, 7.6cqw, 26px)" }}>
          {money(total)}
        </span>
        <span className="mt-1 font-medium text-[#1d1a17]/80" style={{ fontSize: "clamp(11px, 4.1cqw, 14px)" }}>
          came in
        </span>
        <span className="text-[#1d1a17]/55" style={{ fontSize: "clamp(10px, 3.5cqw, 12px)" }}>
          in {MONTH.name}
        </span>
      </div>
    </figure>
  );
}
