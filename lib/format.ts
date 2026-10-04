const whole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

/** $1,060 — shows cents only when there are some ($59.99). */
export function money(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? whole.format(rounded) : cents.format(rounded);
}

/** Parse what someone typed into an amount field ("1,060", "$59.99"). */
export function parseAmount(input: string): number | null {
  const n = Number(input.replace(/[^0-9.]/g, ""));
  if (!input.trim() || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
