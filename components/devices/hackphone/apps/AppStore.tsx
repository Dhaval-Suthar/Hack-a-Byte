"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { User } from "@/types/devices";
import { getPlayspaceId } from "@/lib/playspace-utils";
import { useSocket } from "@/hooks/useSocket";
import SystemLockProAttack from "@/components/devices/hackphone/security/SystemLockProAttack";

// Add custom styles for running malware animation
const runningMalwareStyles = `
  @keyframes pulse-red {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }
  @keyframes progress-shine {
    0% { background-position: -100% 0; }
    100% { background-position: 100% 0; }
  }
  @keyframes complete-flash {
    0%, 100% { background-color: rgba(34, 197, 94, 0.2); border-color: rgba(34, 197, 94, 0.5); }
    50% { background-color: rgba(34, 197, 94, 0.4); border-color: rgba(34, 197, 94, 0.8); }
  }
  .malware-pulse {
    animation: pulse-red 2s ease-in-out infinite;
  }
  .progress-shine {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200% 100%;
    animation: progress-shine 2s ease-in-out infinite;
  }
  .complete-flash {
    animation: complete-flash 1s ease-in-out;
  }
`;

interface AppStoreProps {
  onClose?: () => void;
  time: Date;
  user?: User | null;
  attackerTeamId?: string; // prefer direct teamId to avoid playspace mismatch
}

type Category = "virus" | "worm" | "ransomware";

interface StoreItem {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number;
  icon: string; // emoji icon for now
  requirements: string[];
  isPopular?: boolean;
  rating: number; // 0-5
  downloadCount: string; // e.g. "15.2K"
  version: string;
  developer: string;
  size: string;
}

interface DeploymentData {
  macAddress?: string;
  ipAddress?: string;
  domainName?: string;
  targetUrl?: string;
  stealAmount?: string;
  demandAmount?: string; // For CryptoLocker Elite ransom amount
  customTitle?: string;
  customDescription?: string;
  targetDeviceId?: string;
  // For worm-based broadcast scams
  emailSubject?: string;
  emailContent?: string;
  smsContent?: string;
}

// Reuse the BlackMart catalog data (duplicated here for isolation and to avoid a breaking refactor)
const CATALOG: StoreItem[] = [
  { id: 'virus-001', name: 'SysTrojan Pro', category: 'virus', description: 'Advanced system infiltrator that embeds deep into the target OS. Provides persistent backdoor access with military-grade stealth capabilities.', price: 150, icon: '🦠', requirements: ['Target MAC Address', 'Network Access'], rating: 4.8, downloadCount: '15.2K', version: '3.2.1', developer: 'Dark Systems Inc.', size: '12.5 MB', isPopular: true },
  { id: 'virus-002', name: 'StealthViral', category: 'virus', description: 'Polymorphic virus that mutates to avoid detection. Self-replicating with advanced rootkit capabilities and signature evasion.', price: 225, icon: '🔍', requirements: ['Target MAC Address', 'Admin Privileges'], rating: 4.6, downloadCount: '8.7K', version: '2.1.4', developer: 'Phantom Labs', size: '8.9 MB' },
  { id: 'virus-003', name: 'DataMiner X', category: 'virus', description: 'Harvests credentials, browser data, and system information. Silent operation with encrypted exfiltration protocols.', price: 120, icon: '⛏️', requirements: ['Target MAC Address'], rating: 4.4, downloadCount: '22.1K', version: '1.8.3', developer: 'DeepVault Corp', size: '5.2 MB' },
  { id: 'worm-001', name: 'EmailSpread Pro', category: 'worm', description: 'Self-propagating email worm. Harvests contact lists and spreads sophisticated phishing campaigns automatically across networks.', price: 200, icon: '📧', requirements: ['Target IP Address', 'SMTP Server'], rating: 4.7, downloadCount: '12.5K', version: '4.0.2', developer: 'NetCrawl Solutions', size: '15.8 MB', isPopular: true },
  { id: 'worm-002', name: 'NetCrawler', category: 'worm', description: 'Network-spreading worm that exploits vulnerabilities. Creates distributed botnet infrastructure for large-scale operations.', price: 300, icon: '🕷️', requirements: ['Target IP Range', 'Port Scanner'], rating: 4.9, downloadCount: '9.3K', version: '5.1.0', developer: 'Web Syndicate', size: '28.4 MB' },
  { id: 'worm-003', name: 'SocialHook', category: 'worm', description: 'Social media worm that spreads through messaging platforms. Advanced social engineering with contact harvesting.', price: 175, icon: '🪝', requirements: ['Target IP Address', 'Social Platform Access'], rating: 4.2, downloadCount: '18.9K', version: '2.7.1', developer: 'Social Breach LLC', size: '7.3 MB' },
  { id: 'ransom-001', name: 'CryptoLocker Elite', category: 'ransomware', description: 'Military-grade file encryption ransomware. Deploys professional fake recovery sites with integrated payment systems.', price: 500, icon: '🔒', requirements: ['Target IP Address'], rating: 4.9, downloadCount: '3.2K', version: '6.0.1', developer: 'Cipher Works', size: '45.2 MB', isPopular: true },
  { id: 'ransom-003', name: 'SystemLock Pro', category: 'ransomware', description: 'Advanced PIN cracking ransomware. Attempts to crack device PINs and steal all bitcoins. High risk, high reward malware.', price: 400, icon: '🚫', requirements: ['Target MAC Address'], rating: 4.6, downloadCount: '5.1K', version: '3.4.5', developer: 'Lock & Key Systems', size: '38.7 MB' },
  { id: 'ransom-004', name: 'SiteClone Pro', category: 'ransomware', description: 'Deploy convincing fake reward sites that steal Bitcoin from visitors. Creates realistic crypto portals with automatic fund siphoning (10-20 BTC per victim).', price: 280, icon: '🎭', requirements: ['Target URL'], rating: 4.7, downloadCount: '5.4K', version: '2.3.1', developer: 'Deception Labs', size: '22.8 MB', isPopular: true },
];

type TabKey = "featured" | "categories" | "top" | "search" | "updates";

const ios4NavBar = "bg-gradient-to-b from-[#3C7CC0] via-[#2C68AE] to-[#1F5597] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_6px_rgba(0,0,0,0.35)]";
const ios4Segment = "rounded-lg bg-gradient-to-b from-[#F7F7F7] to-[#D9D9D9] border border-[#A9A9A9] text-[#333] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_1px_rgba(0,0,0,0.1)]";
const ios4SegmentActive = "bg-gradient-to-b from-[#5AA7FF] to-[#2D7FE8] text-white border-[#1C5DBA]";
const ios4Cell = "bg-white active:bg-[#F0F0F0] border-b border-[#D8D8D8]";

