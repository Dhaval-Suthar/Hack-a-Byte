"use client";

import React from "react";
import dynamic from "next/dynamic";
import { getGameById } from "@/lib/games/registry";

export default function GameLoader({ gameId }: { gameId: string }) {
  const def = getGameById(gameId);
  if (!def || !def.componentPath) {
    return <div>Game not found.</div>;
  }

  const Comp = dynamic(() => import(/* @vite-ignore */ def.componentPath!), {
    ssr: false,
    loading: () => <div>Loading game...</div>,
  }) as React.ComponentType<Record<string, unknown>>;

  return <Comp />;
}
