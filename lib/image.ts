"use client";

const FULL_MAX = 1200; // what the AI sees; keeps requests far under Vercel's 4.5 MB limit
const THUMB_MAX = 480; // what chat bubbles, cards and the Shelf show (and sessionStorage holds)

export type PreparedImage = { full: string; thumb: string };

/**
 * Photo or screenshot → JPEG data URLs, resized on the phone before upload.
 * Safari decodes HEIC itself; other browsers fall back to heic2any (loaded only when needed).
 */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
  const bitmap = await decode(file);
  try {
    return {
      full: toJpeg(bitmap, FULL_MAX, 0.85),
      thumb: toJpeg(bitmap, THUMB_MAX, 0.8),
    };
  } finally {
    if ("close" in bitmap) bitmap.close();
  }
}

/** Load an image from a URL (demo files) through the same pipeline as an upload. */
export async function prepareImageFromUrl(url: string): Promise<PreparedImage> {
  const res = await fetch(url);
  return prepareImage(await res.blob());
}

type Drawable = ImageBitmap | HTMLImageElement;

async function decode(file: Blob): Promise<Drawable> {
  try {
    return await decodeBlob(file);
  } catch (err) {
    if (!looksLikeHeic(file)) throw err;
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    return decodeBlob(Array.isArray(converted) ? converted[0] : converted);
  }
}

async function decodeBlob(blob: Blob): Promise<Drawable> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // fall through to <img>, which some older Safari versions handle better
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function looksLikeHeic(file: Blob) {
  const name = file instanceof File ? file.name.toLowerCase() : "";
  return /hei[cf]/.test(file.type) || name.endsWith(".heic") || name.endsWith(".heif");
}

function toJpeg(src: Drawable, max: number, quality: number): string {
  const w = "naturalWidth" in src ? src.naturalWidth : src.width;
  const h = "naturalHeight" in src ? src.naturalHeight : src.height;
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d")!;
  // JPEG has no transparency: paint white behind PNG screenshots.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}
