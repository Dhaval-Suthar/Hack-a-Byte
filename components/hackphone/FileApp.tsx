"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * HackPhone Files — an iOS 4–style file system app mock built for Next.js + React + TypeScript
 *
 * Drop this component anywhere in your Next.js app (app/ or pages/) and render <HackPhoneFiles />.
 * Tailwind CSS recommended for styling (classes included below). The UI intentionally uses
 * skeuomorphic gradients and gloss to evoke iOS 3/4.
 *
 * Props:
 *  - onClose?: (info: CloseInfo) => void
 *  - timeoutMs?: number — optional auto-close after inactivity
 *  - time?: string — optional external clock string (e.g., from parent)
 *
 * CloseInfo fields:
 *  - openedAt: number (epoch ms)
 *  - closedAt: number (epoch ms)
 *  - durationMs: number
 *  - reason: "closeButton" | "swipeDown" | "autoTimeout"
 */

// ---------- Types ----------
type ItemType = "folder" | "file";

export type FSItem = {
  id: string;
  name: string;
  type: ItemType;
  children?: FSItem[]; // folders can have children
  sizeBytes?: number; // files only
  modifiedAt?: string; // ISO date
};

export type CloseInfo = {
  openedAt: number;
  closedAt: number;
  durationMs: number;
  reason: "closeButton" | "swipeDown" | "autoTimeout";
};

export interface HackPhoneFilesProps {
  onClose?: (info: CloseInfo) => void;
  timeoutMs?: number;
  root?: FSItem[];
  time?: string;
}

// ---------- Demo Data ----------
const demoData: FSItem[] = [
  {
    id: "docs",
    name: "Documents",
    type: "folder",
    children: [
      {
        id: "resume.pdf",
        name: "Resume.pdf",
        type: "file",
        sizeBytes: 128_554,
        modifiedAt: "2025-07-10T13:23:00Z",
      },
      {
        id: "ideas.txt",
        name: "App Ideas.txt",
        type: "file",
        sizeBytes: 3_214,
        modifiedAt: "2025-08-02T08:04:00Z",
      },
    ],
  },
  {
    id: "photos",
    name: "Photos",
    type: "folder",
    children: [
      { id: "july", name: "July", type: "folder", children: [] },
      { id: "august", name: "August", type: "folder", children: [] },
    ],
  },
  {
    id: "readme.md",
    name: "README.md",
    type: "file",
    sizeBytes: 1_024,
    modifiedAt: "2025-08-12T09:10:00Z",
  },
];

// ---------- Helpers ----------
const bytes = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n) + " B"
    : "—";

function useInactivityTimer(enabled: boolean, ms: number | undefined, onTimeout: () => void) {
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !ms) return;

    const reset = () => {
      if (ref.current) window.clearTimeout(ref.current);
      ref.current = window.setTimeout(onTimeout, ms);
    };

    reset();

    const events = ["mousemove", "keydown", "touchstart"]; // basic signal of activity
    events.forEach((e) => window.addEventListener(e, reset));

    return () => {
      if (ref.current) window.clearTimeout(ref.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [enabled, ms, onTimeout]);
}

