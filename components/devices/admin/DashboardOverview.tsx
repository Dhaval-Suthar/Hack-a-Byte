"use client";
import React from "react";
import { AccessCode, Playspace, Device, EventItem, GameSession, Team } from "./shared-types";

interface DashboardOverviewProps {
  codes: AccessCode[];
  plays: Playspace[];
  devs: Device[];
  evts: EventItem[];
  sess: GameSession[];
  teams?: Team[];
}

export default function DashboardOverview({ codes, plays, devs, evts, sess, teams = [] }: DashboardOverviewProps) {
  const stats = [
    ["Codes", codes.length],
    ["Playspaces", plays.length],
    ["Devices", devs.length],
    ["Events", evts.length],
    ["Sessions", sess.length],
    ["Teams", teams.length],
  ] as const;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
      {stats.map(([label, value]) => (
        <div key={label} className="p-3 rounded bg-neutral-900 border border-neutral-700">
          <div className="text-xs text-neutral-500 uppercase">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      ))}
    </div>
  );
}
