"use server";

import connectDb from "@/db/connectDb";
import DeviceUser, { MissionProgress, UserGameState } from "@/models/DeviceUser";
import { cookies } from "next/headers";
import mongoose from "mongoose";

/**
 * Get user progress/game state from database
 */
export async function getUserProgress(deviceId: string, deviceType: string) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { error: "User not logged in" };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();

    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      deviceMacAddress: deviceId
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Convert Map objects to plain objects for serialization
    const missions = user.gameState.missions ? Object.fromEntries(user.gameState.missions) : {};
    const serializedMissions: Record<string, object> = {};
    
    // Serialize Date objects and ensure all properties are plain values in missions
    for (const [key, mission] of Object.entries(missions)) {
      serializedMissions[key] = {
        id: mission.id || key,
        title: mission.title || '',
        description: mission.description || '',
        completed: Boolean(mission.completed),
        progress: Number(mission.progress) || 0,
        completedAt: mission.completedAt?.toISOString() || null,
        startedAt: mission.startedAt?.toISOString() || null,
        objectives: mission.objectives ? mission.objectives.map((obj: { id: string; description: string; completed: boolean }) => ({
          id: obj.id || '',
          description: obj.description || '',
          completed: Boolean(obj.completed)
        })) : []
      };
    }

    const gameState = {
      unlockedApplications: user.gameState.unlockedApplications || [],
      skills: user.gameState.skills ? Object.fromEntries(user.gameState.skills) : {},
      missions: serializedMissions,
      gameStats: {
        totalPlayTime: user.gameState.gameStats?.totalPlayTime || 0,
        loginCount: user.gameState.gameStats?.loginCount || 0,
        lastLoginDate: user.gameState.gameStats?.lastLoginDate?.toISOString() || null,
        achievementsUnlocked: user.gameState.gameStats?.achievementsUnlocked || []
      },
      settings: {
        soundEnabled: user.gameState.settings?.soundEnabled ?? true,
        showHiddenFiles: user.gameState.settings?.showHiddenFiles ?? false,
        difficulty: user.gameState.settings?.difficulty || 'medium'
      }
    };

    return {
      success: true,
      gameState: gameState as UserGameState,
      user: {
        _id: user._id.toString(),
        username: user.username,
        lastActiveTime: user.lastActiveTime?.toISOString() || null
      }
    };
  } catch (error) {
    console.error("Error getting user progress:", error);
    return { error: "Failed to get user progress" };
  }
}

/**
 * Update user's mission progress
 */
export async function updateMissionProgress(
  deviceId: string,
  deviceType: string,
  missionId: string,
  missionData: Partial<MissionProgress>
) {
  try {
    // Validate inputs
    if (!deviceId || !deviceType || !missionId) {
      return { error: "Missing required parameters" };
    }

    if (!missionData || typeof missionData !== 'object') {
      return { error: "Invalid mission data" };
    }

    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { error: "User not logged in" };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();

    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      deviceMacAddress: deviceId
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Initialize gameState.missions if it doesn't exist
    if (!user.gameState.missions) {
      user.gameState.missions = new Map();
    }

    // Get existing mission data or create new
    const existingMission = user.gameState.missions.get(missionId) || {
      id: missionId,
      title: missionData.title || `Mission ${missionId}`,
      description: missionData.description || "",
      completed: false,
      progress: 0,
      objectives: []
    };

    // Merge the new data with existing mission data
    // Make sure required fields are preserved from existing mission if not provided in update
    const updatedMission: MissionProgress = {
      id: missionId, // Ensure ID is always set
      title: missionData.title || existingMission.title || `Mission ${missionId}`,
      description: missionData.description || existingMission.description || `Mission ${missionId} details`,
      completed: missionData.completed !== undefined ? missionData.completed : existingMission.completed,
      progress: missionData.progress !== undefined ? missionData.progress : existingMission.progress,
      objectives: missionData.objectives || existingMission.objectives || [],
      startedAt: existingMission.startedAt,
      completedAt: existingMission.completedAt
    };

    // If mission is being completed, set completion timestamp
    if (missionData.completed && !existingMission.completed) {
      updatedMission.completedAt = new Date();
      updatedMission.progress = 100;
    }

    // If mission is being started for the first time, set start timestamp
    if (!existingMission.startedAt && (missionData.startedAt || missionData.progress || missionData.completed)) {
      updatedMission.startedAt = missionData.startedAt || new Date();
    }

    // Update the mission in the user's game state
    user.gameState.missions.set(missionId, updatedMission);

    // Update last active time
    user.lastActiveTime = new Date();

    // Save the user
    await user.save();

    // Serialize the mission data properly to avoid circular references
    const serializedMission = {
      id: updatedMission.id,
      title: updatedMission.title,
      description: updatedMission.description,
      completed: updatedMission.completed,
      progress: updatedMission.progress || 0,
      objectives: updatedMission.objectives || [],
      completedAt: updatedMission.completedAt?.toISOString() || null,
      startedAt: updatedMission.startedAt?.toISOString() || null
    };

    return {
      success: true,
      mission: serializedMission
    };
  } catch (error) {
    console.error("Error updating mission progress:", error);
    
    // Return a safe, serializable error response
    return { 
      error: "Failed to update mission progress",
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Update user's game settings
 */
export async function updateUserSettings(
  deviceId: string,
  deviceType: string,
  settings: Partial<UserGameState['settings']>
) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { error: "User not logged in" };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();

    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      deviceMacAddress: deviceId
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Initialize settings if they don't exist
    if (!user.gameState.settings) {
      user.gameState.settings = {
        soundEnabled: true,
        showHiddenFiles: false,
        difficulty: 'medium'
      };
    }

    // Update settings
    user.gameState.settings = {
      ...user.gameState.settings,
      ...settings
    };

    // Update last active time
    user.lastActiveTime = new Date();

    await user.save();

    return {
      success: true,
      settings: user.gameState.settings
    };
  } catch (error) {
    console.error("Error updating user settings:", error);
    return { error: "Failed to update user settings" };
  }
}

/**
 * Update user's unlocked applications
 */
/**
 * Get user's unlocked applications from database
 */
export async function getUnlockedApplications(deviceId: string, deviceType: string) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { error: "User not logged in" };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();

    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      deviceMacAddress: deviceId
    });

    if (!user) {
      return { error: "User not found" };
    }

    return {
      success: true,
      unlockedApplications: user.gameState.unlockedApplications || []
    };
  } catch (error) {
    console.error("Error getting unlocked applications:", error);
    return { error: "Failed to get unlocked applications" };
  }
}