function parseDownloads(d: string): number {
  // Convert strings like "15.2K" to number for sorting
  const k = d.toUpperCase();
  if (k.endsWith("K")) return parseFloat(k) * 1_000;
  if (k.endsWith("M")) return parseFloat(k) * 1_000_000;
  const n = parseFloat(k.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

const AppStore: React.FC<AppStoreProps> = ({ time, user, attackerTeamId: attackerTeamIdProp }) => {
  // Initialize Socket.IO connection
  const { sendMalwareAttack, triggerAttackEffect, isConnected, socket } = useSocket();
  // Inject custom styles for running malware animation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = runningMalwareStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [tab, setTab] = useState<TabKey>("featured");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | Category>("all");
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<StoreItem | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<StoreItem | null>(null);
  const [deployItem, setDeployItem] = useState<StoreItem | null>(null);
  const [deployData, setDeployData] = useState<DeploymentData>({});
  const [teamBalance, setTeamBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [runningMalware, setRunningMalware] = useState<Map<string, { progress: number; target: string; startTime: number }>>(new Map());
  const [showSystemLockProAttack, setShowSystemLockProAttack] = useState(false);
  const [systemLockProTarget, setSystemLockProTarget] = useState<string>('');

  // Fetch team balance and devices on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const playspaceId = getPlayspaceId();

        // Fetch team balance
        const teamResponse = await fetch('/api/team', {
          headers: {
            'x-playspace-id': playspaceId || '',
          },
        });
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          if (teamData.success) {
            const balance = Number(teamData.bitcoinBalance) || 0;
            console.log('Fetched team balance:', balance);
            setTeamBalance(balance);
            
            // Load purchased malware from database
            const purchasedMalware = teamData.purchasedMalware || [];
            console.log('Fetched purchased malware:', purchasedMalware);
            setPurchased(new Set(purchasedMalware));
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Live malware execution animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRunningMalware(prev => {
        const updated = new Map(prev);
        updated.forEach((data, malwareId) => {
          if (data.progress < 100) {
            const malware = CATALOG.find(item => item.id === malwareId);
            // Different malware types have different execution speeds
            let speedMultiplier = 1;
            if (malware) {
              switch (malware.category) {
                case 'virus': speedMultiplier = 1.2; break; // Faster
                case 'worm': speedMultiplier = 0.8; break; // Slower
                case 'ransomware': speedMultiplier = 0.6; break; // Slowest
              }
            }
            const progressIncrement = (Math.random() * 8 + 3) * speedMultiplier;
            updated.set(malwareId, {
              ...data,
              progress: Math.min(100, data.progress + progressIncrement)
            });
          } else {
            // Remove completed malware after a delay
            setTimeout(() => {
              setRunningMalware(current => {
                const newMap = new Map(current);
                newMap.delete(malwareId);
                return newMap;
              });
            }, 3000);
          }
        });
        return updated;
      });
    }, 400); // Slightly faster updates

    return () => clearInterval(interval);
  }, []);

  // Component for live running malware indicator
  const RunningMalwareIndicator: React.FC<{ malwareId: string; data: { progress: number; target: string; startTime: number } }> = ({ malwareId, data }) => {
    const malware = CATALOG.find(item => item.id === malwareId);
    if (!malware) return null;

    return (
      <div className={`fixed left-4 right-4 z-[80] bg-black/90 backdrop-blur-sm rounded-lg p-3 border shadow-2xl transition-all duration-300 ${
        data.progress >= 100 ? 'border-green-500/50 complete-flash' : 'border-red-500/50'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`text-2xl ${data.progress >= 100 ? 'animate-bounce' : 'malware-pulse'}`}>{malware.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{malware.name}</div>
            <div className="text-red-400 text-xs truncate">Target: {data.target}</div>
            <div className="mt-1 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ease-out relative ${
                  data.progress >= 100 ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                }`}
                style={{ width: `${data.progress}%` }}
              >
                {data.progress < 100 && <div className="progress-shine absolute inset-0"></div>}
              </div>
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {data.progress < 30 && "🔍 Scanning target..."}
              {data.progress >= 30 && data.progress < 60 && "⚡ Injecting payload..."}
              {data.progress >= 60 && data.progress < 90 && "🔄 Executing malware..."}
              {data.progress >= 90 && data.progress < 100 && "🔄 Finalizing attack..."}
              {data.progress >= 100 && "✅ Operation complete - Malware consumed"}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-mono ${data.progress >= 100 ? 'text-green-400' : 'text-white'}`}>
              {Math.round(data.progress)}%
            </div>
            <div className="text-gray-400 text-xs">
              {data.progress >= 100 ? 'Complete' : 'Active'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const featured = useMemo(() => CATALOG.filter(i => i.isPopular), []);
  const top = useMemo(() => {
    return [...CATALOG].sort((a, b) => {
      // Sort by downloads then rating
      const d = parseDownloads(b.downloadCount) - parseDownloads(a.downloadCount);
      if (d !== 0) return d;
      return b.rating - a.rating;
    });
  }, []);

  const filteredByCategory = useMemo(() => {
    return CATALOG.filter(i => selectedCategory === "all" || i.category === selectedCategory);
  }, [selectedCategory]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as StoreItem[];
    return CATALOG.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  }, [query]);

  const onPurchase = useCallback((item: StoreItem) => {
    setPurchaseItem(item);
    setShowPurchase(true);
  }, []);

  const confirmPurchase = useCallback(async () => {
    if (!purchaseItem) return;

    // Refresh balance before checking
    let currentBalance = teamBalance;
    try {
      const playspaceId = getPlayspaceId();
      const teamResponse = await fetch('/api/team', {
        headers: {
          'x-playspace-id': playspaceId || '',
        },
      });
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        if (teamData.success) {
          currentBalance = Number(teamData.bitcoinBalance) || 0;
          setTeamBalance(currentBalance);
        }
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }

    const itemPrice = Number(purchaseItem.price);

    console.log('Purchase attempt:', {
      currentBalance,
      itemPrice,
      itemName: purchaseItem.name,
      hasEnough: currentBalance >= itemPrice
    });

    // Check if team has enough bitcoins
    if (currentBalance < itemPrice) {
      alert(`Insufficient team bitcoins! You have ₿${currentBalance.toFixed(2)}, but need ₿${itemPrice.toFixed(2)}`);
      return;
    }

    try {
      // Deduct bitcoins from team wallet
      const playspaceId = getPlayspaceId();
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-playspace-id': playspaceId || '',
        },
        body: JSON.stringify({
          operation: 'subtract',
          amount: itemPrice,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newBalance = Number(data.bitcoinBalance) || 0;
          console.log('Purchase successful, new balance:', newBalance);
          setTeamBalance(newBalance);
          
          // Save purchased malware to database
          const malwarePlayspaceId = getPlayspaceId();
          console.log('Saving malware purchase:', {
            malwareId: purchaseItem.id,
            playspaceId: malwarePlayspaceId
          });
          
          const malwareResponse = await fetch('/api/team', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-playspace-id': malwarePlayspaceId || '',
            },
            body: JSON.stringify({
              operation: 'purchaseMalware',
              malwareId: purchaseItem.id,
            }),
          });
          
          if (malwareResponse.ok) {
            const malwareData = await malwareResponse.json();
            if (malwareData.success) {
              console.log('Malware purchase saved to database:', malwareData.purchasedMalware);
              setPurchased(prev => new Set(prev).add(purchaseItem.id));
              setShowPurchase(false);
              setPurchaseItem(null);
              alert(`${purchaseItem.name} purchased successfully! ₿${itemPrice.toFixed(2)} deducted from team wallet. New balance: ₿${newBalance.toFixed(2)}`);
            } else {
              console.error('Failed to save malware purchase:', malwareData);
              alert('Purchase completed but item may not be saved properly. Please refresh the app.');
              setShowPurchase(false);
              setPurchaseItem(null);
            }
          } else {
            const errorText = await malwareResponse.text();
            console.error('Malware purchase API failed:', malwareResponse.status, errorText);
            alert('Purchase completed but item may not be saved properly. Please refresh the app.');
            setShowPurchase(false);
            setPurchaseItem(null);
          }
        } else {
          alert('Failed to process purchase: ' + (data.error || 'Unknown error'));
        }
      } else {
        const errorText = await response.text();
        console.error('Purchase failed:', response.status, errorText);
        alert('Failed to process purchase. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to process purchase. Please try again.');
    }
  }, [purchaseItem, teamBalance]);

  const onDeploy = useCallback((item: StoreItem) => {
    setDeployItem(item);
    setDeployData({});
  }, []);

  const executeDeploy = useCallback(async () => {
    console.log('🚫 executeDeploy called:', {
      deployItem: deployItem?.name,
      deployData,
      hasMacAddress: !!deployData.macAddress
    });
    if (!deployItem) return;

    // Validate deployment data based on malware type
    let isValidTarget = false;
    let targetInfo = '';

    if (deployItem.category === 'virus' && deployData.macAddress && deployData.ipAddress) {
      // Validate both MAC address and IP address
      const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      
      const validMac = macRegex.test(deployData.macAddress.trim());
      const validIP = ipRegex.test(deployData.ipAddress.trim());
      
      isValidTarget = validMac && validIP;
      targetInfo = `${deployData.macAddress.trim()} (${deployData.ipAddress.trim()})`;
    } else if (deployItem.category === 'worm') {
      // Special handling for EmailSpread Pro / SocialHook / NetCrawler
      if (deployItem.name === 'EmailSpread Pro') {
        isValidTarget = Boolean(deployData.emailSubject && deployData.emailContent);
        targetInfo = 'all online hackphones';
      } else if (deployItem.name === 'SocialHook') {
        isValidTarget = Boolean(deployData.smsContent);
        targetInfo = 'all online hackphones';
      } else if (deployItem.name === 'NetCrawler') {
        isValidTarget = Boolean(deployData.emailSubject && deployData.emailContent && deployData.smsContent);
        targetInfo = 'all online hackphones';
      } else if (deployData.ipAddress) {
        // Fallback: IP targeting for other worms (if any)
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        isValidTarget = ipRegex.test(deployData.ipAddress.trim());
        targetInfo = deployData.ipAddress.trim();
      }
    } else if (deployItem.category === 'ransomware') {
      // Special handling for ransomware malware
      if (deployItem.name === 'CryptoLocker Elite') {
        // CryptoLocker Elite needs IP address and optional demand amount
        if (deployData.ipAddress) {
          const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          const validIP = ipRegex.test(deployData.ipAddress.trim());
          const validDemand = !deployData.demandAmount || (!isNaN(parseFloat(deployData.demandAmount)) && parseFloat(deployData.demandAmount) > 0);
          isValidTarget = validIP && validDemand;
          targetInfo = deployData.ipAddress.trim();
        } else {
          isValidTarget = false;
          targetInfo = '';
        }
      } else if (deployItem.name === 'SiteClone Pro' && deployData.targetUrl) {
        // SiteClone Pro only needs URL validation (steal amount is random)
        const urlRegex = /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*(\/.*)*/;
        isValidTarget = urlRegex.test(deployData.targetUrl.trim());
        targetInfo = deployData.targetUrl.trim();
      } else if (deployItem.name === 'SystemLock Pro') {
        // SystemLock Pro needs MAC address for PIN cracking
        if (deployData.macAddress && deployData.macAddress.trim()) {
          const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
          const trimmedMAC = deployData.macAddress.trim();
          isValidTarget = macRegex.test(trimmedMAC);
          targetInfo = trimmedMAC;
          console.log('🚫 SystemLock Pro validation:', {
            macAddress: deployData.macAddress,
            trimmedMAC,
            isValidTarget,
            regexTest: macRegex.test(trimmedMAC)
          });
        } else {
          isValidTarget = false;
          targetInfo = '';
          console.log('🚫 SystemLock Pro validation failed: no MAC address provided');
        }
      } else if (deployItem.name === 'FakeBank Portal' && deployData.targetUrl && deployData.stealAmount) {
        // FakeBank Portal needs both URL and steal amount
        const urlRegex = /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*(\/.*)*/;
        isValidTarget = urlRegex.test(deployData.targetUrl.trim()) && 
                       !isNaN(parseFloat(deployData.stealAmount)) && 
                       parseFloat(deployData.stealAmount) > 0;
        targetInfo = deployData.targetUrl.trim();
      } else if (deployData.domainName) {
        // Regular ransomware deployment
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
        isValidTarget = domainRegex.test(deployData.domainName.trim()) && deployData.domainName.trim().length > 0;
        targetInfo = deployData.domainName.trim();
      }
    }

    if (!isValidTarget) {
      if (deployItem.category === 'virus' && (deployItem.name === 'SysTrojan Pro' || deployItem.name === 'StealthViral' || deployItem.name === 'DataMiner X')) {
        alert('Please enter both a valid MAC address (format: XX:XX:XX:XX:XX:XX) and IP address (format: XXX.XXX.XXX.XXX) to target the device.');
      } else if (deployItem.name === 'SystemLock Pro') {
        alert('Please enter a valid MAC address (format: XX:XX:XX:XX:XX:XX) to target the device for SystemLock Pro.');
      } else {
        alert('Please enter a valid target address in the correct format.');
      }
      return;
    }

    try {
      let deploymentMessage = `${deployItem.name} deployed successfully!`;
      let effectMessage = '';

      // Special handling for fake site deployment and worm broadcast scams
      if (deployItem.category === 'worm' && (deployItem.name === 'EmailSpread Pro' || deployItem.name === 'SocialHook' || deployItem.name === 'NetCrawler')) {
        // Prefer teamId passed from AppsRouter; fallback to resolving via playspaceId
        let attackerTeamId: string | undefined = attackerTeamIdProp;
        if (!attackerTeamId) {
          const playspaceId = getPlayspaceId();
          if (playspaceId) {
            try {
              const r = await fetch(`/api/team/get-team-id?playspaceId=${playspaceId}`, { cache: 'no-store' });
              const j = await r.json();
              if (j?.success && j?.teamId) attackerTeamId = j.teamId as string;
            } catch (e) {
              console.warn('Failed to resolve teamId from playspaceId:', e);
            }
          }
        }
        if (!attackerTeamId) {
          alert('Unable to determine your team. Please re-open App Store or rejoin your playspace.');
          return;
        }
        const wormId = deployItem.name === 'EmailSpread Pro' ? 'worm-001' : deployItem.name === 'NetCrawler' ? 'worm-002' : 'worm-003';
        // Call backend to broadcast to all online hackphones
        const resp = await fetch('/api/attack/scam-broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attackerTeamId,
            wormId,
            emailSubject: deployData.emailSubject,
            emailContent: deployData.emailContent,
            smsContent: deployData.smsContent,
          })
        });
        if (!resp.ok) {
          const txt = await resp.text().catch(()=> '');
          throw new Error(`Broadcast failed (${resp.status}): ${txt}`);
        }
        const json = await resp.json().catch(()=>({ success: true }));
        const recipients = Number(json?.recipients ?? 0);
        const emails = Number(json?.emails ?? 0);
        const sms = Number(json?.sms ?? 0);
        effectMessage = `📡 Broadcast queued to ${recipients} online device(s)${emails?`, ${emails} email(s)`:''}${sms?`, ${sms} SMS`:''}.`;
        deploymentMessage = `${deployItem.name} executed: scam ${wormId==='worm-002'?'emails + SMS':''}${wormId==='worm-001'?'emails':''}${wormId==='worm-003'?'SMS':''} dispatched.`;
      }
      else if (deployItem.name === 'SiteClone Pro' && deployData.targetUrl) {
        // Deploy SiteClone Pro fake site (no steal amount needed - random 10-20 BTC)
        const fakeResponse = await fetch('/api/safari/deploy-fake-site', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId: getPlayspaceId(),
            targetUrl: deployData.targetUrl,
            malwareType: deployItem.name,
            customTitle: deployData.customTitle,
            customDescription: deployData.customDescription,
          }),
        });

        if (fakeResponse.ok) {
          const fakeData = await fakeResponse.json();
          if (fakeData.success) {
            effectMessage = `🎭 Fake site deployed at ${deployData.targetUrl}! Will steal ${fakeData.targetAmount} BTC from each visitor.`;
            deploymentMessage = `${deployItem.name} successfully deployed fake site!`;
          } else {
            throw new Error(fakeData.error || 'Failed to deploy fake site');
          }
        } else {
          throw new Error('Failed to deploy fake site');
        }
  } else if (deployItem.name === 'FakeBank Portal' && deployData.targetUrl && deployData.stealAmount) {
        // Deploy FakeBank Portal fake site (with custom steal amount)
        const fakeResponse = await fetch('/api/safari/deploy-fake-site', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId: getPlayspaceId(),
            targetUrl: deployData.targetUrl,
            malwareType: deployItem.name,
            stealAmount: parseFloat(deployData.stealAmount),
          }),
        });

        if (fakeResponse.ok) {
          const fakeData = await fakeResponse.json();
          if (fakeData.success) {
            effectMessage = `🎭 Fake site deployed at ${deployData.targetUrl}! Will steal ${deployData.stealAmount} BTC from each visitor.`;
            deploymentMessage = `${deployItem.name} successfully deployed fake site!`;
          } else {
            throw new Error(fakeData.error || 'Failed to deploy fake site');
          }
        } else {
          throw new Error('Failed to deploy fake site');
        }
  } else if (deployItem.name === 'CryptoLocker Elite' && deployData.ipAddress) {
        // Deploy CryptoLocker Elite ransomware
        const attackerTeamId = attackerTeamIdProp || user?.teamId;
        if (!attackerTeamId) {
          throw new Error('Attacker team ID not found');
        }

        const response = await fetch('/api/attack/cryptolocker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            targetIP: deployData.ipAddress,
            attackerTeamId,
            ...(deployData.demandAmount && { demandAmount: parseFloat(deployData.demandAmount) })
          })
        });
        
        const result = await response.json();
        if (response.ok && result.success) {
          if (result.outcome === 'success') {
            effectMessage = `🔒 CryptoLocker Elite deployed on ${deployData.ipAddress}! Target team must complete typing challenge or face game-ending consequences.`;
          } else {
            effectMessage = `🔒 CryptoLocker Elite failed to penetrate target security defenses.`;
          }
        } else {
          throw new Error(result.error || 'CryptoLocker deployment failed');
        }
      } else if (deployItem.name === 'SystemLock Pro' && deployData.macAddress) {
        // Launch SystemLock Pro PIN cracking interface
        console.log('🚫 SystemLock Pro deployment triggered:', {
          macAddress: deployData.macAddress,
          teamId: attackerTeamIdProp || user?.teamId
        });
        setShowSystemLockProAttack(true);
        setSystemLockProTarget(deployData.macAddress);
        setDeployItem(null); // Close deployment modal
        console.log('🚫 SystemLock Pro state updated:', {
          showSystemLockProAttack: true,
          systemLockProTarget: deployData.macAddress
        });
        return; // Don't show regular deployment success message
      } else {
        // Regular malware deployment
        if (deployItem.category === 'virus') {
          const attackerTeamId = attackerTeamIdProp || user?.teamId;
          if (!attackerTeamId) {
            throw new Error('Attacker team ID not found');
          }

          // Call specific virus APIs
          if (deployItem.id === 'virus-001') { // SysTrojan Pro
            const targetDeviceId = deployData.targetDeviceId || deployData.macAddress; // Assume MAC is device ID for now
            const response = await fetch('/api/attack/systrojan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetDeviceId, attackerTeamId })
            });
            const result = await response.json();
            if (result.success) {
              if (result.outcome === 'destroyed') {
                effectMessage = `💥 SysTrojan Pro destroyed target device! Siphoned ${result.siphon} BTC. Device is now under maintenance.`;
              } else {
                effectMessage = `🦠 SysTrojan Pro injection failed. Target security too strong.`;
              }
            } else {
              throw new Error(result.error || 'SysTrojan attack failed');
            }
          } else if (deployItem.id === 'virus-002') { // StealthViral
            const targetKey = deployData.targetDeviceId || deployData.macAddress || 'unknown-target';
            // Resolve target teamId via helper endpoint (by device MAC) - fallback to playspace team if not found
            let targetTeamId: string | undefined;
            try {
              if (deployData.macAddress) {
                const r = await fetch(`/api/device/resolve-team?mac=${encodeURIComponent(deployData.macAddress)}`);
                if (r.ok) {
                  const j = await r.json();
                  if (j?.success && j?.teamId) targetTeamId = j.teamId;
                }
              }
            } catch (e) { console.warn('Resolve target team failed (mac):', e); }
            if (!targetTeamId) {
              try {
                const r2 = await fetch(`/api/device/resolve-team?ip=${encodeURIComponent(deployData.ipAddress||'')}`);
                if (r2.ok) { const j2 = await r2.json(); if (j2?.success && j2?.teamId) targetTeamId = j2.teamId; }
              } catch (e) { console.warn('Resolve target team failed (ip):', e); }
            }
            if (!targetTeamId) {
              alert('Could not resolve target team for StealthViral (missing mapping).');
              throw new Error('Target team resolution failed');
            }
            console.log('🔍 StealthViral deployment:', { targetKey, targetTeamId, attackerTeamId, deployData });
            const response = await fetch(`/api/attack/stealth-viral?targetKey=${encodeURIComponent(targetKey)}`, {
              method: 'POST',
              headers: { 'x-team-id': attackerTeamId, 'x-target-team-id': targetTeamId }
            });
            const result = await response.json();
            if (result.success) {
              effectMessage = `🔍 StealthViral deployed on ${targetKey}! Target must click rapidly to neutralize (${result.clicksRequired} clicks required).`;
            } else {
              throw new Error(result.error || 'StealthViral deployment failed');
            }
          } else if (deployItem.id === 'virus-003') { // DataMiner X
            const targetDeviceId = deployData.targetDeviceId || deployData.macAddress;
            // Resolve target team as above
            let targetTeamId: string | undefined;
            try {
              if (deployData.macAddress) {
                const r = await fetch(`/api/device/resolve-team?mac=${encodeURIComponent(deployData.macAddress)}`);
                if (r.ok) { const j = await r.json(); if (j?.success && j?.teamId) targetTeamId = j.teamId; }
              }
            } catch {}
            if (!targetTeamId) {
              try {
                const r2 = await fetch(`/api/device/resolve-team?ip=${encodeURIComponent(deployData.ipAddress||'')}`);
                if (r2.ok) { const j2 = await r2.json(); if (j2?.success && j2?.teamId) targetTeamId = j2.teamId; }
              } catch {}
            }
            const response = await fetch('/api/attack/dataminer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetDeviceId, attackerTeamId, targetTeamId })
            });
            const result = await response.json();
            if (response.ok && result.success) {
              if (result.outcome === 'success') {
                effectMessage = `⛏️ DataMiner X exfiltration successful! Retrieved private key: ${result.privateKey}`;
              } else {
                effectMessage = `⛏️ DataMiner X failed to penetrate target security.`;
              }
            } else {
              if (response.status === 429) {
                const resetTs: number | undefined = result?.reset;
                const secs = resetTs ? Math.max(0, Math.ceil((resetTs - Date.now()) / 1000)) : undefined;
                alert(`Rate limited for DataMiner X. ${secs !== undefined ? `Try again in ~${secs}s.` : ''}`);
              }
              throw new Error(result.error || 'DataMiner attack failed');
            }
          } else {
            effectMessage = `🦠 Virus injected into ${targetInfo}. Target device may experience system instability.`;
          }
        } else if (deployItem.category === 'worm') {
          effectMessage = `🕷️ Worm spreading from ${targetInfo}. Network propagation initiated.`;
        } else if (deployItem.category === 'ransomware') {
          // Only generic message for other ransomware (not CryptoLocker Elite)
          if (deployItem.name !== 'CryptoLocker Elite') {
            effectMessage = `🔒 Ransomware deployed. Target systems encrypted. Payment portal active at ${targetInfo}.`;
          }
        }
      }

      // Remove the deployed malware from purchased list
      const deployPlayspaceId = getPlayspaceId();
      console.log('Removing deployed malware from purchased list:', {
        malwareId: deployItem.id,
        playspaceId: deployPlayspaceId
      });

      const deployResponse = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-playspace-id': deployPlayspaceId || '',
        },
        body: JSON.stringify({
          operation: 'deployMalware',
          malwareId: deployItem.id,
        }),
      });

      if (deployResponse.ok) {
        const deployDataResult = await deployResponse.json();
        if (deployDataResult.success) {
          console.log('Malware removed from purchased list:', deployDataResult.purchasedMalware);
          // Update local state to remove the deployed malware
          setPurchased(prev => {
            const newSet = new Set(prev);
            newSet.delete(deployItem.id);
            return newSet;
          });

          // Send real-time attack via Socket.IO (except for fake sites which are passive)
          const attackerPlayspaceId = getPlayspaceId();
          if (attackerPlayspaceId && isConnected && !(deployItem.name === 'FakeBank Portal' || deployItem.name === 'SiteClone Pro')) {
            sendMalwareAttack({
              attackerPlayspaceId,
              targetInfo,
              malwareType: deployItem.category,
              malwareId: deployItem.id,
              attackerName: user?.username || 'Unknown Attacker',
            });
            console.log('Real-time attack sent via Socket.IO');

            // Trigger attack effect based on malware type
            const effectSeverity = deployItem.category === 'ransomware' ? 'critical' :
                                 deployItem.category === 'worm' ? 'high' :
                                 deployItem.category === 'virus' ? 'medium' : 'low';

            const effectMessageSocket = deployItem.category === 'ransomware' ? 'RANSOMWARE DETECTED - SYSTEM LOCKED' :
                                 deployItem.category === 'worm' ? 'NETWORK INTRUSION DETECTED' :
                                 deployItem.category === 'virus' ? 'MALWARE INFECTION DETECTED' : 'SECURITY ALERT';

            // Prefer defender-scoped big-screen effect when a target team is known (virus/worm/ransomware)
            const maybeTargetTeamId = (async () => {
              try {
                if (deployItem.category === 'virus' || deployItem.category === 'worm' || deployItem.category === 'ransomware') {
                  if (deployData.macAddress) {
                    const r = await fetch(`/api/device/resolve-team?mac=${encodeURIComponent(deployData.macAddress)}`);
                    if (r.ok) { const j = await r.json(); if (j?.success && j?.teamId) return j.teamId as string; }
                  }
                  if (deployData.ipAddress) {
                    const r2 = await fetch(`/api/device/resolve-team?ip=${encodeURIComponent(deployData.ipAddress)}`);
                    if (r2.ok) { const j2 = await r2.json(); if (j2?.success && j2?.teamId) return j2.teamId as string; }
                  }
                }
              } catch {}
              return undefined;
            })();

            maybeTargetTeamId.then((resolvedTargetTeamId) => {
              if (resolvedTargetTeamId) {
                triggerAttackEffect({
                  teamId: resolvedTargetTeamId,
                  effect: effectMessageSocket,
                  severity: effectSeverity,
                  duration: deployItem.category === 'ransomware' ? 15000 : 10000,
                });
              } else {
                // Fallback to attacker playspace for non-targeted/legacy effects
                triggerAttackEffect({
                  playspaceId: attackerPlayspaceId,
                  effect: effectMessageSocket,
                  severity: effectSeverity,
                  duration: deployItem.category === 'ransomware' ? 15000 : 10000,
                });
              }
            });
          }

          // Add to running malware for live visualization
          setRunningMalware(prev => {
            const newMap = new Map(prev);
            newMap.set(deployItem.id, {
              progress: 0,
              target: targetInfo,
              startTime: Date.now()
            });
            return newMap;
          });

          alert(`${deploymentMessage}\n\n${effectMessage}\n\n⚠️ This malware has been consumed and is no longer available for reuse.`);

          setDeployItem(null);
          setDeployData({});
        } else {
          console.error('Failed to remove malware from purchased list:', deployDataResult);
          alert(`${deploymentMessage}\n\n${effectMessage}\n\n⚠️ Warning: Malware deployed but may still be available for reuse. Please refresh the app.`);
          setDeployItem(null);
          setDeployData({});
        }
      } else {
        const errorText = await deployResponse.text();
        console.error('Deploy API failed:', deployResponse.status, errorText);
        alert(`${deploymentMessage}\n\n${effectMessage}\n\n⚠️ Warning: Malware deployed but may still be available for reuse. Please refresh the app.`);
        setDeployItem(null);
        setDeployData({});
      }
    } catch (error) {
      console.error('Deployment error:', error);
      alert('Deployment failed. Please try again.');
    }

    if (socket && deployItem.category === 'ransomware' && deployItem.name.toLowerCase().includes('bank')) {
      socket.emit('fake-bank-warning', { domain: deployData.domainName || 'bank.example', ts: Date.now() });
    }
  }, [deployItem, deployData, isConnected, sendMalwareAttack, triggerAttackEffect, user?.username, user?.teamId, socket, attackerTeamIdProp]);

  const getCategoryBadge = (cat: Category) => ({
    virus: "bg-red-500",
    worm: "bg-yellow-500",
    ransomware: "bg-purple-600",
  }[cat]);

  const ListCell: React.FC<{ item: StoreItem }> = ({ item }) => (
    <button
      className={`${ios4Cell} w-full px-3 py-3 text-left`}
      onClick={() => setDetail(item)}
    >
      <div className="flex items-start">
        <div className="w-10 h-10 rounded-md bg-[#EFEFF4] mr-3 flex items-center justify-center text-xl">
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[#111] truncate">{item.name}</div>
              <div className="text-[12px] text-[#666] truncate">{item.developer}</div>
            </div>
            <div className="ml-2 flex items-center">
              {purchased.has(item.id) ? (
                <span className="text-[11px] px-2 py-1 rounded bg-gradient-to-b from-[#F7F7F7] to-[#D9D9D9] border border-[#A9A9A9] text-[#666]">INSTALLED</span>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onPurchase(item); }}
                  className="text-white text-[12px] font-semibold px-2 py-1 rounded bg-gradient-to-b from-[#67B1FF] to-[#2B7BE8] border border-[#1C5DBA] shadow"
                >
                  ₿{item.price}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2 text-[11px] text-[#777]">
              <span>★ {item.rating}</span>
              <span>{item.downloadCount}</span>
              <span className={`text-white px-1.5 py-0.5 rounded ${getCategoryBadge(item.category)}`}>{item.category}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="w-full h-full bg-[#DCEBFF] flex flex-col">
      {/* iOS 4 Navigation Bar */}
      <div className={`${ios4NavBar} px-3 py-2`}>
        <div className="h-7 flex items-center justify-center relative">
          <div className="absolute left-0 top-0 bottom-0 flex items-center">
            <span className="text-white/90 text-xs">
              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="text-[15px] font-bold tracking-wide">App Store</div>
          <div className="absolute right-0 top-0 bottom-0 flex items-center space-x-2">
            <button
              onClick={async () => {
                try {
                  const playspaceId = getPlayspaceId();
                  const teamResponse = await fetch("/api/team", {
                    headers: {
                      "x-playspace-id": playspaceId || "",
                    },
                  });
                  if (teamResponse.ok) {
                    const teamData = await teamResponse.json();
                    if (teamData.success) {
                      const balance = Number(teamData.bitcoinBalance) || 0;
                      const purchasedMalware = teamData.purchasedMalware || [];
                      setTeamBalance(balance);
                      setPurchased(new Set(purchasedMalware));
                      alert(
                        `Data refreshed!\nBalance: ₿${balance.toFixed(2)}\nPurchased items: ${purchasedMalware.length}`
                      );
                    }
                  }
                } catch (error) {
                  console.error("Failed to refresh data:", error);
                }
              }}
              className="text-white/70 text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              ↻
            </button>
            <span className="text-white/90 text-xs">₿{loading ? "..." : teamBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <div className="text-[15px] text-[#245a9e]">Loading App Store...</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto relative">
          {/* Featured */}
          {tab === "featured" && (
            <div>
              <div className="px-3 py-2 text-[12px] font-semibold text-[#245a9e]">Popular Apps & Games</div>
              <div className="bg-white/95 border-t border-b border-[#D8D8D8]">
                {featured.map((i, idx) => (
                  <div
                    key={i.id}
                    className={` ${idx < featured.length - 1 ? "border-b border-[#D8D8D8]" : ""} odd:bg-[#F4F9FF]`}
                  >
                    <ListCell item={i} />
                  </div>
                ))}
              </div>

              <div className="px-3 py-3">
                <div className={`w-full px-2 py-1 ${ios4Segment} flex items-center gap-1 text-[12px]`}>
                  <button className={`flex-1 py-1 rounded ${ios4SegmentActive}`}>What&#39;s Hot</button>
                  <button className="flex-1 py-1 rounded">New</button>
                  <button className="flex-1 py-1 rounded">All</button>
                </div>
              </div>

              <div className="px-3 py-2 text-[12px] font-semibold text-[#245a9e]">Top Charts</div>
              <div className="bg-white/95 border-t border-b border-[#D8D8D8]">
                {top.slice(0, 5).map((i, idx) => (
                  <div key={i.id} className={` ${idx < 4 ? "border-b border-[#D8D8D8]" : ""} odd:bg-[#F4F9FF]`}>
                    <ListCell item={i} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {tab === "categories" && (
            <div>
              <div className="px-3 py-2 text-[11px] text-[#6D6D72] uppercase">Categories</div>
              <div className="px-3 pb-3">
                <div className={`w-full p-1 ${ios4Segment} grid grid-cols-4 gap-1 text-[12px]`}>
                  {[
                    { key: "all", label: "All" },
                    { key: "virus", label: "Virus" },
                    { key: "worm", label: "Worm" },
                    { key: "ransomware", label: "Ransom" },
                  ].map((b) => (
                    <button
                      key={b.key}
                      onClick={() => setSelectedCategory(b.key as "all" | Category)}
                      className={`py-1 rounded ${selectedCategory === b.key ? ios4SegmentActive : ""}`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white/95 border-t border-b border-[#D8D8D8]">
                {filteredByCategory.map((i, idx) => (
                  <div
                    key={i.id}
                    className={` ${
                      idx < filteredByCategory.length - 1 ? "border-b border-[#D8D8D8]" : ""
                    } odd:bg-[#F4F9FF]`}
                  >
                    <ListCell item={i} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top */}
          {tab === "top" && (
            <div>
              <div className="px-3 py-2 text-[11px] text-[#6D6D72] uppercase">Top Charts</div>
              <div className="bg-white/95 border-t border-b border-[#D8D8D8]">
                {top.map((i, idx) => (
                  <div
                    key={i.id}
                    className={` ${idx < top.length - 1 ? "border-b border-[#D8D8D8]" : ""} odd:bg-[#F4F9FF]`}
                  >
                    <ListCell item={i} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          {tab === "search" && (
            <div>
              <div className="p-3">
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full rounded-[10px] bg-white border border-[#C8C7CC] px-8 py-2 text-[14px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                  />
                  <span className="absolute left-3 top-2.5 text-[#8E8E93]">🔍</span>
                </div>
              </div>
              <div className="bg-white/95 border-t border-b border-[#D8D8D8]">
                {(searchResults.length ? searchResults : CATALOG).map((i, idx, arr) => (
                  <div
                    key={i.id}
                    className={` ${idx < arr.length - 1 ? "border-b border-[#D8D8D8]" : ""} odd:bg-[#F4F9FF]`}
                  >
                    <ListCell item={i} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Updates (Purchased) */}
          {tab === "updates" && (
            <div>
              <div className="px-3 py-2 text-[11px] text-[#6D6D72] uppercase">Purchased</div>
              <div className="bg-white/95 border-t border-b border-[#D8D8D8]">
                {CATALOG.filter((i) => purchased.has(i.id)).length === 0 && (
                  <div className="px-3 py-6 text-[13px] text-[#6D6D72]">No purchases yet.</div>
                )}
                {CATALOG.filter((i) => purchased.has(i.id)).map((i, idx, arr) => (
                  <div
                    key={i.id}
                    className={` ${idx < arr.length - 1 ? "border-b border-[#D8D8D8]" : ""} odd:bg-[#F4F9FF]`}
                  >
                    <ListCell item={i} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* bottom spacers so last items are not hidden behind the fixed tab bar and bezel */}
          <div className="h-12" />
          <div className="h-[clamp(74px,12vw,92px)]" />
        </div>
      )}

      {/* iOS 4 Tab Bar (dark glossy) fixed near home button, slightly overlapped to remove gap */}
      <div className="h-12 bg-gradient-to-b from-[#3F3F3F] to-[#1F1F1F] border-t border-black/40 flex items-stretch text-[10px] text-white fixed left-0 right-0 z-40 bottom-[calc(clamp(74px,12vw,92px)-6px)]">
        {[
          { key: "featured", label: "Featured", icon: "★" },
          { key: "categories", label: "Categories", icon: "☰" },
          { key: "top", label: "Top 25", icon: "#" },
          { key: "search", label: "Search", icon: "🔍" },
          { key: "updates", label: "Updates", icon: "⬇" },
        ].map((b) => (
          <button
            key={b.key}
            onClick={() => setTab(b.key as TabKey)}
            className={`flex-1 flex flex-col items-center justify-center ${
              tab === b.key ? "text-[#5AA7FF]" : "text-white/80"
            }`}
          >
            <div className="text-[16px] leading-4">{b.icon}</div>
            <div className="mt-0.5">{b.label}</div>
          </button>
        ))}
      </div>

      {/* Detail View */}
      {detail && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex flex-col">
          <div className={`${ios4NavBar} px-3 py-2`}>
            <div className="h-7 flex items-center">
              <button
                onClick={() => setDetail(null)}
                className="text-white text-[13px] px-2 py-0.5 rounded bg-white/15 border border-white/30"
              >
                Back
              </button>
              <div className="flex-1 text-center text-[15px] font-bold">Details</div>
              <div className="w-[52px]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-[#EFEFF4]">
            <div className="bg-white border-b border-[#D8D8D8] p-3">
              <div className="flex items-start">
                <div className="w-14 h-14 rounded-lg bg-[#EFEFF4] mr-3 flex items-center justify-center text-2xl">
                  {detail.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-bold text-[#111] truncate">{detail.name}</div>
                  <div className="text-[12px] text-[#666]">{detail.developer}</div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[#777]">
                    <span>★ {detail.rating}</span>
                    <span>{detail.downloadCount}</span>
                    <span className={`text-white px-1.5 py-0.5 rounded ${getCategoryBadge(detail.category)}`}>
                      {detail.category}
                    </span>
                  </div>
                </div>
                <div className="ml-2">
                  {!purchased.has(detail.id) ? (
                    <button
                      onClick={() => onPurchase(detail)}
                      className="text-white text-[12px] font-semibold px-3 py-1 rounded bg-gradient-to-b from-[#67B1FF] to-[#2B7BE8] border border-[#1C5DBA] shadow"
                    >
                      Buy ₿{detail.price}
                    </button>
                  ) : (
                    <button
                      onClick={() => onDeploy(detail)}
                      className="text-white text-[12px] font-semibold px-3 py-1 rounded bg-gradient-to-b from-[#4CD964] to-[#2BB84A] border border-[#19943A] shadow"
                    >
                      Deploy
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-3">
              <div className="bg-white rounded-lg border border-[#D8D8D8] p-3 mb-3">
                <div className="text-[13px] font-semibold mb-1">Description</div>
                <div className="text-[13px] text-[#333] leading-snug">{detail.description}</div>
              </div>
              <div className="bg-white rounded-lg border border-[#D8D8D8] p-3 mb-3 text-[13px]">
                <div className="font-semibold mb-1">Information</div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Version</span>
                  <span>{detail.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Size</span>
                  <span>{detail.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Category</span>
                  <span>{detail.category}</span>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-[12px]">
                <div className="font-medium text-yellow-800 mb-1">Educational Use Only</div>
                <div className="text-yellow-800">
                  This software is for authorized testing and educational purposes only.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase modal */}
      {showPurchase && purchaseItem && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-4 border border-[#D8D8D8]">
            <div className="text-[15px] font-bold mb-2 text-center">Confirm Purchase</div>
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded bg-[#EFEFF4] mr-2 flex items-center justify-center text-xl">
                {purchaseItem.icon}
              </div>
              <div>
                <div className="text-[14px] font-semibold">{purchaseItem.name}</div>
                <div className="text-[12px] text-[#666]">{purchaseItem.developer}</div>
              </div>
              <div className="ml-auto text-[16px] font-bold text-green-700">₿{purchaseItem.price}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-[12px] text-yellow-800 mb-3">
              For educational and authorized testing purposes only.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPurchase(false)}
                className="flex-1 py-2 rounded border border-[#C8C7CC] text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                className="flex-1 py-2 rounded text-white text-[13px] font-semibold bg-gradient-to-b from-[#67B1FF] to-[#2B7BE8] border border-[#1C5DBA]"
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deploy modal */}
      {deployItem && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-4 border border-[#D8D8D8]">
            <div className="text-[15px] font-bold mb-2 text-center">Deploy {deployItem.name}</div>
            <div className="space-y-3 text-[13px]">
              {deployItem.category === "virus" && (
                <>
                  <div>
                    <label className="block text-[12px] text-[#666] mb-1">Target MAC Address</label>
                    <input
                      value={deployData.macAddress || ""}
                      onChange={(e) => setDeployData({ ...deployData, macAddress: e.target.value })}
                      placeholder="00:1B:44:11:3A:B7"
                      className="w-full border border-[#C8C7CC] rounded px-2 py-2"
                    />
                    <div className="text-[11px] text-[#888] mt-1">
                      Enter the target&apos;s MAC address (e.g., 00:1B:44:11:3A:B7)
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#666] mb-1">Target IP Address</label>
                    <input
                      value={deployData.ipAddress || ""}
                      onChange={(e) => setDeployData({ ...deployData, ipAddress: e.target.value })}
                      placeholder="192.168.1.100"
                      className="w-full border border-[#C8C7CC] rounded px-2 py-2"
                    />
                    <div className="text-[11px] text-[#888] mt-1">
                      Enter the target&apos;s IP address (e.g., 192.168.1.100)
                    </div>
                  </div>
                </>
              )}
              {deployItem.category === "worm" && (
                (deployItem.name === 'EmailSpread Pro' || deployItem.name === 'NetCrawler' || deployItem.name === 'SocialHook') ? (
                  <>
                    {(deployItem.name === 'EmailSpread Pro' || deployItem.name === 'NetCrawler') && (
                      <>
                        <label className="block text-[12px] text-[#666] mb-1">Email Subject</label>
                        <input
                          value={deployData.emailSubject || ''}
                          onChange={(e) => setDeployData({ ...deployData, emailSubject: e.target.value })}
                          placeholder="Security Notice"
                          className="w-full border border-[#C8C7CC] rounded px-2 py-2 mb-2"
                        />
                        <label className="block text-[12px] text-[#666] mb-1">Email Content</label>
                        <textarea
                          value={deployData.emailContent || ''}
                          onChange={(e) => setDeployData({ ...deployData, emailContent: e.target.value })}
                          placeholder="We detected unusual activity..."
                          className="w-full border border-[#C8C7CC] rounded px-2 py-2 min-h-[80px]"
                        />
                        <div className="text-[11px] text-[#888] mt-1">Email will be sent to all online hackphone devices.</div>
                      </>
                    )}
                    {(deployItem.name === 'SocialHook' || deployItem.name === 'NetCrawler') && (
                      <>
                        <label className="block text-[12px] text-[#666] mb-1 mt-3">SMS Content</label>
                        <textarea
                          value={deployData.smsContent || ''}
                          onChange={(e) => setDeployData({ ...deployData, smsContent: e.target.value })}
                          placeholder="Security alert: Suspicious activity detected..."
                          className="w-full border border-[#C8C7CC] rounded px-2 py-2 min-h-[60px]"
                        />
                        <div className="text-[11px] text-[#888] mt-1">SMS will be sent to all online hackphone devices.</div>
                      </>
                    )}
                    <div className="bg-orange-50 border border-orange-200 rounded p-2 text-[12px] text-orange-700 mt-2">
                      ⚠️ This will dispatch scam messages to all online hackphone devices.
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-[12px] text-[#666] mb-1">Target IP Address</label>
                    <input
                      value={deployData.ipAddress || ""}
                      onChange={(e) => setDeployData({ ...deployData, ipAddress: e.target.value })}
                      placeholder="192.168.1.100"
                      className="w-full border border-[#C8C7CC] rounded px-2 py-2"
                    />
                    <div className="text-[11px] text-[#888] mt-1">
                      Enter the target&apos;s IP address (e.g., 192.168.1.100)
                    </div>
                  </div>
                )
              )}
              {deployItem.category === "ransomware" &&
                (deployItem.name === "FakeBank Portal" || deployItem.name === "SiteClone Pro") && (
                  <>
                    <div>
                      <label className="block text-[12px] text-[#666] mb-1">Target URL</label>
                      <input
                        value={deployData.targetUrl || ""}
                        onChange={(e) => setDeployData({ ...deployData, targetUrl: e.target.value })}
                        placeholder="https://fake-crypto-reward.com"
                        className="w-full border border-[#C8C7CC] rounded px-2 py-2"
                      />
                      <div className="text-[11px] text-[#888] mt-1">
                        Enter the URL for your fake site (must start with http/https)
                      </div>
                    </div>
                    {deployItem.name === "FakeBank Portal" && (
                      <div>
                        <label className="block text-[12px] text-[#666] mb-1">Bitcoin Steal Amount</label>
                        <input
                          value={deployData.stealAmount || ""}
                          onChange={(e) => setDeployData({ ...deployData, stealAmount: e.target.value })}
                          placeholder="5"
                          type="number"
                          min="0.1"
                          step="0.1"
                          className="w-full border border-[#C8C7CC] rounded px-2 py-2"
                        />
                        <div className="text-[11px] text-[#888] mt-1">Amount to steal from each visitor (in BTC)</div>
                      </div>
                    )}
                    {deployItem.name === "SiteClone Pro" && (
                      <>
                        <div>
                          <label className="block text-[12px] text-[#666] mb-1">Site Title</label>
                          <input
                            value={deployData.customTitle || ''}
                            onChange={e => setDeployData({ ...deployData, customTitle: e.target.value })}
                            placeholder="Crypto Bonus Portal"
                            className="w-full border border-[#C8C7CC] rounded px-2 py-2"
                          />
                          <div className="text-[11px] text-[#888] mt-1">Enter a convincing title for your fake site</div>
                        </div>
                        <div>
                          <label className="block text-[12px] text-[#666] mb-1">Site Description</label>
                          <input
                            value={deployData.customDescription || ''}
                            onChange={e => setDeployData({ ...deployData, customDescription: e.target.value })}
                            placeholder="Limited time crypto rewards - Claim your bonus now!"
                            className="w-full border border-[#C8C7CC] rounded px-2 py-2"
                          />
                          <div className="text-[11px] text-[#888] mt-1">Enter a convincing description for your fake site</div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded p-2 text-[12px] text-purple-700">
                          💎 SiteClone Pro automatically generates random steal amounts between 10-20 BTC per victim for
                          maximum effectiveness.
                        </div>
                      </>
                    )}
                    <div className="bg-orange-50 border border-orange-200 rounded p-2 text-[12px] text-orange-700">
                      ⚠️ This will create a fake site that steals Bitcoin from visitors who click on reward claims.
                    </div>
                  </>
                )}
              {deployItem.category === "ransomware" && deployItem.name === "CryptoLocker Elite" && (
                <div>
                  <label className="block text-[12px] text-[#666] mb-1">Target IP Address</label>
                  <input
                    value={deployData.ipAddress || ""}
                    onChange={(e) => setDeployData({ ...deployData, ipAddress: e.target.value })}
                    placeholder="192.168.1.100"
                    className="w-full border border-[#C8C7CC] rounded px-2 py-2"
                  />
                  <div className="text-[11px] text-[#888] mt-1">
                    Enter the target&apos;s IP address (e.g., 192.168.1.100)
                  </div>
                  
                  <label className="block text-[12px] text-[#666] mb-1 mt-3">Ransom Amount (₿)</label>
                  <input
                    value={deployData.demandAmount || ""}
                    onChange={(e) => setDeployData({ ...deployData, demandAmount: e.target.value })}
                    placeholder="100"
                    type="number"
                    min="1"
                    step="1"
                    className="w-full border border-[#C8C7CC] rounded px-2 py-2"
                  />
                  <div className="text-[11px] text-[#888] mt-1">
                    Optional: Custom ransom amount in Bitcoin (leave empty for auto-calculation)
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded p-2 text-[12px] text-red-700 mt-2">
                    🔒 CryptoLocker Elite will deploy a typing defense challenge. Target team must complete it or face game-ending consequences.
                  </div>
                </div>
              )}
              {deployItem.category === "ransomware" &&
                deployItem.name !== "FakeBank Portal" &&
                deployItem.name !== "SiteClone Pro" &&
                deployItem.name !== "CryptoLocker Elite" &&
                deployItem.name !== "SystemLock Pro" && (
                  <div>
                    <label className="block text-[12px] text-[#666] mb-1">Domain Name</label>
                    <input
                      value={deployData.domainName || ""}
                      onChange={(e) => setDeployData({ ...deployData, domainName: e.target.value })}
                      placeholder="fake-bank-portal.com"
                      className="w-full border border-[#C8C7CC] rounded px-2 py-2"
                    />
                    <div className="text-[11px] text-[#888] mt-1">Enter the domain for the fake payment portal</div>
                  </div>
                )}
              {deployItem.name === "SystemLock Pro" && (
                <div>
                  <label className="block text-[12px] text-[#666] mb-1">Target MAC Address</label>
                  <input
                    value={deployData.macAddress || ""}
                    onChange={(e) => setDeployData({ ...deployData, macAddress: e.target.value })}
                    placeholder="aa:bb:cc:dd:ee:ff"
                    className="w-full border border-[#C8C7CC] rounded px-2 py-2"
                  />
                  <div className="text-[11px] text-[#888] mt-1">Enter the MAC address of the target device</div>
                </div>
              )}
              <div className="bg-red-50 border border-red-200 rounded p-2 text-[12px] text-red-700">
                Deploying malware without authorization is illegal. This is a simulation.
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-[12px] text-blue-700">
                Team Bitcoin Balance: ₿{teamBalance.toFixed(2)}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setDeployItem(null)}
                className="flex-1 py-2 rounded border border-[#C8C7CC] text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('🚫 Deploy Attack button clicked:', {
                    deployItem: deployItem?.name,
                    deployData,
                    isDisabled: (deployItem.category === "virus" && !deployData.macAddress) ||
                      (deployItem.category === "worm" &&
                        ((deployItem.name === 'EmailSpread Pro' && !(deployData.emailSubject && deployData.emailContent)) ||
                         (deployItem.name === 'SocialHook' && !deployData.smsContent) ||
                         (deployItem.name === 'NetCrawler' && !(deployData.emailSubject && deployData.emailContent && deployData.smsContent)) ||
                         (!['EmailSpread Pro','SocialHook','NetCrawler'].includes(deployItem.name) && !deployData.ipAddress)
                        )
                      ) ||
                      (deployItem.category === "ransomware" &&
                        deployItem.name === "FakeBank Portal" &&
                        (!deployData.targetUrl || !deployData.stealAmount)) ||
                      (deployItem.category === "ransomware" &&
                        deployItem.name === "SiteClone Pro" &&
                        (!deployData.targetUrl || !deployData.customTitle || !deployData.customDescription)) ||
                      (deployItem.category === "ransomware" &&
                        deployItem.name === "CryptoLocker Elite" &&
                        !deployData.ipAddress) ||
                      (deployItem.category === "ransomware" &&
                        deployItem.name === "SystemLock Pro" &&
                        !deployData.macAddress) ||
                      (deployItem.category === "ransomware" &&
                        deployItem.name !== "FakeBank Portal" &&
                        deployItem.name !== "SiteClone Pro" &&
                        deployItem.name !== "CryptoLocker Elite" &&
                        deployItem.name !== "SystemLock Pro" &&
                        !deployData.domainName)
                  });
                  executeDeploy();
                }}
                disabled={
                  (deployItem.category === "virus" && !deployData.macAddress) ||
                  (deployItem.category === "worm" &&
                    ((deployItem.name === 'EmailSpread Pro' && !(deployData.emailSubject && deployData.emailContent)) ||
                     (deployItem.name === 'SocialHook' && !deployData.smsContent) ||
                     (deployItem.name === 'NetCrawler' && !(deployData.emailSubject && deployData.emailContent && deployData.smsContent)) ||
                     (!['EmailSpread Pro','SocialHook','NetCrawler'].includes(deployItem.name) && !deployData.ipAddress)
                    )
                  ) ||
                  (deployItem.category === "ransomware" &&
                    deployItem.name === "FakeBank Portal" &&
                    (!deployData.targetUrl || !deployData.stealAmount)) ||
                  (deployItem.category === "ransomware" &&
                    deployItem.name === "SiteClone Pro" &&
                    (!deployData.targetUrl || !deployData.customTitle || !deployData.customDescription)) ||
                  (deployItem.category === "ransomware" &&
                    deployItem.name === "CryptoLocker Elite" &&
                    !deployData.ipAddress) ||
                  (deployItem.category === "ransomware" &&
                    deployItem.name === "SystemLock Pro" &&
                    !deployData.macAddress) ||
                  (deployItem.category === "ransomware" &&
                    deployItem.name !== "FakeBank Portal" &&
                    deployItem.name !== "SiteClone Pro" &&
                    deployItem.name !== "CryptoLocker Elite" &&
                    deployItem.name !== "SystemLock Pro" &&
                    !deployData.domainName)
                }
                className="flex-1 py-2 rounded text-white text-[13px] font-semibold bg-gradient-to-b from-[#4CD964] to-[#2B7BE8] border border-[#19943A] disabled:opacity-50"
              >
                Deploy Attack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Running Malware Indicators */}
      {Array.from(runningMalware.entries()).map(([malwareId, data], index) => (
        <div key={malwareId} style={{ bottom: `${80 + index * 80}px` }}>
          <RunningMalwareIndicator malwareId={malwareId} data={data} />
        </div>
      ))}

      {/* SystemLock Pro Attack Interface */}
      {showSystemLockProAttack && (
        <SystemLockProAttack
          teamId={attackerTeamIdProp || user?.teamId || ''}
          initialTargetMAC={systemLockProTarget}
          onClose={() => {
            console.log('🚫 SystemLock Pro onClose called');
            setShowSystemLockProAttack(false);
          }}
        />
      )}
    </div>
  );
};

export default AppStore;
