// Achievement system types and constants
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'security' | 'exploration' | 'skill' | 'social' | 'special';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: 'count' | 'streak' | 'time' | 'condition';
    target: number;
    metric: string;
  };
  unlocked?: boolean;
  unlockedAt?: Date;
  progress?: number;
}

export interface UserAchievements {
  userId: string;
  achievements: Achievement[];
  totalPoints: number;
  lastUpdated: Date;
}

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Record<string, Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>> = {
  // Security Category
  'first-hack': {
    id: 'first-hack',
    title: 'First Steps',
    description: 'Complete your first hacking challenge',
    icon: '🔓',
    category: 'security',
    points: 100,
    rarity: 'common',
    requirements: {
      type: 'count',
      target: 1,
      metric: 'challenges_completed'
    }
  },
  'speed-hacker': {
    id: 'speed-hacker',
    title: 'Speed Demon',
    description: 'Complete a challenge in under 30 seconds',
    icon: '⚡',
    category: 'security',
    points: 250,
    rarity: 'rare',
    requirements: {
      type: 'time',
      target: 30,
      metric: 'completion_time'
    }
  },
  'perfect-streak': {
    id: 'perfect-streak',
    title: 'Flawless',
    description: 'Complete 5 challenges without any failed attempts',
    icon: '💎',
    category: 'security',
    points: 500,
    rarity: 'epic',
    requirements: {
      type: 'streak',
      target: 5,
      metric: 'perfect_completions'
    }
  },
  
  // Exploration Category
  'app-explorer': {
    id: 'app-explorer',
    title: 'Explorer',
    description: 'Open 10 different apps',
    icon: '🗺️',
    category: 'exploration',
    points: 150,
    rarity: 'common',
    requirements: {
      type: 'count',
      target: 10,
      metric: 'apps_opened'
    }
  },
  'device-master': {
    id: 'device-master',
    title: 'Device Master',
    description: 'Use all three device types',
    icon: '📱',
    category: 'exploration',
    points: 300,
    rarity: 'rare',
    requirements: {
      type: 'count',
      target: 3,
      metric: 'devices_used'
    }
  },

  // Skill Category
  'mini-game-master': {
    id: 'mini-game-master',
    title: 'Game Master',
    description: 'Complete all 6 mini-games',
    icon: '🎮',
    category: 'skill',
    points: 600,
    rarity: 'epic',
    requirements: {
      type: 'count',
      target: 6,
      metric: 'unique_games_completed'
    }
  },
  'high-scorer': {
    id: 'high-scorer',
    title: 'High Scorer',
    description: 'Achieve a score over 10,000',
    icon: '🏆',
    category: 'skill',
    points: 400,
    rarity: 'rare',
    requirements: {
      type: 'condition',
      target: 10000,
      metric: 'highest_score'
    }
  },

  // Social Category
  'team-player': {
    id: 'team-player',
    title: 'Team Player',
    description: 'Complete a challenge in team mode',
    icon: '👥',
    category: 'social',
    points: 200,
    rarity: 'common',
    requirements: {
      type: 'count',
      target: 1,
      metric: 'team_completions'
    }
  },
  'bitcoin-millionaire': {
    id: 'bitcoin-millionaire',
    title: 'Bitcoin Millionaire',
    description: 'Accumulate 1,000,000 satoshis',
    icon: '₿',
    category: 'social',
    points: 1000,
    rarity: 'legendary',
    requirements: {
      type: 'condition',
      target: 1000000,
      metric: 'total_bitcoin'
    }
  },

  // Special Category
  'early-bird': {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Login before 8 AM',
    icon: '🌅',
    category: 'special',
    points: 50,
    rarity: 'common',
    requirements: {
      type: 'condition',
      target: 8,
      metric: 'login_hour'
    }
  },
  'night-owl': {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Complete a challenge after midnight',
    icon: '🦉',
    category: 'special',
    points: 100,
    rarity: 'common',
    requirements: {
      type: 'condition',
      target: 0,
      metric: 'completion_hour'
    }
  },
  'persistence': {
    id: 'persistence',
    title: 'Persistence Pays',
    description: 'Login for 7 consecutive days',
    icon: '🔥',
    category: 'special',
    points: 750,
    rarity: 'epic',
    requirements: {
      type: 'streak',
      target: 7,
      metric: 'daily_login_streak'
    }
  }
};

// Achievement utility functions
export class AchievementManager {
  static checkAchievement(achievementId: string, userStats: Record<string, number>): boolean {
    const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
    if (!achievement) return false;

    const { requirements } = achievement;
    const userValue = userStats[requirements.metric] || 0;

    switch (requirements.type) {
      case 'count':
      case 'streak':
        return userValue >= requirements.target;
      case 'time':
        return userValue <= requirements.target; // For time-based achievements, less is better
      case 'condition':
        return userValue >= requirements.target;
      default:
        return false;
    }
  }

  static calculateProgress(achievementId: string, userStats: Record<string, number>): number {
    const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
    if (!achievement) return 0;

    const { requirements } = achievement;
    const userValue = userStats[requirements.metric] || 0;

    switch (requirements.type) {
      case 'count':
      case 'streak':
      case 'condition':
        return Math.min(100, (userValue / requirements.target) * 100);
      case 'time':
        // For time-based achievements, show progress until the target is met
        return userValue <= requirements.target ? 100 : Math.max(0, 100 - ((userValue - requirements.target) / requirements.target) * 100);
      default:
        return 0;
    }
  }

  static getRarityColor(rarity: Achievement['rarity']): string {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      default: return 'text-gray-400 border-gray-400';
    }
  }

  static getCategoryIcon(category: Achievement['category']): string {
    switch (category) {
      case 'security': return '🔒';
      case 'exploration': return '🗺️';
      case 'skill': return '🎯';
      case 'social': return '👥';
      case 'special': return '⭐';
      default: return '🏆';
    }
  }
}
