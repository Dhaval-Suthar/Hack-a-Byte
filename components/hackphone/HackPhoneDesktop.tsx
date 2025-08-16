"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDeviceUser } from "@/app/actions/deviceUser";
import { getPlayspaceId } from "@/lib/playspace-utils";
import HackPhoneBootScreen from "@/components/hackphone/HackPhoneBootScreen";
import HackPhoneHomeScreen from "@/components/hackphone/HackPhoneHomeScreen";
import HackPhoneApps from "@/components/hackphone/HackPhoneApps";

interface User {
  _id: string;
  username: string;
  sessionId?: string;
  progress: {
    unlockedApplications: string[];
    skills: Record<string, unknown>;
  };
  gameState: Record<string, unknown>;
}

const HackPhoneDesktop = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const [hasPasscode, setHasPasscode] = useState(false);

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
    setCurrentApp(appId);
  };

  const handleAppClose = () => {
    setCurrentApp(null);
  };

  const handleAppSwitch = (appId: string) => {
    setCurrentApp(appId);
  };

  if (isLoading) {
    return <HackPhoneBootScreen />;
  }

  if (currentApp) {
    return (
      <HackPhoneApps 
        appId={currentApp}
        onClose={handleAppClose}
        user={user}
        time={time}
        onAppSwitch={handleAppSwitch}
        onOpenApp={handleAppOpen}
      />
    );
  }

  return (
    <HackPhoneHomeScreen 
      onAppOpen={handleAppOpen}
      user={user}
      time={time}
    />
  );
};

export default HackPhoneDesktop;
