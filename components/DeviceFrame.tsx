"use client";

import { useEffect, type ReactNode } from "react";

/**
 * On a phone this is just a full-screen container that follows the visual viewport.
 * On desktop, CSS (globals.css) turns it into an iPhone frame with a Dynamic Island,
 * and this component scales the frame down to fit shorter laptop screens.
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  useEffect(() => {
    const fit = () => {
      const scale = Math.min(1, (window.innerHeight - 40) / 876, (window.innerWidth - 40) / 417);
      document.documentElement.style.setProperty("--frame-scale", String(Math.max(0.5, scale)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="device-stage">
      <div className="device">
        <div className="device-screen">
          <div className="device-status" aria-hidden>
            <span>9:41</span>
            <StatusIcons />
          </div>
          <div className="device-island" aria-hidden />
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusIcons() {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
        <rect x="0" y="8" width="3" height="4" rx="1" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
        <rect x="10" y="3" width="3" height="9" rx="1" />
        <rect x="15" y="0" width="3" height="12" rx="1" />
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
        <path d="M8 2.5c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .7 10.4 10.4 0 0 0 .8 3.6L2 4.9a8.6 8.6 0 0 1 6-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4.3a6.7 6.7 0 0 0-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3zM8 9.7l1.9-2a2.9 2.9 0 0 0-3.8 0z" />
      </svg>
      <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
        <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke="currentColor" opacity="0.4" />
        <rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor" />
        <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity="0.45" />
      </svg>
    </span>
  );
}
