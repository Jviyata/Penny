import { rateLimit, visitorKey } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

// Sarah: a warm, friendly ElevenLabs premade voice. ELEVENLABS_VOICE_ID picks another.
const DEFAULT_VOICE = "EXAVITQu4vr4xnSDxMaL";
// Flash is ElevenLabs' fastest model, so Penny starts talking quickly.
const DEFAULT_MODEL = "eleven_flash_v2_5";
const MAX_CHARS = 400;

/**
 * POST /api/speak { text } → Penny's line as MP3, from ElevenLabs.
 * The key stays on the server (ELEVENLABS_API_KEY). 503 when it isn't set, so the app can fall back.
 */
export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return Response.json({ error: "not_configured" }, { status: 503 });

  const limit = rateLimit(`speak:${visitorKey(req)}`, 60);
  if (!limit.ok) return Response.json({ error: "rate_limited", retryAfterSec: limit.retryAfterSec }, { status: 429 });

  let text = "";
  try {
    const body = (await req.json()) as { text?: unknown };
    text = typeof body.text === "string" ? body.text.trim() : "";
  } catch {
    // fall through to the empty-text check
  }
  if (!text) return Response.json({ error: "no_text" }, { status: 400 });
  text = text.slice(0, MAX_CHARS);

  const voice = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
      }),
    },
  ).catch((err: unknown) => {
    console.error("[speak] couldn't reach ElevenLabs", err instanceof Error ? err.message : err);
    return null;
  });

  if (!res || !res.ok) {
    const detail = res ? await res.text().catch(() => "") : "";
    console.error("[speak] ElevenLabs error", res?.status, detail.slice(0, 300));
    return Response.json({ error: "tts_failed", status: res?.status ?? 0 }, { status: 502 });
  }

  return new Response(res.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" },
  });
}
