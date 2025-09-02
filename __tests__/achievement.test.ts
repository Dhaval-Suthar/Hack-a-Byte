import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import connectDb from '@/db/connectDb';
import AchievementModel, { UserAchievementModel } from '@/models/Achievement';
import DeviceUser from '@/models/DeviceUser';
import { createAchievement, getAchievements, unlockAchievement, getUserAchievements, checkAchievementProgress, getAchievementStats } from '@/app/actions/achievement';

describe('Achievement Actions', () => {
  beforeEach(async () => {
    await connectDb();
    // Clear collections before each test
    await AchievementModel.deleteMany({});
    await UserAchievementModel.deleteMany({});
    await DeviceUser.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await AchievementModel.deleteMany({});
    await UserAchievementModel.deleteMany({});
    await DeviceUser.deleteMany({});
  });

  describe('createAchievement', () => {
    it('should create an achievement successfully', async () => {
      const achievementData = {
        name: 'First Win',
        description: 'Win your first game',
        icon: '🏆',
        category: 'gameplay' as const,
        rarity: 'common' as const,
        requirements: { wins: 1 },
        prerequisites: [],
        rewards: {
          bitcoin: 0.0001,
          experience: 10,
        },
        isActive: true,
      };

      const result = await createAchievement(achievementData);

      expect(result.success).toBe(true);
      expect(result.achievement).toBeDefined();
      expect(result.achievement?.name).toBe(achievementData.name);
      expect(result.achievement?.category).toBe(achievementData.category);
      expect(result.achievement?.rarity).toBe(achievementData.rarity);
      expect(result.achievement?.unlockedCount).toBe(0);
    });

    it('should create achievement with prerequisites', async () => {
      const achievementData = {
        name: 'Advanced Player',
        description: 'Reach advanced level',
        icon: '⭐',
        category: 'technical' as const,
        rarity: 'rare' as const,
        requirements: { level: 10 },
        prerequisites: ['first-win-id'],
        rewards: {
          bitcoin: 0.001,
          experience: 50,
          title: 'Advanced',
        },
        isActive: true,
      };

      const result = await createAchievement(achievementData);

      expect(result.success).toBe(true);
      expect(result.achievement?.prerequisites).toEqual(['first-win-id']);
      expect(result.achievement?.rewards.title).toBe('Advanced');
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        name: '',
        description: 'Test achievement',
        icon: '🏆',
        category: 'gameplay' as const,
        rarity: 'common' as const,
        requirements: {},
        prerequisites: [],
        rewards: {},
        isActive: true,
      };

      const result = await createAchievement(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getAchievements', () => {
    beforeEach(async () => {
      // Create test achievements
      await AchievementModel.create([
        {
          name: 'First Win',
          description: 'Win your first game',
          icon: '🏆',
          category: 'gameplay',
          rarity: 'common',
          requirements: { wins: 1 },
          prerequisites: [],
          rewards: { bitcoin: 0.0001 },
          isActive: true,
          unlockedCount: 5,
        },
        {
          name: 'Social Butterfly',
          description: 'Make 10 friends',
          icon: '👥',
          category: 'social',
          rarity: 'rare',
          requirements: { friends: 10 },
          prerequisites: [],
          rewards: { experience: 20 },
          isActive: true,
          unlockedCount: 2,
        },
        {
          name: 'Inactive Achievement',
          description: 'This is inactive',
          icon: '❌',
          category: 'special',
          rarity: 'legendary',
          requirements: { special: 1 },
          prerequisites: [],
          rewards: { bitcoin: 0.01 },
          isActive: false,
          unlockedCount: 0,
        },
      ]);
    });

    it('should return all active achievements', async () => {
      const result = await getAchievements();

      expect(result.success).toBe(true);
      expect(result.achievements).toHaveLength(2);
      expect(result.achievements?.[0].rarity).toBe('rare'); // Sorted by rarity desc
      expect(result.achievements?.[1].rarity).toBe('common');
    });

    it('should filter by category', async () => {
      const result = await getAchievements('social');

      expect(result.success).toBe(true);
      expect(result.achievements).toHaveLength(1);
      expect(result.achievements?.[0].name).toBe('Social Butterfly');
    });

    it('should include inactive achievements when requested', async () => {
      const result = await getAchievements(undefined, false);

      expect(result.success).toBe(true);
      expect(result.achievements).toHaveLength(3);
    });
  });

  describe('unlockAchievement', () => {
    let userId: string;
    let achievementId: string;

    beforeEach(async () => {
      const user = await DeviceUser.create({
        username: 'testuser',
        email: 'test@example.com',
        gameState: {
          gameStats: { wins: 1 },
        },
      });
      userId = user._id.toString();

      const achievement = await AchievementModel.create({
        name: 'First Win',
        description: 'Win your first game',
        icon: '🏆',
        category: 'gameplay',
        rarity: 'common',
        requirements: { wins: 1 },
        prerequisites: [],
        rewards: { bitcoin: 0.0001 },
        isActive: true,
        unlockedCount: 0,
      });
      achievementId = achievement._id.toString();
    });

    it('should unlock achievement successfully', async () => {
      const result = await unlockAchievement(userId, achievementId);

      expect(result.success).toBe(true);
      expect(result.achievement).toBeDefined();
      expect(result.achievement?.userId).toBe(userId);
      expect(result.achievement?.achievementId).toBe(achievementId);
      expect(result.achievement?.isCompleted).toBe(true);

      // Verify achievement count was updated
      const updatedAchievement = await AchievementModel.findById(achievementId);
      expect(updatedAchievement?.unlockedCount).toBe(1);
    });

    it('should fail for non-existent user', async () => {
      const fakeUserId = '507f1f77bcf86cd799439013';
      const result = await unlockAchievement(fakeUserId, achievementId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should fail for non-existent achievement', async () => {
      const fakeAchievementId = '507f1f77bcf86cd799439013';
      const result = await unlockAchievement(userId, fakeAchievementId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Achievement not found');
    });

    it('should fail if achievement already unlocked', async () => {
      // First unlock
      await unlockAchievement(userId, achievementId);

      // Try to unlock again
      const result = await unlockAchievement(userId, achievementId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Achievement already unlocked');
    });
  });

  describe('getUserAchievements', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await DeviceUser.create({
        username: 'testuser',
        email: 'test@example.com',
      });
      userId = user._id.toString();

      const achievement = await AchievementModel.create({
        name: 'First Win',
        description: 'Win your first game',
        icon: '🏆',
        category: 'gameplay',
        rarity: 'common',
        requirements: { wins: 1 },
        prerequisites: [],
        rewards: { bitcoin: 0.0001 },
        isActive: true,
        unlockedCount: 0,
      });

      // Create user achievement
      await UserAchievementModel.create({
        userId,
        achievementId: achievement._id,
        unlockedAt: new Date('2025-01-01'),
        progress: { wins: 1 },
        isCompleted: true,
      });
    });

    it('should return user achievements', async () => {
      const result = await getUserAchievements(userId);

      expect(result.success).toBe(true);
      expect(result.achievements).toHaveLength(1);
      expect(result.achievements?.[0].userId).toBe(userId);
      expect(result.achievements?.[0].isCompleted).toBe(true);
    });
  });

  describe('checkAchievementProgress', () => {
    let userId: string;
    let achievementId: string;

    beforeEach(async () => {
      const user = await DeviceUser.create({
        username: 'testuser',
        email: 'test@example.com',
        gameState: {
          gameStats: { wins: 3 },
        },
      });
      userId = user._id.toString();

      const achievement = await AchievementModel.create({
        name: 'Triple Win',
        description: 'Win 5 games',
        icon: '🏆',
        category: 'gameplay',
        rarity: 'rare',
        requirements: { wins: 5 },
        prerequisites: [],
        rewards: { bitcoin: 0.001 },
        isActive: true,
        unlockedCount: 0,
      });
      achievementId = achievement._id.toString();
    });

    it('should check achievement progress', async () => {
      const result = await checkAchievementProgress(userId, achievementId);

      expect(result.success).toBe(true);
      expect(result.progress).toBe(0.6); // 3/5 = 0.6
      expect(result.isCompleted).toBe(false);
      expect(result.achievement?.name).toBe('Triple Win');
    });

    it('should return completed for met requirements', async () => {
      // Update user stats to meet requirements
      await DeviceUser.findByIdAndUpdate(userId, {
        'gameState.gameStats.wins': 5
      });

      const result = await checkAchievementProgress(userId, achievementId);

      expect(result.success).toBe(true);
      expect(result.progress).toBe(1);
      expect(result.isCompleted).toBe(true);
    });
  });

  describe('getAchievementStats', () => {
    beforeEach(async () => {
      // Create test achievements
      await AchievementModel.create([
        {
          name: 'Gameplay 1',
          category: 'gameplay',
          rarity: 'common',
          requirements: { wins: 1 },
          prerequisites: [],
          rewards: {},
          isActive: true,
          unlockedCount: 10,
        },
        {
          name: 'Gameplay 2',
          category: 'gameplay',
          rarity: 'rare',
          requirements: { wins: 5 },
          prerequisites: [],
          rewards: {},
          isActive: true,
          unlockedCount: 5,
        },
        {
          name: 'Social 1',
          category: 'social',
          rarity: 'common',
          requirements: { friends: 5 },
          prerequisites: [],
          rewards: {},
          isActive: true,
          unlockedCount: 8,
        },
      ]);
    });

    it('should return achievement statistics', async () => {
      const result = await getAchievementStats();

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();

      const gameplayStats = result.stats?.find((stat: { _id: string; count: number; totalUnlocked: number }) => stat._id === 'gameplay');
      expect(gameplayStats?.count).toBe(2);
      expect(gameplayStats?.totalUnlocked).toBe(15);

      const socialStats = result.stats?.find((stat: { _id: string; count: number; totalUnlocked: number }) => stat._id === 'social');
      expect(socialStats?.count).toBe(1);
      expect(socialStats?.totalUnlocked).toBe(8);
    });
  });
});
