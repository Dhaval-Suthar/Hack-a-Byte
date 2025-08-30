"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface DeviceInfo {
  id: string;
  deviceMacAddress: string;
  deviceType: string;
  status: "online" | "offline" | "maintenance";
  ipAddress: string;
  securityLevel: "low" | "medium" | "high";
  vulnerabilities: string[];
  lastSeen: string;
}

interface SentinelAppProps {
  onClose: () => void;
  time: string;
}

// Mock data for demonstration - in a real app, this would fetch from an API
const mockDevices: DeviceInfo[] = [
  {
    id: "1",
    deviceMacAddress: "00:1B:44:11:3A:B7",
    deviceType: "hackbook-w95",
    status: "online",
    ipAddress: "192.168.1.10",
    securityLevel: "medium",
    vulnerabilities: ["Weak password", "Outdated OS"],
    lastSeen: new Date().toISOString(),
  },
  {
    id: "2",
    deviceMacAddress: "00:1B:44:11:3A:B8",
    deviceType: "hackphone",
    status: "online",
    ipAddress: "192.168.1.15",
    securityLevel: "high",
    vulnerabilities: [],
    lastSeen: new Date().toISOString(),
  },
  {
    id: "3",
    deviceMacAddress: "00:1B:44:11:3A:B9",
    deviceType: "hackdroid",
    status: "maintenance",
    ipAddress: "192.168.1.20",
    securityLevel: "low",
    vulnerabilities: ["No firewall", "Unpatched vulnerabilities"],
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "4",
    deviceMacAddress: "00:1B:44:11:3A:BA",
    deviceType: "hackbook-e95",
    status: "offline",
    ipAddress: "192.168.1.25",
    securityLevel: "medium",
    vulnerabilities: ["Disconnected"],
    lastSeen: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "5",
    deviceMacAddress: "00:1B:44:11:3A:BB",
    deviceType: "hackphone",
    status: "online",
    ipAddress: "192.168.1.30",
    securityLevel: "low",
    vulnerabilities: ["Weak encryption", "Open ports"],
    lastSeen: new Date().toISOString(),
  },
];

// Circular progress component
const CircularProgress = ({ percentage, label }: { percentage: number; label: string }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="transform -rotate-90 w-24 h-24">
        <circle
          cx="48"
          cy="48"
          r="45"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-gray-700"
        />
        <circle
          cx="48"
          cy="48"
          r="45"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-red-400 transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{percentage}%</div>
        </div>
      </div>
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
        {label}
      </div>
    </div>
  );
};

// Animated scanning radar component
const ScanningRadar = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Radar circles */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(251 146 60)" strokeWidth="0.5" opacity="0.3"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="rgb(251 146 60)" strokeWidth="0.5" opacity="0.4"/>
        <circle cx="50" cy="50" r="25" fill="none" stroke="rgb(251 146 60)" strokeWidth="0.5" opacity="0.5"/>
        <circle cx="50" cy="50" r="15" fill="none" stroke="rgb(251 146 60)" strokeWidth="0.5" opacity="0.6"/>
        
        {/* Scanning beam */}
        {isActive && (
          <line x1="50" y1="50" x2="50" y2="5" stroke="rgb(251 146 60)" strokeWidth="2" opacity="0.8">
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 50 50;360 50 50"
              dur="2s"
              repeatCount="indefinite"
            />
          </line>
        )}
        
        {/* Center dot */}
        <circle cx="50" cy="50" r="2" fill="rgb(251 146 60)"/>
        
        {/* Detected devices as blips */}
        <circle cx="35" cy="30" r="1" fill="rgb(251 146 60)" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="65" cy="40" r="1" fill="rgb(251 146 60)" opacity="0.8">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="45" cy="70" r="1" fill="rgb(251 146 60)" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.8s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );
};

// Progress bar with glow effect
const GlowProgress = ({ progress, label }: { progress: number; label: string }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-red-300">{label}</span>
        <span className="text-red-400 font-mono">{progress}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-500 rounded-full transition-all duration-300 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
};

// Experience bar component
const ExperienceBar = ({ xp, level }: { xp: number; level: number }) => {
  const currentLevelXP = xp % 1000;
  const progress = (currentLevelXP / 1000) * 100;
  
  return (
    <div className="bg-gray-800/60 rounded-lg p-3 border border-red-500/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-red-400 font-bold">LV.{level}</span>
          <span className="text-gray-300 text-sm">Security Analyst</span>
        </div>
        <span className="text-xs text-gray-400">{xp} XP</span>
      </div>
      <GlowProgress progress={progress} label={`${currentLevelXP}/1000 XP to next level`} />
    </div>
  );
};

// Notification toast component
const NotificationToast = ({ notifications }: { notifications: string[] }) => {
  return (
    <div className="fixed top-20 right-4 space-y-2 z-50">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className="bg-gray-800/90 backdrop-blur-sm border border-red-400/50 rounded-lg p-3 text-sm text-white animate-slide-in-right shadow-lg shadow-red-500/20"
        >
          {notification}
        </div>
      ))}
    </div>
  );
};

