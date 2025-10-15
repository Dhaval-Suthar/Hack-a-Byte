"use client";

import React, { useEffect, useState } from "react";
import { getLeaderboard } from "@/app/actions/games";
import type { Difficulty, LeaderboardEntryLite } from "@/lib/games/types";

export function Leaderboard({ game, difficulty }: { game: string; difficulty?: Difficulty }) {
  const [entries, setEntries] = useState<LeaderboardEntryLite[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getLeaderboard(game, { difficulty });
      if (!mounted) return;
      if (res.success) setEntries(res.entries);
      else setError(res.error || "Failed to load leaderboard");
    })();
    return () => {
      mounted = false;
    };
  }, [game, difficulty]);

  if (error) return <div className="text-red-600">{error}</div>;
  if (entries.length === 0) return <div>No scores yet.</div>;

  return (
    <div className="space-y-2">
      {entries.map((e, i) => (
        <div key={e._id} className="flex items-center justify-between border p-2 rounded">
          <div className="flex items-center gap-3">
            <span className="w-6 text-right font-mono">{i + 1}.</span>
            <span className="font-semibold">{e.username}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>Score: {e.score}</span>
            <span>Diff: {e.difficulty}</span>
            <span>Time: {e.timeRemaining}s</span>
          </div>
        </div>
      ))}
    </div>
  );
}
