"use server";

import connectDb from "@/db/connectDb";
import AccessCodeModel from "@/models/AccessCode";
import Team from "@/models/Team";
import type { TeamMember as TeamMemberType } from "@/models/Team";
import Device from "@/models/Device";
import DeviceUser, { MissionProgress, UserGameState } from "@/models/DeviceUser";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { teamTimerService } from '@/lib/teamTimerService';
import { ROLE_LIMITS } from "@/lib/constants/app-constants";
import { logger } from '@/lib/logger';

export async function getAvailableRoles(accessCode: string) {
  try {
    await connectDb();

    const codeDocument = await AccessCodeModel.findOne({ code: accessCode, isActive: true });
    if (!codeDocument) {
      return { success: false, error: "Invalid access code" };
    }

    const team = await Team.findOne({ accessCodeId: codeDocument._id });
    if (!team) {
      return { success: false, error: "No team found for this code" };
    }

  const members = team.teamMembers as unknown as TeamMemberType[];
    const teamSize = team.numberOfPlayers;
    const roleLimits = ROLE_LIMITS[teamSize as keyof typeof ROLE_LIMITS] || ROLE_LIMITS[4];

    // Count current role assignments
    const roleCounts: Record<string, number> = {};
    members.forEach((member: TeamMemberType) => {
      if (member.role) {
        const normalized = member.role.toLowerCase();
        roleCounts[normalized] = (roleCounts[normalized] || 0) + 1;
      }
    });

    // Get available roles based on limits
    const availableRoles: string[] = [];
    Object.entries(roleLimits).forEach(([role, limit]) => {
      const currentCount = roleCounts[role] || 0;
      if (currentCount < limit) {
        availableRoles.push(role);
      }
    });
    return { success: true, teamId: team._id.toString(), availableRoles, totalSlots: team.numberOfPlayers };
  } catch (error) {
    logger.error('Error getting available roles:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to fetch roles" };
  }
}

export async function validateAndUseAccessCode(params: { accessCode: string; username: string; role: string; }) {
  try {
    const { accessCode, username, role } = params;
    await connectDb();

    // First, find the access code without incrementing
    const codeDocument = await AccessCodeModel.findOne({ code: accessCode, isActive: true });

    if (!codeDocument) {
      return { success: false, error: "Invalid access code" };
    }

    const team = await Team.findOne({ accessCodeId: codeDocument._id });
    if (!team) {
      return { success: false, error: "Team not found for this code" };
    }
    const members: TeamMemberType[] = (team.teamMembers as unknown as TeamMemberType[]) || [];

    // Check if role is available based on team size limits BEFORE incrementing usage
    const teamSize = team.numberOfPlayers;
    const roleLimits = ROLE_LIMITS[teamSize as keyof typeof ROLE_LIMITS] || ROLE_LIMITS[4];
    const normalizedRole = role.toLowerCase();
    const currentRoleCount = members.filter((m: TeamMemberType) => m.role && m.role.toLowerCase() === normalizedRole).length;
    const maxAllowed = roleLimits[normalizedRole as keyof typeof roleLimits] || 0;

    if (currentRoleCount >= maxAllowed) {
      return { success: false, error: `Role "${role}" limit reached for this team size` };
    }

    // Find first available member slot
    const memberIndex = members.findIndex((m: TeamMemberType) => !m.accessCodeUsed);
    if (memberIndex === -1) {
      return { success: false, error: "No available slots for this team" };
    }

    // Now increment usage count atomically and check limit
    const updatedCodeDocument = await AccessCodeModel.findOneAndUpdate(
      { _id: codeDocument._id, isActive: true },
      { $inc: { usageCount: 1 } },
      { new: true } // Return the updated document
    );

    if (!updatedCodeDocument) {
      return { success: false, error: "Failed to update access code usage" };
    }

    // Check if usage limit was exceeded after increment
    if (updatedCodeDocument.maxUsages && updatedCodeDocument.usageCount > updatedCodeDocument.maxUsages) {
      // Usage exceeded, revert the increment and return error
      await AccessCodeModel.findOneAndUpdate(
        { _id: updatedCodeDocument._id },
        { $inc: { usageCount: -1 } }
      );
      return { success: false, error: "Access code usage limit reached" };
    }

    // Check if we should delete the code (usage count now equals max usages)
    if (updatedCodeDocument.maxUsages && updatedCodeDocument.usageCount >= updatedCodeDocument.maxUsages) {
      console.log(`Deleting access code ${updatedCodeDocument.code} as usage limit reached (usageCount=${updatedCodeDocument.usageCount}, maxUsages=${updatedCodeDocument.maxUsages})`);
      await AccessCodeModel.findByIdAndDelete(updatedCodeDocument._id);
      console.log(`Access code ${updatedCodeDocument.code} deleted`);
    }

    // Check if this is the first member to join (BEFORE marking current member as joined)
    const membersJoinedBefore = members.filter((m: TeamMemberType) => m.accessCodeUsed).length;
    const isFirstMember = membersJoinedBefore === 0; // Before this member joined

    // Mark current member as joined
    team.teamMembers[memberIndex].username = username;
    team.teamMembers[memberIndex].role = normalizedRole;
    team.teamMembers[memberIndex].accessCodeUsed = true;
    team.teamMembers[memberIndex].accessCodeUsedAt = new Date();

    // If all members joined, bring device online and start team timer
    const allJoined = members.every((m: TeamMemberType) => m.accessCodeUsed);
    if (allJoined) {
      if (team.deviceId) {
        await Device.findByIdAndUpdate(team.deviceId, { status: "online" });
      }
      team.timer.startTime = new Date();
      team.timer.isActive = true;
    }

    // Start 1-hour auto-offline timer when first member comes online
    if (isFirstMember && team.deviceId) {
      try {
        await teamTimerService.startTeamTimer(
          team._id.toString(),
          team.deviceId.toString()
        );
        logger.info(`Started 1-hour auto-offline timer for team ${team._id} (first member: ${username})`);
      } catch (error) {
        logger.error('Failed to start team auto-offline timer:', { 
          teamId: team._id.toString(),
          deviceId: team.deviceId.toString(),
          username,
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, error as Error);
      }
    }

    await team.save();


    return {
      success: true,
      teamId: team._id.toString(),
      playspaceId: team.playspaceId ? (team.playspaceId as unknown as mongoose.Types.ObjectId).toString() : undefined,
      deviceId: team.deviceId ? (team.deviceId as unknown as mongoose.Types.ObjectId).toString() : undefined,
      allJoined,
    };
  } catch (error) {
    logger.error('Error validating access code:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to use access code" };
  }
}

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

    const toRecordMissions = (m: unknown): Record<string, MissionProgress> => {
      if (!m) return {};
      if (m instanceof Map) return Object.fromEntries(m.entries()) as Record<string, MissionProgress>;
      return m as Record<string, MissionProgress>;
    };
    const toRecordSkills = (s: unknown): Record<string, number> => {
      if (!s) return {};
      if (s instanceof Map) return Object.fromEntries(s.entries()) as Record<string, number>;
      return s as Record<string, number>;
    };
    const missionsRec = toRecordMissions(user.gameState.missions);
    const serializedMissions: Record<string, object> = {};
    for (const [key, mission] of Object.entries(missionsRec)) {
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
    const gameState: UserGameState = {
      unlockedApplications: user.gameState.unlockedApplications || [],
      skills: toRecordSkills(user.gameState.skills),
      missions: serializedMissions as Record<string, MissionProgress>,
      gameStats: {
        totalPlayTime: user.gameState.gameStats?.totalPlayTime || 0,
        loginCount: user.gameState.gameStats?.loginCount || 0,
        lastLoginDate: user.gameState.gameStats?.lastLoginDate || new Date(),
        achievementsUnlocked: user.gameState.gameStats?.achievementsUnlocked || [],
        wins: user.gameState.gameStats?.wins || 0,
      },
      settings: {
        soundEnabled: user.gameState.settings?.soundEnabled ?? true,
        showHiddenFiles: user.gameState.settings?.showHiddenFiles ?? false,
        difficulty: user.gameState.settings?.difficulty || 'medium'
      },
      initialWins: user.gameState.initialWins || 0,
    };

    return {
      success: true,
  gameState,
      user: {
  _id: String((user as { _id?: unknown })?._id ?? ''),
        username: user.username,
        lastActiveTime: user.lastActiveTime?.toISOString() || null
      }
    };
  } catch (error) {
    logger.error('Error getting user progress:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
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
    const missionStore: Record<string, MissionProgress> = (() => {
      const raw = user.gameState.missions as unknown;
      if (!raw) return {};
      if (raw instanceof Map) return Object.fromEntries(raw.entries()) as Record<string, MissionProgress>;
      return raw as Record<string, MissionProgress>;
    })();
    const existingMission = missionStore[missionId] || {
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
  missionStore[missionId] = updatedMission;
  user.gameState.missions = missionStore as unknown as UserGameState['missions'];

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
    logger.error('Error updating mission progress:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    
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
    logger.error('Error updating user settings:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
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
    logger.error('Error getting unlocked applications:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
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
    logger.error('Error updating unlocked applications:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
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
      user.gameState.gameStats = { totalPlayTime: 0, loginCount: 0, lastLoginDate: new Date(), achievementsUnlocked: [], wins: 0 };
    } else if (typeof user.gameState.gameStats.wins !== 'number') { user.gameState.gameStats.wins = 0; }

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
    logger.error('Error updating game stats:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
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

    const mission = (() => {
      const raw = user.gameState.missions as unknown;
      if (!raw) return undefined;
      if (raw instanceof Map) return raw.get(missionId);
      return (raw as Record<string, MissionProgress>)[missionId];
    })();

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
    logger.error('Error getting mission status:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
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
    const bulkStore: Record<string, MissionProgress> = (() => {
      const raw = user.gameState.missions as unknown;
      if (!raw) return {};
      if (raw instanceof Map) return Object.fromEntries(raw.entries()) as Record<string, MissionProgress>;
      return raw as Record<string, MissionProgress>;
    })();
    for (const [mid, mdata] of Object.entries(missions)) bulkStore[mid] = mdata;
    user.gameState.missions = bulkStore as unknown as UserGameState['missions'];

    user.lastActiveTime = new Date();

    await user.save();

    return {
      success: true,
      updatedCount: Object.keys(missions).length
    };
  } catch (error) {
    logger.error('Error bulk updating missions:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
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
      unlockedApplications: [],
      skills: {},
      missions: {},
      gameStats: { totalPlayTime: 0, loginCount: 0, lastLoginDate: new Date(), achievementsUnlocked: [], wins: 0 },
      settings: { soundEnabled: true, showHiddenFiles: false, difficulty: 'medium' },
      initialWins: 0,
    } as UserGameState;

    await user.save();

    return { success: true };
  } catch (error) {
    logger.error('Error resetting user progress:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to reset progress" };
  }
}
