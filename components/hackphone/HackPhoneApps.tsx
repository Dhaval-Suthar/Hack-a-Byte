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

  // Load saved password on component mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPassword = localStorage.getItem('hackphone_password');
      if (savedPassword) {
        setDevicePassword(savedPassword);
      }
    }
  }, []);

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
  <div className="w-screen h-screen" style={{ background: '#c5c5ca', fontFamily: 'Helvetica, Arial, sans-serif' }}>
    {/* iOS 4 Status Bar */}
    <div className="flex justify-between items-center px-4 pt-3 pb-2 text-white text-xs" style={{ background: 'linear-gradient(to bottom, #6d6d72, #4a4a4a)' }}>
      <div className="flex items-center space-x-1">
        <div className="flex space-x-1">
          <div className="w-1 h-3 bg-white rounded-sm"></div>
          <div className="w-1 h-3 bg-white rounded-sm"></div>
          <div className="w-1 h-3 bg-white rounded-sm"></div>
          <div className="w-1 h-3 bg-white/60 rounded-sm"></div>
          <div className="w-1 h-3 bg-white/60 rounded-sm"></div>
        </div>
        <span className="text-white font-medium ml-1">Carrier</span>
        <span className="text-white">3G</span>
      </div>
      <div className="text-white font-bold">{formatTime(time)}</div>
      <div className="flex items-center space-x-1">
        <span className="text-white">100%</span>
        <div className="w-6 h-3 border border-white rounded-sm relative">
          <div className="w-5 h-1.5 bg-green-500 rounded-sm absolute top-0.5 left-0.5"></div>
          <div className="w-0.5 h-1 bg-white absolute -right-0.5 top-1 rounded-full"></div>
        </div>
      </div>
    </div>

    {/* iOS 4 Navigation Bar */}
    <div className="text-white text-center py-3 font-bold text-lg relative" style={{ 
      background: 'linear-gradient(to bottom, #b0b3b6 0%, #8a8e94 50%, #777b82 51%, #6d7078 100%)',
      borderBottom: '1px solid #4a4d52',
      textShadow: '0 -1px 0 rgba(0,0,0,0.4)'
    }}>
      <div className="absolute top-0 left-0 right-0 h-px bg-white/50"></div>
      Settings
    </div>

    {/* Content Area */}
    <div className="px-4 pt-6 pb-6 overflow-y-auto" style={{ height: 'calc(100% - 88px)' }}>
      
      {/* Airplane Mode */}
      <div className="bg-white rounded-xl overflow-hidden mb-4 border border-[#a7a7aa]" style={{ 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
      }}>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
              background: 'linear-gradient(to bottom, #ff8c00 0%, #ff6500 100%)',
              border: '1px solid #cc5200',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs font-bold">✈️</div>
            </div>
            <span className="text-black text-[17px] font-medium">Airplane Mode</span>
          </div>
          <div className="relative">
            <div className="w-12 h-7 rounded-full relative" style={{
              background: 'linear-gradient(to bottom, #eee 0%, #ccc 100%)',
              border: '1px solid #999',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
            }}>
              <div className="w-6 h-6 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm" style={{
                background: 'linear-gradient(to bottom, #fff 0%, #ddd 100%)',
                border: '1px solid #aaa'
              }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Wi-Fi */}
      <div className="bg-white rounded-xl overflow-hidden mb-4 border border-[#a7a7aa]" style={{ 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
      }}>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
              background: 'linear-gradient(to bottom, #7ec8e3 0%, #52a4c4 100%)',
              border: '1px solid #3e8bb0',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">📶</div>
            </div>
            <div>
              <span className="text-black text-[17px] font-medium">Wi-Fi</span>
              <div className="text-[#999] text-sm">HackaByte Network</div>
            </div>
          </div>
          <span className="text-[#4b82f6] text-lg font-bold">❯</span>
        </div>
      </div>

      {/* Main Settings Group */}
      <div className="bg-white rounded-xl overflow-hidden mb-4 border border-[#a7a7aa]" style={{ 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
      }}>
        {/* General */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#d9d9d9]">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
              background: 'linear-gradient(to bottom, #8e8e93 0%, #6d6d78 100%)',
              border: '1px solid #5a5a63',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">⚙️</div>
            </div>
            <span className="text-black text-[17px] font-medium">General</span>
          </div>
          <span className="text-[#4b82f6] text-lg font-bold">❯</span>
        </div>

        {/* Sounds */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#d9d9d9]">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
              background: 'linear-gradient(to bottom, #007aff 0%, #0051d5 100%)',
              border: '1px solid #0040b3',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">🔊</div>
            </div>
            <span className="text-black text-[17px] font-medium">Sounds</span>
          </div>
          <span className="text-[#4b82f6] text-lg font-bold">❯</span>
        </div>

        {/* Brightness & Wallpaper */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#d9d9d9]">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
              background: 'linear-gradient(to bottom, #ff3b30 0%, #d70015 100%)',
              border: '1px solid #b50000',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">🌅</div>
            </div>
            <span className="text-black text-[17px] font-medium">Brightness & Wallpaper</span>
          </div>
          <span className="text-[#4b82f6] text-lg font-bold">❯</span>
        </div>

        {/* Privacy */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
              background: 'linear-gradient(to bottom, #8e8e93 0%, #6d6d78 100%)',
              border: '1px solid #5a5a63',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">🔒</div>
            </div>
            <span className="text-black text-[17px] font-medium">Privacy</span>
          </div>
          <span className="text-[#4b82f6] text-lg font-bold">❯</span>
        </div>
      </div>

      {/* Apps & Media Group */}
      <div className="bg-white rounded-xl overflow-hidden mb-4 border border-[#a7a7aa]" style={{ 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        background: 'linear-gradient(to bottom, #fefefe 0%, #ebebeb 100%)'
      }}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#d9d9d9]">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
              background: 'linear-gradient(to bottom, #007aff 0%, #0051d5 100%)',
              border: '1px solid #0040b3',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">☁️</div>
            </div>
            <span className="text-black text-[17px] font-medium">iCloud</span>
          </div>
          <span className="text-[#4b82f6] text-lg font-bold">❯</span>
        </div>

        <div className="flex items-center justify-between px-4 py-4 border-b border-[#d9d9d9]">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
              background: 'linear-gradient(to bottom, #007aff 0%, #0051d5 100%)',
              border: '1px solid #0040b3',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">📧</div>
            </div>
            <span className="text-black text-[17px] font-medium">Mail, Contacts, Calendars</span>
          </div>
          <span className="text-[#4b82f6] text-lg font-bold">❯</span>
        </div>

        <div className="flex items-center justify-between px-4 py-4 border-b border-[#d9d9d9]">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
              background: 'linear-gradient(to bottom, #ff9500 0%, #ff6500 100%)',
              border: '1px solid #cc5200',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">🎵</div>
            </div>
            <span className="text-black text-[17px] font-medium">Music</span>
          </div>
          <span className="text-[#4b82f6] text-lg font-bold">❯</span>
        </div>

        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
              background: 'linear-gradient(to bottom, #ff3b30 0%, #d70015 100%)',
              border: '1px solid #b50000',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">📱</div>
            </div>
            <span className="text-black text-[17px] font-medium">Phone</span>
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
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">🔐</div>
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
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">📡</div>
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
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">🔒</div>
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
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              <div className="text-white text-xs">⚡</div>
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

    {/* Passcode Modal */}
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
