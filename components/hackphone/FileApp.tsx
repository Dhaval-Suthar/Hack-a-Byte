"use client";
import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";

/**
 * HackPhone Files — an iOS-style file system app with modern interface
 *
 * Enhanced file browser interface with locations, favorites, and browse functionality
 * Built for Next.js + React + TypeScript with iOS-style design
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
type ItemType = "folder" | "file" | "location";
type ViewType = "browse" | "locations" | "folder";

export type FSItem = {
  id: string;
  name: string;
  type: ItemType;
  children?: FSItem[]; // folders can have children
  sizeBytes?: number; // files only
  modifiedAt?: string; // ISO date
  icon?: string; // icon path for locations
  itemCount?: number; // for folders
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
const locationData: FSItem[] = [
  {
    id: "icloud",
    name: "iCloud Drive",
    type: "location",
    icon: "/hackphone/apps/files/icloud_drive.png",
    itemCount: 0,
  },
  {
    id: "on-my-phone",
    name: "On My iPhone",
    type: "location", 
    icon: "/hackphone/apps/files/on_my_phone.png",
    itemCount: 0,
  },
  {
    id: "drive",
    name: "Drive",
    type: "location",
    icon: "/hackphone/apps/files/drive.png",
    itemCount: 0,
  },
  {
    id: "recently-deleted",
    name: "Recently Deleted",
    type: "location",
    icon: "/hackphone/apps/files/recently_deleted.png",
    itemCount: 0,
  },
];

const favoritesData: FSItem[] = [
  {
    id: "downloads-fav",
    name: "Downloads",
    type: "folder",
    icon: "/hackphone/apps/files/downloads.png",
    itemCount: 8,
  },
  {
    id: "downloads2-fav",
    name: "Downloads",
    type: "folder",
    icon: "/hackphone/apps/files/downloads2.png",
    itemCount: 8,
  },
  {
    id: "downloads3-fav",
    name: "Downloads 2",
    type: "folder",
    icon: "/hackphone/apps/files/downloadss.png",
    itemCount: 142,
  },
];

const demoData: FSItem[] = [
  {
    id: "docs",
    name: "Documents",
    type: "folder",
    itemCount: 12,
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
    itemCount: 142,
    children: [
      { id: "july", name: "July", type: "folder", children: [] },
      { id: "august", name: "August", type: "folder", children: [] },
    ],
  },
  {
    id: "scripts",
    name: "Scripts",
    type: "folder",
    itemCount: 5,
    children: [],
  },
  {
    id: "hack-tools",
    name: "hack-tools.zip",
    type: "file",
    sizeBytes: 2_400_000,
    modifiedAt: "2025-08-12T09:10:00Z",
  },
  {
    id: "network-scan",
    name: "network-scan.log",
    type: "file",
    sizeBytes: 156_000,
    modifiedAt: "2025-08-12T09:10:00Z",
  },
  {
    id: "encrypted-data",
    name: "encrypted-data.bin",
    type: "file",
    sizeBytes: 892_000,
    modifiedAt: "2025-08-12T09:10:00Z",
  },
];

// ---------- Helpers ----------
const bytes = (n?: number) =>
  typeof n === "number"
    ? n > 1_000_000 
      ? (n / 1_000_000).toFixed(1) + " MB"
      : n > 1_000 
      ? (n / 1_000).toFixed(1) + " KB"
      : new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n) + " B"
    : "—";

const formatItemCount = (count?: number) => 
  count === 1 ? "1 item" : `${count || 0} items`;

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
}: HackPhoneFilesProps) {
  const [launched, setLaunched] = useState(true); // Auto-launch the interface
  const [openedAt, setOpenedAt] = useState<number | null>(Date.now()); // Set opened time immediately
  const [currentView, setCurrentView] = useState<ViewType>("browse");
  const [stack, setStack] = useState<FSItem[][]>([root]);
  const cwd = stack[stack.length - 1];

  const closeWith = (reason: CloseInfo["reason"]) => {
    const now = Date.now();
    const open = openedAt ?? now;
    onClose?.({ openedAt: open, closedAt: now, durationMs: now - open, reason });
    setLaunched(false);
    setOpenedAt(null);
    setStack([root]);
    setCurrentView("browse");
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
    <div className="w-full h-full bg-gradient-to-b from-[#f7f7f7] to-[#f0f0f0] text-black flex flex-col pb-8"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      {/* Search Bar */}
      <div className="px-4 pt-4 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-white/70 border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {currentView === "browse" && (
          <BrowseView 
            onNavigateToLocations={() => setCurrentView("locations")}
            favoriteItems={favoritesData}
            onItemClick={(item) => {
              if (item.type === "folder") {
                setCurrentView("folder");
                setStack([root]);
              }
            }}
          />
        )}

        {currentView === "locations" && (
          <LocationsView 
            items={locationData}
            onBack={() => setCurrentView("browse")}
            onItemClick={() => {
              setCurrentView("folder");
              setStack([root]);
            }}
          />
        )}

        {currentView === "folder" && (
          <FolderView
            items={cwd}
            onBack={() => setCurrentView("browse")}
            onItemClick={(item) => {
              if (item.type === "folder") {
                const next = item.children ?? [];
                setStack((s) => [...s, next]);
              }
            }}
          />
        )}
      </div>

      {/* Bottom Taskbar - iOS Files App Style */}
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-200/50 pb-8">
        <div className="flex items-center justify-around py-3">
          <button 
            className={`flex flex-col items-center p-2 ${currentView === "browse" ? "text-blue-600" : "text-gray-600"}`}
            onClick={() => setCurrentView("browse")}
          >
            <Image 
              src="/hackphone/apps/files/browse_icon.png" 
              alt="Browse" 
              width={28} 
              height={28}
              className="mb-1"
            />
            <span className="text-xs font-medium">Browse</span>
          </button>
          
          <button 
            className="flex flex-col items-center p-2 text-gray-600"
            onClick={() => {/* Handle search */}}
          >
            <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-medium">Search</span>
          </button>
          
          <button 
            className="flex flex-col items-center p-2 text-gray-600"
            onClick={() => {/* Handle recents */}}
          >
            <Image 
              src="/hackphone/apps/files/recents.png" 
              alt="Recents" 
              width={28} 
              height={28}
              className="mb-1"
            />
            <span className="text-xs font-medium">Recents</span>
          </button>
          
          <button 
            className="flex flex-col items-center p-2 text-gray-600"
            onClick={() => {/* Handle shared */}}
          >
            <Image 
              src="/hackphone/apps/files/shared.png" 
              alt="Shared" 
              width={28} 
              height={28}
              className="mb-1"
            />
            <span className="text-xs font-medium">Shared</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- View Components ----------
