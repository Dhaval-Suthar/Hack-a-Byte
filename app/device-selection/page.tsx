"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getPlayspaceId } from "@/lib/playspace-utils";
import { getDevicesByPlayspaceId } from "@/app/actions/admin";
import { CHARACTER_INFO } from "@/lib/constants/app-constants";
import { logger } from '@/lib/logger';

interface DeviceOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  path: string;
  platform: "desktop" | "mobile" | "both";
}

interface DeviceInstance {
  id: string;
  type: string;
  status: "online" | "maintenance" | "offline";
}

export default function DeviceSelectionPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentPlayspaceId, setCurrentPlayspaceId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<DeviceInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstances, setSelectedInstances] = useState<{ [deviceType: string]: string }>({});

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Function to fetch available devices for the current playspace
  const fetchDevices = useCallback(async (playspaceId: string) => {
    try {
      setLoading(true);
      const result = await getDevicesByPlayspaceId(playspaceId);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.success && result.devices) {
        // The devices array now contains objects with id, type, and status
        setAvailableDevices(result.devices);

        // Auto-select the best instance for each device type
        const newSelectedInstances: { [deviceType: string]: string } = {};
        const deviceTypes = [...new Set(result.devices.map(d => d.type))];
        
        deviceTypes.forEach(deviceType => {
          const instances = result.devices.filter(d => d.type === deviceType);
          const bestInstance = instances.find(d => d.status === "online") || 
                              instances.find(d => d.status === "maintenance") || 
                              instances[0];
          if (bestInstance) {
            newSelectedInstances[deviceType] = bestInstance.id;
          }
        });
        
        setSelectedInstances(newSelectedInstances);

        // Log the available devices for debugging
      }

      setLoading(false);
    } catch (err) {
      logger.error('Error fetching devices:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      setError("Failed to load available devices");
      setLoading(false);
    }
  }, []);

  // Get current playspace ID from utilities, localStorage, URL params, or cookies
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Try to get from our utility function first (checks cookies & localStorage)
      const playspaceId = getPlayspaceId();

      if (playspaceId) {
        setCurrentPlayspaceId(playspaceId);
        // Once we have a playspace ID, fetch available devices
        fetchDevices(playspaceId);
        return;
      }

      // Fall back to URL params if needed
      const url = new URL(window.location.href);
      const urlPlayspaceId = url.searchParams.get("playspaceId");
      if (urlPlayspaceId) {
        localStorage.setItem("playspaceId", urlPlayspaceId);
        setCurrentPlayspaceId(urlPlayspaceId);
        // Once we have a playspace ID, fetch available devices
        fetchDevices(urlPlayspaceId);
      } else {
        // No playspace ID found, show all devices
        router.push('/');
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed fetchDevices and router dependencies to prevent infinite loop

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

 const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
      .catch((err) => {
        logger.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
  } else {
    document.exitFullscreen().catch((err) => {
      logger.error(`Error attempting to exit fullscreen: ${err.message}`);
    });
  }
};



  // All possible device options - memoized to prevent re-creation on every render
  const allDeviceOptions: DeviceOption[] = useMemo(() => [
    {
      id: "hackbook-w95",
      name: "HackBook W95",
      icon: "/hackbook-W95/app-icon/windows-logo.png",
      description: "Classic Windows 95 experience with games and extras.",
      path: "/hackbook-w95/login",
      platform: "desktop",
    },
    {
      id: "hackbook-l",
      name: "HackBook Linux",
      icon: "/hackbook-l/linux-logo.png",
      description: "Linux terminal-based environment for advanced system exploitation.",
      path: "/hackbook-l/login",
      platform: "desktop",
    },
    {
      id: "hackdroid",
      name: "HackDroid",
      icon: "/hackdroid/android-logo.png",
      description: "Android-based mobile hacking environment.",
      path: "/hackdroid/login",
      platform: "mobile",
    },
    {
      id: "hackphone",
      name: "HackPhone",
      icon: "/hackphone/ios-logo.png",
      description: "iOS-inspired mobile hacking platform.",
      path: "/hackphone/login",
      platform: "mobile",
    },
    {
      id: "admin-console",
      name: "Admin Console",
      icon: "/logo2.png", // Using the main logo as the admin icon
      description: "Secure administrative control panel for HackaByte platform management.",
      path: "/admin",
      platform: "desktop",
    },
  ], []);

  // Get device instances count and status for a specific device type
  const getDeviceInstances = useCallback((deviceType: string) => {
    return availableDevices.filter((d) => d.type === deviceType);
  }, [availableDevices]);

  // Get the best available device instance (prefer online status)
  const getBestDeviceInstance = useCallback((deviceType: string) => {
    const instances = getDeviceInstances(deviceType);
    if (instances.length === 0) return null;
    
    // Prioritize online devices, then maintenance, then offline
    const online = instances.find(d => d.status === "online");
    if (online) return online;
    
    const maintenance = instances.find(d => d.status === "maintenance");
    if (maintenance) return maintenance;
    
    return instances[0]; // fallback to first available
  }, [getDeviceInstances]);

  // Get the selected instance for a device type, or the best available one
  const getSelectedDeviceInstance = useCallback((deviceType: string) => {
    const selectedInstanceId = selectedInstances[deviceType];
    if (selectedInstanceId) {
      const selectedInstance = availableDevices.find(d => d.id === selectedInstanceId);
      if (selectedInstance) return selectedInstance;
    }
    return getBestDeviceInstance(deviceType);
  }, [selectedInstances, availableDevices, getBestDeviceInstance]);

  // Handle instance selection for devices with multiple instances
  const handleInstanceSelect = useCallback((deviceType: string, instanceId: string) => {
    setSelectedInstances(prev => ({
      ...prev,
      [deviceType]: instanceId
    }));
  }, []);

  // Filter available devices based on playspace permissions
  const filterByPlayspaceAccess = useCallback((deviceOptions: DeviceOption[]): DeviceOption[] => {
    // If no playspace ID or no available devices fetched yet, show all devices
    if (!currentPlayspaceId || !availableDevices.length || loading) {
      return deviceOptions;
    }

    // Filter devices based on the list returned from the server
    return deviceOptions.filter((device) => availableDevices.some((d) => d.type === device.id));
  }, [currentPlayspaceId, availableDevices, loading]);

  // Filter devices based on platform (mobile/desktop)
  const filterByPlatform = useCallback((deviceOptions: DeviceOption[]): DeviceOption[] => {
    return deviceOptions.filter(
      (device) =>
        device.platform === "both" ||
        (isMobile && device.platform === "mobile") ||
        (!isMobile && device.platform === "desktop")
    );
  }, [isMobile]);

  // Apply all filters to get final device list using useMemo for performance
  const filteredDevices = useMemo((): DeviceOption[] => {
    // Start with all device options
    let devices = [...allDeviceOptions];

    // Apply playspace access filter
    devices = filterByPlayspaceAccess(devices);

    // Apply platform filter (mobile/desktop) but prioritize mobile devices
    devices = filterByPlatform(devices);

    // Sort devices to prioritize mobile devices first
    devices.sort((a, b) => {
      // Mobile devices come first
      if (a.platform === "mobile" && b.platform !== "mobile") return -1;
      if (a.platform !== "mobile" && b.platform === "mobile") return 1;

      // Within the same platform, maintain original order
      return 0;
    });

    return devices;
  }, [allDeviceOptions, filterByPlayspaceAccess, filterByPlatform]);

  // Handle device selection including playspace ID and device instance selection
  const handleDeviceSelect = useCallback((deviceId: string, playspaceId?: string) => {
    // Find the device in all filtered devices
    const device = filteredDevices.find((d: DeviceOption) => d.id === deviceId);
    if (device) {
      // Get the selected device instance for this device type
      const deviceInstance = getSelectedDeviceInstance(deviceId);
      const specificDeviceId = deviceInstance?.id;

      // Store the device MAC address in localStorage
      if (specificDeviceId) {
        localStorage.setItem("device_mac_address", specificDeviceId);
      }

      // Small delay to show selection effect before navigating
      setTimeout(() => {
        // Build the navigation path with both playspaceId and specific deviceId
        let path = device.path;
        const params = new URLSearchParams();
        
        if (playspaceId) {
          params.set('playspaceId', playspaceId);
        }
        
        if (specificDeviceId) {
          params.set('deviceId', specificDeviceId);
        }
        
        // Add parameters to the path if any exist
        if (params.toString()) {
          path += `?${params.toString()}`;
        }
        
        router.push(path);
      }, 500);
    }
  }, [filteredDevices, getSelectedDeviceInstance, router]);

  return (
    <main className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 text-center">
        <h1 className="text-4xl font-mono font-bold mb-2">SELECT DEVICE</h1>
        <p className="text-sm opacity-70">Choose your virtual device to begin your hacking journey</p>
        
        {/* Display selected character if available */}
        {(() => {
          const selectedRole = typeof window !== 'undefined' ? localStorage.getItem('selectedRole') : null;
          const character = selectedRole ? CHARACTER_INFO[selectedRole as keyof typeof CHARACTER_INFO] : null;
          
          if (character) {
            return (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600 rounded-xl backdrop-blur-sm"
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="relative">
                    <Image 
                      src={character.image} 
                      alt={character.name}
                      width={50}
                      height={50}
                      className={`rounded-full border-2 ${character.borderColor}`}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={`font-mono text-sm ${character.textColor} font-semibold`}>
                      Playing as: {character.name}
                    </p>
                    <p className="text-gray-400 font-mono text-xs">
                      {character.role} • {character.specialty}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          }
          return null;
        })()}
      </motion.div>

      {/* Show loading or error state */}
      {loading && (
        <div className="text-center my-8">
          <p className="text-green-400 font-mono">Loading available devices...</p>
        </div>
      )}

      {error && (
        <div className="text-center my-8">
          <p className="text-red-400 font-mono">{error}</p>
          <button
            onClick={() => currentPlayspaceId && fetchDevices(currentPlayspaceId)}
            className="mt-4 bg-green-900/30 border border-green-500 text-green-400 px-4 py-2 rounded font-mono hover:bg-green-800/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Show no devices available message */}
      {!loading && !error && filteredDevices.length === 0 && (
        <div className="text-center my-8">
          <p className="text-yellow-400 font-mono">No devices are available for this playspace.</p>
          {currentPlayspaceId && <p className="text-green-400 font-mono mt-2">Playspace ID: {currentPlayspaceId}</p>}
          {isHydrated && (
            <p className="text-blue-400 font-mono mt-4">
              {isMobile
                ? "Try accessing from a desktop device for more options."
                : "Try accessing from a mobile device for more options."}
            </p>
          )}
        </div>
      )}

      {/* Devices grid */}
      {!loading && !error && filteredDevices.length > 0 && (
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl mt-4">
          {filteredDevices.map((device: DeviceOption, index: number) => {
            const deviceInstances = getDeviceInstances(device.id);
            const selectedInstance = getSelectedDeviceInstance(device.id);
            
            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="bg-gray-900 border-2 border-green-500 p-6 rounded-lg hover:bg-gray-800 transition-all hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] w-full max-w-md flex-shrink-0"
              >
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <Image src={device.icon} alt={device.name} width={48} height={48} className="object-contain" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-mono font-bold">{device.name}</h2>
                    {deviceInstances.length > 0 && (
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center">
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                              selectedInstance?.status === "online"
                                ? "bg-green-500"
                                : selectedInstance?.status === "maintenance"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          ></span>
                          <span className="text-xs text-green-300">
                            {selectedInstance?.status || "unknown"}
                          </span>
                        </div>
                        {deviceInstances.length > 1 && (
                          <div className="text-xs text-blue-400 font-mono">
                            {deviceInstances.length} instances
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Instance selection dropdown for multiple instances */}
                    {deviceInstances.length > 1 && (
                      <div className="mt-3">
                        <label className="block text-xs text-green-400 font-mono mb-2">
                          Select Instance:
                        </label>
                        <select
                          value={selectedInstances[device.id] || selectedInstance?.id || ''}
                          onChange={(e) => {
                            e.stopPropagation(); // Prevent triggering device selection
                            handleInstanceSelect(device.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()} // Prevent triggering device selection
                          className="w-full bg-gray-800 border border-green-500 text-green-300 text-xs font-mono px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                        >
                          {deviceInstances.map((instance) => (
                            <option key={instance.id} value={instance.id}>
                              {instance.id} ({instance.status})
                              {selectedInstances[device.id] === instance.id ? ' ← Selected' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Show status breakdown for multiple instances */}
                    {deviceInstances.length > 1 && (
                      <div className="mt-2 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {['online', 'maintenance', 'offline'].map(status => {
                            const count = deviceInstances.filter(d => d.status === status).length;
                            if (count === 0) return null;
                            
                            return (
                              <span 
                                key={status}
                                className={`px-2 py-0.5 rounded text-xs font-mono ${
                                  status === 'online' ? 'bg-green-900/50 text-green-300' :
                                  status === 'maintenance' ? 'bg-yellow-900/50 text-yellow-300' :
                                  'bg-red-900/50 text-red-300'
                                }`}
                              >
                                {count} {status}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-green-300 mb-4 min-h-[40px]">{device.description}</p>
                
                {/* Connect button */}
                <div className="mt-auto pt-2 border-t border-green-500/30">
                  <div className="text-xs opacity-60 font-mono mb-2">
                    <p>HackaByte Secure Boot System v1.0.2</p>
                    <p>© 2025 HackaByte Security Systems</p>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedInstance?.status === "online") {
                        handleDeviceSelect(device.id, currentPlayspaceId || undefined);
                      }
                    }}
                    disabled={selectedInstance?.status !== "online"}
                    className={`w-full px-4 py-2 rounded font-mono flex items-center justify-center border transition-colors ${
                      selectedInstance?.status !== "online"
                        ? "bg-gray-700 border-gray-500 text-gray-400 cursor-not-allowed"
                        : "bg-green-900/30 border-green-500 text-green-400 hover:bg-green-800/30"
                    }`}
>
                              <span
                           className={`inline-block w-1.5 h-1.5 mr-2 rounded-full ${
                           selectedInstance?.status === "online" ? "bg-green-500" : "bg-gray-500"
                          }`}
                          ></span>
                        {selectedInstance?.status === "online" 
                          ? `CONNECT TO ${deviceInstances.length > 1 ? 'SELECTED ' : ''}DEVICE`
                          : selectedInstance?.status === "maintenance"
                          ? "DEVICE UNDER MAINTENANCE"
                          : selectedInstance?.status === "offline"
                          ? "DEVICE OFFLINE"
                          : "DEVICE UNAVAILABLE"
                        }
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer navigation and controls */}
      <div className="mt-12 pt-8 border-t border-green-500/20 w-full max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-xs">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-green-500/70 hover:text-green-400 transition-colors font-mono"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              />
            </svg>
            Return to Main Terminal
          </button>
          
          <span className="hidden sm:inline text-green-500/30">•</span>
          
          <button
            onClick={toggleFullscreen}
            className="flex items-center text-green-500/70 hover:text-green-400 transition-colors font-mono"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                />
              )}
            </svg>
            {isFullscreen ? "Exit Fullscreen" : "Enable Fullscreen"}
          </button>
          
          <span className="hidden sm:inline text-green-500/30">•</span>
          
          <span className="text-green-500/50 font-mono">
            HackaByte Terminal v1.0.2
          </span>
        </div>
      </div>
    </main>
  );
}
