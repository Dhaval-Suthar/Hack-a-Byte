"use client";

import React, { useState } from "react";
import MessagingApp from "./MessagingApp";

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

interface HackPhoneAppsProps {
  appId: string;
  onClose: () => void;
  user: User | null;
  time: Date;
}

const HackPhoneApps: React.FC<HackPhoneAppsProps> = ({
  appId,
  onClose,
  user,
  time,
}) => {
  const [devicePassword, setDevicePassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  
  // Settings states
  const [airplaneMode, setAirplaneMode] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [brightness, setBrightness] = useState(75);
  const [volume, setVolume] = useState(50);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  
  // Modal states for different settings screens
  const [showWifiSettings, setShowWifiSettings] = useState(false);
  const [showBluetoothSettings, setShowBluetoothSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showVolumeSettings, setShowVolumeSettings] = useState(false);
  const [showBrightnessSettings, setShowBrightnessSettings] = useState(false);

  // Load saved password on component mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPassword = localStorage.getItem('hackphone_password');
      if (savedPassword) {
        setDevicePassword(savedPassword);
      }
      
      // Load other settings from localStorage
      const savedAirplane = localStorage.getItem('hackphone_airplane');
      const savedWifi = localStorage.getItem('hackphone_wifi');
      const savedBluetooth = localStorage.getItem('hackphone_bluetooth');
      const savedNotifications = localStorage.getItem('hackphone_notifications');
      const savedLocation = localStorage.getItem('hackphone_location');
      const savedBrightness = localStorage.getItem('hackphone_brightness');
      const savedVolume = localStorage.getItem('hackphone_volume');
      const savedVibration = localStorage.getItem('hackphone_vibration');
      
      if (savedAirplane) setAirplaneMode(JSON.parse(savedAirplane));
      if (savedWifi) setWifiEnabled(JSON.parse(savedWifi));
      if (savedBluetooth) setBluetoothEnabled(JSON.parse(savedBluetooth));
      if (savedNotifications) setNotificationsEnabled(JSON.parse(savedNotifications));
      if (savedLocation) setLocationEnabled(JSON.parse(savedLocation));
      if (savedBrightness) setBrightness(parseInt(savedBrightness));
      if (savedVolume) setVolume(parseInt(savedVolume));
      if (savedVibration) setVibrationEnabled(JSON.parse(savedVibration));
    }
  }, []);

  // Helper functions to save settings
  const toggleAirplaneMode = () => {
    const newValue = !airplaneMode;
    setAirplaneMode(newValue);
    localStorage.setItem('hackphone_airplane', JSON.stringify(newValue));
    if (newValue) {
      // Turn off wifi and bluetooth when airplane mode is on
      setWifiEnabled(false);
      setBluetoothEnabled(false);
      localStorage.setItem('hackphone_wifi', JSON.stringify(false));
      localStorage.setItem('hackphone_bluetooth', JSON.stringify(false));
    }
  };

  const toggleWifi = () => {
    if (!airplaneMode) {
      const newValue = !wifiEnabled;
      setWifiEnabled(newValue);
      localStorage.setItem('hackphone_wifi', JSON.stringify(newValue));
    }
  };

  const toggleBluetooth = () => {
    if (!airplaneMode) {
      const newValue = !bluetoothEnabled;
      setBluetoothEnabled(newValue);
      localStorage.setItem('hackphone_bluetooth', JSON.stringify(newValue));
    }
  };

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('hackphone_notifications', JSON.stringify(newValue));
  };

  const toggleLocation = () => {
    const newValue = !locationEnabled;
    setLocationEnabled(newValue);
    localStorage.setItem('hackphone_location', JSON.stringify(newValue));
  };

  const toggleVibration = () => {
    const newValue = !vibrationEnabled;
    setVibrationEnabled(newValue);
    localStorage.setItem('hackphone_vibration', JSON.stringify(newValue));
  };

  const updateBrightness = (value: number) => {
    setBrightness(value);
    localStorage.setItem('hackphone_brightness', value.toString());
  };

  const updateVolume = (value: number) => {
    setVolume(value);
    localStorage.setItem('hackphone_volume', value.toString());
  };

  // iOS 4 Modal Component
  const SettingsModal = ({ 
    title, 
    isVisible, 
    onClose, 
    children 
  }: { 
    title: string; 
    isVisible: boolean; 
    onClose: () => void; 
    children: React.ReactNode; 
  }) => {
    if (!isVisible) return null;
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ 
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(2px)'
      }}>
        <div 
          className="rounded-xl p-0 m-4 w-full max-w-sm border border-[#8a8a8f] overflow-hidden" 
          style={{ 
            background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 50%, #eeeeee 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.9)',
            maxHeight: '80vh'
          }}
        >
          {/* Modal Header */}
          <div className="text-center py-3 relative" style={{
            background: 'linear-gradient(to bottom, #b0b3b6 0%, #8a8e94 25%, #777b82 50%, #6d7078 75%, #5a5d63 100%)',
            borderBottom: '1px solid #4a4d52',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
          }}>
            <button 
              onClick={onClose}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm font-medium transition-all duration-150"
              style={{
                background: 'linear-gradient(to bottom, #6c7cfa 0%, #5c6cfa 25%, #4c63d2 50%, #3c53c2 75%, #2c43b2 100%)',
                border: '1px solid #1c33a2',
                borderRadius: '6px',
                color: 'white',
                textShadow: '0 -1px 0 rgba(0,0,0,0.6)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              Back
            </button>
            <h3 className="text-white font-bold text-lg" style={{
              textShadow: '0 -1px 0 rgba(0,0,0,0.6)'
            }}>
              {title}
            </h3>
            <div className="absolute top-0 left-0 right-0 h-px bg-white/60"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-black/30"></div>
          </div>
          
          {/* Modal Content */}
          <div className="max-h-96 overflow-y-auto" style={{ 
            background: 'linear-gradient(to bottom, #c5c5ca 0%, #b8b8bd 50%, #a8a8ad 100%)' 
          }}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  // iOS 4 Toggle Switch Component
  const ToggleSwitch = ({ enabled, onToggle, disabled = false }: { 
    enabled: boolean; 
    onToggle: (e?: React.MouseEvent) => void; 
    disabled?: boolean; 
  }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${disabled ? 'opacity-50' : ''}`}
      style={{
        background: enabled 
          ? 'linear-gradient(to bottom, #4cd964 0%, #5ac8fa 25%, #007aff 50%, #0051d5 75%, #0040b3 100%)' 
          : 'linear-gradient(to bottom, #f0f0f0 0%, #e0e0e0 25%, #d0d0d0 50%, #c0c0c0 75%, #b0b0b0 100%)',
        border: `1px solid ${enabled ? '#0040b3' : '#999'}`,
        boxShadow: enabled 
          ? 'inset 0 1px 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,64,179,0.3), 0 0 8px rgba(76,217,100,0.4)' 
          : 'inset 0 1px 2px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)'
      }}
    >
      <div 
        className={`w-6 h-6 rounded-full shadow-lg transition-all duration-300 absolute top-0.5 ${
          enabled ? 'left-5' : 'left-0.5'
        }`}
        style={{
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 25%, #e8e8e8 50%, #d8d8d8 75%, #c8c8c8 100%)',
          border: '1px solid #999',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)'
        }}
      />
      {enabled && (
        <div className="absolute inset-0 rounded-full" style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
          animation: 'shimmer 2s infinite'
        }} />
      )}
    </button>
  );

  // iOS 4 Slider Component
  const Slider = ({ value, onChange, min = 0, max = 100 }: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
  }) => (
    <div className="flex items-center space-x-3">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, 
            #007aff 0%, 
            #0051d5 ${value/2}%, 
            #4cd964 ${value}%, 
            #e0e0e0 ${value}%, 
            #d0d0d0 100%)`,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.8)',
          border: '1px solid #999'
        }}
      />
      <span className="text-[#666] text-sm font-medium w-8 text-right" style={{
        textShadow: '0 1px 0 rgba(255,255,255,0.5)'
      }}>{value}%</span>
    </div>
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const renderStatusBar = () => (
    <div className="flex justify-between items-center px-6 pt-12 pb-4 text-white text-sm relative z-10">
      <div className="flex items-center space-x-2">
        <button onClick={onClose} className="text-blue-400 text-sm">
          ← Back
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium">{formatTime(time)}</span>
        <div className="w-7 h-4 border border-white/60 rounded-sm relative">
          <div className="w-4 h-2 bg-green-500 rounded-sm m-0.5" />
          <div className="w-0.5 h-1.5 bg-white/60 rounded-full absolute -right-1 top-1" />
        </div>
      </div>
    </div>
  );

  const renderTerminalApp = () => (
    <div className="w-screen h-screen bg-black flex flex-col">
      {renderStatusBar()}
      <div className="flex-1 p-4 font-mono text-green-400 text-sm overflow-y-auto">
        <div className="mb-4">
          <div className="text-white mb-2">HackPhone Terminal v2.0</div>
          <div className="text-gray-400 mb-4">Welcome, {user?.username || "hacker"}!</div>
        </div>
        
        <div className="space-y-2">
          <div>$ whoami</div>
          <div className="text-white">{user?.username || "anonymous"}</div>
          
          <div>$ ls -la</div>
          <div className="text-white">
            drwxr-xr-x  8 {user?.username || "user"} staff   256 Dec 20 15:30 .<br/>
            drwxr-xr-x  6 {user?.username || "user"} staff   192 Dec 20 15:25 ..<br/>
            -rw-r--r--  1 {user?.username || "user"} staff  2048 Dec 20 15:30 .profile<br/>
            drwxr-xr-x  3 {user?.username || "user"} staff    96 Dec 20 15:28 Documents<br/>
            drwxr-xr-x  5 {user?.username || "user"} staff   160 Dec 20 15:29 Projects<br/>
            drwxr-xr-x  2 {user?.username || "user"} staff    64 Dec 20 15:27 Scripts<br/>
          </div>
          
          <div>$ cat /etc/hackphone-release</div>
          <div className="text-white">
            HackPhone OS 1.0<br/>
            Build: RetroiOS-2024.1<br/>
            Kernel: Darwin-Mobile 23.1.0<br/>
          </div>
          
          <div>$ ps aux | grep hack</div>
          <div className="text-white">
            {user?.username || "user"}   1234  0.1  2.3  hackphone-daemon<br/>
            {user?.username || "user"}   1235  0.0  1.1  hack-scanner<br/>
            {user?.username || "user"}   1236  0.2  3.4  crypto-toolkit<br/>
          </div>
          
          <div className="flex items-center">
            <span>$ </span>
            <div className="w-2 h-4 bg-green-400 ml-1 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilesApp = () => (
    <div className="w-screen h-screen bg-gray-100 flex flex-col">
      {renderStatusBar()}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Files</h1>
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-3">
          {[
            { name: "Documents", icon: "📁", size: "12 items", type: "folder" },
            { name: "Downloads", icon: "📥", size: "8 items", type: "folder" },
            { name: "Photos", icon: "🖼️", size: "142 items", type: "folder" },
            { name: "Scripts", icon: "📜", size: "5 items", type: "folder" },
            { name: "hack-tools.zip", icon: "🗜️", size: "2.4 MB", type: "file" },
            { name: "network-scan.log", icon: "📄", size: "156 KB", type: "file" },
            { name: "encrypted-data.bin", icon: "🔒", size: "892 KB", type: "file" },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center p-3 bg-white rounded-lg border border-gray-200 active:bg-gray-50"
            >
              <span className="text-2xl mr-3">{item.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-500">{item.size}</div>
              </div>
              <span className="text-gray-400">›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNetworkApp = () => (
    <div className="w-screen h-screen bg-black flex flex-col">
      {renderStatusBar()}
      <div className="bg-green-900 border-b border-green-700 px-4 py-3">
        <h1 className="text-lg font-semibold text-green-100">Network Scanner</h1>
      </div>
      <div className="flex-1 p-4 font-mono text-green-400 text-sm overflow-y-auto">
        <div className="space-y-2">
          <div className="text-green-300">Scanning network 192.168.1.0/24...</div>
          <div className="border-b border-green-800 pb-2 mb-3"></div>
          
          {[
            { ip: "192.168.1.1", device: "Router", ports: "22,80,443", status: "Open" },
            { ip: "192.168.1.10", device: "Laptop", ports: "22,3389", status: "Filtered" },
            { ip: "192.168.1.15", device: "Phone", ports: "80", status: "Open" },
            { ip: "192.168.1.20", device: "IoT Device", ports: "80,8080", status: "Open" },
            { ip: "192.168.1.25", device: "Server", ports: "22,80,443,3306", status: "Open" },
          ].map((device, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 py-1">
              <div className="text-yellow-400">{device.ip}</div>
              <div className="text-blue-400">{device.device}</div>
              <div className="text-purple-400">{device.ports}</div>
              <div className={device.status === "Open" ? "text-green-400" : "text-red-400"}>
                {device.status}
              </div>
            </div>
          ))}
          
          <div className="mt-4 pt-2 border-t border-green-800">
            <div className="text-green-300">Scan complete. 5 devices found.</div>
            <div className="flex items-center mt-2">
              <span>hackphone:~ $ </span>
              <div className="w-2 h-4 bg-green-400 ml-1 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCryptoApp = () => (
    <div className="w-screen h-screen bg-purple-900 flex flex-col">
      {renderStatusBar()}
      <div className="bg-purple-800 border-b border-purple-700 px-4 py-3">
        <h1 className="text-lg font-semibold text-purple-100">Crypto Toolkit</h1>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="bg-purple-800/50 rounded-lg p-4">
          <h3 className="text-purple-200 font-medium mb-3">Hash Generator</h3>
          <input
            type="text"
            placeholder="Enter text to hash..."
            className="w-full bg-purple-700 text-purple-100 rounded px-3 py-2 mb-3"
          />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded">MD5</button>
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded">SHA256</button>
          </div>
        </div>
        
        <div className="bg-purple-800/50 rounded-lg p-4">
          <h3 className="text-purple-200 font-medium mb-3">Base64 Encoder/Decoder</h3>
          <textarea
            placeholder="Enter text to encode/decode..."
            className="w-full bg-purple-700 text-purple-100 rounded px-3 py-2 mb-3 h-20 text-sm"
          />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded">Encode</button>
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded">Decode</button>
          </div>
        </div>
        
        <div className="bg-purple-800/50 rounded-lg p-4">
          <h3 className="text-purple-200 font-medium mb-3">Key Generator</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded">8 chars</button>
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded">16 chars</button>
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded">32 chars</button>
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded">64 chars</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsApp = () => (
    <div className="w-screen h-screen" style={{ 
      background: 'linear-gradient(to bottom, #c5c5ca 0%, #b8b8bd 50%, #a8a8ad 100%)', 
      fontFamily: '-apple-system, Helvetica, Arial, sans-serif' 
    }}>
      {/* iOS 4 Status Bar */}
      <div className="flex justify-between items-center px-4 pt-3 pb-2 text-white text-xs" style={{ 
        background: 'linear-gradient(to bottom, #6d6d72 0%, #4a4a4f 50%, #3a3a3f 100%)',
        borderBottom: '1px solid #2a2a2f',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
      }}>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1 h-3 bg-white rounded-sm" style={{
                boxShadow: '0 0 2px rgba(255,255,255,0.5)'
              }}></div>
            ))}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="w-1 h-3 bg-white/60 rounded-sm"></div>
            ))}
          </div>
          <span className="text-white font-medium ml-1" style={{
            textShadow: '0 -1px 0 rgba(0,0,0,0.7)'
          }}>
            {airplaneMode ? 'No Service' : 'Carrier'}
          </span>
          {!airplaneMode && <span className="text-white" style={{
            textShadow: '0 -1px 0 rgba(0,0,0,0.7)'
          }}>3G</span>}
          {airplaneMode && <span className="text-white">✈️</span>}
        </div>
        <div className="text-white font-bold" style={{
          textShadow: '0 -1px 0 rgba(0,0,0,0.7)'
        }}>
          {formatTime(time)}
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-white" style={{
            textShadow: '0 -1px 0 rgba(0,0,0,0.7)'
          }}>100%</span>
          <div className="w-6 h-3 border border-white rounded-sm relative" style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.1))'
          }}>
            <div className="w-5 h-1.5 rounded-sm absolute top-0.5 left-0.5" style={{
              background: 'linear-gradient(to bottom, #4cd964 0%, #5ac8fa 100%)',
              boxShadow: '0 0 3px rgba(76,217,100,0.6)'
            }}></div>
            <div className="w-0.5 h-1 bg-white absolute -right-0.5 top-1 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* iOS 4 Navigation Bar */}
      <div className="text-white text-center py-3 font-bold text-lg relative" style={{ 
        background: 'linear-gradient(to bottom, #b0b3b6 0%, #8a8e94 25%, #777b82 50%, #6d7078 75%, #5a5d63 100%)',
        borderBottom: '1px solid #4a4d52',
        textShadow: '0 -1px 0 rgba(0,0,0,0.6)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
      }}>
        <button 
          onClick={onClose}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm font-medium transition-all duration-150"
          style={{
            background: 'linear-gradient(to bottom, #6c7cfa 0%, #5c6cfa 25%, #4c63d2 50%, #3c53c2 75%, #2c43b2 100%)',
            border: '1px solid #1c33a2',
            borderRadius: '6px',
            color: 'white',
            textShadow: '0 -1px 0 rgba(0,0,0,0.6)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.3)'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          }}
        >
          Back
        </button>
        <div className="absolute top-0 left-0 right-0 h-px bg-white/60"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-black/30"></div>
        Settings
      </div>

      {/* Content Area */}
      <div className="px-4 pt-6 pb-6 overflow-y-auto" style={{ height: 'calc(100% - 88px)' }}>
        
        {/* Airplane Mode */}
        <div className="rounded-xl overflow-hidden mb-4 border border-[#8a8a8f]" style={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 50%, #eeeeee 100%)'
        }}>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #ff9500 0%, #ff8c00 25%, #ff6500 50%, #e55100 75%, #cc4700 100%)',
                border: '1px solid #b33e00',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.3)'
              }}>
                <span className="text-white text-sm font-bold" style={{
                  textShadow: '0 -1px 0 rgba(0,0,0,0.5)'
                }}>✈</span>
              </div>
              <span className="text-black text-[17px] font-medium" style={{
                textShadow: '0 1px 0 rgba(255,255,255,0.8)'
              }}>Airplane Mode</span>
            </div>
            <ToggleSwitch enabled={airplaneMode} onToggle={toggleAirplaneMode} />
          </div>
        </div>

        {/* Wi-Fi */}
        <div className="rounded-xl overflow-hidden mb-4 border border-[#8a8a8f]" style={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 50%, #eeeeee 100%)'
        }}>
          <button
            onClick={() => setShowWifiSettings(true)}
            className="w-full flex items-center justify-between px-4 py-4 border-b border-[#d0d0d0] text-left transition-all duration-150"
            style={{
              background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 100%)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to bottom, #e8e8e8 0%, #d8d8d8 100%)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 100%)';
            }}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #87ceeb 0%, #7ec8e3 25%, #52a4c4 50%, #4a94b4 75%, #3e8bb0 100%)',
                border: '1px solid #2e7ba0',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.3)'
              }}>
                <div className="w-4 h-4 flex flex-col items-center justify-end">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-1 bg-white rounded-sm mb-0.5 ${wifiEnabled ? 'opacity-100' : 'opacity-30'}`}
                      style={{ 
                        height: `${(i + 1) * 2}px`,
                        textShadow: '0 -1px 0 rgba(0,0,0,0.5)',
                        boxShadow: wifiEnabled ? '0 0 2px rgba(255,255,255,0.8)' : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-black text-[17px] font-medium" style={{
                  textShadow: '0 1px 0 rgba(255,255,255,0.8)'
                }}>Wi-Fi</span>
                <div className="text-[#666] text-sm" style={{
                  textShadow: '0 1px 0 rgba(255,255,255,0.5)'
                }}>
                  {wifiEnabled && !airplaneMode ? 'HackaByte Network' : 'Off'}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <ToggleSwitch 
                enabled={wifiEnabled} 
                onToggle={(e) => {
                  e?.stopPropagation();
                  toggleWifi();
                }} 
                disabled={airplaneMode}
              />
              <span className="text-[#4b82f6] text-lg font-bold ml-2" style={{
                textShadow: '0 1px 0 rgba(255,255,255,0.3)'
              }}>❯</span>
            </div>
          </button>

          {/* Bluetooth */}
          <button
            onClick={() => setShowBluetoothSettings(true)}
            className="w-full flex items-center justify-between px-4 py-4 text-left"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #5856d6 0%, #4b4acf 100%)',
                border: '1px solid #3d3cb8',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <span className="text-white text-sm">⚡</span>
              </div>
              <div>
                <span className="text-black text-[17px] font-medium">Bluetooth</span>
                <div className="text-[#999] text-sm">
                  {bluetoothEnabled && !airplaneMode ? 'On' : 'Off'}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <ToggleSwitch 
                enabled={bluetoothEnabled} 
                onToggle={(e) => {
                  e?.stopPropagation();
                  toggleBluetooth();
                }} 
                disabled={airplaneMode}
              />
              <span className="text-[#4b82f6] text-lg font-bold ml-2">❯</span>
            </div>
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl overflow-hidden mb-4 border border-[#a7a7aa]" style={{ 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
        }}>
          <button
            onClick={() => setShowNotificationSettings(true)}
            className="w-full flex items-center justify-between px-4 py-4 text-left"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #ff3b30 0%, #d70015 100%)',
                border: '1px solid #b50000',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <span className="text-white text-sm">📢</span>
              </div>
              <span className="text-black text-[17px] font-medium">Notifications</span>
            </div>
            <div className="flex items-center">
              <ToggleSwitch 
                enabled={notificationsEnabled} 
                onToggle={(e) => {
                  e?.stopPropagation();
                  toggleNotifications();
                }} 
              />
              <span className="text-[#4b82f6] text-lg font-bold ml-2">❯</span>
            </div>
          </button>
        </div>

        {/* Sounds & Brightness Group */}
        <div className="bg-white rounded-xl overflow-hidden mb-4 border border-[#a7a7aa]" style={{ 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
        }}>
          {/* Sounds */}
          <button
            onClick={() => setShowVolumeSettings(true)}
            className="w-full px-4 py-4 border-b border-[#d9d9d9] text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                  background: 'linear-gradient(to bottom, #007aff 0%, #0051d5 100%)',
                  border: '1px solid #0040b3',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  <span className="text-white text-sm">🔊</span>
                </div>
                <span className="text-black text-[17px] font-medium">Volume</span>
              </div>
              <span className="text-[#4b82f6] text-lg font-bold">❯</span>
            </div>
            <div className="pl-11">
              <Slider value={volume} onChange={updateVolume} />
            </div>
          </button>

          {/* Vibration */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#d9d9d9]">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #8e8e93 0%, #6d6d78 100%)',
                border: '1px solid #5a5a63',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <span className="text-white text-sm">📳</span>
              </div>
              <span className="text-black text-[17px] font-medium">Vibration</span>
            </div>
            <ToggleSwitch enabled={vibrationEnabled} onToggle={toggleVibration} />
          </div>

          {/* Brightness */}
          <button
            onClick={() => setShowBrightnessSettings(true)}
            className="w-full px-4 py-4 text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                  background: 'linear-gradient(to bottom, #ff9500 0%, #ff6500 100%)',
                  border: '1px solid #cc5200',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  <span className="text-white text-sm">☀️</span>
                </div>
                <span className="text-black text-[17px] font-medium">Brightness</span>
              </div>
              <span className="text-[#4b82f6] text-lg font-bold">❯</span>
            </div>
            <div className="pl-11">
              <Slider value={brightness} onChange={updateBrightness} />
            </div>
          </button>
        </div>

        {/* Main Settings Group */}
        <div className="bg-white rounded-xl overflow-hidden mb-4 border border-[#a7a7aa]" style={{ 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
        }}>
          {/* General */}
          <button
            onClick={() => setShowGeneralSettings(true)}
            className="w-full flex items-center justify-between px-4 py-4 border-b border-[#d9d9d9] text-left"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #8e8e93 0%, #6d6d78 100%)',
                border: '1px solid #5a5a63',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <span className="text-white text-sm">⚙️</span>
              </div>
              <span className="text-black text-[17px] font-medium">General</span>
            </div>
            <span className="text-[#4b82f6] text-lg font-bold">❯</span>
          </button>

          {/* Location Services */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#d9d9d9]">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #8e8e93 0%, #6d6d78 100%)',
                border: '1px solid #5a5a63',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <span className="text-white text-sm">�</span>
              </div>
              <div>
                <span className="text-black text-[17px] font-medium">Location Services</span>
                <div className="text-[#999] text-sm">
                  {locationEnabled ? 'On' : 'Off'}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <ToggleSwitch enabled={locationEnabled} onToggle={toggleLocation} />
              <span className="text-[#4b82f6] text-lg font-bold ml-2">❯</span>
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #8e8e93 0%, #6d6d78 100%)',
                border: '1px solid #5a5a63',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <span className="text-white text-sm">�</span>
              </div>
              <span className="text-black text-[17px] font-medium">Privacy</span>
            </div>
            <span className="text-[#4b82f6] text-lg font-bold">❯</span>
          </div>
        </div>

        {/* Security Group */}
        <div className="bg-white rounded-xl overflow-hidden mb-4 border border-[#a7a7aa]" style={{ 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
        }}>
          <button
            onClick={() => setShowPasswordSetup(!showPasswordSetup)}
            className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-[#d9d9d9]"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #8e8e93 0%, #6d6d78 100%)',
                border: '1px solid #5a5a63',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <span className="text-white text-sm">🔐</span>
              </div>
              <span className="text-black text-[17px] font-medium">Passcode Lock</span>
            </div>
            <div className="flex items-center">
              <span className="text-[#999] text-[17px] mr-2">{devicePassword ? "On" : "Off"}</span>
              <span className="text-[#4b82f6] text-lg font-bold">❯</span>
            </div>
          </button>

          <div className="flex items-center justify-between px-4 py-4 border-b border-[#d9d9d9]">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #34c759 0%, #248a3d 100%)',
                border: '1px solid #1e7e34',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <span className="text-white text-sm">📡</span>
              </div>
              <span className="text-black text-[17px] font-medium">Network Scanner</span>
            </div>
            <span className="text-[#4b82f6] text-lg font-bold">❯</span>
          </div>

          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #af52de 0%, #8e44ad 100%)',
                border: '1px solid #732d91',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <span className="text-white text-sm">�</span>
              </div>
              <span className="text-black text-[17px] font-medium">Crypto Tools</span>
            </div>
            <span className="text-[#4b82f6] text-lg font-bold">❯</span>
          </div>
        </div>

        {/* Developer Section */}
        <div className="bg-white rounded-xl overflow-hidden border border-[#a7a7aa]" style={{ 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
        }}>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                background: 'linear-gradient(to bottom, #5856d6 0%, #4b4acf 100%)',
                border: '1px solid #3d3cb8',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <span className="text-white text-sm">💻</span>
              </div>
              <div>
                <span className="text-black text-[17px] font-medium">Developer</span>
                <div className="text-[#999] text-sm">Advanced hacking tools</div>
              </div>
            </div>
            <span className="text-[#4b82f6] text-lg font-bold">❯</span>
          </div>
        </div>
      </div>

      {/* All Settings Modals */}
      <SettingsModal 
        title="Wi-Fi Settings" 
        isVisible={showWifiSettings} 
        onClose={() => setShowWifiSettings(false)}
      >
        <div className="p-4 space-y-4">
          <div className="rounded-lg p-4 border border-[#8a8a8f]" style={{
            background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 50%, #eeeeee 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)'
          }}>
            <h4 className="font-medium text-[17px] mb-3" style={{
              textShadow: '0 1px 0 rgba(255,255,255,0.8)',
              color: '#333'
            }}>Available Networks</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 px-2 rounded" style={{
                background: 'linear-gradient(to bottom, rgba(76,217,100,0.1), rgba(76,217,100,0.05))'
              }}>
                <span className="text-[15px] font-medium" style={{
                  textShadow: '0 1px 0 rgba(255,255,255,0.6)',
                  color: '#2d5a2d'
                }}>HackaByte Network ✓</span>
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1 h-3 rounded-sm" style={{
                      background: 'linear-gradient(to bottom, #4cd964, #5ac8fa)',
                      boxShadow: '0 0 3px rgba(76,217,100,0.6)'
                    }}></div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between py-2 px-2 rounded" style={{
                background: 'linear-gradient(to bottom, rgba(255,193,7,0.1), rgba(255,193,7,0.05))'
              }}>
                <span className="text-[15px]" style={{
                  textShadow: '0 1px 0 rgba(255,255,255,0.6)',
                  color: '#5d4e37'
                }}>SecureWiFi 🔒</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-3 bg-orange-400 rounded-sm"></div>
                  <div className="w-1 h-3 bg-orange-400 rounded-sm"></div>
                  <div className="w-1 h-3 bg-gray-300 rounded-sm"></div>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 px-2 rounded" style={{
                background: 'linear-gradient(to bottom, rgba(108,117,125,0.1), rgba(108,117,125,0.05))'
              }}>
                <span className="text-[15px]" style={{
                  textShadow: '0 1px 0 rgba(255,255,255,0.6)',
                  color: '#495057'
                }}>Guest_Network</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-3 bg-gray-400 rounded-sm"></div>
                  <div className="w-1 h-3 bg-gray-300 rounded-sm"></div>
                  <div className="w-1 h-3 bg-gray-300 rounded-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingsModal>

      <SettingsModal 
        title="Bluetooth Settings" 
        isVisible={showBluetoothSettings} 
        onClose={() => setShowBluetoothSettings(false)}
      >
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg p-4 border border-[#a7a7aa]" style={{
            background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
          }}>
            <h4 className="font-medium text-[17px] mb-3">Paired Devices</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-[15px]">🎧 AirPods Pro</span>
                <span className="text-[13px] text-[#666]">Connected</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[15px]">⌨️ Magic Keyboard</span>
                <span className="text-[13px] text-[#666]">Not Connected</span>
              </div>
            </div>
          </div>
        </div>
      </SettingsModal>

      <SettingsModal 
        title="Notifications" 
        isVisible={showNotificationSettings} 
        onClose={() => setShowNotificationSettings(false)}
      >
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg p-4 border border-[#a7a7aa]" style={{
            background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
          }}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px]">Allow Notifications</span>
                <ToggleSwitch enabled={notificationsEnabled} onToggle={toggleNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px]">Show Previews</span>
                <ToggleSwitch enabled={true} onToggle={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px]">Badge App Icon</span>
                <ToggleSwitch enabled={true} onToggle={() => {}} />
              </div>
            </div>
          </div>
        </div>
      </SettingsModal>

      <SettingsModal 
        title="General Settings" 
        isVisible={showGeneralSettings} 
        onClose={() => setShowGeneralSettings(false)}
      >
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg p-4 border border-[#a7a7aa]" style={{
            background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
          }}>
            <div className="space-y-3">
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="text-[15px]">About</span>
                <span className="text-[#4b82f6] text-lg font-bold">❯</span>
              </button>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="text-[15px]">Software Update</span>
                <span className="text-[#4b82f6] text-lg font-bold">❯</span>
              </button>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="text-[15px]">Reset</span>
                <span className="text-[#4b82f6] text-lg font-bold">❯</span>
              </button>
            </div>
          </div>
        </div>
      </SettingsModal>

      <SettingsModal 
        title="Privacy Settings" 
        isVisible={showPrivacySettings} 
        onClose={() => setShowPrivacySettings(false)}
      >
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg p-4 border border-[#a7a7aa]" style={{
            background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
          }}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px]">Location Services</span>
                <ToggleSwitch enabled={locationEnabled} onToggle={toggleLocation} />
              </div>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="text-[15px]">Contacts</span>
                <span className="text-[#4b82f6] text-lg font-bold">❯</span>
              </button>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="text-[15px]">Photos</span>
                <span className="text-[#4b82f6] text-lg font-bold">❯</span>
              </button>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="text-[15px]">Camera</span>
                <span className="text-[#4b82f6] text-lg font-bold">❯</span>
              </button>
            </div>
          </div>
        </div>
      </SettingsModal>

      <SettingsModal 
        title="Volume Settings" 
        isVisible={showVolumeSettings} 
        onClose={() => setShowVolumeSettings(false)}
      >
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg p-4 border border-[#a7a7aa]" style={{
            background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-[15px] font-medium mb-2">Ringer and Alerts</label>
                <Slider value={volume} onChange={updateVolume} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px]">Change with Buttons</span>
                <ToggleSwitch enabled={true} onToggle={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px]">Vibrate on Ring</span>
                <ToggleSwitch enabled={vibrationEnabled} onToggle={toggleVibration} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px]">Vibrate on Silent</span>
                <ToggleSwitch enabled={true} onToggle={() => {}} />
              </div>
            </div>
          </div>
        </div>
      </SettingsModal>

      <SettingsModal 
        title="Brightness Settings" 
        isVisible={showBrightnessSettings} 
        onClose={() => setShowBrightnessSettings(false)}
      >
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg p-4 border border-[#a7a7aa]" style={{
            background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-[15px] font-medium mb-2">Brightness Level</label>
                <Slider value={brightness} onChange={updateBrightness} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px]">Auto-Brightness</span>
                <ToggleSwitch enabled={true} onToggle={() => {}} />
              </div>
            </div>
          </div>
        </div>
      </SettingsModal>

      {/* Enhanced Passcode Modal */}
      {showPasswordSetup && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ 
          background: 'rgba(0,0,0,0.7)'
        }}>
          <div 
            className="rounded-xl p-4 m-4 w-full max-w-sm border border-[#a7a7aa]" 
            style={{ 
              background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            {/* Modal Header */}
            <div className="text-center py-3 mb-2" style={{
              background: 'linear-gradient(to bottom, #b0b3b6 0%, #8a8e94 50%, #777b82 51%, #6d7078 100%)',
              borderRadius: '8px 8px 0 0',
              margin: '-16px -16px 16px -16px',
              borderBottom: '1px solid #4a4d52'
            }}>
              <h3 className="text-white font-bold text-lg" style={{
                textShadow: '0 -1px 0 rgba(0,0,0,0.4)'
              }}>
                {devicePassword ? "Change Passcode" : "Set Passcode"}
              </h3>
            </div>
            
            <div className="space-y-4">
              {devicePassword && (
                <div>
                  <label className="block text-[#4b4b4b] text-sm font-medium mb-2">Current Passcode</label>
                  <input 
                    type="password" 
                    className="w-full px-3 py-3 border border-[#a7a7aa] rounded-lg text-[17px]" 
                    style={{
                      background: 'linear-gradient(to bottom, #fff 0%, #f5f5f5 100%)',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                    }}
                    placeholder="Enter current passcode" 
                  />
                </div>
              )}
              
              <div>
                <label className="block text-[#4b4b4b] text-sm font-medium mb-2">New Passcode</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-3 border border-[#a7a7aa] rounded-lg text-[17px]"
                  style={{
                    background: 'linear-gradient(to bottom, #fff 0%, #f5f5f5 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                  }}
                  placeholder="Enter new passcode"
                />
              </div>
              
              <div>
                <label className="block text-[#4b4b4b] text-sm font-medium mb-2">Confirm Passcode</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-3 border border-[#a7a7aa] rounded-lg text-[17px]"
                  style={{
                    background: 'linear-gradient(to bottom, #fff 0%, #f5f5f5 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                  }}
                  placeholder="Confirm new passcode"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowPasswordSetup(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="flex-1 px-4 py-3 border border-[#a7a7aa] rounded-lg text-black font-medium"
                  style={{
                    background: 'linear-gradient(to bottom, #fff 0%, #e8e8e8 100%)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newPassword === confirmPassword && newPassword.length >= 4) {
                      setDevicePassword(newPassword);
                      setShowPasswordSetup(false);
                      setNewPassword("");
                      setConfirmPassword("");
                      localStorage.setItem('hackphone_password', newPassword);
                    }
                  }}
                  disabled={!newPassword || newPassword !== confirmPassword || newPassword.length < 4}
                  className="flex-1 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50"
                  style={{
                    background: !newPassword || newPassword !== confirmPassword || newPassword.length < 4 
                      ? 'linear-gradient(to bottom, #ccc 0%, #aaa 100%)' 
                      : 'linear-gradient(to bottom, #007aff 0%, #0051d5 100%)',
                    border: '1px solid #0040b3',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}
                >
                  {devicePassword ? "Change" : "Set"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for sliders and animations */}
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 22px;
          width: 22px;
          border-radius: 50%;
          background: linear-gradient(to bottom, #ffffff 0%, #f8f8f8 25%, #e8e8e8 50%, #d8d8d8 75%, #c8c8c8 100%);
          border: 1px solid #999;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8);
          transition: all 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          background: linear-gradient(to bottom, #ffffff 0%, #f0f0f0 25%, #e0e0e0 50%, #d0d0d0 75%, #c0c0c0 100%);
          box-shadow: 0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          background: linear-gradient(to bottom, #f0f0f0 0%, #e8e8e8 25%, #d8d8d8 50%, #c8c8c8 75%, #b8b8b8 100%);
          box-shadow: 0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.6);
        }
        input[type="range"]::-moz-range-thumb {
          height: 22px;
          width: 22px;
          border-radius: 50%;
          background: linear-gradient(to bottom, #ffffff 0%, #f8f8f8 25%, #e8e8e8 50%, #d8d8d8 75%, #c8c8c8 100%);
          border: 1px solid #999;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8);
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
        button:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );

  const renderDefaultApp = () => (
    <div className="w-screen h-screen bg-gray-900 flex flex-col">
      {renderStatusBar()}
      <div className="flex-1 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-xl font-medium mb-2">App Under Development</h2>
          <p className="text-gray-400">The {appId} app is coming soon!</p>
        </div>
      </div>
    </div>
  );

  // Render the appropriate app
  switch (appId) {
    case "terminal":
      return renderTerminalApp();
    case "files":
      return renderFilesApp();
    case "network":
      return renderNetworkApp();
    case "crypto":
      return renderCryptoApp();
    case "settings":
      return renderSettingsApp();
    case "messages":
      return <MessagingApp onClose={onClose} time={time} />;
    default:
      return renderDefaultApp();
  }
};

export default HackPhoneApps;
