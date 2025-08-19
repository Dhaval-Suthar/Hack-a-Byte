"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import clsx from "clsx";

interface BlackMartProps {
  onClose?: () => void;
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
}

interface DeploymentData {
  macAddress?: string;
  ipAddress?: string;
  domainName?: string;
  targetEmail?: string;
}

const MALWARE_CATALOG: MalwareItem[] = [
  // Virus Category
  {
    id: 'virus-001',
    name: 'SysTrojan Pro',
    category: 'virus',
    description: 'Advanced system infiltrator that embeds deep into the target OS. Provides persistent backdoor access.',
    price: 299,
    icon: '/hackbook-W95/app-icon/terminal.png',
    requirements: ['Target MAC Address', 'Network Access'],
    rating: 4.8,
    downloadCount: '15.2K',
    isPopular: true
  },
  {
    id: 'virus-002',
    name: 'StealthViral',
    category: 'virus',
    description: 'Polymorphic virus that mutates to avoid detection. Self-replicating with rootkit capabilities.',
    price: 450,
    icon: '/hackbook-W95/app-icon/lock.png',
    requirements: ['Target MAC Address', 'Admin Privileges'],
    rating: 4.6,
    downloadCount: '8.7K'
  },
  {
    id: 'virus-003',
    name: 'DataMiner X',
    category: 'virus',
    description: 'Harvests credentials, browser data, and system information. Silent operation with encrypted exfiltration.',
    price: 199,
    icon: '/hackbook-W95/app-icon/search.png',
    requirements: ['Target MAC Address'],
    rating: 4.4,
    downloadCount: '22.1K'
  },

  // Worm Category
  {
    id: 'worm-001',
    name: 'EmailSpread Pro',
    category: 'worm',
    description: 'Self-propagating email worm. Harvests contact lists and spreads phishing campaigns automatically.',
    price: 350,
    icon: '/hackbook-W95/app-icon/inbox.png',
    requirements: ['Target IP Address', 'SMTP Server'],
    rating: 4.7,
    downloadCount: '12.5K',
    isPopular: true
  },
  {
    id: 'worm-002',
    name: 'NetCrawler',
    category: 'worm',
    description: 'Network-spreading worm that exploits vulnerabilities. Creates botnet for distributed attacks.',
    price: 520,
    icon: '/hackbook-W95/app-icon/nn.png',
    requirements: ['Target IP Range', 'Port Scanner'],
    rating: 4.9,
    downloadCount: '9.3K'
  },
  {
    id: 'worm-003',
    name: 'SocialHook',
    category: 'worm',
    description: 'Social media worm that spreads through messaging platforms. Harvests social connections.',
    price: 275,
    icon: '/hackbook-W95/app-icon/wintalk.png',
    requirements: ['Target IP Address', 'Social Platform Access'],
    rating: 4.2,
    downloadCount: '18.9K'
  },

  // Ransomware Category
  {
    id: 'ransom-001',
    name: 'CryptoLocker Elite',
    category: 'ransomware',
    description: 'Military-grade file encryption ransomware. Deploys fake recovery sites with payment systems.',
    price: 899,
    icon: '/hackbook-W95/app-icon/lock.svg',
    requirements: ['Domain Name', 'Web Hosting', 'Crypto Wallet'],
    rating: 4.9,
    downloadCount: '3.2K',
    isPopular: true
  },
  {
    id: 'ransom-002',
    name: 'FakeBank Portal',
    category: 'ransomware',
    description: 'Creates convincing banking site replicas. Captures login credentials and payment information.',
    price: 650,
    icon: '/hackbook-W95/app-icon/ie.png',
    requirements: ['Domain Name', 'SSL Certificate'],
    rating: 4.5,
    downloadCount: '7.8K'
  },
  {
    id: 'ransom-003',
    name: 'SystemLock Pro',
    category: 'ransomware',
    description: 'System-wide encryption with custom payment portal. Includes psychological pressure tactics.',
    price: 750,
    icon: '/hackbook-W95/app-icon/shut-down.png',
    requirements: ['Domain Name', 'Payment Gateway'],
    rating: 4.6,
    downloadCount: '5.1K'
  }
];

