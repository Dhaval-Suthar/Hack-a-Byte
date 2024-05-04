import { Suspense, useState } from "react";
import Leaderboard, { LeaderboardSkeleton } from "../ui/hackbook-L/leaderboard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900">
      {children}
      <Suspense fallback={<LeaderboardSkeleton />}>
        <Leaderboard />
      </Suspense>
    </div>
  );
}
