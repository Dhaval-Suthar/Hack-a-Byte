 "use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDeviceUser } from "@/app/actions/deviceUser";
import { getPlayspaceId } from "@/lib/playspace-utils";
import HackPhoneBootScreen from "@/components/devices/hackphone/core/HackPhoneBootScreen";
import HackPhoneHomeScreen from "@/components/devices/hackphone/core/HackPhoneHomeScreen";
import HackPhoneAppsRouter from "@/components/devices/hackphone/core/HackPhoneAppsRouter";
import DeviceStatusGuard from "@/components/devices/hackphone/core/DeviceStatusGuard";
import GameOverListener from "@/components/devices/hackphone/core/GameOverListener";
import { useAppNavigation } from "../shared/useAppNavigation";
import { User } from "@/types/devices";
import { useNotificationService } from "@/hooks/useNotificationService";
import IOS4Notification from "@/components/ui/IOS4Notification";
import dynamic from 'next/dynamic';
import { logger } from '@/lib/logger';
import TimerExpirationModal from '@/components/timer/TimerExpirationModal';
import { useSocket } from '@/hooks/useSocket';

// Lazy-load virus popups to avoid SSR issues
const VirusPopups = dynamic(() => import('@/components/notifications/VirusPopups'), { ssr: false });
const CryptoLockerDefense = dynamic(() => import('@/components/devices/hackphone/security/CryptoLockerDefense'), { ssr: false });
const CryptoLockerPayment = dynamic(() => import('@/components/devices/hackphone/security/CryptoLockerPayment'), { ssr: false });
const SystemLockProVictim = dynamic(() => import('@/components/devices/hackphone/security/SystemLockProVictim'), { ssr: false });