const BlackMart: React.FC<BlackMartProps> = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'virus' | 'worm' | 'ransomware'>('all');
  const [selectedItem, setSelectedItem] = useState<MalwareItem | null>(null);
  const [showDeployment, setShowDeployment] = useState(false);
  const [deploymentData, setDeploymentData] = useState<DeploymentData>({});
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<MalwareItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price' | 'rating'>('popular');

  // Filter and sort malware items
  const filteredItems = MALWARE_CATALOG
    .filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
        default:
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      }
    });

  const handlePurchase = useCallback((item: MalwareItem) => {
    setPurchaseItem(item);
    setShowPurchaseDialog(true);
  }, []);

  const handleDeploy = useCallback((item: MalwareItem) => {
    setSelectedItem(item);
    setDeploymentData({});
    setShowDeployment(true);
  }, []);

  const executeDeploy = useCallback(() => {
    if (!selectedItem) return;

    // Show deployment progress
    const steps = [
      'Initializing deployment system...',
      'Validating target parameters...',
      'Establishing secure connection...',
      'Uploading payload...',
      'Executing deployment...',
      'Deployment completed successfully!'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        console.log(`[${selectedItem.name}] ${steps[stepIndex]}`);
        stepIndex++;
      } else {
        clearInterval(interval);
        alert(`${selectedItem.name} has been successfully deployed!\n\nTarget: ${
          selectedItem.category === 'virus' ? deploymentData.macAddress :
          selectedItem.category === 'worm' ? deploymentData.ipAddress :
          deploymentData.domainName
        }\n\nStatus: Active`);
        setShowDeployment(false);
        setSelectedItem(null);
        setDeploymentData({});
      }
    }, 800);
  }, [selectedItem, deploymentData]);

  const confirmPurchase = useCallback(() => {
    if (!purchaseItem) return;
    
    // Simulate purchase process
    const purchaseSteps = [
      'Processing payment...',
      'Verifying transaction...',
      'Downloading package...',
      'Installation complete!'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < purchaseSteps.length - 1) {
        console.log(`[Purchase] ${purchaseSteps[stepIndex]}`);
        stepIndex++;
      } else {
        clearInterval(interval);
        alert(`Successfully purchased ${purchaseItem.name}!\n\nLicense: UNLIMITED\nSupport: 24/7 Dark Web\nUpdates: Lifetime\n\nItem is now available for deployment.`);
        setShowPurchaseDialog(false);
        setPurchaseItem(null);
      }
    }, 600);
  }, [purchaseItem]);

  const getCategoryClasses = (category: string) => {
    switch (category) {
      case 'virus': return 'bg-red-100 text-red-700 border border-red-400';
      case 'worm': return 'bg-yellow-100 text-yellow-800 border border-yellow-500';
      case 'ransomware': return 'bg-purple-100 text-purple-700 border border-purple-400';
      default: return 'bg-gray-100 text-gray-700 border border-gray-400';
    }
  };

  return (
    <div className="h-full w-full bg-[#c0c0c0] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white p-3 flex items-center">
        <Image
          src="/hackbook-W95/app-icon/blackmart.svg"
          alt="BlackMart"
          width={24}
          height={24}
          className="mr-3"
        />
        <h1 className="text-lg font-bold">BlackMart - Underground Software Store</h1>
        <div className="ml-auto text-sm opacity-90">
          Version 2.1.3 | Secure Connection
        </div>
      </div>

      {/* Toolbar */}
  <div className="bg-[#f0f0f0] border-b-2 border-[#808080] p-2 flex items-center gap-4 text-gray-900">
        <div className="flex items-center gap-2">
      <span className="text-sm font-bold">Categories:</span>
          {['all', 'virus', 'worm', 'ransomware'].map((category) => (
            <button
              key={category}
              className={clsx(
        "px-3 py-1 text-sm border-2 rounded-none text-gray-900",
                selectedCategory === category
                  ? "border-t-[#404040] border-l-[#404040] border-r-[#ffffff] border-b-[#ffffff] shadow-inner bg-[#d0d0d0]"
                  : "border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] hover:bg-[#d0d0d0]"
              )}
              onClick={() => setSelectedCategory(category as 'all' | 'virus' | 'worm' | 'ransomware')}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm">Search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2 py-1 border-2 border-t-[#404040] border-l-[#404040] border-r-[#ffffff] border-b-[#ffffff] bg-white text-sm"
            placeholder="Find malware..."
          />
          
          <span className="text-sm ml-4">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'popular' | 'price' | 'rating')}
            className="px-2 py-1 border-2 border-t-[#404040] border-l-[#404040] border-r-[#ffffff] border-b-[#ffffff] bg-white text-sm"
          >
            <option value="popular">Popular</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="border-2 border-[#808080] bg-[#f0f0f0] p-3 hover:bg-[#e0e0e0] cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-3">
                <Image
                  src={item.icon}
                  alt={item.name}
                  width={32}
                  height={32}
                  className="flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-gray-900">{item.name}</h3>
                    {item.isPopular && (
                      <span className="bg-red-600 text-white px-2 py-0.5 text-xs rounded">HOT</span>
                    )}
                  </div>
                  <div className="mb-1">
                    <span className={clsx('inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-sm', getCategoryClasses(item.category))}>
                      {item.category.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <span>★ {item.rating}</span>
                    <span>•</span>
                    <span>{item.downloadCount} downloads</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-700 mb-3 line-clamp-2">
                {item.description}
              </p>

              <div className="text-xs text-gray-600 mb-3">
                <strong>Requirements:</strong> {item.requirements.join(', ')}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-green-700">
                  ${item.price}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePurchase(item)}
                    className="px-3 py-1 text-xs bg-[#000080] text-white border-2 border-t-[#4040ff] border-l-[#4040ff] border-r-[#000040] border-b-[#000040] hover:bg-[#0000a0]"
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={() => handleDeploy(item)}
                    className="px-3 py-1 text-xs bg-[#008000] text-white border-2 border-t-[#40ff40] border-l-[#40ff40] border-r-[#004000] border-b-[#004000] hover:bg-[#00a000]"
                  >
                    Deploy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Purchase Dialog */}
      {showPurchaseDialog && purchaseItem && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] text-gray-900 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] p-4 w-96">
            <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white p-2 -m-4 mb-4">
              <h3 className="font-bold">Confirm Purchase</h3>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <Image
                src={purchaseItem.icon}
                alt={purchaseItem.name}
                width={48}
                height={48}
              />
              <div>
                <h4 className="font-bold">{purchaseItem.name}</h4>
                <p className="text-sm text-gray-600">{purchaseItem.category.toUpperCase()}</p>
                <p className="text-lg font-bold text-green-700">${purchaseItem.price}</p>
              </div>
            </div>

            <div className="bg-yellow-100 border-2 border-yellow-400 p-2 mb-4 text-xs text-yellow-900">
              <strong className="font-bold">⚠️ Warning:</strong> This software is for educational and authorized testing purposes only. 
              <span className="block mt-1">Unauthorized use may violate laws and regulations.</span>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPurchaseDialog(false)}
                className="px-4 py-2 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] hover:bg-[#d0d0d0]"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                className="px-4 py-2 bg-[#000080] text-white border-2 border-t-[#4040ff] border-l-[#4040ff] border-r-[#000040] border-b-[#000040] hover:bg-[#0000a0]"
              >
                Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Dialog */}
      {showDeployment && selectedItem && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] p-4 w-96">
            <div className="bg-gradient-to-r from-[#008000] to-[#40a040] text-white p-2 -m-4 mb-4">
              <h3 className="font-bold">Deploy {selectedItem.name}</h3>
            </div>

            <div className="space-y-4">
              {selectedItem.category === 'virus' && (
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Target MAC Address: <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={deploymentData.macAddress || ''}
                    onChange={(e) => setDeploymentData(prev => ({ ...prev, macAddress: e.target.value }))}
                    placeholder="00:1B:44:11:3A:B7"
                    className="w-full px-2 py-1 border-2 border-t-[#404040] border-l-[#404040] border-r-[#ffffff] border-b-[#ffffff] bg-white"
                  />
                </div>
              )}

              {selectedItem.category === 'worm' && (
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Target IP Address: <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={deploymentData.ipAddress || ''}
                    onChange={(e) => setDeploymentData(prev => ({ ...prev, ipAddress: e.target.value }))}
                    placeholder="192.168.1.100"
                    className="w-full px-2 py-1 border-2 border-t-[#404040] border-l-[#404040] border-r-[#ffffff] border-b-[#ffffff] bg-white"
                  />
                </div>
              )}

              {selectedItem.category === 'ransomware' && (
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Domain Name: <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={deploymentData.domainName || ''}
                    onChange={(e) => setDeploymentData(prev => ({ ...prev, domainName: e.target.value }))}
                    placeholder="fake-bank-portal.com"
                    className="w-full px-2 py-1 border-2 border-t-[#404040] border-l-[#404040] border-r-[#ffffff] border-b-[#ffffff] bg-white"
                  />
                </div>
              )}

              <div className="bg-red-100 border-2 border-red-400 p-2 text-xs">
                <strong>⚠️ DANGER:</strong> Deploying malware without authorization is illegal. 
                This is for simulation purposes only.
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowDeployment(false)}
                className="px-4 py-2 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] hover:bg-[#d0d0d0]"
              >
                Cancel
              </button>
              <button
                onClick={executeDeploy}
                className="px-4 py-2 bg-[#008000] text-white border-2 border-t-[#40ff40] border-l-[#40ff40] border-r-[#004000] border-b-[#004000] hover:bg-[#00a000]"
                disabled={
                  (selectedItem.category === 'virus' && !deploymentData.macAddress) ||
                  (selectedItem.category === 'worm' && !deploymentData.ipAddress) ||
                  (selectedItem.category === 'ransomware' && !deploymentData.domainName)
                }
              >
                Deploy Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
  <div className="bg-[#c0c0c0] border-t-2 border-[#808080] p-2 text-xs flex justify-between text-gray-900">
        <div>Ready | {filteredItems.length} items found</div>
        <div>🔒 Secure Connection | Anonymous Mode: ON</div>
      </div>
    </div>
  );
};

export default BlackMart;
