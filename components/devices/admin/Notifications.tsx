"use client";
import React from "react";
import { Note } from "./shared-types";

interface NotificationsProps {
  notes: Note[];
}

export default function Notifications({ notes }: NotificationsProps) {
  return (
    <div className="fixed bottom-3 right-3 w-60 space-y-2">
      {notes.map((n) => (
        <div
          key={n.id}
          className={`p-2 text-xs rounded border shadow ${
            n.kind === "ok"
              ? "bg-green-600/20 border-green-500 text-green-200"
              : n.kind === "err"
              ? "bg-red-600/20 border-red-500 text-red-200"
              : "bg-neutral-700 border-neutral-500 text-neutral-100"
          }`}
        >
          {n.msg}
        </div>
      ))}
    </div>
  );
}
