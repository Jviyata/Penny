import "server-only";

const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

/**
 * 20 messages per visitor per hour (or `limit`). Best-effort: it lives in this server instance's memory,
 * so on Vercel each instance counts separately and a cold start resets it. No database needed.
 */
export function rateLimit(key: string, limit = LIMIT): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfterSec: Math.ceil((recent[0] + WINDOW_MS - now) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep memory bounded on long-lived instances.
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return { ok: true, retryAfterSec: 0 };
}

export function visitorKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
