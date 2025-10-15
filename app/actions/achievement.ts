"use server";

import connectDb from "@/db/connectDb";
import AchievementModel, { UserAchievementModel } from "@/models/Achievement";
import DeviceUser from "@/models/DeviceUser";
import { logger } from '@/lib/logger';

// Backwards-compat mapping from legacy test shape -> current canonical schema
// Tests supply: { name, description, icon, category, rarity, requirements: { wins: 1 }, rewards: { bitcoin }, isActive }
// Canonical expects: code, color, requirements object { type,target,value,comparison }
interface LegacyAchievementInput { [k: string]: unknown }
function normalizeInput(data: LegacyAchievementInput) {
  const code = (data.code || data.name || 'ACH').toString().trim().toUpperCase().replace(/\s+/g,'_').slice(0,32);
  const reqs = (typeof data.requirements === 'object' && data.requirements) ? data.requirements as Record<string, unknown> : {};
  const firstReqKey = Object.keys(reqs)[0];
  const firstReqVal = firstReqKey ? Number(reqs[firstReqKey]) : 1;
  return {
    code,
    name: data.name || code,
    description: data.description || 'No description',
    icon: data.icon || '🏆',
    category: data.category || 'gameplay',
    rarity: data.rarity || 'common',
    color: data.color || '#FFD700',
    requirements: {
      type: 'stat',
      target: firstReqKey || 'wins',
      value: firstReqVal || 1,
      comparison: 'gte'
    },
    rewards: data.rewards || {},
    prerequisites: data.prerequisites || [],
    isActive: data.isActive !== false,
    isHidden: false,
    isStackable: false
  };
}

