"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { getPlayspaceId } from '@/lib/playspace-utils';
import { io as rawIo, Socket } from 'socket.io-client';

interface BlackMartPhoneProps {
  onClose?: () => void;
  time: Date;
}

interface MalwareItem {
  id: string;
  name: string;
  category: 'virus' | 'worm' | 'ransomware';
  description: string;
  price: number;
  icon: string;
  requirements: string[];
  isPopular?: boolean;
  rating: number;
  downloadCount: string;
  version: string;
  developer: string;
  size: string;
}

interface DeploymentData {
  macAddress?: string;
  ipAddress?: string;
  domainName?: string;
}

const MALWARE_CATALOG: MalwareItem[] = [
  // Virus Category
  {
    id: 'virus-001',
    name: 'SysTrojan Pro',
    category: 'virus',
    description: 'Advanced system infiltrator that embeds deep into the target OS. Provides persistent backdoor access with military-grade stealth capabilities.',
    price: 299,
    icon: '🦠',
    requirements: ['Target MAC Address', 'Network Access'],
    rating: 4.8,
    downloadCount: '15.2K',
    version: '3.2.1',
    developer: 'Dark Systems Inc.',
    size: '12.5 MB',
    isPopular: true
  },
  {
    id: 'virus-002',
    name: 'StealthViral',
    category: 'virus',
    description: 'Polymorphic virus that mutates to avoid detection. Self-replicating with advanced rootkit capabilities and signature evasion.',
    price: 450,
    icon: '🔍',
    requirements: ['Target MAC Address', 'Admin Privileges'],
    rating: 4.6,
    downloadCount: '8.7K',
    version: '2.1.4',
    developer: 'Phantom Labs',
    size: '8.9 MB'
  },
  {
    id: 'virus-003',
    name: 'DataMiner X',
    category: 'virus',
    description: 'Harvests credentials, browser data, and system information. Silent operation with encrypted exfiltration protocols.',
    price: 199,
    icon: '⛏️',
    requirements: ['Target MAC Address'],
    rating: 4.4,
    downloadCount: '22.1K',
    version: '1.8.3',
    developer: 'DeepVault Corp',
    size: '5.2 MB'
  },

  // Worm Category
  {
    id: 'worm-001',
    name: 'EmailSpread Pro',
    category: 'worm',
    description: 'Self-propagating email worm. Harvests contact lists and spreads sophisticated phishing campaigns automatically across networks.',
    price: 350,
    icon: '📧',
    requirements: ['Target IP Address', 'SMTP Server'],
    rating: 4.7,
    downloadCount: '12.5K',
    version: '4.0.2',
    developer: 'NetCrawl Solutions',
    size: '15.8 MB',
    isPopular: true
  },
  {
    id: 'worm-002',
    name: 'NetCrawler',
    category: 'worm',
    description: 'Network-spreading worm that exploits vulnerabilities. Creates distributed botnet infrastructure for large-scale operations.',
    price: 520,
    icon: '🕷️',
    requirements: ['Target IP Range', 'Port Scanner'],
    rating: 4.9,
    downloadCount: '9.3K',
    version: '5.1.0',
    developer: 'Web Syndicate',
    size: '28.4 MB'
  },
  {
    id: 'worm-003',
    name: 'SocialHook',
    category: 'worm',
    description: 'Social media worm that spreads through messaging platforms. Advanced social engineering with contact harvesting.',
    price: 275,
    icon: '🪝',
    requirements: ['Target IP Address', 'Social Platform Access'],
    rating: 4.2,
    downloadCount: '18.9K',
    version: '2.7.1',
    developer: 'Social Breach LLC',
    size: '7.3 MB'
  },

  // Ransomware Category
  {
    id: 'ransom-001',
    name: 'CryptoLocker Elite',
    category: 'ransomware',
    description: 'Military-grade file encryption ransomware. Deploys professional fake recovery sites with integrated payment systems.',
    price: 899,
    icon: '🔒',
    requirements: ['Domain Name', 'Web Hosting', 'Crypto Wallet'],
    rating: 4.9,
    downloadCount: '3.2K',
    version: '6.0.1',
    developer: 'Cipher Works',
    size: '45.2 MB',
    isPopular: true
  },
  {
    id: 'ransom-002',
    name: 'FakeBank Portal',
    category: 'ransomware',
    description: 'Creates convincing banking site replicas. Advanced phishing with real-time credential capture and payment processing.',
    price: 650,
    icon: '🏦',
    requirements: ['Domain Name', 'SSL Certificate'],
    rating: 4.5,
    downloadCount: '7.8K',
    version: '1.9.8',
    developer: 'Financial Phantoms',
    size: '32.1 MB'
  },
  {
    id: 'ransom-003',
    name: 'SystemLock Pro',
    category: 'ransomware',
    description: 'System-wide encryption with custom payment portal. Includes psychological pressure tactics and deadline enforcement.',
    price: 750,
    icon: '🚫',
    requirements: ['Domain Name', 'Payment Gateway'],
    rating: 4.6,
    downloadCount: '5.1K',
    version: '3.4.5',
    developer: 'Lock & Key Systems',
    size: '38.7 MB'
  }
];

