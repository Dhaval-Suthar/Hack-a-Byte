"use client";

import React from "react";
import dynamic from "next/dynamic";
import { getGameById } from "@/lib/games/registry";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveGameComponent(id: string): React.ComponentType<any> | null {
  switch (id) {
    case "minesweeper":
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return dynamic(() => import("@/components/devices/hackbook-w95/apps/Minesweeper") as any, { ssr: false });
    case "number-jump":
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return dynamic(() => import("@/components/devices/hackbook-w95/apps/NumberJumpingGame") as any, { ssr: false });
    case "untangle-net":
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return dynamic(() => import("@/components/devices/hackbook-w95/apps/UntangleNeuralNetwork") as any, { ssr: false });
    case "quick-event":
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return dynamic(() => import("@/components/devices/hackbook-w95/apps/QuickEventPresser") as any, { ssr: false });
    default:
      return null;
  }
}

export default function GameLoader({ gameId }: { gameId: string }) {
  const def = getGameById(gameId);
  if (!def) {
    return <div>Game not found.</div>;
  }

  const Comp = resolveGameComponent(def.id);
  if (!Comp) return <div>Game not available.</div>;
  return <Comp />;
}
