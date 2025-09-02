"use server";

import connectDb from "@/db/connectDb";
import Team from "@/models/Team";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { createAccessCodeAndPlayspace } from "@/lib/access-code-generation";

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
    console.error("Error fetching teams:", error);
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
        console.warn("Failed to create playspace and device for team:", playspaceResult.error);
        // Don't fail the team creation, just log the warning
      }
    } catch (error) {
      console.error("Error creating playspace and device for team:", error);
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
    console.error("Error creating team:", error);
    return { error: "Failed to create team" };
  }
}

export async function updateTeam(teamId: string, updates: { name?: string; description?: string; leaderUserId?: string }, adminKey?: string) {
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
      },
    };
  } catch (error) {
    console.error("Error updating team:", error);
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

    await Team.findByIdAndDelete(teamId);
    revalidatePath("/admin");

    return {
      success: true,
      message: "Team deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting team:", error);
    return { error: "Failed to delete team" };
  }
}
