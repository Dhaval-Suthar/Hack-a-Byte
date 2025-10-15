'use client';

import React, { useEffect, useState } from 'react';
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

        // Check device status
        const response = await fetch(`/api/device/online-sync?deviceId=${encodeURIComponent(macToCheck)}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Device not found - redirect to device selection
            router.push('/device-selection');
            return;
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
    
    return () => clearInterval(interval);
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
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If we get here, device is online and accessible
  return <>{children}</>;
};

export default DeviceStatusGuard;
