"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDeviceUser } from "@/app/actions/deviceUser";
import { getPlayspaceId } from "@/lib/playspace-utils";
import HackPhoneBootScreen from "@/components/devices/hackphone/core/HackPhoneBootScreen";
import HackPhoneHomeScreen from "@/components/devices/hackphone/core/HackPhoneHomeScreen";
import HackPhoneAppsRouter from "@/components/devices/hackphone/core/HackPhoneAppsRouter";
import { useAppNavigation } from "../shared/useAppNavigation";
import { User } from "@/types/devices";

const HackPhoneDesktop = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [time, setTime] = useState(new Date());
  const [hasPasscode, setHasPasscode] = useState(false);

  // Use the navigation hook
  const { currentApp, openApp, closeApp, switchApp } = useAppNavigation();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check if device passcode is set (client-only)
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("hackphone_password") : null;
      setHasPasscode(!!saved);
    } catch {}
  }, []);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const urlPlayspaceId = searchParams?.get("playspaceId");
        const urlDeviceId = searchParams?.get("deviceId");
        
        let playspaceId = urlPlayspaceId;
        if (!playspaceId) {
          playspaceId = getPlayspaceId();
        }

        // On iPhone 4 UX, we allow home without playspace; only require auth for deviceId flow

        if (urlDeviceId) {
          if (!playspaceId) {
            router.push(`/hackphone/login?deviceId=${urlDeviceId}`);
            return;
          }
          const result = await getDeviceUser(playspaceId, urlDeviceId);
          if (result.isLoggedIn && result.user) {
            setUser(result.user);
          } else {
            // If there is no device passcode, allow guest access instead of redirecting
            if (hasPasscode) {
              router.push(`/hackphone/login?playspaceId=${playspaceId}&deviceId=${urlDeviceId}`);
              return;
            }
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Fail open to home; lock screen handles passcode
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [searchParams, router, hasPasscode]);

  const handleAppOpen = (appId: string) => {
    openApp(appId);
  };

  const handleAppClose = () => {
    closeApp();
  };

  const handleAppSwitch = (appId: string) => {
    switchApp(appId);
  };

  if (isLoading) {
    return <HackPhoneBootScreen />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {currentApp ? (
        <HackPhoneAppsRouter
          appId={currentApp}
          onClose={handleAppClose}
          user={user}
          time={time}
          onAppSwitch={handleAppSwitch}
          onOpenApp={handleAppOpen}
        />
      ) : (
        <HackPhoneHomeScreen
          onAppOpen={handleAppOpen}
        />
      )}

      {/* Persistent bottom overlay: bezel + home button */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 w-full h-[clamp(74px,12vw,92px)] bg-black border-t border-white/10 ring-1 ring-black/60 shadow-[0_18px_40px_rgba(0,0,0,0.7)] overflow-hidden z-[40]"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/40" />
        <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-black/70" />
      </div>

      <button
        aria-label="Home"
        onClick={() => closeApp()}
        className="group absolute bottom-2.5 left-1/2 -translate-x-1/2 w-[clamp(58px,10.5vw,76px)] h-[clamp(58px,10.5vw,76px)] rounded-full bg-neutral-900/70 border border-white/10 ring-1 ring-white/20 shadow-[0_14px_30px_rgba(0,0,0,0.65)] active:translate-y-[1px] transition-transform duration-100 supports-[backdrop-filter]:backdrop-blur-md overflow-hidden z-[50]"
      >
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/18 via-transparent to-transparent" />
        <div className="absolute inset-[10%] rounded-full bg-gradient-to-b from-neutral-900 to-black shadow-[inset_0_8px_12px_rgba(255,255,255,0.06),inset_0_-10px_16px_rgba(0,0,0,0.55)] group-active:shadow-[inset_0_4px_8px_rgba(255,255,255,0.04),inset_0_-6px_10px_rgba(0,0,0,0.55)]" />
        <div
          className="pointer-events-none absolute -top-1 left-0 w-[65%] h-[65%] opacity-45"
          style={{
            background:
              "radial-gradient(120px 80px at 30% 20%, rgba(255,255,255,0.35), rgba(255,255,255,0.05) 55%, transparent 60%)",
            borderTopLeftRadius: 9999,
          }}
        />
        <div className="relative z-10 w-[26%] h-[26%] mx-auto my-auto border-2 border-white/85 rounded-[6px] shadow-[0_0_1px_1px_rgba(255,255,255,0.4)]" />
      </button>
    </div>
  );
};

export default HackPhoneDesktop;
