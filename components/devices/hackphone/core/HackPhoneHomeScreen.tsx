"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { APP_REGISTRY, DOCK_APPS, getAppById } from "../shared/AppRegistry";
import { HomeScreenProps, AppConfig } from "@/types/devices";
import { useSocket } from '@/hooks/useSocket';

// Permission matrix: teamSize -> role -> [settings, messages, mail, safari, appStore, sentinel, game, mining, stocks, allOthers]
const PERMISSION_MATRIX: Record<number, Record<string, boolean[]>> = {
  1: {
    professor: [true, true, true, true, true, true, true, true, true, true]
  },
  2: {
    professor: [false, false, false, false, true, true, true, true, true, true],
    berlin: [true, true, true, true, false, false, false, false, false, true]
  },
  3: {
    professor: [false, false, false, false, false, true, true, true, true, true],
    berlin: [true, true, true, true, false, false, false, false, false, true],
    rio: [false, false, false, false, true, false, false, false, false, true],
    tokyo: [false, false, false, false, true, false, false, false, false, true]
  },
  4: {
    professor: [false, false, false, false, false, true, false, false, true, true],
    berlin: [true, false, false, false, false, false, false, false, false, true],
    rio: [false, false, false, false, true, false, false, false, false, true],
    tokyo: [false, false, false, false, true, false, false, false, false, true],
    nairobi: [false, true, true, true, false, false, true, true, false, true],
    denver: [false, true, true, true, false, false, true, true, false, true]
  },
  5: {
    professor: [false, false, false, false, false, true, false, false, true, true],
    berlin: [true, false, false, false, false, false, false, false, false, true],
    rio: [false, false, false, false, true, false, false, false, false, true],
    tokyo: [false, false, false, false, true, false, false, false, false, true],
    nairobi: [false, true, true, true, false, false, true, true, false, true],
    denver: [false, true, true, true, false, false, true, true, false, true]
  },
  6: {
    professor: [false, false, false, false, false, true, false, false, true, true],
    berlin: [true, false, false, false, false, false, false, false, false, true],
    rio: [false, false, false, false, true, false, false, false, false, true],
    tokyo: [false, false, false, false, true, false, false, false, false, true],
    nairobi: [false, true, true, true, false, false, true, true, false, true],
    denver: [false, true, true, true, false, false, true, true, false, true]
  }
};

// Special apps in order: settings, messages, mail, safari, appStore, sentinel, game, mining, stocks
const SPECIAL_APPS = ['settings', 'messages', 'mail', 'safari', 'appStore', 'sentinel', 'game', 'mining', 'stocks'];

function isAppAllowed(appId: string, teamSize: number, role: string): boolean {
  const normalizedRole = role.toLowerCase();
  const matrix = PERMISSION_MATRIX[teamSize]?.[normalizedRole];
  if (!matrix) return true; // default allow if not defined

  const specialIndex = SPECIAL_APPS.indexOf(appId);
  if (specialIndex !== -1) {
    return matrix[specialIndex];
  } else {
    return matrix[9]; // all others
  }
}

