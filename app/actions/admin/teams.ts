"use server";

import connectDb from "@/db/connectDb";
import Team, { TeamMember } from "@/models/Team";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import Playspace from "@/models/Playspace";
import AccessCode from "@/models/AccessCode";
import { createAccessCodeAndPlayspace } from "@/lib/access-code-generation";
import { logger } from '@/lib/logger';

// Helper function to check admin status
async function checkAdminStatus(adminKey?: string) {
  // If admin key is provided, validate it (file upload authentication)
  if (adminKey) {
    const validKey = process.env.ADMIN_AUTH_KEY || "hackabyte-admin-key-2024"; // This should match your admin-key.txt file
    if (adminKey.trim() === validKey) {
      return { isAdmin: true, error: null };
    } else {
      return {
        isAdmin: false,
        error: "Invalid authentication key",
      };
    }
  }

  // No session-based authentication fallback
  return {
    isAdmin: false,
    error: "Authentication key required",
  };
}

export async function getTeams(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();
    const teams = await Team.find({}).select("_id name description leaderUserId members numberOfPlayers playingDevice").lean().sort({ createdAt: -1 });

    // Transform the data to include member count and ensure all fields exist
    const teamsWithMemberCount = teams.map((team) => ({
      _id: team._id ? team._id.toString() : "",
      name: team.name || "Unknown Team",
      description: team.description || "No description",
      leaderUserId: team.leaderUserId || "",
      members: Array.isArray(team.members) ? team.members.length : 0,
      numberOfPlayers: team.numberOfPlayers || 1,
      playingDevice: team.playingDevice || "smartphone", // Default to smartphone if not set
    }));

    return { teams: teamsWithMemberCount };
  } catch (error) {
    logger.error('Error fetching teams:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to fetch teams" };
  }
}

