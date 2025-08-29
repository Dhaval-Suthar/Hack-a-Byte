"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BitcoinBalance from './BitcoinBalance';

// Helper functions
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return `#${rank}`;
  }
};

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return 'text-yellow-400';
    case 2:
      return 'text-gray-400';
    case 3:
      return 'text-orange-400';
    default:
      return 'text-gray-300';
  }
};

interface LeaderboardEntry {
  id: string;
  name: string;
  role: 'professor' | 'attacker' | 'defender' | 'extractor' | 'bot';
  bitcoin: number;
  score: number;
  rank: number;
  isCurrentPlayer?: boolean;
  achievements?: string[];
  isBot?: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
  showAchievements?: boolean;
  maxEntries?: number;
  className?: string;
}

export function Leaderboard({
  entries,
  currentPlayerId,
  showAchievements = true,
  maxEntries = 10,
  className = ''
}: LeaderboardProps) {
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [sortBy, setSortBy] = useState<'rank' | 'bitcoin' | 'score'>('rank');

  const sortedEntries = [...entries]
    .sort((a, b) => {
      switch (sortBy) {
        case 'bitcoin':
          return b.bitcoin - a.bitcoin;
        case 'score':
          return b.score - a.score;
        default:
          return a.rank - b.rank;
      }
    })
    .slice(0, maxEntries);

  return (
    <div className={`bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-xl">🏆 Leaderboard</h2>

        {/* Sort Options */}
        <div className="flex gap-2">
          {(['rank', 'bitcoin', 'score'] as const).map((option) => (
            <motion.button
              key={option}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSortBy(option)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === option
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        <AnimatePresence>
          {sortedEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedEntry(entry)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                entry.id === currentPlayerId
                  ? 'bg-blue-900/50 border border-blue-500'
                  : entry.isBot
                  ? 'bg-purple-900/30 border border-purple-500/30'
                  : 'bg-gray-800/50 hover:bg-gray-700/50'
              }`}
            >
              {/* Rank and Avatar */}
              <div className="flex items-center gap-3">
                <div className={`text-lg font-bold ${getRankColor(entry.rank)}`}>
                  {getRankIcon(entry.rank)}
                </div>

                <div className="flex items-center gap-2">
                  {entry.isBot && (
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="text-sm"
                    >
                      🤖
                    </motion.div>
                  )}

                  <div>
                    <p className={`font-medium ${entry.id === currentPlayerId ? 'text-blue-200' : 'text-white'}`}>
                      {entry.name}
                      {entry.id === currentPlayerId && <span className="text-blue-400 ml-1">(You)</span>}
                    </p>
                    <p className="text-gray-400 text-sm capitalize">{entry.role}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">
                    Score: {entry.score.toLocaleString()}
                  </p>
                  <BitcoinBalance
                    balance={entry.bitcoin}
                    showIcon={false}
                    size="sm"
                  />
                </div>

                {showAchievements && entry.achievements && entry.achievements.length > 0 && (
                  <div className="flex gap-1">
                    {entry.achievements.slice(0, 3).map((achievement, i) => (
                      <motion.span
                        key={i}
                        whileHover={{ scale: 1.2 }}
                        className="text-lg"
                        title={achievement}
                      >
                        🏅
                      </motion.span>
                    ))}
                    {entry.achievements.length > 3 && (
                      <span className="text-gray-400 text-sm">+{entry.achievements.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Selected Entry Details */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-lg">
                {selectedEntry.name}&apos;s Details
              </h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">Role</p>
                <p className="text-white capitalize">{selectedEntry.role}</p>
              </div>
              <div>
                <p className="text-gray-400">Rank</p>
                <p className="text-white">#{selectedEntry.rank}</p>
              </div>
              <div>
                <p className="text-gray-400">Score</p>
                <p className="text-yellow-400 font-bold">{selectedEntry.score.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Bitcoin</p>
                <BitcoinBalance
                  balance={selectedEntry.bitcoin}
                  showIcon={false}
                  size="sm"
                />
              </div>
            </div>

            {selectedEntry.achievements && selectedEntry.achievements.length > 0 && (
              <div className="mt-4">
                <p className="text-gray-400 mb-2">Achievements</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.achievements.map((achievement, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-yellow-900/50 text-yellow-200 rounded text-sm"
                    >
                      🏅 {achievement}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mini leaderboard for compact displays
export function MiniLeaderboard({
  entries,
  maxEntries = 5
}: {
  entries: LeaderboardEntry[];
  maxEntries?: number;
}) {
  const topEntries = entries
    .sort((a, b) => a.rank - b.rank)
    .slice(0, maxEntries);

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
      <h3 className="text-white font-bold text-sm mb-3">Top Players</h3>
      <div className="space-y-2">
        {topEntries.map((entry) => (
          <div
            key={entry.id}
            className={`flex items-center justify-between text-sm ${
              entry.isCurrentPlayer ? 'text-blue-200' : 'text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">{getRankIcon(entry.rank)}</span>
              <span className="truncate max-w-20">{entry.name}</span>
            </div>
            <span className="text-yellow-400 font-medium">
              {entry.score.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Achievement showcase component
export function AchievementShowcase({
  achievements,
  className = ''
}: {
  achievements: string[];
  className?: string;
}) {
  return (
    <div className={`bg-gradient-to-r from-yellow-900/50 to-orange-900/50 rounded-lg p-4 border border-yellow-500/30 ${className}`}>
      <h3 className="text-yellow-200 font-bold text-lg mb-3 flex items-center gap-2">
        🏆 Achievements
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achievements.map((achievement, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-yellow-900/30 rounded-lg p-3 border border-yellow-500/20"
          >
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl"
              >
                🏅
              </motion.span>
              <span className="text-yellow-200 font-medium">{achievement}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