const HackPhoneHomeScreen: React.FC<HomeScreenProps> = ({
  onAppOpen,
  user,
  teamSize
}) => {
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hackphone-current-page');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { stealthSpawns, ransomSpawns, bankEvents, ransomDemands } = useSocket();
  const activeDemand = ransomDemands.slice(-1)[0];
  const latestBank = bankEvents?.slice(-1)[0];
  const [alertBadge, setAlertBadge] = useState<{ type: 'stealth' | 'ransom'; ts: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('hackphone-current-page', currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const latestStealth = stealthSpawns.slice(-1)[0];
    if (latestStealth) {
      setAlertBadge({ type: 'stealth', ts: Date.now() });
      setTimeout(()=> setAlertBadge(b => (b && Date.now()-b.ts>5000)? null : b), 5200);
    }
  }, [stealthSpawns]);
  useEffect(() => {
    const latestRansom = ransomSpawns.slice(-1)[0];
    if (latestRansom) {
      setAlertBadge({ type: 'ransom', ts: Date.now() });
      setTimeout(()=> setAlertBadge(b => (b && Date.now()-b.ts>5000)? null : b), 5200);
    }
  }, [ransomSpawns]);

  // Use the app registry instead of hardcoded apps
  const apps = useMemo(() => {
    if (!user?.role || !teamSize) return APP_REGISTRY; // if no user or teamSize, show all unlocked
    return APP_REGISTRY.map(app => ({
      ...app,
      isLocked: !isAppAllowed(app.id, teamSize, user.role!)
    }));
  }, [user?.role, teamSize]);

  // Distribute apps across exactly 3 pages in a round-robin fashion to "scatter" them
  const TOTAL_PAGES = 3;
  const pages: AppConfig[][] = useMemo(() => {
    const buckets: AppConfig[][] = Array.from({ length: TOTAL_PAGES }, () => []);
    apps.forEach((app, idx) => {
      buckets[idx % TOTAL_PAGES].push(app);
    });
    return buckets;
  }, [apps]);
  const totalPages = TOTAL_PAGES;

  // date formatting helper removed — home screen no longer shows a date header

  const handleAppClick = (app: AppConfig) => {
    if (app.isLocked) {
      // Show locked app notification
      return;
    }

    // Special handling for fullscreen app - toggle fullscreen directly
    if (app.id === 'fullscreen') {
      if (typeof document !== 'undefined') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
          });
        } else {
          document.exitFullscreen().catch(err => {
            console.error('Error attempting to exit fullscreen:', err);
          });
        }
      }
      return;
    }

    onAppOpen(app.id);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const delta = touchStartX.current - touchEndX.current;
    const threshold = 50; // px
    if (delta > threshold && currentPage < totalPages - 1) {
      setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
    } else if (delta < -threshold && currentPage > 0) {
      setCurrentPage((p) => Math.max(0, p - 1));
    }
  };

  // Optional: mouse drag support (desktop)
  const mouseDownX = useRef<number | null>(null);
  const mouseUpX = useRef<number | null>(null);
  const onMouseDown = (e: React.MouseEvent) => {
    mouseUpX.current = null;
    mouseDownX.current = e.clientX;
  };
  const onMouseUp = (e: React.MouseEvent) => {
    mouseUpX.current = e.clientX;
    if (mouseDownX.current === null || mouseUpX.current === null) return;
    const delta = mouseDownX.current - mouseUpX.current;
    const threshold = 60;
    if (delta > threshold && currentPage < totalPages - 1) {
      setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
    } else if (delta < -threshold && currentPage > 0) {
      setCurrentPage((p) => Math.max(0, p - 1));
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col relative overflow-hidden font-[Helvetica,Arial,ui-sans-serif]">
      {/* iPhone 4 background image */}
      <div className="absolute inset-0 bg-black" />
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: "url(/hackphone/home-screen-bg.png)" }}
      />
      {/* Subtle lighting layer for depth, harmless on older browsers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.18) 0, rgba(255,255,255,0) 40%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0, rgba(255,255,255,0) 35%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.10) 0, rgba(255,255,255,0) 45%)",
        }}
      />

      {/* Top status layer */}
      <div className="text-center text-white relative z-10 pt-2">
        <div className="flex justify-center gap-2">
          {latestBank && (
            <div className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide ${latestBank.online? 'bg-green-600/80':'bg-red-700/80'} shadow`}>BANK {latestBank.online? 'ONLINE':'OFFLINE'}</div>
          )}
          {alertBadge && (
            <div className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-red-600/80 shadow animate-pulse">THREAT</div>
          )}
        </div>
      </div>

      {/* App pages (swipeable) */}
      <div className="flex-1 px-0 sm:px-0 py-4 relative z-10 select-none">
        <div
          ref={containerRef}
          className="h-full w-full overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          <div
            className="h-full flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {pages.map((appsOnPage, pageIdx) => (
              <div key={pageIdx} className="min-w-full px-4 sm:px-6">
                <div className="grid grid-cols-4 gap-4 sm:gap-6 h-full content-start max-w-[420px] mx-auto">
                  {appsOnPage.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleAppClick(app)}
                      className="flex flex-col items-center group"
                    >
                      {/* App icon */}
                      <div
                        className={`w-[clamp(52px,9vw,68px)] h-[clamp(52px,9vw,68px)] rounded-[14px] flex items-center justify-center mb-2 shadow-[0_6px_14px_rgba(0,0,0,0.4)] group-active:scale-95 transition-transform duration-100 relative overflow-hidden bg-white/5`}
                      >
                        <Image
                          src={app.icon}
                          alt={`${app.name} icon`}
                          fill
                          className={app.id === "files" ? "object-contain w-full h-full m-0 p-0" : "object-cover"}
                          sizes="(max-width: 640px) 56px, 64px"
                          priority={false}
                        />
                        {/* Optional gloss */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                      </div>
                      {/* App name */}
                      <span className="text-white text-[11px] font-medium text-center leading-tight max-w-full truncate drop-shadow">
                        {app.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page indicator dots */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 pb-4 relative z-10">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentPage ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* Dock */}
      <div className="px-4 sm:px-6 pt-2 pb-20 relative z-10 max-w-[420px] mx-auto w-full">
        {activeDemand && (
          <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[90%] bg-gradient-to-br from-red-900/90 to-gray-900/90 border border-red-500/60 rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in text-left">
            <div className="text-red-300 font-bold mb-2 text-sm tracking-wide">RANSOM DEMAND</div>
            <div className="text-xs text-red-200 mb-2">Your files are encrypted. Pay <span className="font-semibold text-red-100">₿{activeDemand.demand}</span> before timer expires.</div>
            <RansomTimer demand={activeDemand} />
            <div className="flex gap-2 mt-3">
              <button className="flex-1 px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium" onClick={()=> payRansom(activeDemand)}>PAY</button>
            </div>
          </div>
        )}
        {alertBadge && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] px-3 py-1 rounded-full shadow animate-pulse">
            {alertBadge.type === 'stealth' ? 'STEALTH VIRAL DETECTED' : 'RANSOMWARE ACTIVE'}
          </div>
        )}
        {/* Glossy dock */}
        <div className="mx-auto max-w-[360px] h-[70px] rounded-[18px] bg-white/10 supports-[backdrop-filter]:backdrop-blur-md border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/40" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/40" />
          <div className="flex justify-center items-center h-full space-x-8 relative z-10">
            {/* Dock apps from registry */}
            {DOCK_APPS.map((appId) => {
              const app = getAppById(appId);
              if (!app) return null;
              
              return (
                <button
                  key={app.id}
                  onClick={() => onAppOpen(app.id)}
                  className="w-[56px] h-[56px] rounded-[14px] flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.4)] active:scale-95 transition-transform duration-100 relative overflow-hidden bg-white/5"
                >
                  <Image
                    src={app.icon}
                    alt={`${app.name} icon`}
                    fill
                    className="object-cover"
                    sizes="56px"
                    priority={app.id === "phone" || app.id === "music"} // Prioritize main dock apps
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Home button bezel and button moved to Desktop overlay to make it persistent across screens */}
    </div>
  );
};

// Timer subcomponent
interface ActiveDemand { targetKey: string; demand: number; windowMs: number; ts: number; attackerTeamId?: string }
const RansomTimer: React.FC<{ demand: ActiveDemand }> = ({ demand }) => {
  const [remaining, setRemaining] = useState<number>(()=> demand.windowMs || 0);
  useEffect(()=>{
    const end = demand.ts + (demand.windowMs||0);
    const id = setInterval(()=>{
      const rem = end - Date.now();
      setRemaining(rem);
      if (rem<=0) clearInterval(id);
    }, 500);
    return ()=> clearInterval(id);
  }, [demand]);
  const secs = Math.max(0, Math.ceil(remaining/1000));
  return <div className="text-[10px] text-red-300">Time left: {secs}s</div>;
};

async function payRansom(demand: ActiveDemand) {
  try {
    await fetch('/api/attack/ransomware/pay', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ targetKey: demand.targetKey }) });
  } catch {}
}

export default HackPhoneHomeScreen;