const HackPhoneDesktop = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [time, setTime] = useState(new Date());
  const [hasPasscode, setHasPasscode] = useState(false);
  const [deviceId, setDeviceId] = useState<string | undefined>();
  const [playspaceId, setPlayspaceId] = useState<string | undefined>();
  const [teamId, setTeamId] = useState<string | undefined>();
  const [teamSize, setTeamSize] = useState<number | undefined>();
  const [isPortrait, setIsPortrait] = useState(true);
  const [showTimerExpirationModal, setShowTimerExpirationModal] = useState(false);

  // Use socket hook for timer expiration events
  const { teamTimerExpired } = useSocket();

  // Use the navigation hook
  const { currentApp, openApp, closeApp, switchApp } = useAppNavigation();

  // Notification system for home screen
  const { notification, dismissNotification } = useNotificationService(teamId);

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

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      const orientation = window.orientation || (screen.orientation ? screen.orientation.angle : 0);
      setIsPortrait(orientation === 0 || orientation === 180);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    // Also listen for resize as fallback
    window.addEventListener('resize', handleOrientationChange);

    handleOrientationChange(); // initial check

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const urlPlayspaceId = searchParams?.get("playspaceId");
        const urlDeviceId = searchParams?.get("deviceId");
        
        let currentPlayspaceId = urlPlayspaceId;
        if (!currentPlayspaceId) {
          currentPlayspaceId = getPlayspaceId();
        }

        // Store playspaceId and deviceId for passing to apps
        setPlayspaceId(currentPlayspaceId || undefined);
        setDeviceId(urlDeviceId || undefined);

        // Get teamId from playspaceId for notifications
        if (currentPlayspaceId) {
          try {
            const teamResponse = await fetch(`/api/team/get-team-id?playspaceId=${currentPlayspaceId}`);
            const teamData = await teamResponse.json();
            if (teamData.success) {
              setTeamId(teamData.teamId);
              // Fetch team size
              try {
                const sizeResponse = await fetch(`/api/team/size?teamId=${teamData.teamId}`);
                const sizeData = await sizeResponse.json();
                if (sizeData.success) {
                  setTeamSize(sizeData.numberOfPlayers);
                }
              } catch (error) {
                logger.error('Failed to fetch team size:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
              }
            }
          } catch (error) {
            logger.error('Failed to fetch team ID:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
          }
        }

        // If no deviceId in URL, try to get it from localStorage and resolve correct team
        let resolvedDeviceId = urlDeviceId;
        
        if (!urlDeviceId) {
          try {
            const storedMac = localStorage.getItem("device_mac_address");
            if (storedMac) {
              // Only set deviceId for convenience; do NOT override teamId here to avoid
              // accidentally joining the wrong team on unrelated devices.
              resolvedDeviceId = storedMac;
            }
          } catch (error) {
            logger.error('Failed to read stored MAC address:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
          }
        }
        
        setDeviceId(resolvedDeviceId || undefined);

        // Store device MAC address in localStorage if available
        if (urlDeviceId) {
          localStorage.setItem("device_mac_address", urlDeviceId);
          
          // Also resolve the correct team for this device
          try {
            const resolveResponse = await fetch(`/api/device/resolve-team?mac=${encodeURIComponent(urlDeviceId)}`);
            if (resolveResponse.ok) {
              const resolveData = await resolveResponse.json();
              if (resolveData.success && resolveData.teamId) {
                setTeamId(resolveData.teamId); // Override the playspace-based teamId
              }
            }
          } catch (error) {
            logger.error('Failed to resolve URL device team:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
          }
        }

        // On iPhone 4 UX, we allow home without playspace; only require auth for deviceId flow

        if (urlDeviceId) {
          if (!currentPlayspaceId) {
            router.push(`/hackphone/login?deviceId=${urlDeviceId}`);
            return;
          }
          const result = await getDeviceUser(currentPlayspaceId, urlDeviceId);
          if (result.isLoggedIn && result.user) {
            setUser(result.user);
          } else {
            // If there is no device passcode, allow guest access instead of redirecting
            if (hasPasscode) {
              router.push(`/hackphone/login?playspaceId=${currentPlayspaceId}&deviceId=${urlDeviceId}`);
              return;
            }
          }
        }
      } catch (error) {
        logger.error('Auth check error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        // Fail open to home; lock screen handles passcode
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [searchParams, router, hasPasscode]);

  // Handle timer expiration events
  useEffect(() => {
    if (teamTimerExpired.length > 0 && teamId) {
      // Check if any of the timer expiration events are for our team
      const relevantExpiration = teamTimerExpired.find(event => event.teamId === teamId);
      if (relevantExpiration) {
        setShowTimerExpirationModal(true);
      }
    }
  }, [teamTimerExpired, teamId]);

  const handleAppOpen = useCallback((appId: string) => {
    openApp(appId);
  }, [openApp]);

  const handleAppClose = useCallback(() => {
    closeApp();
  }, [closeApp]);

  const handleAppSwitch = useCallback((appId: string) => {
    switchApp(appId);
  }, [switchApp]);

  if (isLoading) {
    return <HackPhoneBootScreen />;
  }

  return (
    <DeviceStatusGuard deviceId={deviceId} playspaceId={playspaceId}>
      <div className="relative w-screen h-screen overflow-hidden touch-pan-y">
        {/* Main content area with improved touch handling */}
        <div className="relative w-full h-full">
          {currentApp ? (
            <HackPhoneAppsRouter
              appId={currentApp}
              onClose={handleAppClose}
              user={user}
              time={time}
              onAppSwitch={handleAppSwitch}
              onOpenApp={handleAppOpen}
              deviceId={deviceId}
              playspaceId={playspaceId}
            />
          ) : (
            <HackPhoneHomeScreen
              onAppOpen={handleAppOpen}
              user={user}
              teamSize={teamSize}
            />
          )}
        </div>

        {/* Orientation warning overlay */}
        {!isPortrait && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-[60] backdrop-blur-sm">
            <div className="text-center text-white p-6 max-w-sm">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-xl font-semibold mb-2">Rotate to Portrait</h2>
              <p className="text-sm opacity-80">
                Please rotate your device to vertical orientation to continue using the HackPhone.
              </p>
            </div>
          </div>
        )}

            {/* iOS 4 Style Notifications - Show on all screens */}
      {notification && (
        <>
          <IOS4Notification
            message={notification.body}
            type={notification.type}
            isVisible={!!notification}
            onDismiss={dismissNotification}
            onOpen={() => {
              // Open the appropriate app when notification is tapped
              if (notification.type === 'sms') {
                handleAppOpen('messages');
              } else if (notification.type === 'email') {
                handleAppOpen('mail');
              }
              dismissNotification();
            }}
          />
        </>
      )}

      {/* StealthViral random popup overlay (defensive clicking) */}
      {teamId && (
        // Use deviceId (MAC) as the StealthViral targetKey because the attack API
        // spawns events keyed by the target device identifier (MAC). Previously
        // we used teamId which never matched the spawn event targetKey, so the
        // defender never saw popup nodes. Fallback to teamId if deviceId missing.
        <>
          <VirusPopups targetKey={deviceId || teamId} targetTeamId={teamId} active />
          
          {/* CryptoLocker overlays */}
          <CryptoLockerDefense teamId={teamId} active />
          <CryptoLockerPayment teamId={teamId} active />
          
          {/* SystemLock Pro victim overlay */}
          <SystemLockProVictim />
        </>
      )}

      {/* Game over listener for forced redirections */}
      <GameOverListener teamId={teamId} deviceId={deviceId} enabled={true} />

      {/* Enhanced bottom navigation with haptic feedback */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 w-full h-[clamp(74px,12vw,92px)] bg-black/90 border-t border-white/20 ring-1 ring-black/60 shadow-[0_18px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[65] supports-[backdrop-filter]:backdrop-blur-md"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/50" />
        <div className="absolute top-0 left-0 right-0 h-px bg-white/30" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-black/80" />
      </div>

      {/* Enhanced home button with improved touch target */}
      <button
        aria-label="Home"
        onClick={() => {
          // Add haptic feedback for supported devices
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
          closeApp();
        }}
        onTouchStart={(e) => {
          // Improve touch responsiveness
          e.currentTarget.style.transform = 'translate(-50%, 0) scale(0.95)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, 0) scale(1)';
        }}
        className="group absolute bottom-2.5 left-1/2 -translate-x-1/2 w-[clamp(58px,10.5vw,76px)] h-[clamp(58px,10.5vw,76px)] rounded-full bg-neutral-900/80 border border-white/20 ring-1 ring-white/30 shadow-[0_14px_30px_rgba(0,0,0,0.7)] transition-all duration-150 ease-out supports-[backdrop-filter]:backdrop-blur-md overflow-hidden z-[70] active:scale-95 hover:ring-white/40"
      >
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-transparent to-transparent" />
        <div className="absolute inset-[10%] rounded-full bg-gradient-to-b from-neutral-900 to-black shadow-[inset_0_8px_12px_rgba(255,255,255,0.08),inset_0_-10px_16px_rgba(0,0,0,0.6)] group-active:shadow-[inset_0_4px_8px_rgba(255,255,255,0.05),inset_0_-6px_10px_rgba(0,0,0,0.6)]" />
        <div
          className="pointer-events-none absolute -top-1 left-0 w-[65%] h-[65%] opacity-50"
          style={{
            background:
              "radial-gradient(120px 80px at 30% 20%, rgba(255,255,255,0.4), rgba(255,255,255,0.08) 55%, transparent 60%)",
            borderTopLeftRadius: 9999,
          }}
        />
        <div className="relative z-10 w-[26%] h-[26%] mx-auto my-auto border-2 border-white/90 rounded-[6px] shadow-[0_0_1px_1px_rgba(255,255,255,0.5)]" />
      </button>
      </div>

      {/* Timer Expiration Modal */}
      <TimerExpirationModal 
        isOpen={showTimerExpirationModal}
        onClose={() => setShowTimerExpirationModal(false)}
      />
    </DeviceStatusGuard>
  );
};

export default HackPhoneDesktop;
