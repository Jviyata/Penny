"use client";

/**
 * Penny's voice. Her replies are spoken with ElevenLabs (through /api/speak, which keeps the key
 * on the server). If that isn't available, the phone's built-in voice reads them instead.
 *
 * iPhone only plays sound after a tap, so `unlockVoice()` runs on the first tap in Talk to Penny:
 * it primes one audio player that every later reply reuses. Muting is remembered on this device.
 */

const MUTE_KEY = "ciat:penny-muted";
const PREFERRED = ["Samantha", "Ava", "Allison", "Susan", "Zoe", "Karen", "Google US English", "Microsoft Aria", "Microsoft Jenny"];

let player: HTMLAudioElement | null = null;
let unlocked = false;
let pending: AbortController | null = null;
const cache = new Map<string, string>(); // text → audio URL, so a repeated line doesn't cost twice

export function voiceAvailable(): boolean {
  return typeof window !== "undefined" && (typeof Audio !== "undefined" || "speechSynthesis" in window);
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {}
  if (muted) stopSpeaking();
}

/** A tiny silent WAV, played once from a tap to unlock audio on iPhone. */
function silentWav(): string {
  const rate = 8000;
  const samples = 400;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples, true);
  str(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, "data");
  v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128);
  let bin = "";
  new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

/** Call from a tap: lets later replies play on iPhone. */
export function unlockVoice() {
  if (unlocked || typeof window === "undefined") return;
  unlocked = true;
  player = new Audio();
  player.src = silentWav();
  player.play().catch(() => {});
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }
}

export function stopSpeaking() {
  pending?.abort();
  pending = null;
  if (player) player.pause();
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/**
 * Say something as Penny. Replaces anything she was still saying.
 * Resolves once she starts making sound (or right away if she can't), so the text can follow her voice.
 */
export async function speak(text: string): Promise<void> {
  const line = text.replace(/~/g, "about ").trim();
  if (!line || isMuted() || typeof window === "undefined") return;
  stopSpeaking();
  const ctrl = new AbortController();
  pending = ctrl;

  try {
    let url = cache.get(line);
    if (!url) {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: line }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`speak ${res.status}`);
      url = URL.createObjectURL(await res.blob());
      cache.set(line, url);
    }
    if (ctrl.signal.aborted) return;
    player ??= new Audio();
    player.src = url;
    await player.play();
  } catch (err) {
    if (ctrl.signal.aborted) return;
    console.info("[penny-voice] using the built-in voice:", err instanceof Error ? err.message : err);
    await speakBuiltIn(line);
  } finally {
    if (pending === ctrl) pending = null;
  }
}

/** The phone's own voice, used when ElevenLabs isn't available. */
function speakBuiltIn(text: string): Promise<void> {
  if (!("speechSynthesis" in window)) return Promise.resolve();
  const s = window.speechSynthesis;
  const voices = s.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  let voice: SpeechSynthesisVoice | undefined;
  for (const name of PREFERRED) {
    voice = voices.find((x) => x.name.includes(name) && /enhanced|premium/i.test(x.name)) ?? voices.find((x) => x.name.includes(name));
    if (voice) break;
  }
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-US";
  u.rate = 1.03;
  u.pitch = 1.08;
  return new Promise((resolve) => {
    u.onstart = () => resolve();
    u.onerror = () => resolve();
    setTimeout(resolve, 1500); // some browsers never fire onstart
    s.cancel();
    s.speak(u);
  });
}