// Enhanced Network topology visualization
const NetworkTopology = () => {
  return (
    <div className="relative h-full bg-gradient-to-br from-slate-900/50 to-blue-900/20 rounded-lg overflow-hidden border border-cyan-500/20">
      <svg className="w-full h-full" viewBox="0 0 400 300">
        {/* Background grid pattern */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgb(30 41 59)" strokeWidth="0.5"/>
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Network connections with glow */}
        <path d="M 200 150 L 120 80 M 200 150 L 280 80 M 200 150 L 320 150 M 200 150 L 280 220 M 200 150 L 120 220" 
              stroke="rgb(251 146 60)" strokeWidth="2" opacity="0.6" filter="url(#glow)"/>
        
        {/* Central node */}
        <circle cx="200" cy="150" r="25" fill="rgb(251 146 60)" opacity="0.3"/>
        <circle cx="200" cy="150" r="20" fill="rgb(251 146 60)" opacity="0.6"/>
        <circle cx="200" cy="150" r="15" fill="rgb(249 115 22)"/>
        <text x="200" y="155" textAnchor="middle" className="fill-white text-xs font-bold">HQ</text>
        
        {/* Device nodes with pulsing animation */}
        {[
          { x: 120, y: 80, type: "△", status: "online" },
          { x: 280, y: 80, type: "△", status: "maintenance" },
          { x: 320, y: 150, type: "△", status: "online" },
          { x: 280, y: 220, type: "△", status: "offline" },
          { x: 120, y: 220, type: "△", status: "online" },
        ].map((node, i) => (
          <g key={i}>
            <circle cx={node.x} cy={node.y} r="12" fill={
              node.status === 'online' ? 'rgb(34 197 94)' :
              node.status === 'maintenance' ? 'rgb(251 146 60)' : 'rgb(239 68 68)'
            } opacity="0.3">
              <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx={node.x} cy={node.y} r="8" fill={
              node.status === 'online' ? 'rgb(34 197 94)' :
              node.status === 'maintenance' ? 'rgb(251 146 60)' : 'rgb(239 68 68)'
            } opacity="0.8"/>
            <text x={node.x} y={node.y + 3} textAnchor="middle" className="fill-white text-xs font-bold">
              {node.type}
            </text>
          </g>
        ))}
        
        {/* Animated data flow */}
        <circle r="3" fill="rgb(251 146 60)" opacity="0.8">
          <animateMotion dur="3s" repeatCount="indefinite">
            <path d="M 200 150 L 120 80 L 280 80 L 320 150 L 280 220 L 120 220 L 200 150"/>
          </animateMotion>
        </circle>
      </svg>
    </div>
  );
};

