import { existsSync } from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/AppShell";
import { DeviceFrame } from "@/components/DeviceFrame";
import { StoreProvider } from "@/lib/store";

// Screens, plus one optional photo per category page (falls back to the Home photo).
const SCENES = ["home", "free", "chat", "shelf", "goals", "rent", "bills", "loans", "groceries", "transit", "savings"] as const;

/** Scene photos that exist in /public/bg, as CSS variables. Missing ones fall back to the warm gradient. */
function scenePhotos(): CSSProperties {
  const vars: Record<string, string> = {};
  for (const name of SCENES) {
    for (const ext of ["jpg", "jpeg", "webp", "png"]) {
      if (existsSync(path.join(process.cwd(), "public", "bg", `${name}.${ext}`))) {
        vars[`--scene-${name}`] = `url("/bg/${name}.${ext}")`;
        break;
      }
    }
  }
  return vars as CSSProperties;
}

export default function Page() {
  return (
    <div className="contents" style={scenePhotos()}>
      <StoreProvider>
        <DeviceFrame>
          <AppShell />
        </DeviceFrame>
      </StoreProvider>
    </div>
  );
}
