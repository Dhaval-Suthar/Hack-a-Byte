"use client";

import { DevToolsProvider } from "@/components/devices/hackbook-w95/hooks/useDevToolsContext";
import Desktop from "@/components/devices/hackbook-w95/desktop";

export default function DesktopWithDevTools() {
  return (
    <DevToolsProvider>
      <Desktop />
    </DevToolsProvider>
  );
}