export async function createTeam(name: string, description: string, numberOfPlayers: number, playingDevice: "smartphone" | "pc_laptop", leaderUserId?: string, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return { error: "Team name is required" };
    }

    if (!numberOfPlayers || numberOfPlayers < 1 || numberOfPlayers > 10) {
      return { error: "Number of players must be between 1 and 10" };
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({ name: name.trim() });
    if (existingTeam) {
      return { error: "Team name already exists" };
    }

    // If leader is specified, we'll just store it as is (no validation since User model is removed)
    // if (leaderUserId) {
    //   const leader = await User.findById(leaderUserId);
    //   if (!leader) {
    //     return { error: "Specified leader user does not exist" };
    //   }
    // }

    // Generate wallet credentials
    const crypto = await import("crypto");
    const walletAddress = crypto
      .createHash("sha256")
      .update(`${name}:${Date.now()}`)
      .digest("hex")
      .slice(0, 42);
    const privateKey = crypto.randomBytes(32).toString("hex");
    const publicKey = crypto.createHash("sha256").update(privateKey).digest("hex").slice(0, 66);

    // Initialize member slots
    const teamMembers = Array.from({ length: numberOfPlayers }, () => ({ accessCodeUsed: false }));

  // Create new team (playspace & access code will be generated just after and then linked back)
    const newTeam = new Team({
      name: name.trim(),
      description: description?.trim() || "",
      leaderUserId: leaderUserId || null,
      members: leaderUserId ? [leaderUserId] : [],
      numberOfPlayers,
      wallet: {
        walletAddress,
        privateKey,
        publicKey,
        bitcoinBalance: 100,
      },
      teamMembers,
      timer: {
        isActive: false,
        elapsedTime: 0,
        totalPausedTime: 0,
      },
    });

    await newTeam.save();

    // Create playspace and device for the team
  let generatedAccessCode: string | undefined;
  try {
      const playspaceResult = await createAccessCodeAndPlayspace({
        numberOfPlayers,
        playingDevice,
        eventTitle: name.trim(),
        registrationId: newTeam._id.toString(),
        codePrefix: '9', // Admin-created teams use '9' prefix
      });

      if (playspaceResult.success) {
    generatedAccessCode = playspaceResult.accessCode;
        // Update team with playspace, device & access code references
        if (playspaceResult.playspaceId) {
          newTeam.playspaceId = new mongoose.Types.ObjectId(playspaceResult.playspaceId);
        }
        if (playspaceResult.deviceId) {
          newTeam.deviceId = new mongoose.Types.ObjectId(playspaceResult.deviceId);
        }
        if (playspaceResult.accessCodeId) {
          newTeam.accessCodeId = new mongoose.Types.ObjectId(playspaceResult.accessCodeId);
        }
        await newTeam.save();
      } else {
        logger.warn('Failed to create playspace and device for team:', { error: playspaceResult.error });
        // Don't fail the team creation, just log the warning
      }
    } catch (error) {
      logger.error('Error creating playspace and device for team:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      // Don't fail the team creation, just log the error
    }

    revalidatePath("/admin");

    return {
      success: true,
      message: "Team created successfully",
      team: {
        _id: newTeam._id.toString(),
        name: newTeam.name,
        description: newTeam.description,
        leaderUserId: newTeam.leaderUserId,
        members: newTeam.members.length,
        numberOfPlayers: newTeam.numberOfPlayers,
        walletAddress: newTeam.wallet.walletAddress,
        accessCodeId: newTeam.accessCodeId ? newTeam.accessCodeId.toString() : undefined,
        playspaceId: newTeam.playspaceId ? newTeam.playspaceId.toString() : undefined,
        deviceId: newTeam.deviceId ? newTeam.deviceId.toString() : undefined,
        accessCode: generatedAccessCode,
      },
    };
  } catch (error) {
    logger.error('Error creating team:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to create team" };
  }
}

export async function updateTeam(teamId: string, updates: { name?: string; description?: string; leaderUserId?: string; numberOfPlayers?: number }, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return { error: "Team not found" };
    }

    // Validate name uniqueness if being updated
    if (updates.name && updates.name.trim() !== team.name) {
      const existingTeam = await Team.findOne({ name: updates.name.trim() });
      if (existingTeam && existingTeam._id.toString() !== teamId) {
        return { error: "Team name already exists" };
      }
      team.name = updates.name.trim();
    }

    // Update description
    if (updates.description !== undefined) {
      team.description = updates.description.trim();
    }

    // Update leader
    if (updates.leaderUserId !== undefined) {
      if (updates.leaderUserId) {
        // Verify the new leader exists (removed since User model is gone)
        // const leader = await User.findById(updates.leaderUserId);
        // if (!leader) {
        //   return { error: "Specified leader user does not exist" };
        // }
        team.leaderUserId = updates.leaderUserId;
        // Add leader to members if not already there
        if (!team.members.includes(updates.leaderUserId)) {
          team.members.push(updates.leaderUserId);
        }
      } else {
        team.leaderUserId = null;
      }
    }

    // Update numberOfPlayers and adjust teamMembers size accordingly
    if (typeof updates.numberOfPlayers === 'number' && updates.numberOfPlayers !== team.numberOfPlayers) {
      const newSize = Math.max(1, Math.min(10, updates.numberOfPlayers));
      // Grow or shrink teamMembers while preserving existing occupied slots
      const current = Array.isArray(team.teamMembers) ? team.teamMembers : [];

      if (newSize > current.length) {
        // Add empty slots
        const toAdd = newSize - current.length;
        for (let i = 0; i < toAdd; i++) {
          current.push({ accessCodeUsed: false });
        }
      } else if (newSize < current.length) {
        // If reducing, ensure we don't remove slots that are occupied
        // Strategy: keep first N slots; but before truncating, check that any slots being dropped are empty
        const dropping = current.slice(newSize);
  const hasOccupied = dropping.some((m: TeamMember) => Boolean(m?.username || m?.role || m?.accessCodeUsed));
        if (hasOccupied) {
          return { error: "Cannot reduce team size below number of occupied member slots" };
        }
        current.length = newSize;
      }

      team.teamMembers = current;
      team.numberOfPlayers = newSize;
    }

    await team.save();
    revalidatePath("/admin");

    return {
      success: true,
      message: "Team updated successfully",
      team: {
        _id: team._id.toString(),
        name: team.name,
        description: team.description,
        leaderUserId: team.leaderUserId,
        members: team.members.length,
        numberOfPlayers: team.numberOfPlayers,
      },
    };
  } catch (error) {
    logger.error('Error updating team:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to update team" };
  }
}

export async function deleteTeam(teamId: string, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return { error: "Team not found" };
    }

    // Check if team has members
    if (team.members && team.members.length > 0) {
      return { error: "Cannot delete team with active members. Please remove all members first." };
    }

    // Capture related resource IDs before deletion
    const playspaceId = team.playspaceId ? team.playspaceId.toString() : undefined;
    const accessCodeId = team.accessCodeId ? team.accessCodeId.toString() : undefined;

    // Delete the team first
    await Team.findByIdAndDelete(teamId);

    // Best-effort cascade cleanup of playspace and access code
    try {
      if (playspaceId) {
        await Playspace.findByIdAndDelete(playspaceId);
      }
    } catch (e) {
      logger.warn('Failed to delete playspace during team deletion', { playspaceId, error: e instanceof Error ? e.message : e });
    }
    try {
      if (accessCodeId) {
        await AccessCode.findByIdAndDelete(accessCodeId);
      }
    } catch (e) {
      logger.warn('Failed to delete access code during team deletion', { accessCodeId, error: e instanceof Error ? e.message : e });
    }
    revalidatePath("/admin");

    return {
      success: true,
      message: "Team and related resources deleted successfully",
    };
  } catch (error) {
    logger.error('Error deleting team:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to delete team" };
  }
}

