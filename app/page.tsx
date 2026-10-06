import { AppShell } from "@/components/AppShell";
import { DeviceFrame } from "@/components/DeviceFrame";
import { StoreProvider } from "@/lib/store";

export default function Page() {
  return (
    <StoreProvider>
      <DeviceFrame>
        <AppShell />
      </DeviceFrame>
    </StoreProvider>
  );
}
