"use client";

import React, { useState, useEffect, useRef } from "react";
import { logger } from '@/lib/logger';

// Type definitions
interface DeviceSettings {
  airplaneMode?: boolean;
  wifiEnabled?: boolean;
  bluetoothEnabled?: boolean;
  notificationsEnabled?: boolean;
  locationEnabled?: boolean;
  brightness?: number;
  volume?: number;
  ringtone?: string;
  network?: string;
  darkMode?: boolean;
  hapticFeedback?: boolean;
  autoUpdateApps?: boolean;
  vibrateEnabled?: boolean;
  autoBrightness?: boolean;
}

interface PinSettings {
  pin?: string | null;
  pinEnabled?: boolean;
}

// ClassicSwitch component for iOS 4 style toggles
const ClassicSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ 
  checked, 
  onChange, 
  disabled = false 
}) => {
  return (
    <div
      className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
        disabled 
          ? "bg-gray-200 cursor-not-allowed" 
          : checked 
            ? "bg-blue-500" 
            : "bg-gray-300"
      }`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-0.5"
        } ${disabled ? "opacity-50" : ""}`}
      />
    </div>
  );
};

const SettingsApp: React.FC = () => {
  // State variables
  const [screen, setScreen] = useState<string>("main");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Connectivity
  const [airplaneModeEnabled, setAirplaneModeEnabled] = useState<boolean>(false);
  const [wifiEnabled, setWifiEnabled] = useState<boolean>(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(true);
  
  // Network and services
  const [network, setNetwork] = useState<string>("Home WiFi");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("Home WiFi");
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [locationEnabled, setLocationEnabled] = useState<boolean>(true);
  
  // Display and audio
  const [brightness, setBrightness] = useState<number>(75);
  const [volume, setVolume] = useState<number>(50);
  const [ringtone, setRingtone] = useState<string>("Default");
  const [darkModeEnabled, setDarkModeEnabled] = useState<boolean>(false);
  const [autoBrightnessEnabled, setAutoBrightnessEnabled] = useState<boolean>(true);
  
  // PIN settings
  const [pinEnabled, setPinEnabled] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>("");
  
  // Additional features
  const [hapticFeedback, setHapticFeedback] = useState<boolean>(true);
  const [autoUpdateApps, setAutoUpdateApps] = useState<boolean>(true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(true);
  const [voiceControlEnabled, setVoiceControlEnabled] = useState<boolean>(false);
  const [largerTextEnabled, setLargerTextEnabled] = useState<boolean>(false);
  const [buttonShapesEnabled, setButtonShapesEnabled] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load settings from database
  const loadSettingsFromDatabase = async () => {
    setIsLoading(true);
    try {
      const deviceMacAddress = localStorage.getItem("device_mac_address");
      if (!deviceMacAddress) {
        logger.warn('No device MAC address found in localStorage');
        setIsLoading(false);
        return;
      }

      // Load device settings
      const deviceResponse = await fetch(`/api/device/settings?deviceMacAddress=${deviceMacAddress}`);
      if (deviceResponse.ok) {
        const deviceData = await deviceResponse.json();
        if (deviceData.success && deviceData.device) {
          const device = deviceData.device;
          
          // Set connectivity settings
          setAirplaneModeEnabled(device.airplaneMode || false);
          setWifiEnabled(device.wifiEnabled !== undefined ? device.wifiEnabled : true);
          setBluetoothEnabled(device.bluetoothEnabled !== undefined ? device.bluetoothEnabled : true);
          setNotificationsEnabled(device.notificationsEnabled !== undefined ? device.notificationsEnabled : true);
          setLocationEnabled(device.locationEnabled !== undefined ? device.locationEnabled : true);
          
          // Set display and audio settings
          setBrightness(device.brightness || 75);
          setVolume(device.volume || 50);
          setRingtone(device.ringtone || "Default");
          setNetwork(device.network || "Home WiFi");
          setDarkModeEnabled(device.darkMode || false);
          setHapticFeedback(device.hapticFeedback !== undefined ? device.hapticFeedback : true);
          setAutoUpdateApps(device.autoUpdateApps !== undefined ? device.autoUpdateApps : true);
          setVibrateEnabled(device.vibrateEnabled !== undefined ? device.vibrateEnabled : true);
          
          // Set PIN settings
          setPinEnabled(!!device.pin);
        }
      }
    } catch (error) {
      logger.error('Failed to load settings from database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      // Fall back to default values if database loading fails
      setAirplaneModeEnabled(false);
      setWifiEnabled(true);
      setBluetoothEnabled(true);
      setNotificationsEnabled(true);
      setLocationEnabled(true);
      setBrightness(75);
      setVolume(50);
      setRingtone("Default");
      setNetwork("Home WiFi");
      setDarkModeEnabled(false);
      setHapticFeedback(true);
      setAutoUpdateApps(true);
      setVibrateEnabled(true);
      setPinEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Load settings from database on component mount
  useEffect(() => {
    loadSettingsFromDatabase();
  }, []);

  // API call helpers
  const updatePinSettings = async (settings: Partial<PinSettings>) => {
    setIsUpdating(true);
    try {
      const deviceMacAddress = localStorage.getItem("device_mac_address");
      if (!deviceMacAddress) {
        logger.warn('No device MAC address found in localStorage');
        return;
      }

      const response = await fetch("/api/device/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceMacAddress, ...settings }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${result.error || 'Unknown error'}`);
      }

      // Update local state based on what was saved
      if (settings.pin !== undefined) {
        setPinEnabled(!!settings.pin);
      }
      if (settings.pinEnabled !== undefined) {
        setPinEnabled(settings.pinEnabled);
      }
    } catch (error) {
      logger.error('Failed to update PIN settings:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateDeviceSettings = async (settings: Partial<DeviceSettings>) => {
    setIsUpdating(true);
    try {
      const deviceMacAddress = localStorage.getItem("device_mac_address");
      if (!deviceMacAddress) {
        logger.warn('No device MAC address found in localStorage');
        return;
      }

      const response = await fetch("/api/device/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceMacAddress, ...settings }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error('Failed to update device settings:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Setting update functions
  const setAirplaneMode = async (v: boolean) => {
    setAirplaneModeEnabled(v);
    if (v) {
      setWifiEnabled(false);
      setBluetoothEnabled(false);
    }
    await updateDeviceSettings({ 
      airplaneMode: v,
      ...(v && { wifiEnabled: false, bluetoothEnabled: false }),
    });
  };

  const setWifi = async (v: boolean) => {
    if (!airplaneModeEnabled) {
      setWifiEnabled(v);
      await updateDeviceSettings({ wifiEnabled: v });
    }
  };

  const setNotifications = async (v: boolean) => {
    setNotificationsEnabled(v);
    await updateDeviceSettings({ notificationsEnabled: v });
  };

  const setLocation = async (v: boolean) => {
    setLocationEnabled(v);
    await updateDeviceSettings({ locationEnabled: v });
  };

  const setBrightnessLevel = async (v: number) => {
    setBrightness(v);
    await updateDeviceSettings({ brightness: v });
  };

  const setVolumeLevel = async (v: number) => {
    setVolume(v);
    await updateDeviceSettings({ volume: v });
  };

  const setRingtoneSelection = async (v: string) => {
    setRingtone(v);
    await updateDeviceSettings({ ringtone: v });
  };

  const setNetworkAndNavigate = async (networkName: string) => {
    setNetwork(networkName);
    setSelectedNetwork(networkName);
    await updateDeviceSettings({ network: networkName });
    setScreen("wifi");
  };

  const setBluetooth = async (v: boolean) => {
    if (!airplaneModeEnabled) {
      setBluetoothEnabled(v);
      await updateDeviceSettings({ bluetoothEnabled: v });
    }
  };

  const setDarkMode = async (v: boolean) => {
    setDarkModeEnabled(v);
    await updateDeviceSettings({ darkMode: v });
  };

  const setHaptic = async (v: boolean) => {
    setHapticFeedback(v);
    await updateDeviceSettings({ hapticFeedback: v });
  };

  const setAutoUpdate = async (v: boolean) => {
    setAutoUpdateApps(v);
    await updateDeviceSettings({ autoUpdateApps: v });
  };

  const setVibrate = async (v: boolean) => {
    setVibrateEnabled(v);
    await updateDeviceSettings({ vibrateEnabled: v });
  };

  // PIN functions
  const setPinToggle = async (v: boolean) => {
    setPinEnabled(v);
    if (!v) {
      // If disabling PIN, clear it from database and reset form
      await updatePinSettings({ pin: null, pinEnabled: false });
      setNewPin("");
      setConfirmPin("");
      setPinError("");
      // Reload settings to reflect the changes
      loadSettingsFromDatabase();
    } else {
      await updatePinSettings({ pinEnabled: true });
    }
  };

  // PIN validation and helper functions
  const validatePin = (pin: string): { isValid: boolean; error: string; strength: string } => {
    if (pin.length === 0) {
      return { isValid: false, error: "", strength: "" };
    }
    if (pin.length !== 4) {
      return { isValid: false, error: "PIN must be exactly 4 digits", strength: "" };
    }
    if (!/^\d+$/.test(pin)) {
      return { isValid: false, error: "PIN must contain only numbers", strength: "" };
    }
    
    return { isValid: true, error: "", strength: "Valid" };
  };

  const handlePinChange = (value: string, type: 'new' | 'confirm') => {
    const numericValue = value.replace(/\D/g, ''); // Only allow digits
    
    if (type === 'new') {
      setNewPin(numericValue);
      const validation = validatePin(numericValue);
      setPinError(validation.error);
      
      // Clear confirm PIN if it doesn't match new PIN
      if (confirmPin && confirmPin !== numericValue) {
        setConfirmPin("");
      }
    } else {
      setConfirmPin(numericValue);
      if (numericValue && numericValue !== newPin) {
        setPinError("PINs do not match");
      } else if (numericValue === newPin) {
        setPinError("");
      }
    }
  };

  const handleChangePin = async () => {
    const validation = validatePin(newPin);
    if (!validation.isValid) {
      setPinError(validation.error);
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }

    try {
      await updatePinSettings({ pin: newPin });
      setNewPin("");
      setConfirmPin("");
      setPinError("");
      alert("PIN updated successfully");
      
      // Reload settings to reflect the changes
      loadSettingsFromDatabase();
    } catch (error) {
      logger.error('Failed to update PIN:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      setPinError("Failed to update PIN. Please try again.");
    }
  };

  const setAutoBrightness = async (v: boolean) => {
    setAutoBrightnessEnabled(v);
    await updateDeviceSettings({ autoBrightness: v });
  };

  // Filter settings based on search query
  const shouldShowSetting = (settingName: string) => {
    if (!searchQuery) return true;
    return settingName.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const shouldShowGroup = (settingNames: string[]) => {
    if (!searchQuery) return true;
    return settingNames.some(name => shouldShowSetting(name));
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-200 text-black">
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-b from-gray-300 to-gray-400 border-b border-gray-500 shadow-inner">
          <div className="w-20"></div>
          <h1 className="text-lg font-bold text-center">Settings</h1>
          <div className="w-20"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⭯</div>
            <div className="text-gray-600">Loading Settings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-200 text-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-b from-gray-300 to-gray-400 border-b border-gray-500 shadow-inner">
        <div className="w-20">
          {screen !== "main" && (
            <button
              onClick={() => setScreen("main")}
              className="text-blue-600 text-base font-medium hover:text-blue-800 transition-colors"
            >
              ‹ Back
            </button>
          )}
        </div>
        <h1 className="text-lg font-bold text-center flex items-center">
          {screen === "main" ? "Settings" :
           screen === "wifi" ? "Wi-Fi" :
           screen === "brightness" ? "Brightness" :
           screen === "sounds" ? "Sounds" :
           screen === "general" ? "General" :
           screen === "about" ? "About" :
           screen === "display" ? "Display & Brightness" :
           screen === "accessibility" ? "Accessibility" :
           screen === "pin" ? "PIN" :
           screen === "notifications" ? "Notifications" : "Settings"}
          {isUpdating && <span className="ml-2 text-sm animate-spin">⭯</span>}
        </h1>
        <div className="w-20"></div>
      </div>

      {/* Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-gray-200"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          willChange: 'scroll-position',
          overscrollBehavior: 'contain',
          scrollPadding: '0',
          touchAction: 'pan-y'
        }}
      >
        {screen === "main" && (
          <div className="pb-8">
            {/* Search Bar */}
            <div className="bg-white border-t border-b border-gray-300 mt-2">
              <div className="px-4 py-2">
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                  <span className="text-gray-400 mr-2">🔍</span>
                  <input
                    type="text"
                    placeholder="Search Settings"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-gray-400 ml-2 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Connectivity Group */}
            {shouldShowGroup(["airplane", "wifi", "bluetooth"]) && (
            <div className="bg-white border-t border-gray-300 border-b mt-4">
              {shouldShowSetting("airplane") && (
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">✈️</span>
                </div>
                <div className="flex-1">
                  <span className="text-base text-black">Airplane Mode</span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <ClassicSwitch checked={airplaneModeEnabled} onChange={setAirplaneMode} />
                </div>
              </div>
              )}

              {shouldShowSetting("wifi") && (
              <div
                className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setScreen("wifi")}
              >
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">📶</span>
                </div>
                <div className="flex-1">
                  <div className="text-base text-black">Wi-Fi</div>
                  <div className="text-sm text-gray-500">
                    {wifiEnabled && !airplaneModeEnabled ? network || "Home WiFi" : "Off"}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}

              {shouldShowSetting("bluetooth") && (
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">🔵</span>
                </div>
                <div className="flex-1">
                  <div className="text-base text-black">Bluetooth</div>
                  <div className="text-sm text-gray-500">{bluetoothEnabled && !airplaneModeEnabled ? "On" : "Off"}</div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <ClassicSwitch 
                    checked={bluetoothEnabled && !airplaneModeEnabled} 
                    onChange={setBluetooth}
                    disabled={airplaneModeEnabled}
                  />
                </div>
              </div>
              )}
            </div>
            )}

            {/* Services Group */}
            {shouldShowGroup(["notification", "location", "carrier"]) && (
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              {shouldShowSetting("notification") && (
              <div
                className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setScreen("notifications")}
              >
                <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">🔔</span>
                </div>
                <div className="flex-1">
                  <span className="text-base text-black">Notifications</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 text-sm mr-2">{notificationsEnabled ? "On" : "Off"}</span>
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}

              {shouldShowSetting("location") && (
              <div
                className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setLocation(!locationEnabled)}
              >
                <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">📍</span>
                </div>
                <div className="flex-1">
                  <span className="text-base text-black">Location Services</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 text-sm mr-2">{locationEnabled ? "On" : "Off"}</span>
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}

              {shouldShowSetting("carrier") && (
              <div className="flex items-center px-4 py-3">
                <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">📱</span>
                </div>
                <div className="flex-1">
                  <span className="text-base text-black">Carrier</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 text-sm mr-2">Verizon</span>
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}
            </div>
            )}

            {/* Display & Sounds Group */}
            {shouldShowGroup(["display", "sound", "brightness"]) && (
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              {shouldShowSetting("display") && (
              <div className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setScreen("display")}>
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">🌟</span>
                </div>
                <div className="flex-1">
                  <span className="text-base text-black">Display & Brightness</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}

              {shouldShowSetting("sound") && (
              <div
                className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setScreen("sounds")}
              >
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">🔊</span>
                </div>
                <div className="flex-1">
                  <div className="text-base text-black">Sounds & Haptics</div>
                  <div className="text-sm text-gray-500">{ringtone}</div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}

              {shouldShowSetting("brightness") && (
              <div className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setScreen("brightness")}>
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">☀️</span>
                </div>
                <div className="flex-1">
                  <div className="text-base text-black">Brightness</div>
                  <div className="text-sm text-gray-500">{brightness}%</div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}
            </div>
            )}

            {/* General & System Group */}
            {shouldShowGroup(["general", "privacy", "about", "accessibility"]) && (
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              {shouldShowSetting("general") && (
              <div
                className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setScreen("general")}
              >
                <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">⚙️</span>
                </div>
                <div className="flex-1">
                  <span className="text-base text-black">General</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}

              {shouldShowSetting("accessibility") && (
              <div className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setScreen("accessibility")}>
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">♿</span>
                </div>
                <div className="flex-1">
                  <span className="text-base text-black">Accessibility</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}

              {shouldShowSetting("privacy") && (
              <div className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">🔒</span>
                </div>
                <div className="flex-1">
                  <span className="text-base text-black">Privacy</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}

              {shouldShowSetting("about") && (
              <div
                className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setScreen("about")}
              >
                <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">ℹ️</span>
                </div>
                <div className="flex-1">
                  <span className="text-base text-black">About</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}
            </div>
            )}

            {/* PIN Group */}
            {shouldShowGroup(["pin"]) && (
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              {shouldShowSetting("pin") && (
              <div className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setScreen("pin")}>
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">�</span>
                </div>
                <div className="flex-1">
                  <span className="text-base text-black">PIN</span>
                  <div className="text-sm text-gray-500">{pinEnabled ? "Enabled" : "Disabled"}</div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
              )}
            </div>
            )}

            {/* Version Info Footer */}
            <div className="mt-8 px-4 text-center text-xs text-gray-400">
              <div>HackPhone OS</div>
              <div>Version 4.3.1 (8F455)</div>
              <div className="mt-2">© 2025 HackaByte Corp.</div>
            </div>
          </div>
        )}

        {/* Wi-Fi Screen */}
        {screen === "wifi" && (
          <div className="pb-8">
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="flex-1">
                  <span className="text-base text-black">Wi-Fi</span>
                </div>
                <ClassicSwitch 
                  checked={wifiEnabled && !airplaneModeEnabled} 
                  onChange={setWifi}
                  disabled={airplaneModeEnabled}
                />
              </div>
            </div>

            {wifiEnabled && !airplaneModeEnabled && (
              <div className="bg-white border-t border-b border-gray-300 mt-4">
                <div className="px-4 py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 uppercase tracking-wide">Choose a Network...</span>
                </div>
                {["Home WiFi", "Guest Network", "CoffeeShop_WiFi", "Office_5G", "Neighbor_WiFi"].map((net) => (
                  <div
                    key={net}
                    className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setNetworkAndNavigate(net)}
                  >
                    <div className="flex-1">
                      <div className="text-base text-black">{net}</div>
                      {net === selectedNetwork && <div className="text-xs text-blue-600">✓ Connected</div>}
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg">📶</span>
                      <span className="text-gray-400 text-lg ml-2">ℹ️</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {airplaneModeEnabled && (
              <div className="bg-white border-t border-b border-gray-300 mt-4">
                <div className="px-4 py-8 text-center">
                  <div className="text-gray-500 text-base">Wi-Fi is disabled in Airplane Mode</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Display & Brightness Screen */}
        {screen === "display" && (
          <div className="pb-8">
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              {/* Brightness */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base text-black">Brightness</span>
                  <span className="text-sm text-gray-500">{brightness}%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🌑</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightnessLevel(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${brightness}%, #e5e7eb ${brightness}%, #e5e7eb 100%)`
                    }}
                  />
                  <span className="text-lg">☀️</span>
                </div>
              </div>

              {/* Auto-Brightness */}
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="flex-1">
                  <span className="text-base text-black">Auto-Brightness</span>
                </div>
                <ClassicSwitch checked={autoBrightnessEnabled} onChange={setAutoBrightness} />
              </div>

              {/* Dark Mode */}
              <div className="flex items-center px-4 py-3">
                <div className="flex-1">
                  <div className="text-base text-black">Dark Mode</div>
                  <div className="text-sm text-gray-500">Automatically turn on at sunset</div>
                </div>
                <ClassicSwitch checked={darkModeEnabled} onChange={setDarkMode} />
              </div>
            </div>
          </div>
        )}

        {/* Sounds & Haptics Screen */}
        {screen === "sounds" && (
          <div className="pb-8">
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              {/* Volume */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base text-black">Ringer Volume</span>
                  <span className="text-sm text-gray-500">{volume}%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🔇</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolumeLevel(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #e5e7eb ${volume}%, #e5e7eb 100%)`
                    }}
                  />
                  <span className="text-lg">🔊</span>
                </div>
              </div>

              {/* Vibrate */}
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="flex-1">
                  <span className="text-base text-black">Vibrate on Ring</span>
                </div>
                <ClassicSwitch checked={vibrateEnabled} onChange={setVibrate} />
              </div>

              {/* Haptic Feedback */}
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="flex-1">
                  <div className="text-base text-black">Haptic Feedback</div>
                  <div className="text-sm text-gray-500">Feel vibrations for interactions</div>
                </div>
                <ClassicSwitch checked={hapticFeedback} onChange={setHaptic} />
              </div>

              {/* Ringtone */}
              <div className="flex items-center px-4 py-3">
                <div className="flex-1">
                  <div className="text-base text-black">Ringtone</div>
                  <div className="text-sm text-blue-600">{ringtone}</div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
            </div>

            {/* Ringtone Selection */}
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              <div className="px-4 py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600 uppercase tracking-wide">Select Ringtone</span>
              </div>
              {["Default", "Classic", "Digital", "Marimba", "Xylophone", "Bell"].map((tone) => (
                <div
                  key={tone}
                  className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setRingtoneSelection(tone)}
                >
                  <div className="flex-1">
                    <div className="text-base text-black">{tone}</div>
                  </div>
                  {tone === ringtone && <div className="text-blue-600">✓</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility Screen */}
        {screen === "accessibility" && (
          <div className="pb-8">
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              {/* Voice Control */}
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="flex-1">
                  <div className="text-base text-black">Voice Control</div>
                  <div className="text-sm text-gray-500">Control your device with voice commands</div>
                </div>
                <ClassicSwitch checked={voiceControlEnabled} onChange={setVoiceControlEnabled} />
              </div>

              {/* Haptic Feedback */}
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="flex-1">
                  <div className="text-base text-black">Haptic Feedback</div>
                  <div className="text-sm text-gray-500">Feel vibrations for interactions</div>
                </div>
                <ClassicSwitch checked={hapticFeedback} onChange={setHaptic} />
              </div>

              {/* Larger Text */}
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="flex-1">
                  <span className="text-base text-black">Larger Text</span>
                </div>
                <ClassicSwitch checked={largerTextEnabled} onChange={setLargerTextEnabled} />
              </div>

              {/* Button Shapes */}
              <div className="flex items-center px-4 py-3">
                <div className="flex-1">
                  <div className="text-base text-black">Button Shapes</div>
                  <div className="text-sm text-gray-500">Show button outlines</div>
                </div>
                <ClassicSwitch checked={buttonShapesEnabled} onChange={setButtonShapesEnabled} />
              </div>
            </div>
          </div>
        )}

        {/* PIN Screen */}
        {screen === "pin" && (
          <div className="pb-8">
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              {/* PIN Toggle */}
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center mr-3">
                  <span className="text-white text-lg">�</span>
                </div>
                <div className="flex-1">
                  <div className="text-base text-black">Enable PIN</div>
                  <div className="text-sm text-gray-500">Require PIN to unlock device</div>
                </div>
                <ClassicSwitch checked={pinEnabled} onChange={setPinToggle} />
              </div>

              {pinEnabled && (
                <>
                  {/* New PIN */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">New PIN</div>
                      <button
                        onClick={() => setShowPin(!showPin)}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {showPin ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        value={newPin}
                        onChange={(e) => handlePinChange(e.target.value, 'new')}
                        placeholder="Enter 4-digit PIN"
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-colors ${
                          pinError && newPin ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                        }`}
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      {newPin && newPin.length === 4 && !pinError && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-green-500 text-sm">✓</span>
                        </div>
                      )}
                    </div>
                    {pinError && newPin && (
                      <div className="text-xs text-red-600 mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {pinError}
                      </div>
                    )}
                  </div>

                  {/* Confirm PIN */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Confirm PIN</div>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        value={confirmPin}
                        onChange={(e) => handlePinChange(e.target.value, 'confirm')}
                        placeholder="Confirm 4-digit PIN"
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-colors ${
                          pinError && confirmPin ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                        }`}
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={!newPin || !!validatePin(newPin).error}
                      />
                      {confirmPin && newPin === confirmPin && confirmPin.length === 4 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-green-500 text-sm">✓</span>
                        </div>
                      )}
                    </div>
                    {pinError && confirmPin && pinError.includes("match") && (
                      <div className="text-xs text-red-600 mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {pinError}
                      </div>
                    )}
                  </div>

                  {/* Change PIN Button */}
                  <div className="px-4 py-3">
                    <button
                      onClick={handleChangePin}
                      disabled={newPin.length !== 4 || confirmPin.length !== 4 || newPin !== confirmPin}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin
                        ? "✓ Set PIN"
                        : "Set PIN"
                      }
                    </button>
                  </div>

                  {/* PIN Status */}
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">PIN Status</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600 font-medium">Enabled</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Your device is protected with a PIN
                    </div>
                  </div>
                </>
              )}

              {!pinEnabled && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">PIN Status</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-500">Disabled</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Enable PIN for additional security
                  </div>
                </div>
              )}
            </div>

            {/* PIN Management Options */}
            {pinEnabled && (
              <div className="bg-white border-t border-b border-gray-300 mt-4">
                <div className="px-4 py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 uppercase tracking-wide">PIN Options</span>
                </div>
                
                <div className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🔄</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-base text-black">Change PIN</div>
                    <div className="text-sm text-gray-500">Update your current PIN</div>
                  </div>
                  <div className="text-gray-400 text-lg">›</div>
                </div>

                <div 
                  className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setPinToggle(false)}
                >
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🗑️</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-base text-black">Remove PIN</div>
                    <div className="text-sm text-gray-500">Disable PIN protection</div>
                  </div>
                  <div className="text-gray-400 text-lg">›</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Screen */}
        {screen === "notifications" && (
          <div className="pb-8">
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="flex-1">
                  <span className="text-base text-black">Allow Notifications</span>
                </div>
                <ClassicSwitch checked={notificationsEnabled} onChange={setNotifications} />
              </div>
            </div>

            {notificationsEnabled && (
              <div className="bg-white border-t border-b border-gray-300 mt-4">
                <div className="px-4 py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 uppercase tracking-wide">App Notifications</span>
                </div>
                {["Messages", "Mail", "Safari", "Camera", "Maps", "Weather"].map((app) => (
                  <div key={app} className="flex items-center px-4 py-3 border-b border-gray-200">
                    <div className="flex-1">
                      <span className="text-base text-black">{app}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-blue-600 text-sm mr-2">On</span>
                      <span className="text-gray-400 text-lg">›</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* General Screen */}
        {screen === "general" && (
          <div className="pb-8">
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              {/* Auto-Update */}
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <div className="flex-1">
                  <div className="text-base text-black">Auto-Update Apps</div>
                  <div className="text-sm text-gray-500">Automatically update apps in background</div>
                </div>
                <ClassicSwitch checked={autoUpdateApps} onChange={setAutoUpdate} />
              </div>

              {/* Reset Options */}
              <div className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <span className="text-base text-black">Reset</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>

              {/* Storage */}
              <div className="flex items-center px-4 py-3">
                <div className="flex-1">
                  <div className="text-base text-black">Storage</div>
                  <div className="text-sm text-gray-500">12.3 GB used of 32 GB</div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About Screen */}
        {screen === "about" && (
          <div className="pb-8">
            <div className="bg-white border-t border-b border-gray-300 mt-4">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="text-base text-black">Device Name</div>
                <div className="text-sm text-blue-600">HackPhone</div>
              </div>
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="text-base text-black">Software Version</div>
                <div className="text-sm text-gray-500">HackPhone OS 4.3.1</div>
              </div>
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="text-base text-black">Model</div>
                <div className="text-sm text-gray-500">HackPhone 4S</div>
              </div>
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="text-base text-black">Serial Number</div>
                <div className="text-sm text-gray-500">HC4S123456789</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-base text-black">Build</div>
                <div className="text-sm text-gray-500">8F455</div>
              </div>
            </div>

            <div className="bg-white border-t border-b border-gray-300 mt-4">
              <div className="px-4 py-3">
                <div className="text-center text-sm text-gray-600">
                  Developed by HackaByte Corp.
                </div>
                <div className="text-center text-xs text-gray-400 mt-1">
                  © 2025 All rights reserved
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsApp;