/**
 * Update team's money (bitcoin balance)
 * @param teamId The ID of the team
 * @param amount The new balance amount
 * @param adminKey Optional admin authentication key
 * @returns Success status or error message
 */
export async function updateTeamMoney(teamId: string, amount: number, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    if (typeof amount !== 'number' || amount < 0) {
      return { error: "Amount must be a positive number" };
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return { error: "Team not found" };
    }

    const previousBalance = team.wallet.bitcoinBalance;
    team.wallet.bitcoinBalance = amount;
    await team.save();

    revalidatePath("/admin");

    return {
      success: true,
      message: "Team money updated successfully",
      data: {
        teamId,
        teamName: team.name,
        previousBalance,
        newBalance: amount,
        change: amount - previousBalance,
      },
    };
  } catch (error) {
    logger.error('Error updating team money:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to update team money" };
  }
}

/**
 * Get team's current money and time information
 * @param teamId The ID of the team
 * @param adminKey Optional admin authentication key
 * @returns Team financial and time data
 */
export async function getTeamFinancialData(teamId: string, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    const team = await Team.findById(teamId).select('name wallet timer autoOfflineTimer');
    if (!team) {
      return { error: "Team not found" };
    }

    // Calculate remaining time for auto-offline timer
    let remainingTime = 0;
    let timeExpired = false;
    
    if (team.autoOfflineTimer?.isActive && team.autoOfflineTimer?.endTime) {
      const endTime = new Date(team.autoOfflineTimer.endTime).getTime();
      const now = Date.now();
      remainingTime = Math.max(0, endTime - now);
      timeExpired = remainingTime <= 0;
    }

    return {
      success: true,
      data: {
        teamId: team._id.toString(),
        teamName: team.name,
        bitcoinBalance: team.wallet?.bitcoinBalance || 0,
        timer: {
          isActive: team.timer?.isActive || false,
          startTime: team.timer?.startTime,
          elapsedTime: team.timer?.elapsedTime || 0,
          totalPausedTime: team.timer?.totalPausedTime || 0,
        },
        autoOfflineTimer: {
          isActive: team.autoOfflineTimer?.isActive || false,
          startTime: team.autoOfflineTimer?.startTime,
          endTime: team.autoOfflineTimer?.endTime,
          remainingTime,
          timeExpired,
        },
      },
    };
  } catch (error) {
    logger.error('Error fetching team financial data:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to fetch team data" };
  }
}

/**
 * Set team's available time (auto-offline timer)
 * @param teamId The ID of the team
 * @param totalMinutes Total minutes of available time to set
 * @param adminKey Optional admin authentication key
 * @returns Success status or error message
 */
export async function updateTeamTime(teamId: string, totalMinutes: number, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    if (typeof totalMinutes !== 'number' || totalMinutes < 0) {
      return { error: "Total minutes must be a positive number" };
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return { error: "Team not found" };
    }

    const totalMs = totalMinutes * 60 * 1000;
    const now = new Date();

    // Set new timer with specified total time starting from now
    team.autoOfflineTimer = {
      isActive: true,
      startTime: now,
      endTime: new Date(now.getTime() + totalMs),
    };

    await team.save();
    revalidatePath("/admin");

    const remainingTime = team.autoOfflineTimer.endTime.getTime() - Date.now();

    return {
      success: true,
      message: `Set team's available time to ${totalMinutes} minutes`,
      data: {
        teamId,
        teamName: team.name,
        totalMinutes,
        newEndTime: team.autoOfflineTimer.endTime,
        remainingTime: Math.max(0, remainingTime),
        isActive: team.autoOfflineTimer.isActive,
      },
    };
  } catch (error) {
    logger.error('Error updating team time:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to update team time" };
  }
}

/**
 * Reset team's timer (stop auto-offline timer)
 * @param teamId The ID of the team
 * @param adminKey Optional admin authentication key
 * @returns Success status or error message
 */
export async function resetTeamTimer(teamId: string, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    const team = await Team.findById(teamId);
    if (!team) {
      return { error: "Team not found" };
    }

    // Stop the auto-offline timer
    team.autoOfflineTimer = {
      isActive: false,
      stoppedAt: new Date(),
    };

    await team.save();
    revalidatePath("/admin");

    return {
      success: true,
      message: "Team timer reset successfully",
      data: {
        teamId,
        teamName: team.name,
        timerReset: true,
      },
    };
  } catch (error) {
    logger.error('Error resetting team timer:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to reset team timer" };
  }
}