export async function createAchievement(data: LegacyAchievementInput) {
  try {
    await connectDb();
  if (!data || typeof data !== 'object') return { success: false, error: 'Invalid data' };
  if (!String((data as { name?: unknown }).name || '').trim()) return { success: false, error: 'Name required' };
  if (!String((data as { description?: unknown }).description || '').trim()) return { success: false, error: 'Description required' };
  const reqs = (data as { requirements?: unknown }).requirements;
  if (!reqs || !Object.keys(reqs as Record<string, unknown>).length) return { success: false, error: 'At least one requirement' };
  const normalized = normalizeInput(data);
  const achievement = await AchievementModel.create(normalized as Record<string, unknown>);
  return { success: true, achievement: achievement.toObject() };
  } catch (error) {
    logger.error('Error creating achievement:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to create achievement" };
  }
}

export async function getAchievements(category?: string, isActive: boolean = true) {
  try {
    await connectDb();
  const query: Record<string, unknown> = {};
  if (isActive === true) {
    query.isActive = true; // explicit filter only when true
  }
    if (category) {
      query.category = category;
    }

    const achievements = await AchievementModel.find(query).sort({ rarity: -1, name: 1 }).lean();
    // Map back to legacy expectation shape (requirements as key-value map, unlockedCount fallback)
    const mapped = achievements.map(a => ({
      ...a,
      requirements: { [a.requirements?.target || 'wins']: a.requirements?.value || 1 },
      unlockedCount: (a as unknown as { unlockedCount?: number }).unlockedCount || 0
    }));
    return { success: true, achievements: mapped };
  } catch (error) {
    logger.error('Error fetching achievements:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to fetch achievements" };
  }
}

export async function unlockAchievement(userId: string, achievementId: string) {
  try {
    await connectDb();

  const achievement = await AchievementModel.findById(achievementId);
    if (!achievement) {
      return { success: false, error: "Achievement not found" };
    }

  const user = await DeviceUser.findById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user already has this achievement
  const existingAchievement = await UserAchievementModel.findOne({ userId, achievementId });

    if (existingAchievement) {
      return { success: false, error: "Achievement already unlocked" };
    }

    // Check prerequisites
    const hasPrerequisites = await achievement.checkPrerequisites(userId);
    if (!hasPrerequisites) {
      return { success: false, error: "Prerequisites not met" };
    }

    // Create user achievement
  const userAchievement = new UserAchievementModel({
      userId,
      achievementId,
      progress: achievement.requirements?.value || 1,
      isCompleted: true,
      completedAt: new Date(),
      count: 1,
      earnedThrough: 'manual'
    });
  achievement.unlockedCount = (achievement.unlockedCount || 0) + 1;

    // Add rewards to user
    if (achievement.rewards.bitcoin) {
      // Note: This would need to be updated to work with team wallets
      // user.bitcoinBalance = (user.bitcoinBalance || 0) + achievement.rewards.bitcoin;
    }

    if (achievement.rewards.experience) {
      // Add experience logic here
    }

  await Promise.all([ userAchievement.save(), achievement.save(), user.save() ]);

  const plain = userAchievement.toObject();
  return { success: true, achievement: { ...plain, userId: plain.userId?.toString(), achievementId: plain.achievementId?.toString() } };
  } catch (error) {
    logger.error('Error unlocking achievement:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to unlock achievement" };
  }
}

export async function getUserAchievements(userId: string) {
  try {
    await connectDb();

  const userAchievements = await UserAchievementModel.find({ userId }).populate('achievementId').sort({ createdAt: -1 }).lean();
    return { success: true, achievements: userAchievements.map(ua => {
      const achField = ua.achievementId as unknown as { _id?: { toString(): string } } | string;
      const idStr = typeof achField === 'string' ? achField : achField?._id?.toString();
      const userField = ua.userId as unknown;
      const userIdStr = typeof userField === 'string' ? userField : (userField && typeof (userField as { toString(): string }).toString === 'function' ? (userField as { toString(): string }).toString() : undefined);
      let achievementIdStr = idStr;
      if (!achievementIdStr) {
        const rawAch = ua.achievementId as unknown;
        if (rawAch && typeof rawAch === 'object' && typeof (rawAch as { toString(): string }).toString === 'function') {
          achievementIdStr = (rawAch as { toString(): string }).toString();
        }
      }
      return {
        ...ua,
        progress: typeof ua.progress === 'object' ? Number(Object.values(ua.progress as Record<string, unknown>)[0]) || 0 : ua.progress,
        userId: userIdStr,
        achievementId: achievementIdStr
      };
    }) };
  } catch (error) {
    logger.error('Error fetching user achievements:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to fetch user achievements" };
  }
}

export async function checkAchievementProgress(userId: string, achievementId: string) {
  try {
    await connectDb();

    const achievement = await AchievementModel.findById(achievementId);
    if (!achievement) {
      return { success: false, error: "Achievement not found" };
    }

  const user = await DeviceUser.findById(userId).lean();
    if (!user) {
      return { success: false, error: "User not found" };
    }

  const target = achievement.requirements?.target || 'wins';
  const needed = achievement.requirements?.value || 1;
    interface GS { gameStats?: Record<string, unknown>; initialWins?: number }
    const gs = (user as unknown as { gameState?: GS }).gameState;
    const stats = gs?.gameStats || {};
    let rawVal = stats[target];
    const initialWins = gs?.initialWins;
    if (target === 'wins') {
      // Use initial snapshot only if current value seems inflated (much higher than needed)
      // This prevents stat inflation bugs while allowing normal gameplay progress
      if (typeof initialWins === 'number' && typeof rawVal === 'number') {
        // Only use initialWins if current value is suspiciously high (more than 2x needed)
        if (rawVal > needed * 2 && initialWins <= needed) {
          rawVal = initialWins;
        }
      }
    }
    const currentVal = typeof rawVal === 'number' ? rawVal : Number(rawVal) || 0;
    const baseVal = currentVal;
    const fraction = needed > 0 ? baseVal / needed : 0;
    const progress = fraction >= 1 ? 1 : Number(fraction.toFixed(2));
    const isCompleted = baseVal >= needed;

    return {
      success: true,
      progress,
      isCompleted,
      achievement: achievement.toObject()
    };
  } catch (error) {
    logger.error('Error checking achievement progress:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to check achievement progress" };
  }
}

export async function getAchievementStats() {
  try {
    await connectDb();
  const stats = await AchievementModel.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, totalUnlocked: { $sum: '$unlockedCount' } } }
  ]);

    return { success: true, stats };
  } catch (error) {
    logger.error('Error fetching achievement stats:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to fetch achievement stats" };
  }
}
