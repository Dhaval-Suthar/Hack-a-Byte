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
  teamId?: string;
  walletAddress?: string;
  bitcoinBalance?: number;
  isBank?: boolean;
}

interface WalletInfo {
  address: string;
  balance: number;
  teamName?: string;
  lastActivity: string;
  isOwnTeam: boolean;
}

// Removed BankDevice interface – bank status tab eliminated

interface SentinelAppProps {
  onClose: () => void;
  time: string;
}

// All mock/static data removed – live data only

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



// Bank Transfers Tab Component
const BankTransfersTab = ({
  addNotification
}: {
  addNotification: (message: string) => void;
}) => {
  const [transferAmount, setTransferAmount] = useState('');
  const [senderWallet, setSenderWallet] = useState('');
  const [receiverWallet, setReceiverWallet] = useState('');
  const [senderPrivateKey, setSenderPrivateKey] = useState('');

  const executeTransfer = async () => {
    if (!transferAmount || !senderWallet || !receiverWallet) {
      addNotification("❌ Please specify amount, sender wallet, and receiver wallet");
      return;
    }

    if (!senderPrivateKey) {
      addNotification("❌ Please provide sender private key for authorization");
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      addNotification("❌ Invalid transfer amount");
      return;
    }

    // For now, just show success notification since we don't have real transfer API
    addNotification(`💸 Transfer initiated: ₿${amount} from ${senderWallet.slice(0, 10)}... to ${receiverWallet.slice(0, 10)}...`);
    
    // Reset form
    setTransferAmount('');
    setSenderWallet('');
    setReceiverWallet('');
    setSenderPrivateKey('');
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/60 to-blue-900/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 shadow-xl">
      <h2 className="text-blue-400 font-bold mb-4 tracking-wide flex items-center space-x-2">
        <span>💸</span>
        <span>BANK TRANSFER OPERATIONS</span>
      </h2>
      <div className="space-y-6">
        {/* Transfer Form */}
        <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
          <h3 className="text-white font-medium mb-4">Execute Bitcoin Transfer</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Sender Wallet Address</label>
                <input
                  type="text"
                  placeholder="Enter sender wallet address"
                  value={senderWallet}
                  onChange={(e) => setSenderWallet(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (BTC)</label>
                <input
                  type="number"
                  placeholder="0.00000000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sender Private Key</label>
              <input
                type="password"
                placeholder="Enter sender private key for authorization"
                value={senderPrivateKey}
                onChange={(e) => setSenderPrivateKey(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Receiver Wallet Address</label>
              <input
                type="text"
                placeholder="Enter receiver wallet address"
                value={receiverWallet}
                onChange={(e) => setReceiverWallet(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <button
              onClick={executeTransfer}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
            >
              Execute Secure Transfer
            </button>
          </div>
        </div>
      </div>
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


function SentinelApp({ onClose, time }: SentinelAppProps) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [walletData, setWalletData] = useState<WalletInfo[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [discoveredDevices, setDiscoveredDevices] = useState<number>(0);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'mission' | 'transfers' | 'wallets'>('mission');
  const [ownTeamBalance, setOwnTeamBalance] = useState<number | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);

  // Check user role on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const selectedRole = localStorage.getItem('selectedRole');
      setUserRole(selectedRole);
    }
  }, []);

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
    addNotification("🔍 Initiating strategic reconnaissance scan...");

    // Simulate scanning process
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setScanProgress(i);
      
      // Simulate device discovery
      if (i % 20 === 0 && i > 0) {
        setDiscoveredDevices(prev => prev + Math.floor(Math.random() * 2) + 1);
        if (i === 20) addNotification("📡 Network infrastructure mapped");
        if (i === 40) addNotification("🖥️ Team devices identified");
        if (i === 60) addNotification("� Wallet addresses discovered");
        if (i === 80) addNotification("🏦 Bank device status checked");
      }
    }

    // Award experience points
    const earnedXP = Math.floor(Math.random() * 200) + 100;
    addNotification(`🎯 Strategic scan complete! +${earnedXP} XP earned`);
    
    setIsScanning(false);
    
    // Refresh all data
    fetchDevices();
    fetchWallets();
    fetchTeamBalance();
  };

  useEffect(() => {
    fetchDevices();
    fetchWallets();
    fetchTeamBalance();
  }, []);

  const fetchDevices = async () => {
    try {
      // Try to fetch from real API first
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter to only show hackphones (bank removed) excluding own
          const filteredDevices = data.devices.filter((device: DeviceInfo) =>
            device.deviceType === 'hackphone' && device.teamId !== 'my-team'
          );
          setDevices(filteredDevices);
        } else {
          setDevices([]);
        }
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      setDevices([]);
    }
  };
  const fetchWallets = async () => {
    try { const r = await fetch('/api/sentinel?type=wallets'); if (r.ok){ const d= await r.json(); if(d.success) setWalletData(d.wallets);} } catch {}
  };
  const fetchTeamBalance = async () => { try { const r = await fetch('/api/team'); if(r.ok){ const d= await r.json(); if(d.bitcoinBalance!==undefined) setOwnTeamBalance(d.bitcoinBalance);} } catch {} };

  // Show loading while checking role
  if (userRole === null) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-red-900/30 flex flex-col font-sans text-white overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <ScanningRadar isActive={true} />
            <p className="text-gray-400 text-lg">Checking access credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is professor
  if (userRole && userRole.toLowerCase() !== 'professor') {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-red-900/30 flex flex-col font-sans text-white overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-red-400 mb-2">ACCESS DENIED</h3>
            <p className="text-gray-400 text-sm">SENTINEL is restricted to Professor-level clearance only</p>
            <p className="text-gray-500 text-xs mt-2">Current role: {userRole}</p>
            <button 
              onClick={onClose}
              className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
            >
              Return to Desktop
            </button>
          </div>
        </div>
      </div>
    );
  }

  const onlineDevices = devices.filter(d => d.status === "online").length;
  const maintenanceDevices = devices.filter(d => d.status === "maintenance").length;

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
        {[...Array(30)].map((_, i) => (
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

      {/* Enhanced Header */}
      <div className="flex items-center justify-between bg-gray-800/80 backdrop-blur-sm border-b border-red-500/30 p-4 shadow-lg shadow-red-500/10">
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
            <div className="text-xs text-gray-400">Strategic Command Interface</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400 font-mono">{time}</div>
          <div className="text-xs text-red-400">Professor Access</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gradient-to-r from-gray-900/80 to-black/60 backdrop-blur-md border-b border-cyan-500/30">
        {[
          { id: 'mission', name: 'Mission Control', icon: '🎯', gradient: 'from-red-500/20 to-orange-500/20' },
          { id: 'transfers', name: 'Bank Transfers', icon: '💸', gradient: 'from-blue-500/20 to-cyan-500/20' },
          { id: 'wallets', name: 'Wallet Monitor', icon: '💰', gradient: 'from-green-500/20 to-emerald-500/20' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'mission' | 'transfers' | 'wallets')}
            className={`flex-1 py-4 px-3 text-sm font-bold transition-all duration-300 relative overflow-hidden group ${
              activeTab === tab.id
                ? 'text-white bg-gradient-to-r ' + tab.gradient + ' border-b-2 border-cyan-400 shadow-lg shadow-cyan-400/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <div className="relative z-10 flex flex-col items-center space-y-2">
              <div className={`text-lg transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                {tab.icon}
              </div>
              <span className="tracking-wide">{tab.name}</span>
            </div>
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900/50 to-black/70">
        {activeTab === 'mission' && (
          <div className="p-4 space-y-4">
            {/* Enhanced Strategic Command Header */}
            <div className="relative bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20 backdrop-blur-md border border-red-500/40 rounded-2xl p-6 shadow-2xl shadow-red-500/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 animate-pulse" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400 tracking-wider">
                        MISSION CONTROL
                      </h1>
                      <p className="text-sm text-gray-400">Strategic Command Interface</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-400">{devices.length}</div>
                    <div className="text-xs text-gray-400">TARGETS DETECTED</div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-green-400">{onlineDevices}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Online</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-yellow-400">{maintenanceDevices}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Vulnerable</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-blue-400">{ownTeamBalance !== null ? `₿${ownTeamBalance.toFixed(1)}` : '—'}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Treasury</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-purple-400">{discoveredDevices}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Scanned</div>
                  </div>
                </div>

                {/* Strategic Scan Section */}
                <div className="flex items-center justify-center space-x-6">
                  <div className="flex-shrink-0">
                    <ScanningRadar isActive={isScanning} />
                  </div>
                  <div className="flex-1 space-y-4">
                    {isScanning && (
                      <div className="space-y-3">
                        <GlowProgress progress={scanProgress} label="Reconnaissance Progress" />
                        <div className="text-center">
                          <div className="text-red-300 animate-pulse font-medium">🔍 Scanning enemy positions...</div>
                          <div className="text-xs text-gray-500 mt-1">Deep packet analysis in progress</div>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={startScan}
                      disabled={isScanning}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl ${
                        isScanning 
                          ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600/30'
                          : 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500 hover:from-red-400 hover:via-orange-400 hover:to-red-400 text-white shadow-red-500/50 hover:shadow-red-500/70 border border-red-400/50'
                      }`}
                    >
                      {isScanning ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
                          <span>TACTICAL SCAN ACTIVE</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>🚀</span>
                          <span>INITIATE STRATEGIC SCAN</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Intelligence Panel */}
            <div className="bg-gradient-to-br from-cyan-600/10 via-blue-600/10 to-cyan-600/10 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-500/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <span className="text-xl">🖥️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tracking-wide">
                      TARGET INTELLIGENCE
                    </h2>
                    <div className="flex items-center space-x-3 text-sm text-gray-400">
                      <span>High-value assets identified</span>
                      <span className="px-2 py-1 bg-cyan-500/20 rounded-full text-cyan-400 font-mono text-xs">
                        {devices.length} ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {devices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 opacity-50">🔍</div>
                    <div className="text-gray-400 mb-2">No targets detected</div>
                    <div className="text-sm text-gray-500">Run a strategic scan to discover enemy assets</div>
                  </div>
                ) : (
                  devices.map((device, index) => (
                    <div 
                      key={device.id} 
                      className="group relative bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-700/30 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/10 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] p-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => setSelectedDevice(device)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className={`w-5 h-5 rounded-full border-2 ${
                              device.status === 'online' ? 'bg-green-400 border-green-300 shadow-lg shadow-green-400/50' :
                              device.status === 'maintenance' ? 'bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-400/50' : 
                              'bg-red-400 border-red-300 shadow-lg shadow-red-400/50'
                            }`}>
                              {device.status === 'online' && (
                                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-bold group-hover:text-cyan-300 transition-colors">
                                {device.deviceType.toUpperCase()}
                              </span>
                              {device.isBank && <span className="text-lg">🏦</span>}
                              {device.bitcoinBalance && device.bitcoinBalance > 100 && <span className="text-yellow-400">💎</span>}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">{device.ipAddress}</div>
                            {device.bitcoinBalance && (
                              <div className="text-sm font-bold text-green-400">₿{device.bitcoinBalance.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            device.securityLevel === 'high' ? 'text-green-400 bg-green-400/10 border-green-400/30' :
                            device.securityLevel === 'medium' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' :
                            'text-red-400 bg-red-400/10 border-red-400/30'
                          }`}>
                            {device.securityLevel.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-500">{formatLastSeen(device.lastSeen)}</div>
                        </div>
                      </div>
                      
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                    </div>
                  ))
                )}
              </div>

              {/* Device Details Panel */}
              {selectedDevice && (
                <div className="mt-6 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-cyan-500/40 rounded-xl p-5 shadow-xl shadow-cyan-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-sm">🔍</span>
                      </div>
                      <div>
                        <h3 className="text-cyan-400 font-bold">TARGET ANALYSIS</h3>
                        <div className="text-xs text-gray-400">{selectedDevice.deviceType.toUpperCase()}</div>
                      </div>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10" 
                      onClick={() => setSelectedDevice(null)}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                        <div className="text-gray-400 text-xs mb-1">IP ADDRESS</div>
                        <div className="font-mono text-cyan-300">{selectedDevice.ipAddress}</div>
                      </div>
                      <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                        <div className="text-gray-400 text-xs mb-1">MAC ADDRESS</div>
                        <div className="font-mono text-cyan-300">{selectedDevice.deviceMacAddress}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                        <div className="text-gray-400 text-xs mb-1">SECURITY LEVEL</div>
                        <div className={`font-bold ${getSecurityColor(selectedDevice.securityLevel)}`}>
                          {selectedDevice.securityLevel.toUpperCase()}
                        </div>
                      </div>
                      <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                        <div className="text-gray-400 text-xs mb-1">WALLET BALANCE</div>
                        <div className="text-green-400 font-bold">
                          {selectedDevice.bitcoinBalance !== undefined ? `₿${selectedDevice.bitcoinBalance.toFixed(2)}` : 'UNKNOWN'}
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2 bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                      <div className="text-gray-400 text-xs mb-2">VULNERABILITIES</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedDevice.vulnerabilities && selectedDevice.vulnerabilities.length > 0 ? 
                          selectedDevice.vulnerabilities.map(v => (
                            <span key={v} className="text-xs bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30 text-red-300 font-medium">
                              {v}
                            </span>
                          )) : 
                          <span className="text-xs text-gray-500 italic">No known vulnerabilities detected</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mission Command Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Team Wallet Status */}
              <div className="bg-gradient-to-br from-gray-800/60 to-green-900/40 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 shadow-xl">
                <h2 className="text-green-400 font-bold mb-6 tracking-wide flex items-center space-x-2">
                  <span>💰</span>
                  <span>TEAM TREASURY</span>
                </h2>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">{ownTeamBalance !== null ? `₿${ownTeamBalance.toFixed(2)}` : '—'}</div>
                    <div className="text-sm text-gray-400">Available for Operations</div>
                  </div>
                  <div className="text-center text-sm text-gray-400">
                    Use Bank Transfers tab for transactions
                  </div>
                </div>
              </div>



                <h2 className="text-red-400 font-bold mb-6 tracking-wide flex items-center space-x-2">
                  <span>�️</span>
                  <span>SECURITY STATUS</span>
                </h2>
            </div>

            {/* Battlefield map removed */}
          </div>
        )}

        {activeTab === 'transfers' && (
          <div className="p-4 space-y-4">
            <BankTransfersTab
              addNotification={(message) => setNotifications(prev => [...prev, message])}
            />
          </div>
        )}



        {activeTab === 'wallets' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-gray-800/60 to-green-900/40 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 shadow-xl">
              <h2 className="text-green-400 font-bold mb-4 tracking-wide flex items-center space-x-2">
                <span>💰</span>
                <span>WALLET INTELLIGENCE</span>
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {walletData.map((wallet, index) => (
                  <div 
                    key={wallet.address} 
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      wallet.isOwnTeam 
                        ? 'bg-green-900/20 border-green-500/30' 
                        : 'bg-gray-900/40 border-gray-700/30 hover:border-green-400/50'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white flex items-center space-x-2">
                          <span>{wallet.teamName}</span>
                          {wallet.isOwnTeam && <span className="text-green-400">👑</span>}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{wallet.address.slice(0, 20)}...</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400">₿{wallet.balance.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{wallet.lastActivity}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* bank transfers removed */}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #3b82f6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #2563eb);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #06b6d4 rgba(31, 41, 55, 0.3);
        }
      `}</style>
    </div>
  );
}

export default SentinelApp;
