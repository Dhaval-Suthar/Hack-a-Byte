"use client";

import React, { useMemo, useState, useCallback } from "react";

interface AppStoreProps {
  onClose?: () => void;
  time: Date;
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
}

// Reuse the BlackMart catalog data (duplicated here for isolation and to avoid a breaking refactor)
const CATALOG: StoreItem[] = [
  { id: 'virus-001', name: 'SysTrojan Pro', category: 'virus', description: 'Advanced system infiltrator that embeds deep into the target OS. Provides persistent backdoor access with military-grade stealth capabilities.', price: 299, icon: '🦠', requirements: ['Target MAC Address', 'Network Access'], rating: 4.8, downloadCount: '15.2K', version: '3.2.1', developer: 'Dark Systems Inc.', size: '12.5 MB', isPopular: true },
  { id: 'virus-002', name: 'StealthViral', category: 'virus', description: 'Polymorphic virus that mutates to avoid detection. Self-replicating with advanced rootkit capabilities and signature evasion.', price: 450, icon: '🔍', requirements: ['Target MAC Address', 'Admin Privileges'], rating: 4.6, downloadCount: '8.7K', version: '2.1.4', developer: 'Phantom Labs', size: '8.9 MB' },
  { id: 'virus-003', name: 'DataMiner X', category: 'virus', description: 'Harvests credentials, browser data, and system information. Silent operation with encrypted exfiltration protocols.', price: 199, icon: '⛏️', requirements: ['Target MAC Address'], rating: 4.4, downloadCount: '22.1K', version: '1.8.3', developer: 'DeepVault Corp', size: '5.2 MB' },
  { id: 'worm-001', name: 'EmailSpread Pro', category: 'worm', description: 'Self-propagating email worm. Harvests contact lists and spreads sophisticated phishing campaigns automatically across networks.', price: 350, icon: '📧', requirements: ['Target IP Address', 'SMTP Server'], rating: 4.7, downloadCount: '12.5K', version: '4.0.2', developer: 'NetCrawl Solutions', size: '15.8 MB', isPopular: true },
  { id: 'worm-002', name: 'NetCrawler', category: 'worm', description: 'Network-spreading worm that exploits vulnerabilities. Creates distributed botnet infrastructure for large-scale operations.', price: 520, icon: '🕷️', requirements: ['Target IP Range', 'Port Scanner'], rating: 4.9, downloadCount: '9.3K', version: '5.1.0', developer: 'Web Syndicate', size: '28.4 MB' },
  { id: 'worm-003', name: 'SocialHook', category: 'worm', description: 'Social media worm that spreads through messaging platforms. Advanced social engineering with contact harvesting.', price: 275, icon: '🪝', requirements: ['Target IP Address', 'Social Platform Access'], rating: 4.2, downloadCount: '18.9K', version: '2.7.1', developer: 'Social Breach LLC', size: '7.3 MB' },
  { id: 'ransom-001', name: 'CryptoLocker Elite', category: 'ransomware', description: 'Military-grade file encryption ransomware. Deploys professional fake recovery sites with integrated payment systems.', price: 899, icon: '🔒', requirements: ['Domain Name', 'Web Hosting', 'Crypto Wallet'], rating: 4.9, downloadCount: '3.2K', version: '6.0.1', developer: 'Cipher Works', size: '45.2 MB', isPopular: true },
  { id: 'ransom-002', name: 'FakeBank Portal', category: 'ransomware', description: 'Creates convincing banking site replicas. Advanced phishing with real-time credential capture and payment processing.', price: 650, icon: '🏦', requirements: ['Domain Name', 'SSL Certificate'], rating: 4.5, downloadCount: '7.8K', version: '1.9.8', developer: 'Financial Phantoms', size: '32.1 MB' },
  { id: 'ransom-003', name: 'SystemLock Pro', category: 'ransomware', description: 'System-wide encryption with custom payment portal. Includes psychological pressure tactics and deadline enforcement.', price: 750, icon: '🚫', requirements: ['Domain Name', 'Payment Gateway'], rating: 4.6, downloadCount: '5.1K', version: '3.4.5', developer: 'Lock & Key Systems', size: '38.7 MB' },
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

const AppStore: React.FC<AppStoreProps> = ({ time }) => {
  const [tab, setTab] = useState<TabKey>("featured");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | Category>("all");
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<StoreItem | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<StoreItem | null>(null);
  const [deployItem, setDeployItem] = useState<StoreItem | null>(null);
  const [deployData, setDeployData] = useState<DeploymentData>({});

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

  const confirmPurchase = useCallback(() => {
    if (!purchaseItem) return;
    setPurchased(prev => new Set(prev).add(purchaseItem.id));
    setShowPurchase(false);
    setPurchaseItem(null);
  }, [purchaseItem]);

  const onDeploy = useCallback((item: StoreItem) => {
    setDeployItem(item);
    setDeployData({});
  }, []);

  const executeDeploy = useCallback(() => {
    if (!deployItem) return;
    // Simulation only
    alert(`${deployItem.name} deployed successfully!`);
    setDeployItem(null);
    setDeployData({});
  }, [deployItem]);

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
                  {(item.price && item.price > 0 ? `$${item.price}` : 'GET')} ›
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
  <div className="w-screen h-screen bg-[#DCEBFF] flex flex-col">
      {/* iOS 4 Navigation Bar */}
      <div className={`${ios4NavBar} px-3 py-2`}> 
        <div className="h-7 flex items-center justify-center relative">
          <div className="absolute left-0 top-0 bottom-0 flex items-center">
            <span className="text-white/90 text-xs">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="text-[15px] font-bold tracking-wide">App Store</div>
        </div>
      </div>

      {/* Content */}
  <div className="flex-1 overflow-y-auto relative">
        {/* Featured */}
        {tab === "featured" && (
          <div>
            <div className="px-3 py-2 text-[12px] font-semibold text-[#245a9e]">Popular Apps & Games</div>
            <div className="bg-white/95 border-t border-b border-[#D8D8D8]">
              {featured.map((i, idx) => (
                <div key={i.id} className={` ${idx < featured.length - 1 ? 'border-b border-[#D8D8D8]' : ''} odd:bg-[#F4F9FF]`}>
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
        <div key={i.id} className={` ${idx < 4 ? 'border-b border-[#D8D8D8]' : ''} odd:bg-[#F4F9FF]`}>
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
                ].map(b => (
                  <button key={b.key} onClick={() => setSelectedCategory(b.key as "all" | Category)} className={`py-1 rounded ${selectedCategory === b.key ? ios4SegmentActive : ""}`}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white/95 border-t border-b border-[#D8D8D8]">
              {filteredByCategory.map((i, idx) => (
                <div key={i.id} className={` ${idx < filteredByCategory.length - 1 ? 'border-b border-[#D8D8D8]' : ''} odd:bg-[#F4F9FF]`}>
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
                <div key={i.id} className={` ${idx < top.length - 1 ? 'border-b border-[#D8D8D8]' : ''} odd:bg-[#F4F9FF]`}>
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
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full rounded-[10px] bg-white border border-[#C8C7CC] px-8 py-2 text-[14px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                />
                <span className="absolute left-3 top-2.5 text-[#8E8E93]">🔍</span>
              </div>
            </div>
            <div className="bg-white/95 border-t border-b border-[#D8D8D8]">
              {(searchResults.length ? searchResults : CATALOG).map((i, idx, arr) => (
                <div key={i.id} className={` ${idx < arr.length - 1 ? 'border-b border-[#D8D8D8]' : ''} odd:bg-[#F4F9FF]`}>
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
              {CATALOG.filter(i => purchased.has(i.id)).length === 0 && (
                <div className="px-3 py-6 text-[13px] text-[#6D6D72]">No purchases yet.</div>
              )}
              {CATALOG.filter(i => purchased.has(i.id)).map((i, idx, arr) => (
                <div key={i.id} className={` ${idx < arr.length - 1 ? 'border-b border-[#D8D8D8]' : ''} odd:bg-[#F4F9FF]`}>
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

  {/* iOS 4 Tab Bar (dark glossy) fixed near home button, slightly overlapped to remove gap */}
  <div className="h-12 bg-gradient-to-b from-[#3F3F3F] to-[#1F1F1F] border-t border-black/40 flex items-stretch text-[10px] text-white fixed left-0 right-0 z-40 bottom-[calc(clamp(74px,12vw,92px)-6px)]">
        {[
          { key: "featured", label: "Featured", icon: "★" },
          { key: "categories", label: "Categories", icon: "☰" },
          { key: "top", label: "Top 25", icon: "#" },
          { key: "search", label: "Search", icon: "🔍" },
          { key: "updates", label: "Updates", icon: "⬇" },
        ].map(b => (
          <button
            key={b.key}
            onClick={() => setTab(b.key as TabKey)}
            className={`flex-1 flex flex-col items-center justify-center ${tab === b.key ? "text-[#5AA7FF]" : "text-white/80"}`}
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
              <button onClick={() => setDetail(null)} className="text-white text-[13px] px-2 py-0.5 rounded bg-white/15 border border-white/30">Back</button>
              <div className="flex-1 text-center text-[15px] font-bold">Details</div>
              <div className="w-[52px]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-[#EFEFF4]">
            <div className="bg-white border-b border-[#D8D8D8] p-3">
              <div className="flex items-start">
                <div className="w-14 h-14 rounded-lg bg-[#EFEFF4] mr-3 flex items-center justify-center text-2xl">{detail.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-bold text-[#111] truncate">{detail.name}</div>
                  <div className="text-[12px] text-[#666]">{detail.developer}</div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[#777]">
                    <span>★ {detail.rating}</span>
                    <span>{detail.downloadCount}</span>
                    <span className={`text-white px-1.5 py-0.5 rounded ${getCategoryBadge(detail.category)}`}>{detail.category}</span>
                  </div>
                </div>
                <div className="ml-2">
                  {!purchased.has(detail.id) ? (
                    <button onClick={() => onPurchase(detail)} className="text-white text-[12px] font-semibold px-3 py-1 rounded bg-gradient-to-b from-[#67B1FF] to-[#2B7BE8] border border-[#1C5DBA] shadow">Buy ${detail.price}</button>
                  ) : (
                    <button onClick={() => onDeploy(detail)} className="text-white text-[12px] font-semibold px-3 py-1 rounded bg-gradient-to-b from-[#4CD964] to-[#2BB84A] border border-[#19943A] shadow">Deploy</button>
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
                <div className="flex justify-between"><span className="text-[#666]">Version</span><span>{detail.version}</span></div>
                <div className="flex justify-between"><span className="text-[#666]">Size</span><span>{detail.size}</span></div>
                <div className="flex justify-between"><span className="text-[#666]">Category</span><span>{detail.category}</span></div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-[12px]">
                <div className="font-medium text-yellow-800 mb-1">Educational Use Only</div>
                <div className="text-yellow-800">This software is for authorized testing and educational purposes only.</div>
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
              <div className="w-10 h-10 rounded bg-[#EFEFF4] mr-2 flex items-center justify-center text-xl">{purchaseItem.icon}</div>
              <div>
                <div className="text-[14px] font-semibold">{purchaseItem.name}</div>
                <div className="text-[12px] text-[#666]">{purchaseItem.developer}</div>
              </div>
              <div className="ml-auto text-[16px] font-bold text-green-700">${purchaseItem.price}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-[12px] text-yellow-800 mb-3">For educational and authorized testing purposes only.</div>
            <div className="flex gap-2">
              <button onClick={() => setShowPurchase(false)} className="flex-1 py-2 rounded border border-[#C8C7CC] text-[13px]">Cancel</button>
              <button onClick={confirmPurchase} className="flex-1 py-2 rounded text-white text-[13px] font-semibold bg-gradient-to-b from-[#67B1FF] to-[#2B7BE8] border border-[#1C5DBA]">Buy</button>
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
              {deployItem.category === 'virus' && (
                <div>
                  <label className="block text-[12px] text-[#666] mb-1">Target MAC Address</label>
                  <input value={deployData.macAddress || ''} onChange={e => setDeployData({ ...deployData, macAddress: e.target.value })} placeholder="00:1B:44:11:3A:B7" className="w-full border border-[#C8C7CC] rounded px-2 py-2" />
                </div>
              )}
              {deployItem.category === 'worm' && (
                <div>
                  <label className="block text:[12px] text-[#666] mb-1">Target IP Address</label>
                  <input value={deployData.ipAddress || ''} onChange={e => setDeployData({ ...deployData, ipAddress: e.target.value })} placeholder="192.168.1.100" className="w-full border border-[#C8C7CC] rounded px-2 py-2" />
                </div>
              )}
              {deployItem.category === 'ransomware' && (
                <div>
                  <label className="block text:[12px] text-[#666] mb-1">Domain Name</label>
                  <input value={deployData.domainName || ''} onChange={e => setDeployData({ ...deployData, domainName: e.target.value })} placeholder="fake-bank-portal.com" className="w-full border border-[#C8C7CC] rounded px-2 py-2" />
                </div>
              )}
              <div className="bg-red-50 border border-red-200 rounded p-2 text-[12px] text-red-700">Deploying malware without authorization is illegal. This is a simulation.</div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setDeployItem(null)} className="flex-1 py-2 rounded border border-[#C8C7CC] text-[13px]">Cancel</button>
              <button onClick={executeDeploy} disabled={(deployItem.category === 'virus' && !deployData.macAddress) || (deployItem.category === 'worm' && !deployData.ipAddress) || (deployItem.category === 'ransomware' && !deployData.domainName)} className="flex-1 py-2 rounded text-white text-[13px] font-semibold bg-gradient-to-b from-[#4CD964] to-[#2BB84A] border border-[#19943A] disabled:opacity-50">Deploy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppStore;
