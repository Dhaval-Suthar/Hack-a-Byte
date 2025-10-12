'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface DeviceStatusGuardProps {
  deviceId?: string;
  playspaceId?: string;
  children: React.ReactNode;
}

const DeviceStatusGuard: React.FC<DeviceStatusGuardProps> = ({ 
  deviceId, 
  playspaceId, 
  children 
}) => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Respect server-side rate limiting and avoid spamming reloads
  const [retryAfterSec, setRetryAfterSec] = useState<number | null>(null);
  const retryUntilRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkDeviceStatus = async () => {
      try {
        // Check if we have required data
        if (!deviceId && !playspaceId) {
          // Missing both - redirect to device selection
          router.push('/device-selection');
          return;
        }

        let macToCheck = deviceId;
        
        // If no deviceId, try to get from localStorage
        if (!macToCheck) {
          try {
            macToCheck = localStorage.getItem('device_mac_address') || undefined;
          } catch {
            // localStorage not available
          }
        }

        if (!macToCheck) {
          // No device MAC available - redirect to device selection
          router.push('/device-selection');
          return;
        }

        // If we're currently rate-limited, do not call again until allowed
        if (retryUntilRef.current && Date.now() < retryUntilRef.current) {
          return;
        }

        // Check device status
        const response = await fetch(
          `/api/device/online-sync?deviceId=${encodeURIComponent(macToCheck)}`,
          { cache: 'no-store' }
        );
        
        if (!response.ok) {
          if (response.status === 404) {
            // Device not found - redirect to device selection
            router.push('/device-selection');
            return;
          }
          if (response.status === 429) {
            // Respect Retry-After header if present
            const retryHeader = response.headers.get('Retry-After');
            const secs = retryHeader ? parseInt(retryHeader, 10) : NaN;
            const waitSecs = Number.isFinite(secs) && secs > 0 ? secs : 30;
            setRetryAfterSec(waitSecs);
            retryUntilRef.current = Date.now() + waitSecs * 1000;
            setError(`Status check rate limited. Try again in ~${waitSecs}s`);

            // Start a simple countdown timer for UX
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = setInterval(() => {
              const remaining = retryUntilRef.current ? Math.max(0, Math.ceil((retryUntilRef.current - Date.now()) / 1000)) : 0;
              setRetryAfterSec(remaining);
              if (remaining <= 0 && countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
                countdownTimerRef.current = null;
              }
            }, 1000);

            return; // Don't throw; handled gracefully
          }
          throw new Error(`Status check failed: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Redirect based on device status
        if (!data.online || data.status === 'offline') {
          router.push(`/device-offline?deviceId=${encodeURIComponent(macToCheck)}&reason=offline`);
          return;
        }

        if (data.status === 'maintenance') {
          router.push(`/device-maintenance?deviceId=${encodeURIComponent(macToCheck)}&reason=maintenance`);
          return;
        }

      } catch (err) {
        logger.error('Device status check failed:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
        setError(err instanceof Error ? err.message : 'Status check failed');
      } finally {
        setIsChecking(false);
      }
    };

    checkDeviceStatus();
    
    // Set up periodic status checks every 30 seconds
    const interval = setInterval(checkDeviceStatus, 30000);
    
    return () => {
      clearInterval(interval);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [deviceId, playspaceId, router]);

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Checking device status...</p>
        </div>
      </div>
    );
  }

  // Show error if status check failed
  if (error) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => {
              // Soft retry: re-run status check without reloading the whole app
              setIsChecking(true);
              setError(null);
              // Clear any block so we can try immediately when user taps Retry
              retryUntilRef.current = null;
              // Trigger a microtask to run the effect's checker again by toggling state
              // We rely on the interval check; but kick an immediate check too
              (async () => {
                try {
                  const mac = (typeof window !== 'undefined') ? localStorage.getItem('device_mac_address') || undefined : undefined;
                  if (!mac && !deviceId) return;
                  const toCheck = deviceId || mac!;
                  const resp = await fetch(`/api/device/online-sync?deviceId=${encodeURIComponent(toCheck)}`, { cache: 'no-store' });
                  if (!resp.ok) {
                    if (resp.status === 404) {
                      router.push('/device-selection');
                      return;
                    }
                    if (resp.status === 429) {
                      const retryHeader = resp.headers.get('Retry-After');
                      const secs = retryHeader ? parseInt(retryHeader, 10) : NaN;
                      const waitSecs = Number.isFinite(secs) && secs > 0 ? secs : 30;
                      setRetryAfterSec(waitSecs);
                      retryUntilRef.current = Date.now() + waitSecs * 1000;
                      setError(`Status check rate limited. Try again in ~${waitSecs}s`);
                      setIsChecking(false);
                      return;
                    }
                    throw new Error(`Status check failed: ${resp.statusText}`);
                  }
                  const data = await resp.json();
                  if (!data.online || data.status === 'offline') {
                    router.push(`/device-offline?deviceId=${encodeURIComponent(toCheck)}&reason=offline`);
                    return;
                  }
                  if (data.status === 'maintenance') {
                    router.push(`/device-maintenance?deviceId=${encodeURIComponent(toCheck)}&reason=maintenance`);
                    return;
                  }
                  setIsChecking(false);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Status check failed');
                  setIsChecking(false);
                }
              })();
            }}
            className={`px-4 py-2 rounded text-white ${retryAfterSec && retryAfterSec > 0 ? 'bg-blue-900/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={!!retryAfterSec && retryAfterSec > 0}
          >
            {retryAfterSec && retryAfterSec > 0 ? `Retry in ${retryAfterSec}s` : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  // If we get here, device is online and accessible
  return <>{children}</>;
};

export default DeviceStatusGuard;
