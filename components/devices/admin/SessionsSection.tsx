"use client";
import React from "react";
import SimpleList from "./SimpleList";
import { GameSession } from "./shared-types";

interface SessionsSectionProps {
  sess: GameSession[];
  q: string;
  setQ: (query: string) => void;
  onAdjust: (id: string, delta: number) => Promise<void>;
  onEnd: (id: string) => Promise<void>;
}

export default function SessionsSection({ sess, q, setQ, onAdjust, onEnd }: SessionsSectionProps) {
  const filtered = sess.filter((s) => 
    s.team1Name.toLowerCase().includes(q.toLowerCase()) || 
    s.team2Name.toLowerCase().includes(q.toLowerCase()) ||
    (s.deviceId && s.deviceId.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search"
        className="px-2 py-1 bg-neutral-800 rounded text-xs w-full"
      />
      <SimpleList
        items={filtered}
        label={(s) => (
          <div className="w-full flex items-center gap-2">
            <span className="font-semibold">{s.team1Name} vs {s.team2Name}</span>
            <span className="px-2 py-0.5 rounded bg-neutral-800">{s.team1Score} - {s.team2Score}</span>
            <span className="px-2 py-0.5 rounded bg-neutral-800">
              {s.status}
            </span>
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-xs">
              {Math.floor(s.duration / 60)}m {s.duration % 60}s
            </span>
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => onAdjust(s._id, 10)}
                className="px-2 py-0.5 bg-neutral-700 rounded"
              >
                +10
              </button>
              <button
                onClick={() => onAdjust(s._id, -10)}
                className="px-2 py-0.5 bg-neutral-700 rounded"
              >
                -10
              </button>
              <button
                disabled={s.status !== 'active'}
                onClick={() => onEnd(s._id)}
                className="px-2 py-0.5 bg-red-600/80 rounded disabled:opacity-40"
              >
                End
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
