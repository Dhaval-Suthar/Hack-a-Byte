"use client";

import React, { useState } from "react";
import Calendar from "./apps/Calendar/Calendar";
import MessagingApp from "./MessagingApp";
import MapApp from "./MapApp";
import MusicApp from "./MusicApp";
import GalleryApp from "./GalleryApp";
import CameraApp from "./CameraApp";
import ClockApp from "./ClockApp";
import SafariApp from "./SafariApp";
import StockMarketApp from "./apps/StockMarketApp";
import SnakeeGame from "./apps/SnakeeGame";
import ContactsApp from "./ContactsApp";
import PhoneApp from "./PhoneApp";
import WeatherApp from "./WeatherApp";
import NotesApp from "./apps/NotesApp";
import CalculatorApp from "./CalculatorApp";

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
  onAppSwitch?: (appId: string) => void;
  onOpenApp?: (appId: string) => void;
  initialPhoneNumber?: string;
}

const HackPhoneApps: React.FC<HackPhoneAppsProps> = ({
  appId,
  onClose,
  user,
  time,
  onAppSwitch,
  onOpenApp,
  initialPhoneNumber,
}) => {
  const [devicePassword, setDevicePassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);

  // Load saved password on component mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPassword = localStorage.getItem('hackphone_password');
      if (savedPassword) {
        setDevicePassword(savedPassword);
      }
    }
  }, []);

  // Status bar removed globally (signal/time/battery) per UX request

  const renderTerminalApp = () => (
  <div className="w-screen h-screen bg-black flex flex-col">
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
  <div className="w-screen h-screen bg-gray-100 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          {/* Security Section */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Security</h2>
            </div>
            
            {/* Passcode */}
            <button
              onClick={() => setShowPasswordSetup(!showPasswordSetup)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🔒</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Passcode</div>
                  <div className="text-sm text-gray-500">
                    {devicePassword ? "On" : "Off"}
                  </div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            {/* Face ID */}
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">👤</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Face ID</div>
                  <div className="text-sm text-gray-500">Not available</div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>

          {/* General Section */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">General</h2>
            </div>
            
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">ℹ️</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">About</div>
                  <div className="text-sm text-gray-500">HackPhone OS 1.0</div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🎨</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Display & Brightness</div>
                  <div className="text-sm text-gray-500">Auto</div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🔊</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Sounds & Haptics</div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>

          {/* Hacker Tools Section */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Hacker Tools</h2>
            </div>
            
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🌐</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Network Tools</div>
                  <div className="text-sm text-gray-500">Scanner, WiFi, VPN</div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🔐</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Crypto Tools</div>
                  <div className="text-sm text-gray-500">Encryption, Hashing</div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>

          {/* Passcode Setup Modal */}
          {showPasswordSetup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 m-4 w-full max-w-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  {devicePassword ? "Change Passcode" : "Set Passcode"}
                </h3>
                
                <div className="space-y-4">
                  {devicePassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Passcode
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter current passcode"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Passcode
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new passcode"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Passcode
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
                          // Save to localStorage for persistence
                          localStorage.setItem('hackphone_password', newPassword);
                        }
                      }}
                      disabled={!newPassword || newPassword !== confirmPassword || newPassword.length < 4}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {devicePassword ? "Change" : "Set"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDefaultApp = () => (
  <div className="w-screen h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-xl font-medium mb-2">App Under Development</h2>
          <p className="text-gray-400">The {appId} app is coming soon!</p>
        </div>
      </div>
    </div>
  );

  const renderCalendarApp = () => (
    <div className="w-screen h-screen bg-gray-50 flex flex-col">
      {/* <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Calendar</h1>
      </div> */}
      <div className="flex-1 overflow-hidden">
        <Calendar time={time} />
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
    case "calendar":
      return renderCalendarApp();
    case "clock":
      return <ClockApp onClose={onClose} />;
    case "safari":
      return <SafariApp onClose={onClose} />;
    case "messages":
      return <MessagingApp time={time} />;
    case "maps":
      return <MapApp onClose={onClose} time={time} />;
    case "music":
      return <MusicApp />;
    case "camera":
      return <CameraApp 
        onClose={onClose} 
        time={time} 
        onOpenGallery={() => onAppSwitch?.('photos')}
      />;
    case "photos":
    case "gallery":
      return <GalleryApp 
        time={time} 
        onOpenCamera={() => onAppSwitch?.('camera')}
      />;
    case "stocks":
      return <StockMarketApp time={time} />;
    case "snakee":
      return <SnakeeGame onClose={onClose} time={time} />;
    case "game":
    case "games":
      // The Home screen uses the id "game" for the Games icon — route it to Snakee
      return <SnakeeGame onClose={onClose} time={time} />;
    case "contacts":
      return <ContactsApp onClose={onClose} time={time} onOpenPhone={() => onOpenApp?.("phone")} />;
    case "phone":
      return <PhoneApp onClose={onClose} time={time} onOpenContacts={() => onOpenApp?.("contacts")} initialPhoneNumber={initialPhoneNumber} />;
    case "weather":
      return <WeatherApp onClose={onClose} time={time} />;
    case "notes":
       return <NotesApp onClose={onClose} time={time.toLocaleTimeString()} />;
    case  "calculator":
      return <CalculatorApp onClose={onClose} time={time.toLocaleTimeString()} />;
    default:
      return renderDefaultApp();
  }
};

export default HackPhoneApps;