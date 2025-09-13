"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSocket } from "@/hooks/useSocket";

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
  addNotification,
  fetchTeamBalance,
  fetchWallets
}: {
  addNotification: (message: string) => void;
  fetchTeamBalance: () => void;
  fetchWallets: () => void;
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

    try {
      addNotification("🔄 Processing transfer...");
      
      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress: senderWallet,
          toAddress: receiverWallet,
          amount: amount,
          privateKey: senderPrivateKey
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addNotification(`✅ Transfer successful: ₿${amount} sent to ${receiverWallet.slice(0, 10)}...`);
        
        // Refresh team balance and wallet intelligence after successful transfer
        fetchTeamBalance();
        fetchWallets();
        
      } else {
        addNotification(`❌ Transfer failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Transfer error:', error);
      addNotification("❌ Transfer failed: Network error");
    }
    
    // Reset form
    setTransferAmount('');
    setSenderWallet('');
    setReceiverWallet('');
    setSenderPrivateKey('');
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/60 to-blue-900/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 sm:p-6 shadow-xl">
      <h2 className="text-blue-400 font-bold mb-4 tracking-wide flex items-center space-x-2 text-sm sm:text-base">
        <span>💸</span>
        <span>BANK TRANSFER OPERATIONS</span>
      </h2>
      <div className="space-y-4 sm:space-y-6">
        {/* Transfer Form */}
        <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3 sm:p-4">
          <h3 className="text-white font-medium mb-3 sm:mb-4 text-sm sm:text-base">Execute Bitcoin Transfer</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-2">Sender Wallet Address</label>
                <input
                  type="text"
                  placeholder="Enter sender wallet address"
                  value={senderWallet}
                  onChange={(e) => setSenderWallet(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-2">Amount (BTC)</label>
                <input
                  type="number"
                  placeholder="0.00000000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-xs sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-2">Sender Private Key</label>
              <input
                type="password"
                placeholder="Enter sender private key for authorization"
                value={senderPrivateKey}
                onChange={(e) => setSenderPrivateKey(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-2">Receiver Wallet Address</label>
              <input
                type="text"
                placeholder="Enter receiver wallet address"
                value={receiverWallet}
                onChange={(e) => setReceiverWallet(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-xs sm:text-sm"
              />
            </div>
            <button
              onClick={executeTransfer}
              className="w-full py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors text-sm sm:text-base"
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
          className="bg-gray-800/90 backdrop-blur-sm border border-red-400/50 rounded-lg p-3 text-sm text-white animate-slide-in-right shadow-lg shadow-red-500/20 animate-fade-out"
          style={{ animationDelay: `${index * 200}ms` }}
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
  const [ownTeamId, setOwnTeamId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  // New scan gating state
  const SCAN_COOLDOWN_MS = 60_000; // 1 minute
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [deviceLockedForScan, setDeviceLockedForScan] = useState<DeviceInfo | null>(null);
  const [nowTs, setNowTs] = useState(Date.now());
  // Game termination state
  const [isTerminating, setIsTerminating] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [gameTerminated, setGameTerminated] = useState(false);

  // Socket connection
  const { socket } = useSocket();

  // Tick every second to update cooldown display
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Check user role on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const selectedRole = localStorage.getItem('selectedRole');
      setUserRole(selectedRole);
      
      // Load last scan time from localStorage
      const savedLastScanTime = localStorage.getItem('sentinelLastScanTime');
      if (savedLastScanTime) {
        const lastScanTs = parseInt(savedLastScanTime, 10);
        setLastScanTime(lastScanTs);
        
        // Check if cooldown is still active
        const timeSinceLastScan = Date.now() - lastScanTs;
        if (timeSinceLastScan < SCAN_COOLDOWN_MS) {
          setScanCompleted(true); // Mark as completed if cooldown was active
        }
      }
    }
  }, []);

  // Game termination handler
  const handleGameTerminated = useCallback(() => {
    setGameTerminated(true);
    addNotification("🚨 Game has been terminated by administrator");
    addNotification("📱 All devices are now offline");
    addNotification("🔄 Redirecting to game over screen...");
    
    // Redirect to game over after a short delay
    setTimeout(() => {
      window.location.href = '/game-over';
    }, 3000);
  }, []);

  // Socket event listeners for game termination
  useEffect(() => {
    if (!socket) return;

    socket.on('game-terminated', handleGameTerminated);

    return () => {
      socket.off('game-terminated', handleGameTerminated);
    };
  }, [socket, handleGameTerminated]);

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev.slice(-2), message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 3000);
  };

  const terminateGame = async () => {
    setIsTerminating(true);
    addNotification("🚨 Initiating game termination sequence...");

    try {
      const response = await fetch('/api/admin/terminate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addNotification("✅ Game terminated successfully!");
        addNotification("📱 All devices offline");
        addNotification("👥 Teams redirected to game over");
        
        // Trigger local termination state
        setGameTerminated(true);
        
        // Close the app after successful termination
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        addNotification(`❌ Termination failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Game termination error:', error);
      addNotification("❌ Termination failed: Network error");
    } finally {
      setIsTerminating(false);
      setShowTerminateConfirm(false);
    }
  };

  const startScan = async () => {
    if (lastScanTime && Date.now() - lastScanTime < SCAN_COOLDOWN_MS) {
      addNotification('⏳ Scan cooldown active. Please wait.');
      return;
    }
    setIsScanning(true);
    setScanProgress(0);
    setDiscoveredDevices(0);
    addNotification("🔍 Initiating strategic reconnaissance scan...");
    setSelectedDevice(null);
    setDeviceLockedForScan(null);
    setScanCompleted(false);

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
    
    // Refresh all data (will be first reveal after scan)
    fetchDevices();
    fetchWallets();
    fetchTeamBalance();
    
    const currentTime = Date.now();
    setLastScanTime(currentTime);
    setScanCompleted(true);
    
    // Save to localStorage to persist across app launches
    if (typeof window !== 'undefined') {
      localStorage.setItem('sentinelLastScanTime', currentTime.toString());
    }
  };

  useEffect(() => {
    // On mount we only fetch wallets & team balance; devices gated behind scan
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
          // Filter to only show online hackphones (bank removed) excluding own team
          const filteredDevices = data.devices.filter((device: DeviceInfo) =>
            device.deviceType === 'hackphone' && device.status === 'online' && device.teamId !== ownTeamId
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
    try { 
      const r = await fetch('/api/sentinel?type=wallets', { credentials: 'include' }); 
      if (r.ok){ 
        const d= await r.json(); 
        if(d.success) {
          setWalletData(d.wallets);
        }
      } else {
      }
    } catch {
      // Ignore fetch wallet data errors
    }
  };
  const fetchTeamBalance = async () => { 
    try { 
      const r = await fetch('/api/team', { credentials: 'include' }); 
      if(r.ok){ 
        const d = await r.json(); 
        if(d.bitcoinBalance !== undefined) {
          setOwnTeamBalance(d.bitcoinBalance);
        }
        if(d.teamId) {
          setOwnTeamId(d.teamId);
        } else {
        }
      } else {
      }
    } catch {
      // Ignore fetch team balance errors
    }
  };

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

  // Check if game has been terminated
  if (gameTerminated) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-red-900/30 flex flex-col font-sans text-white overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4 animate-pulse">🚨</div>
            <h3 className="text-xl font-bold text-red-400 mb-2">GAME TERMINATED</h3>
            <p className="text-gray-400 text-sm">The game has been terminated by the administrator</p>
            <p className="text-yellow-400 text-xs mt-2 animate-pulse">Redirecting to game over screen...</p>
          </div>
        </div>
      </div>
    );
  }

  const onlineDevices = scanCompleted ? devices.filter(d => d.status === "online").length : 0;
  const maintenanceDevices = scanCompleted ? devices.filter(d => d.status === "maintenance").length : 0;

  const cooldownRemaining = lastScanTime ? Math.max(0, SCAN_COOLDOWN_MS - (nowTs - lastScanTime)) : 0;
  const cooldownSeconds = Math.ceil(cooldownRemaining / 1000);

  const getSecurityColor = (level: string) => {
    switch (level) {
      case "high": return "text-green-400";
      case "medium": return "text-yellow-400";
      case "low": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  // Calculate dynamic security level based on device attributes
  const calculateSecurityLevel = (device: DeviceInfo): "low" | "medium" | "high" => {
    let score = 0;
    
    // Vulnerabilities reduce security
    if (device.vulnerabilities && device.vulnerabilities.length > 0) {
      score -= device.vulnerabilities.length * 20;
    }
    
    // High bitcoin balance indicates valuable target (potentially better secured)
    if (device.bitcoinBalance && device.bitcoinBalance > 50) {
      score += 30;
    } else if (device.bitcoinBalance && device.bitcoinBalance > 10) {
      score += 15;
    }
    
    // Bank devices are typically more secure
    if (device.isBank) {
      score += 25;
    }
    
    // Status affects security (online devices might be more actively maintained)
    if (device.status === 'online') {
      score += 10;
    }
    
    // Determine level based on score
    if (score >= 30) return "high";
    if (score >= 0) return "medium";
    return "low";
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
            <div className="font-bold text-red-400 tracking-wider text-sm sm:text-base">SENTINEL</div>
            <div className="text-xs text-gray-400 hidden sm:block">Strategic Command Interface</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs sm:text-sm text-gray-400 font-mono">{time}</div>
          <div className="text-xs text-red-400">Professor</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gradient-to-r from-gray-900/80 to-black/60 backdrop-blur-md border-b border-cyan-500/30">
        {[
          { id: 'mission', name: 'Mission', icon: '🎯', gradient: 'from-red-500/20 to-orange-500/20' },
          { id: 'transfers', name: 'Transfers', icon: '💸', gradient: 'from-blue-500/20 to-cyan-500/20' },
          { id: 'wallets', name: 'Wallets', icon: '💰', gradient: 'from-green-500/20 to-emerald-500/20' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'mission' | 'transfers' | 'wallets')}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold transition-all duration-300 relative overflow-hidden group ${
              activeTab === tab.id
                ? 'text-white bg-gradient-to-r ' + tab.gradient + ' border-b-2 border-cyan-400 shadow-lg shadow-cyan-400/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <div className="relative z-10 flex flex-col items-center space-y-1">
              <div className={`text-base sm:text-lg transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                {tab.icon}
              </div>
              <span className="tracking-wide text-center leading-tight">{tab.name}</span>
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
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
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
                      <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400 tracking-wider">
                        MISSION CONTROL
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-400">Strategic Command Interface</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm sm:text-lg font-bold text-red-400">{devices.length}</div>
                    <div className="text-xs text-gray-400">TARGETS</div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-2 sm:p-3 text-center backdrop-blur-sm">
                    <div className="text-lg sm:text-2xl font-bold text-green-400">{onlineDevices}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Online</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-2 sm:p-3 text-center backdrop-blur-sm">
                    <div className="text-lg sm:text-2xl font-bold text-yellow-400">{maintenanceDevices}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Vulnerable</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2 sm:p-3 text-center backdrop-blur-sm">
                    <div className="text-lg sm:text-2xl font-bold text-blue-400">{ownTeamBalance !== null ? `₿${ownTeamBalance.toFixed(1)}` : '—'}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Treasury</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-2 sm:p-3 text-center backdrop-blur-sm">
                    <div className="text-lg sm:text-2xl font-bold text-purple-400">{discoveredDevices}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Scanned</div>
                  </div>
                </div>

                {/* Strategic Scan Section */}
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="flex-shrink-0">
                    <ScanningRadar isActive={isScanning} />
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    {isScanning && (
                      <div className="space-y-3">
                        <GlowProgress progress={scanProgress} label="Reconnaissance Progress" />
                        <div className="text-center">
                          <div className="text-red-300 animate-pulse font-medium text-sm">🔍 Scanning enemy positions...</div>
                          <div className="text-xs text-gray-500 mt-1">Deep packet analysis in progress</div>
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      <button
                        onClick={startScan}
                        disabled={isScanning || cooldownRemaining > 0}
                        className={`w-full py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-lg transition-all duration-300 transform ${
                          (isScanning || cooldownRemaining > 0)
                            ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600/30'
                            : 'hover:scale-105 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 hover:from-red-400 hover:via-orange-400 hover:to-red-400 text-white shadow-xl shadow-red-500/50 hover:shadow-red-500/70 border border-red-400/50'
                        }`}
                      >
                        {isScanning ? (
                          <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                            <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-3 border-white border-t-transparent rounded-full" />
                            <span className="text-xs sm:text-sm">TACTICAL SCAN ACTIVE</span>
                          </div>
                        ) : cooldownRemaining > 0 ? (
                          <div className="flex items-center justify-center space-x-2">
                            <span>⏳</span>
                            <span className="text-xs sm:text-sm">COOLDOWN {cooldownSeconds}s</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <span>🚀</span>
                            <span className="text-xs sm:text-sm">{scanCompleted ? 'RE-SCAN NETWORK' : 'INITIATE STRATEGIC SCAN'}</span>
                          </div>
                        )}
                      </button>
                      {!scanCompleted && !isScanning && (
                        <p className="text-center text-xs text-gray-500">Run a scan to reveal target devices.</p>
                      )}
                      {deviceLockedForScan && (
                        <p className="text-center text-xs text-cyan-400">Target locked. Re-scan to analyze another device.</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Game Termination Section */}
                <div className="mt-6 pt-6 border-t border-red-500/20">
                  <div className="text-center space-y-4">
                    <div className="text-red-300 text-sm">
                      <span className="text-yellow-400">⚠️</span> Game Administration
                    </div>
                    {!showTerminateConfirm ? (
                      <button
                        onClick={() => setShowTerminateConfirm(true)}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-red-600 hover:from-yellow-500 hover:to-red-500 text-white font-bold rounded-xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/30"
                      >
                        🏁 TERMINATE GAME
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-red-400 font-bold text-sm mb-2">⚠️ CONFIRM TERMINATION</div>
                          <div className="text-gray-400 text-xs mb-4">
                            This will set all devices offline and redirect teams to game over screen.
                          </div>
                        </div>
                        <div className="flex space-x-3 justify-center">
                          <button
                            onClick={() => setShowTerminateConfirm(false)}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={terminateGame}
                            disabled={isTerminating}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isTerminating ? 'Terminating...' : 'CONFIRM'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Target Intelligence Panel */}
            <div className="bg-gradient-to-br from-cyan-600/10 via-blue-600/10 to-cyan-600/10 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-6 pb-20 shadow-2xl shadow-cyan-500/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <span className="text-xl">🖥️</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tracking-wide">
                      TARGET INTELLIGENCE
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 text-xs sm:text-sm text-gray-400">
                      <span>High-value assets identified</span>
                      <span className="px-2 py-1 bg-cyan-500/20 rounded-full text-cyan-400 font-mono text-xs mt-1 sm:mt-0 w-fit">
                        {devices.length} ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {!scanCompleted ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 opacity-50">🛰️</div>
                    <div className="text-gray-400 mb-2">Scan required</div>
                    <div className="text-sm text-gray-500">Initiate a strategic scan to enumerate targets.</div>
                  </div>
                ) : devices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 opacity-50">🔍</div>
                    <div className="text-gray-400 mb-2">No targets detected</div>
                    <div className="text-sm text-gray-500">Re-scan later to discover new devices</div>
                  </div>
                ) : (
                  devices.map((device, index) => {
                    const locked = !!deviceLockedForScan && deviceLockedForScan.id !== device.id;
                    return (
                      <div
                        key={device.id}
                        className={`group relative bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl border transition-all duration-300 p-4 ${
                          locked ? 'border-gray-700/30 opacity-40 cursor-not-allowed' : 'border-gray-700/30 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/10 cursor-pointer transform hover:scale-[1.02]'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => {
                          if (locked) return;
                          setSelectedDevice(device);
                          if (!deviceLockedForScan) {
                            setDeviceLockedForScan(device);
                            addNotification('🎯 Target locked for this scan');
                          }
                        }}
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
                                <span className="text-white font-bold group-hover:text-cyan-300 transition-colors text-sm">
                                  {device.deviceType.toUpperCase()}
                                </span>
                                {device.isBank && <span className="text-base">🏦</span>}
                                {device.bitcoinBalance && device.bitcoinBalance > 100 && <span className="text-yellow-400">💎</span>}
                                {deviceLockedForScan?.id === device.id && <span className="text-cyan-400">🔒</span>}
                              </div>
                              <div className="text-xs text-gray-400 font-mono break-all">{device.ipAddress}</div>
                              {device.bitcoinBalance && (
                                <div className="text-sm font-bold text-green-400">₿{device.bitcoinBalance.toFixed(2)}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className={`text-xs font-bold px-3 py-1 rounded-full border ${
                              calculateSecurityLevel(device) === 'high' ? 'text-green-400 bg-green-400/10 border-green-400/30' :
                              calculateSecurityLevel(device) === 'medium' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' :
                              'text-red-400 bg-red-400/10 border-red-400/30'
                            }`}>
                              {calculateSecurityLevel(device).toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-500">{formatLastSeen(device.lastSeen)}</div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                      </div>
                    );
                  })
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
                      disabled={!!deviceLockedForScan && deviceLockedForScan.id === selectedDevice.id}
                    >
                      {deviceLockedForScan && deviceLockedForScan.id === selectedDevice.id ? '🔒' : '✕'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                        <div className="text-gray-400 text-xs mb-1">IP ADDRESS</div>
                        <div className="font-mono text-cyan-300 text-xs break-all">{selectedDevice.ipAddress}</div>
                      </div>
                      <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                        <div className="text-gray-400 text-xs mb-1">MAC ADDRESS</div>
                        <div className="font-mono text-cyan-300 text-xs break-all">{selectedDevice.deviceMacAddress}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                        <div className="text-gray-400 text-xs mb-1">SECURITY LEVEL</div>
                        <div className={`font-bold text-sm ${getSecurityColor(calculateSecurityLevel(selectedDevice))}`}>
                          {calculateSecurityLevel(selectedDevice).toUpperCase()}
                        </div>
                      </div>
                      <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                        <div className="text-gray-400 text-xs mb-1">WALLET BALANCE</div>
                        <div className="text-green-400 font-bold text-sm">
                          {selectedDevice.bitcoinBalance !== undefined ? `₿${selectedDevice.bitcoinBalance.toFixed(2)}` : 'UNKNOWN'}
                        </div>
                      </div>
                    </div>
                    <div className="sm:col-span-2 bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                      <div className="text-gray-400 text-xs mb-2">VULNERABILITIES</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedDevice.vulnerabilities && selectedDevice.vulnerabilities.length > 0 ? 
                          selectedDevice.vulnerabilities.map(v => (
                            <span key={v} className="text-xs bg-red-500/20 px-2 py-1 rounded-full border border-red-500/30 text-red-300 font-medium break-words">
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

          </div>
        )}

        {activeTab === 'transfers' && (
          <div className="p-3 sm:p-4 space-y-4">
            <BankTransfersTab
              addNotification={(message) => setNotifications(prev => [...prev, message])}
              fetchTeamBalance={fetchTeamBalance}
              fetchWallets={fetchWallets}
            />
          </div>
        )}



        {activeTab === 'wallets' && (
          <div className="p-3 sm:p-4 space-y-4">
            <div className="bg-gradient-to-br from-gray-800/60 to-green-900/40 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 sm:p-6 shadow-xl">
              <h2 className="text-green-400 font-bold mb-4 tracking-wide flex items-center space-x-2 text-sm sm:text-base">
                <span>💰</span>
                <span>WALLET INTELLIGENCE</span>
              </h2>
              <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar">
                {walletData.map((wallet, index) => (
                  <div 
                    key={wallet.address} 
                    className={`p-3 sm:p-4 rounded-lg border transition-all duration-300 ${
                      wallet.isOwnTeam 
                        ? 'bg-green-900/20 border-green-500/30' 
                        : 'bg-gray-900/40 border-gray-700/30 hover:border-green-400/50'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 mr-3">
                        <div className="text-xs sm:text-sm font-medium text-white flex items-center space-x-2">
                          <span className="truncate">{wallet.teamName}</span>
                          {wallet.isOwnTeam && <span className="text-green-400 flex-shrink-0">👑</span>}
                        </div>
                        <div className="text-xs text-gray-400 font-mono break-all">{wallet.address}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs sm:text-sm font-bold text-green-400">₿{wallet.balance.toFixed(2)}</div>
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
        @keyframes fade-out {
          0% { opacity: 1; transform: translateX(0); }
          70% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(20px); }
        }
        .animate-fade-out {
          animation: fade-out 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default SentinelApp;
