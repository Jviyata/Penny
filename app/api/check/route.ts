import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import path from "node:path";
import { APP_RULES, RESPONSE_SCHEMA, describeState, toCheckResult } from "@/lib/ai";
import { rateLimit, visitorKey } from "@/lib/rateLimit";
import { askPennyAgent } from "@/lib/pennyAgent";
import type { CheckRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const AGENT_TIMEOUT_MS = 30_000;

const MODEL = "claude-sonnet-5-5";
const MAX_IMAGE_CHARS = 4_000_000; // ~3 MB of JPEG; the client sends ~150-400 KB
const HISTORY_TURNS = 12;

// Read once per server instance. next.config.ts ships /prompts with this function on Vercel.
let systemPrompt: string | null = null;
function loadSystemPrompt(): string {
  systemPrompt ??= readFileSync(path.join(process.cwd(), "prompts", "system.txt"), "utf8").trim();
  return systemPrompt;
}

let client: Anthropic | null = null;

/**
 * POST /api/check: one turn of "Can I afford this?".
 * Any non-200 tells the client to answer with its local fallback instead of showing an error.
 */
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "not_configured" }, 503);

  const limit = rateLimit(visitorKey(req));
  if (!limit.ok) return json({ error: "rate_limited", retryAfterSec: limit.retryAfterSec }, 429);

  let body: CheckRequest;
  try {
    body = await req.json();
    if (typeof body?.message?.text !== "string" || !body.state || !Array.isArray(body.history)) throw new Error();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const image = parseImage(body.message.image);
  if (body.message.image && !image) return json({ error: "bad_image" }, 400);

  // Keys that aren't scoped to a workspace must name one (the workspace Penny's agent lives in).
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID;
  client ??= new Anthropic({
    timeout: 25_000,
    maxRetries: 1,
    defaultHeaders: workspace ? { "anthropic-workspace-id": workspace } : undefined,
  });

  // 1. Penny's Managed Agent (her own training lives on the agent).
  if (process.env.PENNY_AGENT !== "off") {
    try {
      const text = await askPennyAgent(client, agentPrompt(body), image, AGENT_TIMEOUT_MS);
      const result = toCheckResult(extractJson(text));
      if (result) return json({ result, via: "agent" }, 200);
      console.error("[check] agent reply wasn't usable JSON", text.slice(0, 200));
    } catch (err) {
      console.error("[check] agent failed, using direct call", err instanceof Error ? err.message : err);
    }
  }

  // 2. Direct Messages API call with the same rules (also the fallback when the agent fails).
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      // Short chat replies: low effort keeps it quick (thinking stays adaptive).
      output_config: { effort: "low", format: { type: "json_schema", schema: RESPONSE_SCHEMA } },
      // If a safety classifier declines, retry server-side on Anthropic's recommended fallback.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: loadSystemPrompt() },
        { type: "text", text: APP_RULES, cache_control: { type: "ephemeral" } },
      ],
      messages: buildMessages(body, image),
    });

    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      console.error("[check] unusable stop_reason", response.stop_reason, response.stop_details);
      return json({ error: "no_answer" }, 502);
    }

    const text = response.content.find((b) => b.type === "text");
    const result = text?.type === "text" ? toCheckResult(safeParse(text.text)) : null;
    if (!result) {
      console.error("[check] unusable output", text?.type === "text" ? text.text.slice(0, 200) : "(no text)");
      return json({ error: "bad_output" }, 502);
    }

    return json({ result }, 200);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) console.error("[check] Anthropic rate limit");
    else if (err instanceof Anthropic.AuthenticationError) console.error("[check] bad ANTHROPIC_API_KEY");
    else if (err instanceof Anthropic.APIError) console.error("[check] API error", err.status, err.message);
    else console.error("[check] failed", err);
    return json({ error: "upstream" }, 502);
  }
}

function buildMessages(body: CheckRequest, image: ReturnType<typeof parseImage>): Anthropic.Beta.BetaMessageParam[] {
  // Earlier turns as plain text; only the newest message carries its photo.
  const history = body.history
    .slice(-HISTORY_TURNS)
    .filter((h) => (h.role === "user" || h.role === "assistant") && typeof h.text === "string" && h.text.trim())
    .map((h) => ({ role: h.role, content: h.text.slice(0, 1500) }));
  while (history.length && history[0].role !== "user") history.shift();

  const text = body.message.text.trim().slice(0, 2000) || (image ? "(sent a photo)" : "(empty message)");
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (image) content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
  content.push({ type: "text", text: `${describeState(body)}\n\n${text}` });

  return [...history, { role: "user", content }];
}

function parseImage(dataUrl: string | undefined) {
  if (!dataUrl) return null;
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m || m[2].length > MAX_IMAGE_CHARS) return null;
  return { mediaType: m[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: m[2] };
}

/** One self-contained message for the agent: app rules, the JSON shape, live numbers, history, the question. */
function agentPrompt(body: CheckRequest): string {
  const history = body.history
    .slice(-HISTORY_TURNS)
    .filter((h) => typeof h.text === "string" && h.text.trim())
    .map((h) => `${h.role === "user" ? "User" : "Penny"}: ${h.text.slice(0, 600)}`)
    .join("\n");
  const text = body.message.text.trim().slice(0, 2000) || "(sent a photo)";
  return [
    APP_RULES,
    `Reply with ONE JSON object only (no prose, no code fences) matching this JSON schema:\n${JSON.stringify(RESPONSE_SCHEMA)}`,
    describeState(body),
    history ? `<conversation_so_far>\n${history}\n</conversation_so_far>` : "",
    `User: ${text}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Pull the JSON object out of a reply, tolerating code fences or a stray sentence around it. */
function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? safeParse(text.slice(start, end + 1)) : {};
}

function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function json(data: unknown, status: number) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
