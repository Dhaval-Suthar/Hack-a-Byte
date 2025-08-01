"use server";

import connectDb from "@/db/connectDb";
import DeviceUser from "@/models/DeviceUser";

// Helper function to check admin status (simplified)
async function checkAdminStatus(adminKey?: string) {
  // For now, implement a basic admin check
  // In production, this should validate against a proper admin system
  const validAdminKey = process.env.ADMIN_KEY || "admin123";
  
  if (!adminKey || adminKey !== validAdminKey) {
    return { isAdmin: false, error: "Admin authentication required" };
  }
  
  return { isAdmin: true, error: null };
}

interface UserGameStateLeaned {
  unlockedApplications?: string[];
  skills?: Map<string, number> | Record<string, number>;
  missions?: Map<string, unknown> | Record<string, unknown>;
  gameStats?: {
    totalPlayTime?: number;
    loginCount?: number;
    lastLoginDate?: Date;
    achievementsUnlocked?: string[];
  };
  settings?: {
    soundEnabled?: boolean;
    showHiddenFiles?: boolean;
    difficulty?: string;
  };
}

interface DeviceUserLeaned {
  _id: unknown;
  username: string;
  deviceMacAddress: string;
  deviceId: string;
  isActive: boolean;
  lastActiveTime?: Date;
  createdAt?: Date;
  gameState?: UserGameStateLeaned;
}

/**
 * Get all device users with their progress (Admin only)
 */
export async function getAllDeviceUsersProgress(adminKey?: string) {
  try {
    const { isAdmin, error } = await checkAdminStatus(adminKey);

    if (!isAdmin) {
      return { error };
    }

    await connectDb();

    // Get all device users with their game state
    const users = await DeviceUser.find({})
      .select('username deviceMacAddress deviceId gameState lastActiveTime createdAt isActive')
      .lean()
      .sort({ lastActiveTime: -1 });

    // Process the users data for safe serialization
    const processedUsers = users.map((user: unknown) => {
      const typedUser = user as DeviceUserLeaned;
      const gameState = typedUser.gameState || {};
      
      return {
        _id: typedUser._id?.toString() || '',
        username: typedUser.username,
        deviceMacAddress: typedUser.deviceMacAddress,
        deviceId: typedUser.deviceId,
        isActive: typedUser.isActive,
        lastActiveTime: typedUser.lastActiveTime ? typedUser.lastActiveTime.toISOString() : null,
        createdAt: typedUser.createdAt ? typedUser.createdAt.toISOString() : null,
        gameState: {
          unlockedApplications: gameState.unlockedApplications || [],
          skills: gameState.skills ? (gameState.skills instanceof Map ? Object.fromEntries(gameState.skills) : gameState.skills) : {},
          missions: gameState.missions ? (gameState.missions instanceof Map ? Object.fromEntries(gameState.missions) : gameState.missions) : {},
          gameStats: {
            totalPlayTime: gameState.gameStats?.totalPlayTime || 0,
            loginCount: gameState.gameStats?.loginCount || 0,
            lastLoginDate: gameState.gameStats?.lastLoginDate ? gameState.gameStats.lastLoginDate.toISOString() : null,
            achievementsUnlocked: gameState.gameStats?.achievementsUnlocked || []
          },
          settings: {
            soundEnabled: gameState.settings?.soundEnabled ?? true,
            showHiddenFiles: gameState.settings?.showHiddenFiles ?? false,
            difficulty: gameState.settings?.difficulty || 'medium'
          }
        }
      };
    });

    return {
      success: true,
      users: processedUsers
    };
  } catch (error) {
    console.error("Error getting all device users progress:", error);
    return { error: "Failed to get device users progress" };
  }
}

/**
 * Get progress summary statistics (Admin only)
 */
export async function getProgressSummaryStats(adminKey?: string) {
  try {
    const { isAdmin, error } = await checkAdminStatus(adminKey);

    if (!isAdmin) {
      return { error };
    }

    await connectDb();

    // Get aggregate statistics
    const totalUsers = await DeviceUser.countDocuments({});
    const activeUsers = await DeviceUser.countDocuments({ isActive: true });
    
    // Get all users with their missions
    const users = await DeviceUser.find({})
      .select('gameState')
      .lean();

    // Calculate mission completion statistics
    const missionStats: Record<string, { completed: number; total: number }> = {};
    let totalMissionsCompleted = 0;
    let totalMissions = 0;

    (users as unknown[]).forEach(userItem => {
      const user = userItem as { gameState?: UserGameStateLeaned };
      const missions = user.gameState?.missions || new Map();
      const missionsObj = missions instanceof Map ? Object.fromEntries(missions) : missions;
      
      Object.entries(missionsObj).forEach(([missionId, mission]) => {
        if (!missionStats[missionId]) {
          missionStats[missionId] = { completed: 0, total: 0 };
        }
        missionStats[missionId].total++;
        totalMissions++;
        
        if (mission && typeof mission === 'object' && 'completed' in mission && mission.completed) {
          missionStats[missionId].completed++;
          totalMissionsCompleted++;
        }
      });
    });

    // Calculate average play time
    const totalPlayTime = (users as unknown[]).reduce((sum: number, userItem) => {
      const user = userItem as { gameState?: UserGameStateLeaned };
      return sum + (user.gameState?.gameStats?.totalPlayTime || 0);
    }, 0);
    const averagePlayTime = totalUsers > 0 ? totalPlayTime / totalUsers : 0;

    // Get most popular unlocked applications
    const appCount: Record<string, number> = {};
    (users as unknown[]).forEach(userItem => {
      const user = userItem as { gameState?: UserGameStateLeaned };
      const apps = user.gameState?.unlockedApplications || [];
      apps.forEach((app: string) => {
        appCount[app] = (appCount[app] || 0) + 1;
      });
    });

    const popularApps = Object.entries(appCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([app, count]) => ({ app, count }));

    return {
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalMissionsCompleted,
        totalMissions,
        averagePlayTime: Math.round(averagePlayTime),
        missionStats,
        popularApps
      }
    };
  } catch (error) {
    console.error("Error getting progress summary stats:", error);
    return { error: "Failed to get progress summary stats" };
  }
}

/**
 * Reset user progress (Admin only)
 */
export async function resetUserProgress(
  userId: string,
  adminKey?: string
) {
  try {
    const { isAdmin, error } = await checkAdminStatus(adminKey);

    if (!isAdmin) {
      return { error };
    }

    await connectDb();

    const user = await DeviceUser.findById(userId);
    if (!user) {
      return { error: "User not found" };
    }

    // Reset game state to initial values
    user.gameState = {
      unlockedApplications: ['Notepad', 'MyComputer'],
      skills: new Map(),
      missions: new Map(),
      gameStats: {
        totalPlayTime: 0,
        loginCount: user.gameState.gameStats?.loginCount || 0, // Keep login count
        lastLoginDate: user.gameState.gameStats?.lastLoginDate || new Date(),
        achievementsUnlocked: []
      },
      settings: {
        soundEnabled: true,
        showHiddenFiles: false,
        difficulty: 'medium'
      }
    };

    await user.save();

    return {
      success: true,
      message: `Progress reset for user ${user.username}`
    };
  } catch (error) {
    console.error("Error resetting user progress:", error);
    return { error: "Failed to reset user progress" };
  }
}
