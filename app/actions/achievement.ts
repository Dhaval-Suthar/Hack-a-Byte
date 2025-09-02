"use server";

import connectDb from "@/db/connectDb";
import AchievementModel, { UserAchievementModel } from "@/models/Achievement";
import DeviceUser from "@/models/DeviceUser";

export async function createAchievement(data: {
  name: string;
  description: string;
  icon: string;
  category: 'gameplay' | 'social' | 'technical' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: Record<string, number>;
  prerequisites: string[];
  rewards: {
    bitcoin?: number;
    experience?: number;
    title?: string;
  };
  isActive: boolean;
}) {
  try {
    await connectDb();

    const achievement = new AchievementModel({
      name: data.name,
      description: data.description,
      icon: data.icon,
      category: data.category,
      rarity: data.rarity,
      requirements: data.requirements,
      prerequisites: data.prerequisites,
      rewards: data.rewards,
      isActive: data.isActive,
      unlockedCount: 0,
    });

    await achievement.save();
    return { success: true, achievement: achievement.toObject() };
  } catch (error) {
    console.error("Error creating achievement:", error);
    return { success: false, error: "Failed to create achievement" };
  }
}

export async function getAchievements(category?: string, isActive: boolean = true) {
  try {
    await connectDb();

    const query: Record<string, unknown> = { isActive };
    if (category) {
      query.category = category;
    }

    const achievements = await AchievementModel.find(query)
      .sort({ rarity: -1, name: 1 })
      .lean();

    return { success: true, achievements };
  } catch (error) {
    console.error("Error fetching achievements:", error);
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
    const existingAchievement = await UserAchievementModel.findOne({
      userId,
      achievementId
    });

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
      unlockedAt: new Date(),
      progress: achievement.requirements,
      isCompleted: true,
    });

    // Update achievement stats
    achievement.unlockedCount += 1;

    // Add rewards to user
    if (achievement.rewards.bitcoin) {
      // Note: This would need to be updated to work with team wallets
      // user.bitcoinBalance = (user.bitcoinBalance || 0) + achievement.rewards.bitcoin;
    }

    if (achievement.rewards.experience) {
      // Add experience logic here
    }

    await Promise.all([
      userAchievement.save(),
      achievement.save(),
      user.save()
    ]);

    return { success: true, achievement: userAchievement.toObject() };
  } catch (error) {
    console.error("Error unlocking achievement:", error);
    return { success: false, error: "Failed to unlock achievement" };
  }
}

export async function getUserAchievements(userId: string) {
  try {
    await connectDb();

    const userAchievements = await UserAchievementModel.find({ userId })
      .populate('achievementId')
      .sort({ unlockedAt: -1 })
      .lean();

    return { success: true, achievements: userAchievements };
  } catch (error) {
    console.error("Error fetching user achievements:", error);
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

    const user = await DeviceUser.findById(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const progress = achievement.evaluateRequirement(user.gameState?.gameStats || {});
    const isCompleted = progress >= 1;

    return {
      success: true,
      progress,
      isCompleted,
      achievement: achievement.toObject()
    };
  } catch (error) {
    console.error("Error checking achievement progress:", error);
    return { success: false, error: "Failed to check achievement progress" };
  }
}

export async function getAchievementStats() {
  try {
    await connectDb();

    const stats = await AchievementModel.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalUnlocked: { $sum: '$unlockedCount' }
        }
      }
    ]);

    return { success: true, stats };
  } catch (error) {
    console.error("Error fetching achievement stats:", error);
    return { success: false, error: "Failed to fetch achievement stats" };
  }
}