function BrowseView({ 
  onNavigateToLocations, 
  favoriteItems, 
  onItemClick 
}: { 
  onNavigateToLocations: () => void;
  favoriteItems: FSItem[];
  onItemClick: (item: FSItem) => void;
}) {
  return (
    <div className="px-4 space-y-6">
      {/* Locations Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
          <button 
            onClick={onNavigateToLocations}
            className="text-blue-600 text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
          {locationData.slice(0, 4).map((item, index) => (
            <div key={item.id} className={`${index > 0 ? 'border-t border-gray-100' : ''}`}>
              <button 
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100"
                onClick={() => onItemClick(item)}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Image 
                    src={item.icon || "/hackphone/apps/files/app_icon.png"} 
                    alt={item.name} 
                    width={32} 
                    height={32}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Favorites Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Favorites</h2>
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
          {favoriteItems.map((item, index) => (
            <div key={item.id} className={`${index > 0 ? 'border-t border-gray-100' : ''}`}>
              <button 
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100"
                onClick={() => onItemClick(item)}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Image 
                    src={item.icon || "/hackphone/apps/files/app_icon.png"} 
                    alt={item.name} 
                    width={32} 
                    height={32}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">{formatItemCount(item.itemCount)}</div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tags Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
          <button className="text-blue-600 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function LocationsView({ 
  items, 
  onBack, 
  onItemClick 
}: { 
  items: FSItem[];
  onBack: () => void;
  onItemClick: (item: FSItem) => void;
}) {
  return (
    <div className="px-4">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3 p-1">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Locations</h1>
      </div>
      
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
        {items.map((item, index) => (
          <div key={item.id} className={`${index > 0 ? 'border-t border-gray-100' : ''}`}>
            <button 
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100"
              onClick={() => onItemClick(item)}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <Image 
                  src={item.icon || "/hackphone/apps/files/app_icon.png"} 
                  alt={item.name} 
                  width={40} 
                  height={40}
                  className="rounded-lg"
                />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-500">{formatItemCount(item.itemCount)}</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FolderView({ 
  items, 
  onBack, 
  onItemClick 
}: { 
  items: FSItem[];
  onBack: () => void;
  onItemClick: (item: FSItem) => void;
}) {
  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="p-1">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-sm text-gray-600">{formatItemCount(items.length)}</div>
      </div>
      
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
        {items.map((item, index) => (
          <div key={item.id} className={`${index > 0 ? 'border-t border-gray-100' : ''}`}>
            <button 
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100"
              onClick={() => onItemClick(item)}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                {item.type === "folder" ? (
                  <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 2a1 1 0 000 2h6a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h8a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-500">
                  {item.type === "folder"
                    ? formatItemCount(item.itemCount || item.children?.length)
                    : `${bytes(item.sizeBytes)} • ${item.modifiedAt ? new Date(item.modifiedAt).toLocaleDateString() : "—"}`}
                </div>
              </div>
              {item.type === "folder" && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Subcomponents ----------
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