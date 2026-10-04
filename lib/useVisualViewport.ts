"use client";

import { useEffect } from "react";

/**
 * iOS Safari doesn't shrink 100dvh when the keyboard opens; only the visual viewport changes.
 * Pin the app to the visual viewport instead, so anything at the bottom of the screen
 * (composer, sheets) always sits right above the keyboard.
 *
 * Sets on <html>:  --app-h, --app-top  and  data-keyboard="open" | "closed"
 *
 * "Keyboard open" means the visible height dropped well below the tallest height seen at this width
 * (window.innerHeight can shrink with the keyboard on some iOS versions, so it isn't the baseline).
 * Focus changes trigger a re-check, since they land before the resize settles.
 */
export function useVisualViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    let tallest = 0;
    let tallestWidth = 0;
    let frame = 0;

    const typing = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!touch || !el) return false;
      if (el.tagName === "TEXTAREA") return true;
      if (el.tagName === "INPUT") return !/^(checkbox|radio|button|submit|file|range|color)$/i.test((el as HTMLInputElement).type);
      return el.isContentEditable;
    };

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (vv.width !== tallestWidth) {
          tallestWidth = vv.width; // rotation: start over
          tallest = 0;
        }
        tallest = Math.max(tallest, vv.height, typing() ? 0 : window.innerHeight);
        // Height is the reliable signal: with a hardware keyboard a field can be focused with no keyboard on screen.
        const keyboard = tallest - vv.height > 150;
        root.style.setProperty("--app-h", `${vv.height}px`);
        root.style.setProperty("--app-top", `${vv.offsetTop}px`);
        root.dataset.keyboard = keyboard ? "open" : "closed";
        // iOS sometimes scrolls the (locked) page when focusing an input; undo it.
        if (window.scrollY !== 0) window.scrollTo(0, 0);
      });
    };

    // Focus changes land before the resize; a second pass catches the settled size.
    const onFocus = () => {
      update();
      setTimeout(update, 350);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onFocus);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocus);
    };
  }, []);
}