function SentinelApp({ onClose, time }: SentinelAppProps) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [discoveredDevices, setDiscoveredDevices] = useState<number>(0);
  const [scanLevel] = useState(1);
  const [experience, setExperience] = useState(2750);
  const [notifications, setNotifications] = useState<string[]>([]);

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev.slice(-2), message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 3000);
  };

  const startScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setDiscoveredDevices(0);
    addNotification("🔍 Initiating deep network scan...");

    // Simulate scanning process
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setScanProgress(i);
      
      // Simulate device discovery
      if (i % 20 === 0 && i > 0) {
        setDiscoveredDevices(prev => prev + Math.floor(Math.random() * 2) + 1);
        if (i === 40) addNotification("📡 Wireless devices detected");
        if (i === 60) addNotification("🖥️ Network infrastructure found");
        if (i === 80) addNotification("📱 Mobile devices identified");
      }
    }

    // Award experience points
    const earnedXP = Math.floor(Math.random() * 200) + 100;
    setExperience(prev => prev + earnedXP);
    addNotification(`🎯 Scan complete! +${earnedXP} XP earned`);
    
    setIsScanning(false);
    
    // Refresh device data
    fetchDevices();
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      // Try to fetch from real API first
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDevices(data.devices);
        } else {
          // Fallback to mock data if API fails
          setDevices(mockDevices);
        }
      } else {
        // Fallback to mock data if API fails
        setDevices(mockDevices);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      // Fallback to mock data if API fails
      setDevices(mockDevices);
    } finally {
      setLoading(false);
    }
  };

  const onlineDevices = devices.filter(d => d.status === "online").length;
  const offlineDevices = devices.filter(d => d.status === "offline").length;
  const maintenanceDevices = devices.filter(d => d.status === "maintenance").length;
  const securityScore = Math.round((devices.filter(d => d.securityLevel === "high").length / devices.length) * 100) || 0;

  const getSecurityColor = (level: string) => {
    switch (level) {
      case "high": return "text-green-400";
      case "medium": return "text-yellow-400";
      case "low": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-red-900/30 flex flex-col font-sans text-white overflow-hidden relative">
      {/* Notifications */}
      <NotificationToast notifications={notifications} />
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-400 rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Header with enhanced styling */}
      <div className="flex items-center justify-between bg-gray-800/80 backdrop-blur-sm border-b border-red-500/30 p-4 shadow-lg shadow-red-500/10">
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-red-400 transition-colors duration-200 flex items-center space-x-1">
          <span>←</span>
          <span>Home</span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30">
            <Image 
              src="/hackphone/apps/sentinel/app-icon.png" 
              alt="Sentinel App Icon" 
              width={32} 
              height={32} 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="text-center">
            <div className="font-bold text-red-400 tracking-wider">SENTINEL</div>
            <div className="text-xs text-gray-400">Network Security Suite</div>
          </div>
        </div>
        <span className="text-sm text-gray-400 font-mono">{time}</span>
      </div>

      {/* Experience Bar */}
      <div className="p-4 pb-2">
        <ExperienceBar xp={experience} level={scanLevel} />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <ScanningRadar isActive={true} />
            <p className="text-gray-400 text-lg">Initializing Sentinel Protocol...</p>
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Enhanced Scan Control Panel */}
          <div className="bg-gradient-to-r from-gray-800/60 to-red-900/40 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 shadow-2xl shadow-red-500/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-red-400 font-bold text-lg tracking-wide">NETWORK SCANNER</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Devices Found:</span>
                <span className="text-red-400 font-mono">{discoveredDevices}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ScanningRadar isActive={isScanning} />
                {isScanning && (
                  <div className="space-y-2">
                    <GlowProgress progress={scanProgress} label="Scanning Progress" />
                    <div className="text-center text-sm text-red-300 animate-pulse">
                      Analyzing network topology...
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col justify-center space-y-4">
                <button
                  onClick={startScan}
                  disabled={isScanning}
                  className={`py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    isScanning 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-red-500/50 hover:shadow-red-500/70'
                  }`}
                >
                  {isScanning ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>SCANNING...</span>
                    </div>
                  ) : (
                    '🔍 INITIATE SCAN'
                  )}
                </button>
                
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2">
                    <div className="text-green-400 font-bold">{onlineDevices}</div>
                    <div className="text-slate-400">Online</div>
                  </div>
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2">
                    <div className="text-yellow-400 font-bold">{maintenanceDevices}</div>
                    <div className="text-slate-400">Maintenance</div>
                  </div>
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2">
                    <div className="text-red-400 font-bold">{offlineDevices}</div>
                    <div className="text-slate-400">Offline</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Strategic Overview Panel */}
            <div className="bg-gradient-to-br from-gray-800/60 to-red-900/40 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 shadow-xl">
              <h2 className="text-red-400 font-bold mb-6 tracking-wide flex items-center space-x-2">
                <span>📊</span>
                <span>STRATEGIC OVERVIEW</span>
              </h2>
              <div className="flex items-center space-x-6">
                <CircularProgress percentage={securityScore} label="Security Score" />
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-gray-300">Network integrity: Operational</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-gray-300">Threat detection: Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-gray-300">AI monitoring: Enabled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Network Map */}
            <div className="bg-gradient-to-br from-gray-800/60 to-red-900/40 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 shadow-xl">
              <h2 className="text-red-400 font-bold mb-4 tracking-wide flex items-center space-x-2">
                <span>🗺️</span>
                <span>NETWORK TOPOLOGY</span>
              </h2>
              <div className="h-40">
                <NetworkTopology />
              </div>
            </div>
          </div>

          {/* Device List with enhanced styling */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-xl">
            <h2 className="text-red-400 font-bold mb-4 tracking-wide flex items-center space-x-2">
              <span>🖥️</span>
              <span>CONNECTED DEVICES</span>
              <span className="text-xs bg-red-500/20 px-2 py-1 rounded-full">{devices.length} detected</span>
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {devices.map((device, index) => (
                <div 
                  key={device.id} 
                  className="group flex items-center justify-between p-4 bg-gray-900/40 backdrop-blur-sm rounded-lg border border-gray-700/30 hover:border-red-400/50 hover:bg-gray-800/60 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
                  onClick={() => {
                    // Add device inspection logic here in the future
                    addNotification(`🔍 Inspecting ${device.deviceType.toUpperCase()}`);
                  }}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className={`w-4 h-4 rounded-full ${
                        device.status === 'online' ? 'bg-green-400 shadow-lg shadow-green-400/50' :
                        device.status === 'maintenance' ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 
                        'bg-red-400 shadow-lg shadow-red-400/50'
                      }`}>
                        {device.status === 'online' && (
                          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-red-300 transition-colors">
                        {device.deviceType.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">{device.ipAddress}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${getSecurityColor(device.securityLevel)} bg-opacity-20`}>
                      {device.securityLevel.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{formatLastSeen(device.lastSeen)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom styles for scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 146, 60, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 146, 60, 0.8);
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default SentinelApp;