// ---------- Main Component ----------
function HackPhoneFiles({
  onClose,
  timeoutMs = undefined,
  root = demoData,
  time,
}: HackPhoneFilesProps) {
  const [launched, setLaunched] = useState(false);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [stack, setStack] = useState<FSItem[][]>([root]);
  const cwd = stack[stack.length - 1];

  const breadcrumb = useMemo(() => {
    const names = ["Files", ...stack.slice(1).map((arr) => findFolderName(root, arr) ?? "").filter(Boolean)];
    return names.join(" ▸ ");
  }, [stack, root]);

  const closeWith = (reason: CloseInfo["reason"]) => {
    const now = Date.now();
    const open = openedAt ?? now;
    onClose?.({ openedAt: open, closedAt: now, durationMs: now - open, reason });
    setLaunched(false);
    setOpenedAt(null);
    setStack([root]);
  };

  useInactivityTimer(Boolean(launched), timeoutMs, () => closeWith("autoTimeout"));

  const startY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 120) {
      startY.current = null;
      closeWith("swipeDown");
    }
  };

  return (
    <div className="w-full min-h-[600px] h-full bg-[#0b0c0f] text-white flex items-center justify-center p-6">
      <div className="relative w-[360px] h-[720px] rounded-[42px] shadow-2xl overflow-hidden"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -20%, #222 0%, #111 55%, #0b0c0f 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <StatusBar time={time} />

        <div className="absolute inset-0 pt-16 pb-8 px-6">
          <div className="grid grid-cols-4 gap-5 place-items-center">
            <AppIcon
              label="Files"
              onClick={() => {
                setLaunched(true);
                setOpenedAt(Date.now());
              }}
            />
          </div>
        </div>

        <AnimatePresence>
          {launched && (
            <motion.div
              key="files-app"
              initial={{ y: 720, scale: 0.96, opacity: 0.8 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 720, scale: 0.98, opacity: 0.8 }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className="absolute inset-0 bg-gradient-to-b from-[#f2f2f2] to-[#e5e5e5] text-black"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
            >
              <AppHeader title={breadcrumb} onClose={() => closeWith("closeButton")} />

              <div className="px-3 pb-6">
                <div className="flex items-center justify-between py-2">
                  <div className="text-[13px] text-black/70">{cwd.length} items</div>
                  <div className="flex items-center gap-2 text-black/70">
                    <span className="text-[13px]">{openedAt ? prettyDuration(Date.now() - openedAt) : "—"}</span>
                    <button
                      className="px-2 py-1 rounded-lg bg-white/60 hover:bg-white/80 text-[12px] border border-black/10"
                      onClick={() => setStack([root])}
                    >
                      Home
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-inner"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75))",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <ul className="divide-y divide-black/6">
                    {cwd.map((item) => (
                      <li key={item.id}>
                        <button
                          className="w-full flex items-center gap-3 px-3 py-3 active:bg-black/5"
                          onClick={() => {
                            if (item.type === "folder") {
                              const next = item.children ?? [];
                              setStack((s) => [...s, next]);
                            }
                          }}
                        >
                          <div className="shrink-0">
                            {item.type === "folder" ? (
                              <div className="w-6 h-6 bg-yellow-400 rounded-sm" />
                            ) : (
                              <div className="w-6 h-6 bg-blue-500 rounded-sm" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-[15px] font-medium text-black/90">{item.name}</div>
                            <div className="text-[12px] text-black/55">
                              {item.type === "folder"
                                ? `${item.children?.length ?? 0} items`
                                : `${bytes(item.sizeBytes)} • ${item.modifiedAt ? new Date(item.modifiedAt).toLocaleDateString() : "—"}`}
                            </div>
                          </div>
                          {item.type === "folder" ? (
                            <span className="text-black/35">▶</span>
                          ) : (
                            <span className="text-black/35">⋯</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-10"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.0))",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- Subcomponents ----------
function StatusBar({ time }: { time?: string }) {
  return (
    <div
      className="h-10 flex items-center justify-between px-4 text-[12px] text-white"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.06))",
      }}
    >
      <div className="font-semibold tracking-wide">HackPhone</div>
      <div className="opacity-90">
        {time ?? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

function AppIcon({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-2xl relative shadow-xl"
        style={{
          background:
            "linear-gradient(180deg, #57a3ff, #3b78ff)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 18px rgba(0,0,0,0.35)",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-1/2 rounded-2xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.15))",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-white/90" />
        </div>
      </div>
      <div className="text-[12px] text-white/90 drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]">
        {label}
      </div>
    </button>
  );
}

function AppHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="px-3 pt-2">
      <div
        className="h-10 rounded-xl flex items-center justify-between px-2"
        style={{
          background:
            "linear-gradient(180deg, #fefefe, #e9e9e9)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] bg-white/70 hover:bg-white/90 border border-black/10"
          >
            ✕ Close
          </button>
          <div className="text-[13px] text-black/60">iOS 4 style</div>
        </div>
        <div className="text-[14px] font-semibold text-black/80 truncate max-w-[60%] text-center">
          {title}
        </div>
        <div className="w-[80px]" />
      </div>
    </div>
  );
}

// ---------- Utilities ----------
function prettyDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const remS = s % 60;
  if (m > 0) return `${m}m ${remS}s`;
  return `${remS}s`;
}

function findFolderName(root: FSItem[], current: FSItem[]): string | undefined {
  const walk = (arr: FSItem[]): FSItem | undefined => {
    for (const item of arr) {
      if (item.type === "folder") {
        if (item.children === current) return item;
        const deeper = item.children ? walk(item.children) : undefined;
        if (deeper) return deeper;
      }
    }
    return undefined;
  };
  return walk(root)?.name;
}
export default HackPhoneFiles;