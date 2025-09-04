"use client";

import React, { useState, useEffect } from 'react';
import { Achievement, AchievementManager, ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({ achievement, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -100, scale: 0.8 }}
      className="fixed top-4 right-4 z-[100] bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-2xl border border-white/20 max-w-sm"
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{achievement.icon}</div>
        <div className="flex-1">
          <div className="font-bold text-lg">Achievement Unlocked!</div>
          <div className="text-sm opacity-90">{achievement.title}</div>
          <div className="text-xs opacity-75">{achievement.description}</div>
          <div className="text-xs font-semibold mt-1">+{achievement.points} points</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          ×
        </Button>
      </div>
    </motion.div>
  );
};

interface AchievementGridProps {
  achievements: Achievement[];
  userStats: Record<string, number>;
}

const AchievementGrid: React.FC<AchievementGridProps> = ({ achievements, userStats }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = ['all', 'security', 'exploration', 'skill', 'social', 'special'];
  
  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "primary" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {category === 'all' ? '🏆' : AchievementManager.getCategoryIcon(category as Achievement['category'])}
            {category}
          </Button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map(achievement => {
          const progress = AchievementManager.calculateProgress(achievement.id, userStats);
          const isUnlocked = achievement.unlocked || progress >= 100;
          const rarityStyle = AchievementManager.getRarityColor(achievement.rarity);

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${isUnlocked 
                  ? `bg-gradient-to-br from-gray-800 to-gray-900 ${rarityStyle} shadow-lg` 
                  : 'bg-gray-800/50 border-gray-600 opacity-60'
                }
                hover:scale-105 hover:shadow-xl
              `}
            >
              {/* Rarity Indicator */}
              <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${rarityStyle} bg-black/20`}>
                {achievement.rarity}
              </div>

              {/* Achievement Icon */}
              <div className="text-4xl mb-3 text-center">
                {achievement.icon}
              </div>

              {/* Achievement Info */}
              <div className="text-center space-y-2">
                <h3 className="font-bold text-lg">{achievement.title}</h3>
                <p className="text-sm text-gray-300">{achievement.description}</p>
                
                {/* Progress Bar */}
                {!isUnlocked && (
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Points and Status */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-yellow-400">+{achievement.points} pts</span>
                  {isUnlocked ? (
                    <span className="text-green-400 font-semibold">✓ Unlocked</span>
                  ) : (
                    <span className="text-gray-400">{Math.round(progress)}%</span>
                  )}
                </div>

                {/* Unlock Date */}
                {achievement.unlockedAt && (
                  <div className="text-xs text-gray-400">
                    Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

interface AchievementSystemProps {
  userStats: Record<string, number>;
  className?: string;
}

export const AchievementSystem: React.FC<AchievementSystemProps> = ({ userStats, className = '' }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // Initialize achievements from definitions
  useEffect(() => {
    const allAchievements: Achievement[] = Object.values(ACHIEVEMENT_DEFINITIONS).map(def => ({
      ...def,
      unlocked: AchievementManager.checkAchievement(def.id, userStats),
      progress: AchievementManager.calculateProgress(def.id, userStats)
    }));

    setAchievements(allAchievements);
  }, [userStats]);

  // Check for new achievements when stats change
  useEffect(() => {
    const newlyUnlocked = achievements.filter(achievement => 
      !achievement.unlocked && AchievementManager.checkAchievement(achievement.id, userStats)
    );

    if (newlyUnlocked.length > 0) {
      const updatedAchievements = achievements.map(achievement => ({
        ...achievement,
        unlocked: achievement.unlocked || AchievementManager.checkAchievement(achievement.id, userStats),
        unlockedAt: achievement.unlocked ? achievement.unlockedAt : (AchievementManager.checkAchievement(achievement.id, userStats) ? new Date() : undefined)
      }));
      
      setAchievements(updatedAchievements);
      setNewAchievements(newlyUnlocked.map(a => ({ ...a, unlocked: true, unlockedAt: new Date() })));
    }
  }, [userStats, achievements]);

  const removeNotification = (achievementId: string) => {
    setNewAchievements(prev => prev.filter(a => a.id !== achievementId));
  };

  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Achievement Notifications */}
      <AnimatePresence>
        {newAchievements.map(achievement => (
          <AchievementNotification
            key={achievement.id}
            achievement={achievement}
            onClose={() => removeNotification(achievement.id)}
          />
        ))}
      </AnimatePresence>

      {/* Achievement Summary */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 rounded-lg border border-blue-500/30">
        <h2 className="text-2xl font-bold mb-4 text-center">🏆 Achievements</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-yellow-400">{unlockedCount}</div>
            <div className="text-sm text-gray-300">Unlocked</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">{achievements.length}</div>
            <div className="text-sm text-gray-300">Total</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400">{totalPoints}</div>
            <div className="text-sm text-gray-300">Points</div>
          </div>
        </div>
      </div>

      {/* Achievement Grid */}
      <AchievementGrid achievements={achievements} userStats={userStats} />
    </div>
  );
};

export default AchievementSystem;
