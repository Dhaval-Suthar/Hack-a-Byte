"use client";

import React, { useEffect, useState } from "react";
import { getUserAchievements } from "@/app/actions/achievement";
import { logger } from '@/lib/logger';

interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  category: 'combat' | 'tournament' | 'exploration' | 'social' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirements: {
    type: string;
    value: number;
    currentProgress?: number;
  }[];
  unlockedAt?: string;
  isUnlocked: boolean;
}

interface AchievementCardProps {
  achievement: Achievement;
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'uncommon': return 'border-green-300 bg-green-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'uncommon': return 'text-green-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getProgress = () => {
    if (achievement.isUnlocked) return 100;
    if (!achievement.requirements.length) return 0;

    const totalProgress = achievement.requirements.reduce((sum, req) => {
      const current = req.currentProgress || 0;
      return sum + Math.min(current / req.value, 1);
    }, 0);

    return Math.round((totalProgress / achievement.requirements.length) * 100);
  };

  const progress = getProgress();

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      achievement.isUnlocked
        ? `${getRarityColor(achievement.rarity)} shadow-md`
        : 'border-gray-200 bg-gray-50 opacity-60'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`text-4xl ${achievement.isUnlocked ? '' : 'grayscale'}`}>
          {achievement.icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900">{achievement.name}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getRarityTextColor(achievement.rarity)} bg-white`}>
              {achievement.rarity}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-3">{achievement.description}</p>

          <div className="space-y-2">
            {achievement.requirements.map((req, index) => (
              <div key={index} className="text-xs text-gray-500">
                <span className="capitalize">{req.type.replace('_', ' ')}: </span>
                <span className={achievement.isUnlocked ? 'text-green-600' : ''}>
                  {req.currentProgress || 0} / {req.value}
                </span>
              </div>
            ))}
          </div>

          {!achievement.isUnlocked && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {achievement.isUnlocked && achievement.unlockedAt && (
            <div className="mt-3 text-xs text-green-600">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </div>
          )}

          <div className="mt-2 text-xs text-gray-500">
            {achievement.points} points
          </div>
        </div>
      </div>
    </div>
  );
}

export function AchievementGallery() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      // TODO: Get userId from authentication context
      const userId = 'placeholder-user-id';
      const result = await getUserAchievements(userId);

      if (result.success && result.achievements) {
        setAchievements(result.achievements as unknown as Achievement[]);
      } else {
        setError(result.error || 'Failed to load achievements');
      }
    } catch (err) {
      logger.error('Failed to load achievements:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    const matchesStatus = filter === 'all' ||
      (filter === 'unlocked' && achievement.isUnlocked) ||
      (filter === 'locked' && !achievement.isUnlocked);

    const matchesCategory = categoryFilter === 'all' || achievement.category === categoryFilter;

    return matchesStatus && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(achievements.map(a => a.category)))];
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalPoints = achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadAchievements}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Achievements</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="text-2xl font-bold">{unlockedCount}</div>
            <div className="text-purple-100">Unlocked</div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="text-2xl font-bold">{achievements.length}</div>
            <div className="text-blue-100">Total</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-green-100">Points Earned</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unlocked' | 'locked')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Achievements</option>
              <option value="unlocked">Unlocked Only</option>
              <option value="locked">Locked Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredAchievements.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-500 text-lg">
            {filter === 'unlocked' ? 'No unlocked achievements yet' :
             filter === 'locked' ? 'All achievements unlocked!' :
             'No achievements found'}
          </p>
          <p className="text-gray-400 mt-2">
            Keep playing to unlock new achievements!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => (
            <AchievementCard
              key={achievement._id}
              achievement={achievement}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AchievementProgress({ userId }: { userId: string }) {
  const [stats, setStats] = useState({
    total: 0,
    unlocked: 0,
    points: 0,
    recent: [] as Achievement[]
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getUserAchievements(userId);
        if (result.success && result.achievements) {
          const achievements = result.achievements as unknown as Achievement[];
          const unlocked = achievements.filter(a => a.isUnlocked);
          const points = unlocked.reduce((sum, a) => sum + a.points, 0);
          const recent = unlocked
            .filter(a => a.unlockedAt)
            .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
            .slice(0, 3);

          setStats({
            total: achievements.length,
            unlocked: unlocked.length,
            points,
            recent
          });
        }
      } catch (err) {
        logger.error('Failed to load achievement stats:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      }
    };

    loadStats();
  }, [userId]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievement Progress</h3>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.unlocked}</div>
          <div className="text-sm text-gray-500">Unlocked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.points}</div>
          <div className="text-sm text-gray-500">Points</div>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0}%` }}
        ></div>
      </div>

      {stats.recent.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Unlocks</h4>
          <div className="space-y-2">
            {stats.recent.map((achievement) => (
              <div key={achievement._id} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{achievement.icon}</span>
                <span className="text-gray-900">{achievement.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
