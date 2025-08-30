import Link from "next/link";
import { listGames } from "@/lib/games/registry";

export const dynamic = "force-static";

export default function GamesIndex() {
  const games = listGames();
  
  // Featured game data
  const featuredGame = {
    title: "CryptoHeist: Digital Warfare",
    description: "Strategic multiplayer bitcoin heist game with AI bot support",
    deviceType: "hackphone",
    tags: ["Multiplayer", "Strategy", "Bitcoin", "AI Bots"],
    features: [
      "Flexible team sizes (1-6 players)",
      "AI bot system for incomplete teams", 
      "Bank device high-value targets",
      "Real-time bitcoin tracking",
      "Competitive leaderboards"
    ],
    pricing: { standard: "₹60", extended: "₹100" },
    icon: "🏦"
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">🎮 Game Center</h1>
        <p className="text-gray-600">Discover and play exciting games on your Hack-A-Byte devices</p>
      </div>

      {/* Featured Game Section */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-6">
          <div className="text-6xl">{featuredGame.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{featuredGame.title}</h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                NEW
              </span>
            </div>
            <p className="text-gray-700 mb-4">{featuredGame.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Game Features:</h3>
                <ul className="space-y-1">
                  {featuredGame.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Pricing:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border">
                    <span className="text-gray-700">Standard Match</span>
                    <span className="font-bold text-green-600">{featuredGame.pricing.standard}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border">
                    <span className="text-gray-700">Extended Match</span>
                    <span className="font-bold text-blue-600">{featuredGame.pricing.extended}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/devices/hackphone" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                🎯 Play on HackPhone
              </Link>
              <div className="text-sm text-gray-500">
                Device: {featuredGame.deviceType} • Tags: {featuredGame.tags.join(", ")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Games Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Other Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((g) => (
            <div key={g.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">{g.title}</div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {g.deviceType}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-3">
                {g.tags?.length ? g.tags.join(" • ") : "No tags"}
              </div>
              <Link 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors" 
                href={`/games/${g.slug}`}
              >
                Play Game →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
 
