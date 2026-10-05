"use client";

import { useState } from "react";
import { DEMO_FILES } from "@/lib/demoData";
import { money } from "@/lib/format";
import { prepareImageFromUrl } from "@/lib/image";
import { useStore } from "@/lib/store";
import { useSend } from "@/lib/useSend";
import { ImagesIcon, ResetIcon } from "../ui/Icons";
import { Mascot } from "../ui/Mascot";
import { Sheet, SheetButton } from "../ui/Sheet";
import type { Tab } from "../TabBar";

/**
 * Demo mode only: a floating "Demo files" button (top right, below the Dynamic Island)
 * and a tray of sample product screenshots. Not rendered at all when Demo mode is off.
 */
export function DemoFiles({ goTo }: { goTo: (t: Tab) => void }) {
  const { state, dispatch } = useStore();
  const send = useSend();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  if (!state.hydrated || !state.demoMode) return null;

  // Goes through the same resize pipeline as a real upload, then into the chat.
  const pick = async (file: (typeof DEMO_FILES)[number]) => {
    if (state.thinking || loading) return;
    setLoading(file.id);
    try {
      const image = await prepareImageFromUrl(file.src);
      setOpen(false);
      goTo("chat");
      send({ text: "", image, hint: { name: file.name, price: file.price } });
    } finally {
      setLoading(null);
    }
  };

  const reset = () => {
    dispatch({ type: "resetDemo" });
    setOpen(false);
    goTo("home");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pressable glass-strong absolute right-3 top-[calc(var(--sat)+52px)] z-40 flex h-11 items-center gap-1.5 rounded-full pl-3.5 pr-4 text-[14px] font-semibold text-on-photo shadow-[0_8px_20px_-8px_rgba(20,12,4,0.5)] [html[data-keyboard=open]_&]:hidden [html[data-menu=open]_&]:pointer-events-none [html[data-menu=open]_&]:opacity-0"
      >
        <ImagesIcon />
        Demo files
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Demo files"
        trailing={<SheetButton strong onClick={() => setOpen(false)}>Done</SheetButton>}
      >
        <div className="px-4 pb-3 pt-1">
          <p className="px-1 pb-3 text-[14px] leading-[19px] text-label-2">
            Tap a screenshot to send it into the chat, as if you’d uploaded it.
          </p>
          <ul className="grid grid-cols-3 gap-2.5">
            {DEMO_FILES.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => pick(f)}
                  disabled={!!loading || state.thinking}
                  className="pressable block w-full text-left disabled:opacity-60"
                >
                  <div className="relative aspect-[9/16] overflow-hidden rounded-[16px] bg-fill shadow-[0_0_0_1px_var(--sep)]">
                    <img src={f.src} alt={`${f.name} screenshot`} className="h-full w-full object-cover" draggable={false} />
                    {loading === f.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-[13px] font-semibold text-white">
                        Opening…
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-[14px] font-semibold">{f.name}</p>
                  <p className="tabular text-[13px] text-label-2">{money(f.price)}</p>
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={reset}
            className="pressable mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-fill text-[16px] font-semibold text-label"
          >
            <ResetIcon />
            Reset demo
          </button>
          <div className="mt-2 flex items-center gap-2 px-1">
            <Mascot mood="calm_neutral" size={36} />
            <p className="text-[13px] leading-[17px] text-label-2">
              Puts back $1,060, the four plans and the goals, and clears the chat and your wishlist.
            </p>
          </div>
        </div>
      </Sheet>
    </>
  );
}
