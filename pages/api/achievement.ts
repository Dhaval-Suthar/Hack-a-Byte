import { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@/db/connectDb";
import AchievementModel, { UserAchievementModel } from "@/models/Achievement";
import DeviceUser from "@/models/DeviceUser";
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'POST', 'PUT'].includes(req.method || '')) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDb();

    if (req.method === "GET") {
      // Get achievements or user achievements
      const { userId, category, isActive = 'true' } = req.query;

      if (userId && typeof userId === 'string') {
        // Get user achievements
        const userAchievements = await UserAchievementModel.find({ userId })
          .populate('achievementId')
          .sort({ unlockedAt: -1 })
          .lean();

        return res.status(200).json({
          success: true,
          achievements: userAchievements
        });
      } else {
        // Get all achievements
        const query: Record<string, unknown> = { isActive: isActive === 'true' };
        if (category && typeof category === 'string') {
          query.category = category;
        }

        const achievements = await AchievementModel.find(query)
          .sort({ rarity: -1, name: 1 })
          .lean();

        return res.status(200).json({
          success: true,
          achievements
        });
      }
    }

    if (req.method === "POST") {
      // Create new achievement
      const {
        name,
        description,
        icon,
        category,
        rarity,
        requirements,
        prerequisites,
        rewards,
        isActive
      } = req.body;

      if (!name || !description || !category || !rarity) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const achievement = new AchievementModel({
        name,
        description,
        icon: icon || '🏆',
        category,
        rarity,
        requirements: requirements || {},
        prerequisites: prerequisites || [],
        rewards: rewards || {},
        isActive: isActive !== false,
        unlockedCount: 0,
      });

      await achievement.save();

      return res.status(201).json({
        success: true,
        achievement: achievement.toObject()
      });
    }

    if (req.method === "PUT") {
      // Unlock achievement for user
      const { userId, achievementId } = req.body;

      if (!userId || !achievementId) {
        return res.status(400).json({ error: "User ID and Achievement ID are required" });
      }

      const achievement = await AchievementModel.findById(achievementId);
      if (!achievement) {
        return res.status(404).json({ error: "Achievement not found" });
      }

      const user = await DeviceUser.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has this achievement
      const existingAchievement = await UserAchievementModel.findOne({
        userId,
        achievementId
      });

      if (existingAchievement) {
        return res.status(400).json({ error: "Achievement already unlocked" });
      }

      // Check prerequisites
      const hasPrerequisites = await achievement.checkPrerequisites(userId);
      if (!hasPrerequisites) {
        return res.status(400).json({ error: "Prerequisites not met" });
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

      await Promise.all([
        userAchievement.save(),
        achievement.save()
      ]);

      return res.status(200).json({
        success: true,
        achievement: userAchievement.toObject()
      });
    }
  } catch (error) {
    logger.error('Achievement API error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
