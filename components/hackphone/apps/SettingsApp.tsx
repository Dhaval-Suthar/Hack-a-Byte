"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

// Import setting icons
import airplaneIcon from "../airplane.png";
import wifiIcon from "../wifi.png";
import vpnIcon from "../vpn.png";
import personalHotspotIcon from "../personalhotspot.png";
import notificationsIcon from "../notifications.png";
import locServicesIcon from "../locservices.png";
import soundsIcon from "../sounds.png";
import brightnessIcon from "../brightness.png";

interface SettingsAppProps {
  onClose?: () => void;
  onBack?: () => void;
}

const STORAGE_KEYS = {
  VPN: "hp_vpn_enabled",
  NETWORK: "hp_network",
  ENCRYPTION: "hp_encryption",
  PASSCODE: "hackphone_password",
  PIN: "hackphone_pin",
  AIRPLANE_MODE: "hp_airplane_mode",
  WIFI_ENABLED: "hp_wifi_enabled",
  NOTIFICATIONS: "hp_notifications",
  LOCATION: "hp_location",
  DEVICE_LOCK: "hp_device_lock",
};

const availableNetworks = ["Home WiFi", "Office WiFi", "Guest Network", "Mobile Data"];

const SettingsApp: React.FC<SettingsAppProps> = ({ onClose, onBack }) => {
  const [vpnEnabled, setVpnEnabled] = useState(false);
  const [network, setNetwork] = useState<string | null>(null);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [passcode, setPasscode] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [airplaneModeEnabled, setAirplaneModeEnabled] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [deviceLockEnabled, setDeviceLockEnabled] = useState(false);

  // simple screen routing: 'main' | 'wifi' | 'vpn' | 'passcode' | 'pin' | 'encryption' | 'lock'
  const [screen, setScreen] = useState<string>("main");
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVpnEnabled(localStorage.getItem(STORAGE_KEYS.VPN) === "1");
    setNetwork(localStorage.getItem(STORAGE_KEYS.NETWORK) || availableNetworks[0]);
    setEncryptionEnabled(localStorage.getItem(STORAGE_KEYS.ENCRYPTION) === "1");
    setPasscode(localStorage.getItem(STORAGE_KEYS.PASSCODE));
    setPin(localStorage.getItem(STORAGE_KEYS.PIN));
    setAirplaneModeEnabled(localStorage.getItem(STORAGE_KEYS.AIRPLANE_MODE) === "1");
    setWifiEnabled(localStorage.getItem(STORAGE_KEYS.WIFI_ENABLED) !== "0");
    setNotificationsEnabled(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) !== "0");
    setLocationEnabled(localStorage.getItem(STORAGE_KEYS.LOCATION) !== "0");
    setDeviceLockEnabled(localStorage.getItem(STORAGE_KEYS.DEVICE_LOCK) === "1");
  }, []);

  const setVpn = (v: boolean) => {
    setVpnEnabled(v);
    localStorage.setItem(STORAGE_KEYS.VPN, v ? "1" : "0");
  };

  const setAirplaneMode = (v: boolean) => {
    setAirplaneModeEnabled(v);
    localStorage.setItem(STORAGE_KEYS.AIRPLANE_MODE, v ? "1" : "0");
    if (v) {
      setWifiEnabled(false);
      localStorage.setItem(STORAGE_KEYS.WIFI_ENABLED, "0");
    }
  };

  const setWifi = (v: boolean) => {
    if (!airplaneModeEnabled) {
      setWifiEnabled(v);
      localStorage.setItem(STORAGE_KEYS.WIFI_ENABLED, v ? "1" : "0");
    }
  };

  const setNotifications = (v: boolean) => {
    setNotificationsEnabled(v);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, v ? "1" : "0");
  };

  const setLocation = (v: boolean) => {
    setLocationEnabled(v);
    localStorage.setItem(STORAGE_KEYS.LOCATION, v ? "1" : "0");
  };

  const setDeviceLock = (v: boolean) => {
    setDeviceLockEnabled(v);
    localStorage.setItem(STORAGE_KEYS.DEVICE_LOCK, v ? "1" : "0");
  };

  const setNetworkAndNavigate = (n: string) => {
    setNetwork(n);
    localStorage.setItem(STORAGE_KEYS.NETWORK, n);
    // open Wi‑Fi detail screen
    setSelectedNetwork(n);
    setScreen("wifi");
  };

  const setEncryption = (v: boolean) => {
    setEncryptionEnabled(v);
    localStorage.setItem(STORAGE_KEYS.ENCRYPTION, v ? "1" : "0");
  };

  const savePasscode = (value: string) => {
    localStorage.setItem(STORAGE_KEYS.PASSCODE, value);
    setPasscode(value);
  };

  const removePasscode = () => {
    localStorage.removeItem(STORAGE_KEYS.PASSCODE);
    setPasscode(null);
  };

  const savePin = (value: string) => {
    localStorage.setItem(STORAGE_KEYS.PIN, value);
    setPin(value);
  };

  const removePin = () => {
    localStorage.removeItem(STORAGE_KEYS.PIN);
    setPin(null);
  };

  /* iPhone 4-style ON/OFF switch (pure inline styles to avoid Tailwind dynamic classes) */
  const ClassicSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => {
    const width = 72;
    const height = 27;
    const knobSize = 23;
    const padding = 1;

    const containerStyle: React.CSSProperties = {
      width,
      height,
      borderRadius: 4,
      background: checked ? '#4cd964' : '#e5e5ea',
      border: '1px solid #d1d1d6',
      position: 'relative',
      display: 'inline-block',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'background-color 0.2s ease, border-color 0.2s ease',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)',
    };

    const knobStyle: React.CSSProperties = {
      width: knobSize,
      height: knobSize,
      borderRadius: 2,
      background: 'linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%)',
      border: '1px solid #b3b3b3',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)',
      position: 'absolute',
      top: padding,
      left: checked ? width - knobSize - padding : padding,
      transition: 'left 0.25s ease-in-out',
      zIndex: 2,
    };

    const onLabelStyle: React.CSSProperties = {
      position: 'absolute',
      left: 8,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: 11,
      fontWeight: 'bold',
      color: checked ? '#ffffff' : 'transparent',
      transition: 'color 0.2s ease',
      zIndex: 1,
      textShadow: checked ? '0 -1px 0 rgba(0,0,0,0.25)' : 'none',
    };

    const offLabelStyle: React.CSSProperties = {
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: 11,
      fontWeight: 'bold',
      color: checked ? 'transparent' : '#8e8e93',
      transition: 'color 0.2s ease',
      zIndex: 1,
      textShadow: checked ? 'none' : '0 1px 0 rgba(255,255,255,0.5)',
    };

    return (
      <div 
        role="switch" 
        aria-checked={checked} 
        tabIndex={0} 
        onKeyDown={(e) => { 
          if (e.key === 'Enter' || e.key === ' ') { 
            e.preventDefault();
            e.stopPropagation();
            onChange(!checked); 
          } 
        }} 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChange(!checked);
        }} 
        style={containerStyle}
      >
        <div style={onLabelStyle}>ON</div>
        <div style={offLabelStyle}>OFF</div>
        <div style={knobStyle} />
      </div>
    );
  };

  /* Screens */
  const MainScreen = () => (
    <div className="w-screen h-screen bg-gray-200 flex flex-col text-sm">
      {/* Header */}
      <div className="h-11 bg-gradient-to-b from-slate-400 to-slate-500 text-white flex items-center justify-center border-b border-slate-600">
        <h1 className="text-lg font-bold text-center text-white drop-shadow-sm">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-200" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="space-y-0 pb-4">
          
          {/* First Group */}
          <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
            {/* Airplane Mode */}
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center mr-3">
                <Image src={airplaneIcon} alt="Airplane Mode" width={18} height={16} className="filter brightness-0 invert" />
              </div>
              <div className="flex-1">
                <span className="text-base text-black">Airplane Mode</span>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ClassicSwitch checked={airplaneModeEnabled} onChange={setAirplaneMode} />
              </div>
            </div>

            {/* Wi-Fi */}
            <div className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer" onClick={() => setScreen('wifi')}>
              <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                <Image src={wifiIcon} alt="Wi-Fi" width={18} height={16} className="filter brightness-0 invert" />
              </div>
              <div className="flex-1">
                <div className="text-base text-black">Wi-Fi</div>
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 text-sm mr-2">{wifiEnabled && !airplaneModeEnabled ? (network || 'On') : 'Off'}</span>
                <span className="text-gray-400 text-lg">›</span>
              </div>
            </div>

            {/* VPN */}
            <div className="flex items-center px-4 py-3">
              <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                <Image src={vpnIcon} alt="VPN" width={18} height={16} className="filter brightness-0 invert" />
              </div>
              <div className="flex-1 cursor-pointer" onClick={() => setScreen('vpn')}>
                <span className="text-base text-black">VPN</span>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ClassicSwitch checked={vpnEnabled && !airplaneModeEnabled} onChange={(v) => !airplaneModeEnabled && setVpn(v)} />
              </div>
            </div>
          </div>

          {/* Second Group */}
          <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
            {/* Personal Hotspot */}
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                <Image src={personalHotspotIcon} alt="Personal Hotspot" width={18} height={16} className="filter brightness-0 invert" />
              </div>
              <div className="flex-1">
                <span className="text-base text-black">Personal Hotspot</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 text-sm mr-2">Off</span>
                <span className="text-gray-400 text-lg">›</span>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center mr-3">
                <Image src={notificationsIcon} alt="Notifications" width={18} height={16} className="filter brightness-0 invert" />
              </div>
              <div className="flex-1">
                <span className="text-base text-black">Notifications</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 text-sm mr-2">{notificationsEnabled ? 'On' : 'Off'}</span>
                <span className="text-gray-400 text-lg">›</span>
              </div>
            </div>

            {/* Location Services */}
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                <Image src={locServicesIcon} alt="Location Services" width={18} height={16} className="filter brightness-0 invert" />
              </div>
              <div className="flex-1">
                <span className="text-base text-black">Location Services</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 text-sm mr-2">{locationEnabled ? 'On' : 'Off'}</span>
                <span className="text-gray-400 text-lg">›</span>
              </div>
            </div>

            {/* Carrier */}
            <div className="flex items-center px-4 py-3">
              <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                <span className="text-white text-sm">📱</span>
              </div>
              <div className="flex-1">
                <span className="text-base text-black">Carrier</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 text-sm mr-2">ROGERS</span>
                <span className="text-gray-400 text-lg">›</span>
              </div>
            </div>
          </div>

          {/* Third Group */}
          <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
            {/* Sounds */}
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mr-3">
                <Image src={soundsIcon} alt="Sounds" width={18} height={16} className="filter brightness-0 invert" />
              </div>
              <div className="flex-1">
                <span className="text-base text-black">Sounds</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 text-lg">›</span>
              </div>
            </div>

            {/* Brightness */}
            <div className="flex items-center px-4 py-3">
              <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                <Image src={brightnessIcon} alt="Brightness" width={18} height={16} className="filter brightness-0 invert" />
              </div>
              <div className="flex-1">
                <span className="text-base text-black">Brightness</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 text-lg">›</span>
              </div>
            </div>
          </div>

          {/* Security Group */}
          <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
            {/* Device Lock */}
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mr-3">
                <span className="text-white text-sm">🔐</span>
              </div>
              <div className="flex-1">
                <span className="text-base text-black">Device Lock</span>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ClassicSwitch checked={deviceLockEnabled} onChange={setDeviceLock} />
              </div>
            </div>

            {/* Encryption */}
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center mr-3">
                <span className="text-white text-sm">🔒</span>
              </div>
              <div className="flex-1">
                <span className="text-base text-black">Encryption</span>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ClassicSwitch checked={encryptionEnabled} onChange={(v) => setEncryption(v)} />
              </div>
            </div>

            {/* Passcode */}
            <div className="flex items-center px-4 py-3 border-b border-gray-200 cursor-pointer" onClick={() => setScreen('passcode')}>
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mr-3">
                <span className="text-white text-sm">🔑</span>
              </div>
              <div className="flex-1">
                <span className="text-base text-black">Passcode Lock</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 text-sm mr-2">{passcode ? 'On' : 'Off'}</span>
                <span className="text-gray-400 text-lg">›</span>
              </div>
            </div>

            {/* PIN */}
            <div className="flex items-center px-4 py-3 cursor-pointer" onClick={() => setScreen('pin')}>
              <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center mr-3">
                <span className="text-white text-sm">#</span>
              </div>
              <div className="flex-1">
                <span className="text-base text-black">PIN Lock</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 text-sm mr-2">{pin ? 'On' : 'Off'}</span>
                <span className="text-gray-400 text-lg">›</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  const WifiScreen = () => (
    <div className="w-screen h-screen bg-gray-200 flex flex-col text-sm">
      {/* Header with Back Button */}
      <div className="h-11 bg-gradient-to-b from-slate-400 to-slate-500 text-white flex items-center justify-between px-4 border-b border-slate-600">
        <button onClick={() => setScreen('main')} className="text-white text-base">‹ Settings</button>
        <h1 className="text-lg font-bold text-white drop-shadow-sm">Wi-Fi</h1>
        <div className="w-20"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-200">
        <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-base text-black">Wi-Fi</span>
              <ClassicSwitch 
                checked={wifiEnabled && !airplaneModeEnabled} 
                onChange={(v) => setWifi(v)} 
              />
            </div>
          </div>
          {wifiEnabled && !airplaneModeEnabled && network && (
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base text-black">{selectedNetwork || network}</div>
                  <div className="text-sm text-blue-600">✓</div>
                </div>
                <div className="text-blue-600 text-base">ⓘ</div>
              </div>
            </div>
          )}
        </div>

        {(!wifiEnabled || airplaneModeEnabled) && (
          <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
            <div className="px-4 py-8 text-center">
              <div className="text-base text-gray-500">
                {airplaneModeEnabled ? 'Turn off Airplane Mode to use Wi-Fi' : 'No Wi-Fi networks available'}
              </div>
            </div>
          </div>
        )}

        {wifiEnabled && !airplaneModeEnabled && (
          <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="text-sm text-gray-500 uppercase">Choose a Network...</div>
            </div>
            {availableNetworks.map((n) => (
              <div key={n} className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 last:border-b-0 ${n === network ? 'bg-blue-50' : ''}`} onClick={() => setNetworkAndNavigate(n)}>
                <div className="text-base text-black">{n}</div>
                {n === network && <div className="text-blue-600">✓</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const VpnScreen = () => (
    <div className="w-screen h-screen bg-gray-200 flex flex-col text-sm">
      {/* Header with Back Button */}
      <div className="h-11 bg-gradient-to-b from-slate-400 to-slate-500 text-white flex items-center justify-between px-4 border-b border-slate-600">
        <button onClick={() => setScreen('main')} className="text-white text-base">‹ Settings</button>
        <h1 className="text-lg font-bold text-white drop-shadow-sm">VPN</h1>
        <div className="w-20"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-200">
        <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-base text-black">VPN</span>
              <ClassicSwitch 
                checked={vpnEnabled && !airplaneModeEnabled} 
                onChange={(v) => !airplaneModeEnabled && setVpn(v)} 
              />
            </div>
          </div>
          {vpnEnabled && !airplaneModeEnabled && (
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="text-base text-black">Connected</div>
              <div className="text-sm text-blue-600">example.vpn.server</div>
            </div>
          )}
          {airplaneModeEnabled && (
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="text-base text-gray-500">Turn off Airplane Mode to use VPN</div>
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
          <div className="px-4 py-3">
            <div className="text-base text-blue-600">Add VPN Configuration...</div>
          </div>
        </div>
      </div>
    </div>
  );

  const PasscodeScreen = () => {
    const [newPasscode, setNewPasscode] = useState("");
    const [confirmPasscode, setConfirmPasscode] = useState("");
    const [currentPasscode, setCurrentPasscode] = useState("");
    const [step, setStep] = useState<'main' | 'enter-current' | 'enter-new' | 'confirm-new'>('main');

    const resetForm = () => {
      setNewPasscode("");
      setConfirmPasscode("");
      setCurrentPasscode("");
      setStep('main');
    };

    const handleSetPasscode = () => {
      if (newPasscode && newPasscode === confirmPasscode && newPasscode.length >= 4) {
        savePasscode(newPasscode);
        setScreen('main');
        resetForm();
      }
    };

    const handleChangePasscode = () => {
      if (currentPasscode === passcode && newPasscode && newPasscode === confirmPasscode && newPasscode.length >= 4) {
        savePasscode(newPasscode);
        setScreen('main');
        resetForm();
      }
    };

    const handleRemovePasscode = () => {
      if (currentPasscode === passcode) {
        removePasscode();
        setScreen('main');
        resetForm();
      }
    };

    const verifyCurrentPasscode = () => {
      if (currentPasscode === passcode) {
        if (step === 'enter-current' && newPasscode) {
          // Coming from change passcode flow
          return true;
        }
        return true;
      }
      return false;
    };

    return (
      <div className="w-screen h-screen bg-gray-200 flex flex-col text-sm">
        {/* Header with Back Button */}
        <div className="h-11 bg-gradient-to-b from-slate-400 to-slate-500 text-white flex items-center justify-between px-4 border-b border-slate-600">
          <button onClick={() => { setScreen('main'); resetForm(); }} className="text-white text-base">‹ Settings</button>
          <h1 className="text-lg font-bold text-white drop-shadow-sm">Passcode Lock</h1>
          <div className="w-20"></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-200">
          {!passcode ? (
            // Set new passcode flow
            <>
              <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="text-base text-black">Turn Passcode On</div>
                  <div className="text-xs text-gray-500 mt-1">A passcode protects the data on this iPhone.</div>
                </div>
                <div className="px-4 py-3 border-b border-gray-200">
                  <input 
                    type="password" 
                    value={newPasscode} 
                    onChange={(e) => setNewPasscode(e.target.value)} 
                    placeholder="Enter a passcode" 
                    className="w-full px-0 py-2 border-0 border-b border-gray-300 bg-transparent text-base focus:outline-none focus:border-blue-500" 
                    autoFocus
                  />
                </div>
                <div className="px-4 py-3">
                  <input 
                    type="password" 
                    value={confirmPasscode} 
                    onChange={(e) => setConfirmPasscode(e.target.value)} 
                    placeholder="Re-enter your passcode" 
                    className="w-full px-0 py-2 border-0 border-b border-gray-300 bg-transparent text-base focus:outline-none focus:border-blue-500" 
                  />
                </div>
              </div>

              {newPasscode && confirmPasscode && (
                <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                  <div className="px-4 py-3">
                    <button 
                      onClick={handleSetPasscode}
                      className={`w-full text-center text-base ${
                        newPasscode === confirmPasscode && newPasscode.length >= 4 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                      }`}
                      disabled={!newPasscode || newPasscode !== confirmPasscode || newPasscode.length < 4}
                    >
                      Set Passcode
                    </button>
                  </div>
                </div>
              )}

              {newPasscode && confirmPasscode && newPasscode !== confirmPasscode && (
                <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                  <div className="px-4 py-3">
                    <div className="text-center text-red-600 text-sm">Passcodes did not match. Try again.</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Manage existing passcode
            <>
              <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                <div className="px-4 py-3 border-b border-gray-200">
                  <button 
                    onClick={() => setStep('enter-current')} 
                    className="w-full text-left text-base text-black"
                  >
                    Change Passcode
                    <span className="text-gray-400 float-right">›</span>
                  </button>
                </div>
                <div className="px-4 py-3">
                  <button 
                    onClick={() => setStep('enter-current')} 
                    className="w-full text-left text-base text-red-600"
                  >
                    Turn Passcode Off
                    <span className="text-gray-400 float-right">›</span>
                  </button>
                </div>
              </div>

              {step === 'enter-current' && (
                <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-base text-black">Enter Passcode</div>
                    <div className="text-xs text-gray-500 mt-1">Enter your current passcode</div>
                  </div>
                  <div className="px-4 py-3">
                    <input 
                      type="password" 
                      value={currentPasscode} 
                      onChange={(e) => setCurrentPasscode(e.target.value)} 
                      placeholder="Current passcode" 
                      className="w-full px-0 py-2 border-0 border-b border-gray-300 bg-transparent text-base focus:outline-none focus:border-blue-500" 
                      autoFocus
                    />
                  </div>
                  {currentPasscode && (
                    <div className="px-4 py-3 border-t border-gray-200">
                      <button 
                        onClick={() => {
                          if (verifyCurrentPasscode()) {
                            handleRemovePasscode();
                          }
                        }}
                        className={`w-full text-center text-base ${
                          currentPasscode === passcode ? 'text-red-600' : 'text-gray-400'
                        }`}
                        disabled={currentPasscode !== passcode}
                      >
                        Turn Passcode Off
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentPasscode && currentPasscode !== passcode && step === 'enter-current' && (
                <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                  <div className="px-4 py-3">
                    <div className="text-center text-red-600 text-sm">Incorrect passcode. Try again.</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const PinScreen = () => {
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [currentPin, setCurrentPin] = useState("");
    const [step, setStep] = useState<'main' | 'enter-current' | 'enter-new' | 'confirm-new'>('main');

    const resetForm = () => {
      setNewPin("");
      setConfirmPin("");
      setCurrentPin("");
      setStep('main');
    };

    const handleSetPin = () => {
      if (newPin && newPin === confirmPin && newPin.length >= 4) {
        savePin(newPin);
        setScreen('main');
        resetForm();
      }
    };

    const handleChangePin = () => {
      if (currentPin === pin && newPin && newPin === confirmPin && newPin.length >= 4) {
        savePin(newPin);
        setScreen('main');
        resetForm();
      }
    };

    const handleRemovePin = () => {
      if (currentPin === pin) {
        removePin();
        setScreen('main');
        resetForm();
      }
    };

    const verifyCurrentPin = () => {
      if (currentPin === pin) {
        if (step === 'enter-current' && newPin) {
          // Coming from change PIN flow
          return true;
        }
        return true;
      }
      return false;
    };

    return (
      <div className="w-screen h-screen bg-gray-200 flex flex-col text-sm">
        {/* Header with Back Button */}
        <div className="h-11 bg-gradient-to-b from-slate-400 to-slate-500 text-white flex items-center justify-between px-4 border-b border-slate-600">
          <button onClick={() => { setScreen('main'); resetForm(); }} className="text-white text-base">‹ Settings</button>
          <h1 className="text-lg font-bold text-white drop-shadow-sm">PIN Lock</h1>
          <div className="w-20"></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-200">
          {!pin ? (
            // Set new PIN flow
            <>
              <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="text-base text-black">Turn PIN On</div>
                  <div className="text-xs text-gray-500 mt-1">A PIN provides quick access to your device.</div>
                </div>
                <div className="px-4 py-3 border-b border-gray-200">
                  <input 
                    type="password" 
                    value={newPin} 
                    onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))} 
                    placeholder="Enter a PIN (4-6 digits)" 
                    className="w-full px-0 py-2 border-0 border-b border-gray-300 bg-transparent text-base focus:outline-none focus:border-blue-500" 
                    maxLength={6} 
                    autoFocus
                  />
                </div>
                <div className="px-4 py-3">
                  <input 
                    type="password" 
                    value={confirmPin} 
                    onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))} 
                    placeholder="Re-enter your PIN" 
                    className="w-full px-0 py-2 border-0 border-b border-gray-300 bg-transparent text-base focus:outline-none focus:border-blue-500" 
                    maxLength={6} 
                  />
                </div>
              </div>

              {newPin && confirmPin && (
                <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                  <div className="px-4 py-3">
                    <button 
                      onClick={handleSetPin}
                      className={`w-full text-center text-base ${
                        newPin === confirmPin && newPin.length >= 4 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                      }`}
                      disabled={!newPin || newPin !== confirmPin || newPin.length < 4}
                    >
                      Set PIN
                    </button>
                  </div>
                </div>
              )}

              {newPin && confirmPin && newPin !== confirmPin && (
                <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                  <div className="px-4 py-3">
                    <div className="text-center text-red-600 text-sm">PINs did not match. Try again.</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Manage existing PIN
            <>
              <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                <div className="px-4 py-3 border-b border-gray-200">
                  <button 
                    onClick={() => setStep('enter-current')} 
                    className="w-full text-left text-base text-black"
                  >
                    Change PIN
                    <span className="text-gray-400 float-right">›</span>
                  </button>
                </div>
                <div className="px-4 py-3">
                  <button 
                    onClick={() => setStep('enter-current')} 
                    className="w-full text-left text-base text-red-600"
                  >
                    Turn PIN Off
                    <span className="text-gray-400 float-right">›</span>
                  </button>
                </div>
              </div>

              {step === 'enter-current' && (
                <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-base text-black">Enter PIN</div>
                    <div className="text-xs text-gray-500 mt-1">Enter your current PIN</div>
                  </div>
                  <div className="px-4 py-3">
                    <input 
                      type="password" 
                      value={currentPin} 
                      onChange={(e) => setCurrentPin(e.target.value.replace(/[^0-9]/g, ''))} 
                      placeholder="Current PIN" 
                      className="w-full px-0 py-2 border-0 border-b border-gray-300 bg-transparent text-base focus:outline-none focus:border-blue-500" 
                      maxLength={6} 
                      autoFocus
                    />
                  </div>
                  {currentPin && (
                    <div className="px-4 py-3 border-t border-gray-200">
                      <button 
                        onClick={() => {
                          if (verifyCurrentPin()) {
                            handleRemovePin();
                          }
                        }}
                        className={`w-full text-center text-base ${
                          currentPin === pin ? 'text-red-600' : 'text-gray-400'
                        }`}
                        disabled={currentPin !== pin}
                      >
                        Turn PIN Off
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentPin && currentPin !== pin && step === 'enter-current' && (
                <div className="bg-white border-t border-gray-300 border-b border-gray-300 mt-4">
                  <div className="px-4 py-3">
                    <div className="text-center text-red-600 text-sm">Incorrect PIN. Try again.</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  switch (screen) {
    case 'wifi':
      return <WifiScreen />;
    case 'vpn':
      return <VpnScreen />;
    case 'passcode':
      return <PasscodeScreen />;
    case 'pin':
      return <PinScreen />;
    default:
      return <MainScreen />;
  }
};

export default SettingsApp;
