import connectDb from '@/db/connectDb';
import Site from '@/models/Site';

const sampleSites = [
  {
    url: "https://www.google.com",
    title: "Google",
    description: "Search the world's information",
    category: "search",
    content: `
      <div class="flex flex-col items-center justify-center min-h-screen bg-white">
        <div class="text-center mb-8">
          <h1 class="text-6xl font-bold text-blue-600 mb-4">Google</h1>
          <div class="max-w-md mx-auto">
            <input type="text" placeholder="Search Google or type a URL" 
                   class="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
            <div class="flex justify-center gap-3 mt-6">
              <button class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">Google Search</button>
              <button class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">I'm Feeling Lucky</button>
            </div>
          </div>
        </div>
        <div class="text-xs text-gray-500 mt-8">
          <p>Google offered in: <a href="#" class="text-blue-600">English</a></p>
        </div>
      </div>
    `,
    backgroundColor: "#ffffff",
    textColor: "#000000",
    favicon: "https://www.google.com/favicon.ico"
  },
  {
    url: "https://www.redmondpie.com/",
    title: "Redmond Pie",
    description: "Technology news and jailbreak tutorials",
    category: "news",
    content: `
      <div class="bg-white min-h-screen">
        <header class="bg-red-600 text-white p-4">
          <h1 class="text-3xl font-bold">Redmond Pie</h1>
          <p class="text-red-100">Technology News & Tutorials</p>
        </header>
        <main class="p-6">
          <article class="mb-8">
            <h2 class="text-2xl font-bold mb-4">Latest iOS Jailbreak Released</h2>
            <p class="text-gray-700 mb-4">A new jailbreak tool has been released for iOS devices, allowing users to customize their devices beyond Apple's restrictions.</p>
            <div class="text-sm text-gray-500">Published 2 hours ago</div>
          </article>
          <article class="mb-8">
            <h2 class="text-2xl font-bold mb-4">Windows 11 Update Brings New Features</h2>
            <p class="text-gray-700 mb-4">Microsoft has rolled out a major update to Windows 11 with enhanced security features and improved performance.</p>
            <div class="text-sm text-gray-500">Published 5 hours ago</div>
          </article>
        </main>
      </div>
    `,
    backgroundColor: "#ffffff",
    textColor: "#000000"
  },
  {
    url: "https://crypto-vault-secure.com/emergency-access",
    title: "Emergency Crypto Vault",
    description: "Emergency access to abandoned crypto vault",
    category: "reward",
    content: `
      <div class="bg-gradient-to-b from-yellow-900 to-orange-900 min-h-screen text-yellow-100">
        <div class="container mx-auto p-8">
          <div class="bg-black/50 rounded-lg p-6 border border-yellow-500">
            <h1 class="text-3xl font-bold text-yellow-400 mb-4">🔐 Emergency Crypto Vault Access</h1>
            <div class="bg-red-900/50 border border-red-500 rounded p-4 mb-6">
              <h2 class="text-xl font-bold text-red-300 mb-2">⚠️ VAULT BREACH DETECTED</h2>
              <p class="text-red-200">Emergency protocols activated. Vault contents available for immediate extraction.</p>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between bg-yellow-900/30 p-3 rounded">
                <span>Vault Status:</span>
                <span class="text-yellow-400 font-bold">UNLOCKED</span>
              </div>
              <div class="flex justify-between bg-yellow-900/30 p-3 rounded">
                <span>Available Balance:</span>
                <span class="text-green-400 font-bold">25.00000000 BTC</span>
              </div>
              <div class="flex justify-between bg-yellow-900/30 p-3 rounded">
                <span>Security Level:</span>
                <span class="text-red-400 font-bold">COMPROMISED</span>
              </div>
            </div>
            <div class="mt-6 p-4 bg-green-900/30 border border-green-500 rounded">
              <p class="text-green-300">✅ First visitor gets full access to vault contents!</p>
            </div>
          </div>
        </div>
      </div>
    `,
    isRewardSite: true,
    rewardAmount: 25,
    rewardCooldownMinutes: 120, // 2 hours cooldown
    backgroundColor: "#1a1a1a",
    textColor: "#fbbf24"
  },
  {
    url: "https://bitcoin-mining-pool.net/unclaimed-rewards",
    title: "Unclaimed Mining Rewards",
    description: "Unclaimed mining pool rewards waiting for collection",
    category: "reward",
    content: `
      <div class="bg-gradient-to-b from-blue-900 to-purple-900 min-h-screen text-blue-100">
        <div class="container mx-auto p-8">
          <div class="bg-black/50 rounded-lg p-6 border border-blue-500">
            <h1 class="text-3xl font-bold text-blue-400 mb-4">⛏️ Bitcoin Mining Pool</h1>
            <div class="bg-orange-900/50 border border-orange-500 rounded p-4 mb-6">
              <h2 class="text-xl font-bold text-orange-300 mb-2">💰 UNCLAIMED REWARDS DETECTED</h2>
              <p class="text-orange-200">Mining rewards have been sitting unclaimed for 30+ days. Pool rules allow emergency collection.</p>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-blue-900/30 p-4 rounded">
                <div class="text-sm text-blue-300">Pool Hashrate</div>
                <div class="text-2xl font-bold text-blue-400">154.7 EH/s</div>
              </div>
              <div class="bg-purple-900/30 p-4 rounded">
                <div class="text-sm text-purple-300">Block Height</div>
                <div class="text-2xl font-bold text-purple-400">867,432</div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between bg-blue-900/30 p-3 rounded">
                <span>Unclaimed Balance:</span>
                <span class="text-green-400 font-bold">18.50000000 BTC</span>
              </div>
              <div class="flex justify-between bg-blue-900/30 p-3 rounded">
                <span>Last Claim:</span>
                <span class="text-red-400">34 days ago</span>
              </div>
            </div>
            <div class="mt-6 p-4 bg-green-900/30 border border-green-500 rounded">
              <p class="text-green-300">⚡ Emergency collection available for first visitor!</p>
            </div>
          </div>
        </div>
      </div>
    `,
    isRewardSite: true,
    rewardAmount: 18,
    rewardCooldownMinutes: 90, // 1.5 hours cooldown
    backgroundColor: "#1e3a8a",
    textColor: "#dbeafe"
  },
  {
    url: "https://defi-liquidation.xyz/claim",
    title: "DeFi Liquidation Claim",
    description: "Claim liquidated DeFi protocol tokens",
    category: "reward",
    content: `
      <div class="bg-gradient-to-b from-purple-900 to-indigo-900 min-h-screen text-purple-100">
        <div class="container mx-auto p-8">
          <div class="bg-black/50 rounded-lg p-6 border border-purple-500">
            <h1 class="text-3xl font-bold text-purple-400 mb-4">🌐 DeFi Liquidation Portal</h1>
            <div class="bg-orange-900/50 border border-orange-500 rounded p-4 mb-6">
              <h2 class="text-xl font-bold text-orange-300 mb-2">⚠️ LIQUIDATION EVENT</h2>
              <p class="text-orange-200">Protocol liquidation in progress. Claim your share before redistribution deadline.</p>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between bg-purple-900/30 p-3 rounded">
                <span>Liquidation Pool:</span>
                <span class="text-purple-400 font-bold">ACTIVE</span>
              </div>
              <div class="flex justify-between bg-purple-900/30 p-3 rounded">
                <span>Available Claims:</span>
                <span class="text-green-400 font-bold">15.75000000 BTC</span>
              </div>
              <div class="flex justify-between bg-purple-900/30 p-3 rounded">
                <span>Deadline:</span>
                <span class="text-red-400 font-bold">2 hours remaining</span>
              </div>
            </div>
            <div class="mt-6 p-4 bg-green-900/30 border border-green-500 rounded">
              <p class="text-green-300">💎 Click to claim your liquidation share!</p>
            </div>
          </div>
        </div>
      </div>
    `,
    isRewardSite: true,
    rewardAmount: 15,
    rewardCooldownMinutes: 45, // 45 minutes cooldown
    backgroundColor: "#581c87",
    textColor: "#e9d5ff"
  },
  {
    url: "https://whale-wallet-backup.com/restore",
    title: "Whale Wallet Recovery",
    description: "Access backup of high-value cryptocurrency wallet",
    category: "reward",
    content: `
      <div class="bg-gradient-to-b from-green-900 to-teal-900 min-h-screen text-green-100">
        <div class="container mx-auto p-8">
          <div class="bg-black/50 rounded-lg p-6 border border-green-500">
            <h1 class="text-3xl font-bold text-green-400 mb-4">🐋 Whale Wallet Recovery</h1>
            <div class="bg-red-900/50 border border-red-500 rounded p-4 mb-6">
              <h2 class="text-xl font-bold text-red-300 mb-2">🔓 WALLET BACKUP FOUND</h2>
              <p class="text-red-200">Orphaned whale wallet detected. Recovery process initiated for unclaimed funds.</p>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between bg-green-900/30 p-3 rounded">
                <span>Wallet Type:</span>
                <span class="text-green-400 font-bold">WHALE (10,000+ BTC)</span>
              </div>
              <div class="flex justify-between bg-green-900/30 p-3 rounded">
                <span>Recovery Amount:</span>
                <span class="text-green-400 font-bold">30.00000000 BTC</span>
              </div>
              <div class="flex justify-between bg-green-900/30 p-3 rounded">
                <span>Last Access:</span>
                <span class="text-red-400">180 days ago</span>
              </div>
            </div>
            <div class="mt-6 p-4 bg-green-900/30 border border-green-500 rounded">
              <p class="text-green-300">🚀 Emergency recovery available for first claimant!</p>
            </div>
          </div>
        </div>
      </div>
    `,
    isRewardSite: true,
    rewardAmount: 30,
    rewardCooldownMinutes: 180, // 3 hours cooldown (higher reward, longer cooldown)
    backgroundColor: "#14532d",
    textColor: "#bbf7d0"
  },
  {
    url: "https://fork-rewards.io/claim-now",
    title: "Blockchain Fork Rewards",
    description: "Claim rewards from recent blockchain fork",
    category: "reward",
    content: `
      <div class="bg-gradient-to-b from-orange-900 to-red-900 min-h-screen text-orange-100">
        <div class="container mx-auto p-8">
          <div class="bg-black/50 rounded-lg p-6 border border-orange-500">
            <h1 class="text-3xl font-bold text-orange-400 mb-4">⚡ Blockchain Fork Rewards</h1>
            <div class="bg-blue-900/50 border border-blue-500 rounded p-4 mb-6">
              <h2 class="text-xl font-bold text-blue-300 mb-2">🔄 FORK DISTRIBUTION</h2>
              <p class="text-blue-200">Recent hard fork created bonus tokens. Claim your share before window closes.</p>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between bg-orange-900/30 p-3 rounded">
                <span>Fork Block:</span>
                <span class="text-orange-400 font-bold">867,890</span>
              </div>
              <div class="flex justify-between bg-orange-900/30 p-3 rounded">
                <span>Reward Pool:</span>
                <span class="text-green-400 font-bold">20.25000000 BTC</span>
              </div>
              <div class="flex justify-between bg-orange-900/30 p-3 rounded">
                <span>Distribution:</span>
                <span class="text-orange-400 font-bold">LIVE</span>
              </div>
            </div>
            <div class="mt-6 p-4 bg-green-900/30 border border-green-500 rounded">
              <p class="text-green-300">⚡ Claim your fork rewards now!</p>
            </div>
          </div>
        </div>
      </div>
    `,
    isRewardSite: true,
    rewardAmount: 20,
    rewardCooldownMinutes: 60, // 1 hour cooldown
    backgroundColor: "#9a3412",
    textColor: "#fed7aa"
  },
  {
    url: "https://ico-refund.net/emergency",
    title: "ICO Emergency Refund",
    description: "Emergency refund portal for failed ICO project",
    category: "reward",
    content: `
      <div class="bg-gradient-to-b from-gray-900 to-slate-900 min-h-screen text-gray-100">
        <div class="container mx-auto p-8">
          <div class="bg-black/50 rounded-lg p-6 border border-gray-500">
            <h1 class="text-3xl font-bold text-gray-400 mb-4">🔄 ICO Emergency Refund</h1>
            <div class="bg-yellow-900/50 border border-yellow-500 rounded p-4 mb-6">
              <h2 class="text-xl font-bold text-yellow-300 mb-2">⚠️ PROJECT TERMINATED</h2>
              <p class="text-yellow-200">ICO project terminated. Emergency refund protocol activated for investors.</p>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between bg-gray-900/30 p-3 rounded">
                <span>Project Status:</span>
                <span class="text-red-400 font-bold">TERMINATED</span>
              </div>
              <div class="flex justify-between bg-gray-900/30 p-3 rounded">
                <span>Refund Amount:</span>
                <span class="text-green-400 font-bold">12.00000000 BTC</span>
              </div>
              <div class="flex justify-between bg-gray-900/30 p-3 rounded">
                <span>Refund Pool:</span>
                <span class="text-gray-400 font-bold">AVAILABLE</span>
              </div>
            </div>
            <div class="mt-6 p-4 bg-green-900/30 border border-green-500 rounded">
              <p class="text-green-300">💰 Claim emergency refund immediately!</p>
            </div>
          </div>
        </div>
      </div>
    `,
    isRewardSite: true,
    rewardAmount: 12,
    rewardCooldownMinutes: 30, // 30 minutes cooldown (lower reward, shorter cooldown)
    backgroundColor: "#111827",
    textColor: "#f3f4f6"
  },
  {
    url: "https://news.ycombinator.com",
    title: "Hacker News",
    description: "Social news website focusing on computer science and entrepreneurship",
    category: "news",
    content: `
      <div class="bg-orange-50 min-h-screen">
        <header class="bg-orange-600 p-2">
          <div class="flex items-center">
            <div class="w-6 h-6 bg-white mr-2"></div>
            <h1 class="text-white font-bold">Hacker News</h1>
          </div>
        </header>
        <main class="p-4">
          <div class="space-y-3">
            <div class="flex">
              <span class="text-gray-500 w-8">1.</span>
              <div>
                <a href="#" class="text-black hover:underline">New AI breakthrough achieves human-level reasoning</a>
                <div class="text-xs text-gray-500">342 points by researcher123 4 hours ago | 156 comments</div>
              </div>
            </div>
            <div class="flex">
              <span class="text-gray-500 w-8">2.</span>
              <div>
                <a href="#" class="text-black hover:underline">Open source Bitcoin wallet with enhanced privacy</a>
                <div class="text-xs text-gray-500">289 points by cryptodev 6 hours ago | 89 comments</div>
              </div>
            </div>
            <div class="flex">
              <span class="text-gray-500 w-8">3.</span>
              <div>
                <a href="#" class="text-black hover:underline">Building a secure messaging app from scratch</a>
                <div class="text-xs text-gray-500">201 points by security_expert 8 hours ago | 67 comments</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `,
    backgroundColor: "#fff7ed",
    textColor: "#000000"
  },
  {
    url: "https://github.com",
    title: "GitHub",
    description: "Code hosting platform for version control and collaboration",
    category: "other",
    content: `
      <div class="bg-gray-900 min-h-screen text-white">
        <header class="bg-gray-800 p-4 border-b border-gray-700">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold">GitHub</h1>
            <div class="flex gap-4">
              <a href="#" class="text-gray-300 hover:text-white">Pull requests</a>
              <a href="#" class="text-gray-300 hover:text-white">Issues</a>
              <a href="#" class="text-gray-300 hover:text-white">Marketplace</a>
            </div>
          </div>
        </header>
        <main class="p-6">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold mb-6">Let's build from here</h2>
            <p class="text-xl text-gray-300 mb-8">The world's leading AI-powered developer platform.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gray-800 p-6 rounded-lg">
                <h3 class="text-xl font-bold mb-3">🔥 Trending repositories</h3>
                <div class="space-y-3">
                  <div>
                    <a href="#" class="text-blue-400 hover:underline">microsoft/PowerToys</a>
                    <p class="text-sm text-gray-400">Windows system utilities to maximize productivity</p>
                  </div>
                  <div>
                    <a href="#" class="text-blue-400 hover:underline">bitcoin/bitcoin</a>
                    <p class="text-sm text-gray-400">Bitcoin Core integration/staging tree</p>
                  </div>
                </div>
              </div>
              <div class="bg-gray-800 p-6 rounded-lg">
                <h3 class="text-xl font-bold mb-3">⭐ Explore</h3>
                <p class="text-gray-300">Discover repositories, topics, and trending projects.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    `,
    backgroundColor: "#111827",
    textColor: "#ffffff"
  }
];

export default async function seedSites() {
  try {
    await connectDb();
    
    // Clear existing sites
    await Site.deleteMany({});
    
    // Insert sample sites
    await Site.insertMany(sampleSites);
    
    console.log('Successfully seeded sites database');
    return { success: true, count: sampleSites.length };
  } catch (error) {
    console.error('Failed to seed sites:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