export async function updateUnlockedApplications(
  deviceId: string,
  deviceType: string,
  applications: string[]
) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { error: "User not logged in" };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();

    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      deviceMacAddress: deviceId
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Update unlocked applications (merge with existing)
    const existingApps = user.gameState.unlockedApplications || [];
    const newApps = [...new Set([...existingApps, ...applications])]; // Remove duplicates

    user.gameState.unlockedApplications = newApps;
    user.lastActiveTime = new Date();

    await user.save();

    return {
      success: true,
      unlockedApplications: newApps
    };
  } catch (error) {
    console.error("Error updating unlocked applications:", error);
    return { error: "Failed to update unlocked applications" };
  }
}

/**
 * Update user's game statistics
 */
export async function updateGameStats(
  deviceId: string,
  deviceType: string,
  statsUpdate: Partial<UserGameState['gameStats']>
) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { error: "User not logged in" };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();

    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      deviceMacAddress: deviceId
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Initialize game stats if they don't exist
    if (!user.gameState.gameStats) {
      user.gameState.gameStats = {
        totalPlayTime: 0,
        loginCount: 0,
        lastLoginDate: new Date(),
        achievementsUnlocked: []
      };
    }

    // Update game stats
    user.gameState.gameStats = {
      ...user.gameState.gameStats,
      ...statsUpdate
    };

    user.lastActiveTime = new Date();

    await user.save();

    return {
      success: true,
      gameStats: {
        totalPlayTime: user.gameState.gameStats?.totalPlayTime || 0,
        loginCount: user.gameState.gameStats?.loginCount || 0,
        lastLoginDate: user.gameState.gameStats?.lastLoginDate?.toISOString() || null,
        achievementsUnlocked: user.gameState.gameStats?.achievementsUnlocked || []
      }
    };
  } catch (error) {
    console.error("Error updating game stats:", error);
    return { error: "Failed to update game stats" };
  }
}

/**
 * Get mission status for a specific mission
 */
export async function getMissionStatus(
  deviceId: string,
  deviceType: string,
  missionId: string
) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { error: "User not logged in" };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();

    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      deviceMacAddress: deviceId
    });

    if (!user) {
      return { error: "User not found" };
    }

    const mission = user.gameState.missions?.get(missionId);

    return {
      success: true,
      mission: mission ? {
        id: mission.id || missionId,
        title: mission.title || '',
        description: mission.description || '',
        completed: Boolean(mission.completed),
        progress: Number(mission.progress) || 0,
        completedAt: mission.completedAt?.toISOString() || null,
        startedAt: mission.startedAt?.toISOString() || null,
        objectives: mission.objectives ? mission.objectives.map((obj: { id: string; description: string; completed: boolean }) => ({
          id: obj.id || '',
          description: obj.description || '',
          completed: Boolean(obj.completed)
        })) : []
      } : null,
      completed: mission?.completed || false
    };
  } catch (error) {
    console.error("Error getting mission status:", error);
    return { error: "Failed to get mission status" };
  }
}

/**
 * Bulk update multiple missions (useful for importing from localStorage)
 */
export async function bulkUpdateMissions(
  deviceId: string,
  deviceType: string,
  missions: Record<string, MissionProgress>
) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { error: "User not logged in" };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();

    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      deviceMacAddress: deviceId
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Initialize missions map if it doesn't exist
    if (!user.gameState.missions) {
      user.gameState.missions = new Map();
    }

    // Update all missions
    for (const [missionId, missionData] of Object.entries(missions)) {
      user.gameState.missions.set(missionId, missionData);
    }

    user.lastActiveTime = new Date();

    await user.save();

    return {
      success: true,
      updatedCount: Object.keys(missions).length
    };
  } catch (error) {
    console.error("Error bulk updating missions:", error);
    return { error: "Failed to bulk update missions" };
  }
}

/**
 * Reset all progress for a user on a specific device
 */
export async function resetAllProgress(deviceId: string, deviceType: string) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { error: "User not logged in" };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();

    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      deviceMacAddress: deviceId
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Reset all game state
    user.gameState = {
      missions: new Map(),
      skills: new Map(),
      unlockedApplications: [],
      settings: new Map(),
      totalScore: 0,
      gamesCompleted: 0,
      achievements: [],
      lastActiveTime: new Date()
    };

    await user.save();

    return { success: true };
  } catch (error) {
    console.error("Error resetting user progress:", error);
    return { error: "Failed to reset progress" };
  }
}
