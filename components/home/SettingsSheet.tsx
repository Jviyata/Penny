"use client";

import { useStore } from "@/lib/store";
import { Sheet, SheetButton } from "../ui/Sheet";
import { Switch } from "../ui/Switch";

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();

  return (
    <Sheet open={open} onClose={onClose} title="Settings" trailing={<SheetButton strong onClick={onClose}>Done</SheetButton>}>
      <div className="space-y-2 px-4 pb-4 pt-2">
        <div className="rounded-[14px] bg-fill px-4">
          <div className="flex min-h-12 items-center gap-3">
            <span className="flex-1 text-[17px]">Demo mode</span>
            <Switch
              label="Demo mode"
              checked={state.demoMode}
              onChange={(on) => dispatch({ type: "setDemoMode", on })}
            />
          </div>
        </div>
        <p className="px-4 text-[13px] leading-[18px] text-label-2">
          Adds a Demo files button with sample product screenshots and a reset. Turn it off for a clean product view.
          You can also open the app with <span className="whitespace-nowrap font-mono">?demo=1</span>.
        </p>
        <button
          type="button"
          onClick={() => {
            // Onboarding shows on a fresh load once this is cleared.
            try {
              localStorage.removeItem("ciat:onboarded");
            } catch {}
            window.location.reload();
          }}
          className="pressable mt-2 flex min-h-12 w-full items-center rounded-[14px] bg-fill px-4 text-left text-[17px]"
        >
          Replay onboarding
        </button>
      </div>
    </Sheet>
  );
}
