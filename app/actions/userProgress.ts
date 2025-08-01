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
    const gameState = {
      ...user.gameState,
      skills: user.gameState.skills ? Object.fromEntries(user.gameState.skills) : {},
      missions: user.gameState.missions ? Object.fromEntries(user.gameState.missions) : {}
    };

    return {
      success: true,
      gameState: gameState as UserGameState,
      user: {
        _id: user._id.toString(),
        username: user.username,
        lastActiveTime: user.lastActiveTime
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
      ...existingMission,
      ...missionData,
      id: missionId, // Ensure ID is always set
      title: missionData.title || existingMission.title || `Mission ${missionId}`,
      description: missionData.description || existingMission.description || `Mission ${missionId} details`
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

    return {
      success: true,
      mission: updatedMission
    };
  } catch (error) {
    console.error("Error updating mission progress:", error);
    return { error: "Failed to update mission progress" };
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
      gameStats: user.gameState.gameStats
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
      mission: mission || null,
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