const BlackMartPhone: React.FC<BlackMartPhoneProps> = ({ time }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'virus' | 'worm' | 'ransomware'>('all');
  const [selectedItem, setSelectedItem] = useState<MalwareItem | null>(null);
  const [showDeployment, setShowDeployment] = useState(false);
  const [deploymentData, setDeploymentData] = useState<DeploymentData>({});
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<MalwareItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailItem, setDetailItem] = useState<MalwareItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());
  // Phase 1 wiring state
  const [attackerTeamId, setAttackerTeamId] = useState('');
  const [targetDeviceId, setTargetDeviceId] = useState('');
  // Phase 2: auto context
  const [devices, setDevices] = useState<{id:string; teamId?:string; deviceType:string; status:string; isBank?:boolean;}[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceError, setDeviceError] = useState<string|undefined>();
  const [socket, setSocket] = useState<Socket|null>(null); // retained to allow future real-time UI enhancements
  const [statusLines, setStatusLines] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  // Phase 3 real-time feedback
  interface WormToken { id:string; wormId:string; channel:'email'|'sms'; targetTeamId:string; expires:number }
  const [wormTokens, setWormTokens] = useState<WormToken[]>([]);
  const [ransomStatus, setRansomStatus] = useState<string>();
  const [stealthStatus, setStealthStatus] = useState<string>();
  const [showIntelPanel, setShowIntelPanel] = useState(false);
  const [ransomProgress, setRansomProgress] = useState<{p:number; total:number}|null>(null);
  const [stealthProgress, setStealthProgress] = useState<{p:number; total:number}|null>(null);
  const playspaceId = getPlayspaceId();
  const appendStatus = (l:string)=>setStatusLines(p=>[...p,l]);
  // Utility: mutate ransomware / stealth viral progress (defender simulation)
  const defendRansom = useCallback(async ()=>{
    const targetKey = playspaceId || targetDeviceId; if (!targetKey) return;
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const ch = chars[Math.floor(Math.random()*chars.length)];
      const resp = await fetch(`/api/attack/ransomware?targetKey=${encodeURIComponent(targetKey)}`, { method:'PUT', headers: attackerTeamId? { 'x-team-id': attackerTeamId, 'Content-Type':'application/json'}: undefined, body: JSON.stringify({ char: ch }) });
      const js = await resp.json().catch(()=>({}));
      if (resp.ok && js.success) appendStatus(`⌨ ransom char ${ch}${js.completed? ' (completed)': ''}`); else appendStatus(`⌨ ransom fail ${js.error||resp.status}`);
  } catch { appendStatus('⌨ ransom error'); }
  }, [playspaceId, targetDeviceId, attackerTeamId]);
  const defendStealth = useCallback(async ()=>{
    const targetKey = playspaceId || targetDeviceId; if (!targetKey) return;
    try {
      const resp = await fetch(`/api/attack/stealth-viral?targetKey=${encodeURIComponent(targetKey)}`, { method:'PUT', headers: attackerTeamId? { 'x-team-id': attackerTeamId, 'Content-Type':'application/json'}: undefined, body: JSON.stringify({}) });
      const js = await resp.json().catch(()=>({}));
      if (resp.ok && js.success) appendStatus(`🖱 stealth click ${js.clicks||'?'}${js.defeated?' (defeated)':''}`); else appendStatus(`🖱 stealth fail ${js.error||resp.status}`);
  } catch { appendStatus('🖱 stealth error'); }
  }, [playspaceId, targetDeviceId, attackerTeamId]);
  const openWormToken = useCallback(async (tokenId:string)=>{
    try {
      const teamId = attackerTeamId; if (!teamId) { appendStatus('📬 need team to open'); return; }
      appendStatus(`📬 open token ${tokenId.slice(0,6)}`);
      const resp = await fetch('/api/attack/worm/open', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ teamId, tokenId }) });
      const js = await resp.json().catch(()=>({}));
      if (resp.ok && js.success) {
        setWormTokens(t=> t.filter(tok=>tok.id!==tokenId));
        appendStatus(`� worm reward +${js.reward}`);
      } else {
        appendStatus(`📬 open fail ${js.error || resp.status}`);
      }
    } catch { appendStatus('📬 token open error'); }
  }, [attackerTeamId]);

  // Fetch devices (online) and attempt to infer attacker team id (first with roles we expect or first non-bank device w/ team)
  useEffect(()=>{
    let cancelled = false;
    async function load() {
      setLoadingDevices(true); setDeviceError(undefined);
      try {
        const resp = await fetch('/api/devices');
        if (!resp.ok) throw new Error('devices fetch failed');
        const json = await resp.json();
        if (cancelled) return;
        const list = Array.isArray(json.devices)? json.devices as typeof devices : [];
        setDevices(list);
        // pick a default attacker team id (first teamId present on a non-bank device)
        if (!attackerTeamId) {
          const pick = list.find(d=>d.teamId && !d.isBank);
          if (pick?.teamId) setAttackerTeamId(pick.teamId);
        }
        // pick a target device (different from attacker device if possible)
        if (!targetDeviceId) {
          const attackerDeviceId = list.find(d=>d.teamId === attackerTeamId)?.id;
          const target = list.find(d=> d.id !== attackerDeviceId && !d.isBank);
          if (target) setTargetDeviceId(target.id);
        }
      } catch (e) {
        if (!cancelled) setDeviceError(e instanceof Error? e.message : 'Unknown device load error');
      } finally { if (!cancelled) setLoadingDevices(false); }
    }
    load();
    const interval = setInterval(load, 15_000); // refresh every 15s
    return ()=>{ cancelled = true; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute target if attacker changes and current target equals attacker
  useEffect(()=>{
    if (!devices.length || !attackerTeamId) return;
    const attackerDeviceId = devices.find(d=>d.teamId===attackerTeamId)?.id;
    if (attackerDeviceId && attackerDeviceId === targetDeviceId) {
      const alt = devices.find(d=>d.id!==attackerDeviceId && !d.isBank);
      if (alt) setTargetDeviceId(alt.id);
    }
  }, [attackerTeamId, devices, targetDeviceId]);

  // Socket join for team room (so defender/attacker events route correctly) + malware event listeners
  useEffect(()=>{
    if (!attackerTeamId) return;
    setSocket(prev=>{
      if (prev) { prev.emit('join-team', attackerTeamId); return prev; }
      const s = rawIo('/', { path: '/api/socket/io', transports: ['websocket'] });
      s.on('connect', ()=> appendStatus('🔌 joined socket'));
      s.emit('join-team', attackerTeamId);
      // Worm tokens
      s.on('worm-payload', (p: { tokenId:string; wormId:string; channel:'email'|'sms'; targetTeamId:string; expires:number })=>{
        setWormTokens(old=>[...old.filter(t=>t.id!==p.tokenId), { id:p.tokenId, wormId:p.wormId, channel:p.channel, targetTeamId:p.targetTeamId, expires:p.expires }]);
        appendStatus(`📨 worm token ${p.tokenId.slice(0,6)} ${p.channel}`);
      });
      // Ransomware
      s.on('ransomware-spawn', (p:{phrase:string; rewardDemand:number})=>{ setRansomStatus(`Spawn ${p.phrase} demand ${p.rewardDemand}`); appendStatus('💣 ransomware spawn'); });
  s.on('ransomware-progress', (p:{progress:number; total:number})=> { setRansomStatus(`Progress ${p.progress}/${p.total}`); setRansomProgress({p:p.progress, total:p.total}); });
      s.on('ransomware-neutralized', (p:{bonus:number})=>{ setRansomStatus(`Neutralized +${p.bonus}`); appendStatus('🛡 ransomware neutralized'); });
      s.on('ransomware-demand', (p:{demand:number; windowMs:number})=>{ setRansomStatus(`Demand ${p.demand} ${Math.round(p.windowMs/1000)}s window`); appendStatus('💰 ransom demand'); });
      // Stealth viral
      s.on('malware-stealth-viral-spawn', (p:{clicksRequired:number})=>{ setStealthStatus(`Stealth 0/${p.clicksRequired}`); appendStatus('🕵 stealth spawn'); });
  s.on('malware-stealth-viral-progress', (p:{clicks:number; clicksRequired:number})=> { setStealthStatus(`Stealth ${p.clicks}/${p.clicksRequired}`); setStealthProgress({p:p.clicks,total:p.clicksRequired}); });
      s.on('malware-stealth-viral-defeated', ()=>{ setStealthStatus('Stealth defeated'); appendStatus('✅ stealth defeated'); });
      // SysTrojan
      s.on('systrojan-success', ()=> appendStatus('💥 systrojan success'));
      s.on('systrojan-failure', ()=> appendStatus('🛡 systrojan blocked'));
      return s;
    });
    return ()=>{ socket?.off('connect'); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attackerTeamId]);

  // Persist intel panel preference
  useEffect(()=>{
    const stored = localStorage.getItem('bm_intel');
    if (stored === '1') setShowIntelPanel(true);
  }, []);
  useEffect(()=>{ localStorage.setItem('bm_intel', showIntelPanel? '1':'0'); }, [showIntelPanel]);

  // Derived lists
  const selectableTargets = useMemo(()=> devices.filter(d=>!d.isBank && d.teamId && d.teamId !== attackerTeamId), [devices, attackerTeamId]);

  // Filter malware items
  const filteredItems = MALWARE_CATALOG
    .filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));

  const handlePurchase = useCallback((item: MalwareItem, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent event bubbling
    }
    setPurchaseItem(item);
    setShowPurchaseDialog(true);
  }, []);

  const handleDeploy = useCallback((item: MalwareItem) => {
    setSelectedItem(item);
    setDeploymentData({});
    setShowDeployment(true);
  }, []);

  const executeDeploy = useCallback(async () => {
    if (!selectedItem) return;
    setIsDeploying(true); setStatusLines([]);
    const id = selectedItem.id;
    appendStatus(`▶ Deploying ${selectedItem.name}`);
    try {
      let resp: Response | null = null;
      if (id === 'virus-001') {
        if (!targetDeviceId || !attackerTeamId) throw new Error('targetDeviceId & attackerTeamId required');
        appendStatus('POST /api/attack/systrojan');
        resp = await fetch('/api/attack/systrojan', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ targetDeviceId, attackerTeamId }) });
      } else if (id === 'virus-002') {
        const targetKey = playspaceId || targetDeviceId; if (!targetKey) throw new Error('target key required');
        appendStatus('POST /api/attack/stealth-viral');
        resp = await fetch(`/api/attack/stealth-viral?targetKey=${encodeURIComponent(targetKey)}`, { method:'POST', headers: attackerTeamId ? { 'x-team-id': attackerTeamId } : undefined });
      } else if (id === 'virus-003') {
        if (!targetDeviceId || !attackerTeamId) throw new Error('targetDeviceId & attackerTeamId required');
        appendStatus('POST /api/attack/dataminer');
        resp = await fetch('/api/attack/dataminer', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ targetDeviceId, attackerTeamId }) });
      } else if (id.startsWith('worm-')) {
        if (!attackerTeamId) throw new Error('attackerTeamId required');
        appendStatus('POST /api/attack/worm');
        resp = await fetch('/api/attack/worm', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ attackerTeamId, wormId: id }) });
      } else if (id.startsWith('ransom-')) {
        const targetKey = playspaceId || targetDeviceId; if (!targetKey) throw new Error('target key required');
        appendStatus('POST /api/attack/ransomware');
        resp = await fetch(`/api/attack/ransomware?targetKey=${encodeURIComponent(targetKey)}`, { method:'POST', headers: attackerTeamId ? { 'Content-Type':'application/json'} : undefined, body: attackerTeamId ? JSON.stringify({ attackerTeamId }) : undefined });
      }
      if (!resp) throw new Error('No response');
      const json = await resp.json().catch(()=>({}));
      if (!resp.ok || json.success === false) appendStatus(`❌ Fail: ${json.error || resp.statusText}`); else appendStatus('✅ Accepted. Await effects.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      appendStatus(`⚠ ${msg}`);
    } finally { setIsDeploying(false); }
  }, [selectedItem, attackerTeamId, targetDeviceId, playspaceId]);

  const confirmPurchase = useCallback(() => {
    if (!purchaseItem) return;
    
    setTimeout(() => {
      alert(`Successfully purchased ${purchaseItem.name}!\n\nLicense: UNLIMITED\nSupport: 24/7 Dark Web\n\nItem is now available for deployment.`);
      setPurchasedItems(prev => new Set(prev).add(purchaseItem.id));
      setShowPurchaseDialog(false);
      setPurchaseItem(null);
    }, 1500);
  }, [purchaseItem]);

  const showItemDetails = useCallback((item: MalwareItem) => {
    setDetailItem(item);
    setShowDetails(true);
  }, []);



  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'virus': return 'bg-red-500';
      case 'worm': return 'bg-yellow-500';
      case 'ransomware': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (showDetails && detailItem) {
    return (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <button onClick={() => setShowDetails(false)} className="mr-3 text-blue-500 text-lg">
            ‹ Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900 flex-1">App Details</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* App Header */}
          <div className="bg-white px-4 py-6">
            <div className="flex items-start">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mr-4">
                {detailItem.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{detailItem.name}</h2>
                <p className="text-gray-600 mb-2">{detailItem.developer}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>★ {detailItem.rating}</span>
                  <span>{detailItem.downloadCount} downloads</span>
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${getCategoryColor(detailItem.category)}`}>
                    {detailItem.category.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Purchase/Deploy Buttons */}
            <div className="flex space-x-3 mt-6">
              {!purchasedItems.has(detailItem.id) ? (
                <button
                  onClick={(e) => handlePurchase(detailItem, e)}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold"
                >
                  Buy ${detailItem.price}
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeploy(detailItem);
                  }}
                  className="w-full bg-green-500 text-white py-3 px-4 rounded-xl font-semibold"
                >
                  Deploy
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-50 px-4 py-4">
            <div className="bg-white rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{detailItem.description}</p>
            </div>

            <div className="bg-white rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Version</span>
                  <span className="text-gray-900">{detailItem.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Size</span>
                  <span className="text-gray-900">{detailItem.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className="text-gray-900">{detailItem.category}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Requirements</h3>
              <div className="space-y-2">
                {detailItem.requirements.map((req, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                    <span className="text-gray-600">{req}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
              <div className="flex items-start">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Educational Use Only</h4>
                  <p className="text-yellow-700 text-sm">This software is for authorized testing and educational purposes only. Unauthorized use may violate laws.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Dialog - Only when in detail view */}
        {showPurchaseDialog && purchaseItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Confirm Purchase</h3>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl mr-3">
                  {purchaseItem.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{purchaseItem.name}</h4>
                  <p className="text-sm text-gray-600">{purchaseItem.developer}</p>
                  <p className="text-xl font-bold text-green-600">${purchaseItem.price}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="text-yellow-700">For educational and authorized testing purposes only.</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPurchaseDialog(false);
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmPurchase();
                  }}
                  className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-medium"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deployment Dialog - Only when in detail view */}
        {showDeployment && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Deploy {selectedItem.name}</h3>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">Attacker Team</label>
                      <select value={attackerTeamId} onChange={e=>setAttackerTeamId(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs">
                        <option value="">Select team…</option>
                        {Array.from(new Set(devices.map(d=>d.teamId).filter(Boolean)))
                          .map(tid=> <option key={tid as string} value={tid as string}>{tid}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">Target Device</label>
                      <select value={targetDeviceId} onChange={e=>setTargetDeviceId(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs">
                        <option value="">Select device…</option>
                        {selectableTargets.map(d=> <option key={d.id} value={d.id}>{d.id.slice(0,6)}… {d.deviceType}</option>)}
                      </select>
                    </div>
                  </div>
                  {loadingDevices && <div className="text-[10px] text-gray-500">Loading devices…</div>}
                  {deviceError && <div className="text-[10px] text-red-600">{deviceError}</div>}
                </div>
                {selectedItem.category === 'virus' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target MAC Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deploymentData.macAddress || ''}
                      onChange={(e) => setDeploymentData(prev => ({ ...prev, macAddress: e.target.value }))}
                      placeholder="00:1B:44:11:3A:B7"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}

                {selectedItem.category === 'worm' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target IP Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deploymentData.ipAddress || ''}
                      onChange={(e) => setDeploymentData(prev => ({ ...prev, ipAddress: e.target.value }))}
                      placeholder="192.168.1.100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}

                {selectedItem.category === 'ransomware' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Domain Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deploymentData.domainName || ''}
                      onChange={(e) => setDeploymentData(prev => ({ ...prev, domainName: e.target.value }))}
                      placeholder="fake-bank-portal.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}

                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-start text-sm">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <span className="text-red-700">Deploying malware without authorization is illegal. This is for simulation only.</span>
                  </div>
                </div>
                {statusLines.length>0 && (
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-2 max-h-32 overflow-auto text-[10px] leading-tight">
                    {statusLines.map((l,i)=>(<div key={i}>{l}</div>))}
                  </div>
                )}
                <button onClick={()=>setShowIntelPanel(s=>!s)} className="mt-2 text-[10px] underline text-blue-600">{showIntelPanel?'Hide':'Show'} Live Intel</button>
                {showIntelPanel && (
                  <div className="mt-2 space-y-2">
                    <div className="bg-white border rounded p-2">
                      <div className="text-[11px] font-semibold mb-1 flex justify-between items-center">
                        <span>Worm Payload Tokens</span>
                        <button onClick={()=> setWormTokens(t=> t.filter(tok=> tok.expires > Date.now()))} className="text-[9px] text-blue-600 underline">Prune</button>
                      </div>
                      <div className="max-h-24 overflow-auto space-y-1 text-[10px]">
                        {wormTokens.filter(t=>t.expires>Date.now()).length===0 && <div className="text-gray-500">None</div>}
                        {wormTokens.filter(t=>t.expires>Date.now()).map(t=> (
                          <div key={t.id} className="flex items-center justify-between gap-2">
                            <span className="truncate">{t.id.slice(0,6)} {t.channel} {t.wormId.replace('worm-','W')}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">{Math.max(0,Math.round((t.expires-Date.now())/1000))}s</span>
                              <button onClick={()=>openWormToken(t.id)} className="px-1 py-0.5 bg-green-600 text-white rounded text-[9px]">Open</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white border rounded p-2">
                      <div className="text-[11px] font-semibold mb-1 flex justify-between items-center">
                        <span>Ransomware</span>
                        <button onClick={defendRansom} className="text-[9px] text-blue-600 underline">Type</button>
                      </div>
                      <div className="text-[10px] min-h-[14px]">{ransomStatus || 'Idle'}</div>
                      {ransomProgress && (
                        <div className="mt-1 h-2 bg-gray-200 rounded overflow-hidden">
                          <div className="h-full bg-purple-500 transition-all" style={{ width: `${(ransomProgress.p / ransomProgress.total)*100}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="bg-white border rounded p-2">
                      <div className="text-[11px] font-semibold mb-1 flex justify-between items-center">
                        <span>Stealth Viral</span>
                        <button onClick={defendStealth} className="text-[9px] text-blue-600 underline">Click</button>
                      </div>
                      <div className="text-[10px] min-h-[14px]">{stealthStatus || 'Idle'}</div>
                      {stealthProgress && (
                        <div className="mt-1 h-2 bg-gray-200 rounded overflow-hidden">
                          <div className="h-full bg-yellow-500 transition-all" style={{ width: `${(stealthProgress.p / stealthProgress.total)*100}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowDeployment(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeploy}
                  className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-medium disabled:opacity-50"
                  disabled={
                    (selectedItem.category === 'virus' && !deploymentData.macAddress) ||
                    (selectedItem.category === 'worm' && !deploymentData.ipAddress) ||
                    (selectedItem.category === 'ransomware' && !deploymentData.domainName) || isDeploying
                  }
                >
                  {isDeploying ? 'Deploying...' : 'Deploy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">BlackMart</h1>
          <div className="text-xs text-gray-500">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search malware..."
            className="w-full bg-gray-100 rounded-xl px-4 py-2 pl-10 text-sm"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'All', icon: '📱' },
            { key: 'virus', label: 'Virus', icon: '🦠' },
            { key: 'worm', label: 'Worm', icon: '🪱' },
            { key: 'ransomware', label: 'Ransom', icon: '🔒' }
          ].map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key as 'all' | 'virus' | 'worm' | 'ransomware')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.key
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="text-xs mb-1">{category.icon}</div>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* App List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="px-4 py-4 space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 shadow-sm"
              onClick={() => showItemDetails(item)}
            >
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl mr-3">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    {item.isPopular && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">HOT</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>★ {item.rating}</span>
                      <span>{item.downloadCount}</span>
                      <span className={`px-2 py-1 rounded-full text-white ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      {purchasedItems.has(item.id) ? (
                        <div className="text-sm font-medium text-green-600">OWNED</div>
                      ) : (
                        <div className="text-lg font-bold text-green-600">
                          ${item.price}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>





      {/* Status Bar */}
      <div className="bg-gray-100 px-4 py-2 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>🔒 Secure Connection</span>
          <span>{filteredItems.length} items</span>
          <span>Anonymous Mode</span>
        </div>
      </div>
    </div>
  );
};

export default BlackMartPhone;
