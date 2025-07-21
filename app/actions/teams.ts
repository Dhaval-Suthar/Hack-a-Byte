"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDb from "@/db/connectDb";
import Team from "@/models/Team";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

// Helper function to check authentication
async function checkAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { 
      isAuthenticated: false, 
      error: "Not authenticated",
      user: null
    };
  }
  
  return { 
    isAuthenticated: true, 
    error: null,
    user: session.user
  };
}

// Create a new team
export async function createTeam(data: {
  name: string;
  description?: string;
  members?: string[];
  isPublic?: boolean;
}) {
  const { isAuthenticated, error, user } = await checkAuth();
  
  if (!isAuthenticated) {
    return { error };
  }
  
  try {
    await connectDb();
    
    const { name, description = "", members = [], isPublic = true } = data;
    
    // Check if team name exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return { error: "Team name already exists" };
    }
    
    // Add current user as owner if they're not already in members
    const allMembers = members.includes(user!.id) 
      ? members 
      : [...members, user!.id];
    
    // Create team
    const newTeam = await Team.create({
      name,
      description,
      owner: user!.id,
      members: allMembers,
      isPublic,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Update user's teams
    for (const memberId of allMembers) {
      await User.findByIdAndUpdate(
        memberId,
        { $addToSet: { teams: newTeam._id } }
      );
    }
    
    revalidatePath("/community");
    
    return {
      success: true,
      team: {
        id: newTeam._id.toString(),
        name: newTeam.name,
        description: newTeam.description,
        owner: newTeam.owner.toString(),
        members: newTeam.members.map(id => id.toString()),
        isPublic: newTeam.isPublic,
        createdAt: newTeam.createdAt,
        updatedAt: newTeam.updatedAt
      }
    };
  } catch (error) {
    console.error("Error creating team:", error);
    return { error: "Failed to create team" };
  }
}

// Get teams where the current user is a member
export async function getUserTeams() {
  const { isAuthenticated, error, user } = await checkAuth();
  
  if (!isAuthenticated) {
    return { error };
  }
  
  try {
    await connectDb();
    
    const teams = await Team.find({ 
      members: user!.id 
    }).sort({ updatedAt: -1 });
    
    return { 
      teams: teams.map(team => ({
        id: team._id.toString(),
        name: team.name,
        description: team.description,
        owner: team.owner.toString(),
        members: team.members.map(id => id.toString()),
        isPublic: team.isPublic,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }))
    };
  } catch (error) {
    console.error("Error getting user teams:", error);
    return { error: "Failed to get teams" };
  }
}

// Get public teams
export async function getPublicTeams(limit = 10) {
  try {
    await connectDb();
    
    const teams = await Team.find({ 
      isPublic: true 
    })
    .sort({ createdAt: -1 })
    .limit(limit);
    
    return { 
      teams: teams.map(team => ({
        id: team._id.toString(),
        name: team.name,
        description: team.description,
        owner: team.owner.toString(),
        members: team.members.map(id => id.toString()),
        isPublic: team.isPublic,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }))
    };
  } catch (error) {
    console.error("Error getting public teams:", error);
    return { error: "Failed to get public teams" };
  }
}

// Get a specific team
export async function getTeam(teamId: string) {
  try {
    await connectDb();
    
    const team = await Team.findById(teamId).populate('members', 'username email');
    
    if (!team) {
      return { error: "Team not found" };
    }
    
    return { 
      team: {
        id: team._id.toString(),
        name: team.name,
        description: team.description,
        owner: team.owner.toString(),
        members: team.members,
        isPublic: team.isPublic,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }
    };
  } catch (error) {
    console.error("Error getting team:", error);
    return { error: "Failed to get team" };
  }
}

// Join a team
export async function joinTeam(teamId: string) {
  const { isAuthenticated, error, user } = await checkAuth();
  
  if (!isAuthenticated) {
    return { error };
  }
  
  try {
    await connectDb();
    
    // Check if team exists and is public
    const team = await Team.findById(teamId);
    
    if (!team) {
      return { error: "Team not found" };
    }
    
    if (!team.isPublic) {
      return { error: "This team requires an invitation to join" };
    }
    
    // Check if already a member
    if (team.members.includes(user!.id)) {
      return { error: "You're already a member of this team" };
    }
    
    // Add user to team
    team.members.push(user!.id);
    team.updatedAt = new Date();
    await team.save();
    
    // Add team to user's teams
    await User.findByIdAndUpdate(
      user!.id,
      { $addToSet: { teams: team._id } }
    );
    
    revalidatePath("/community");
    
    return { success: true };
  } catch (error) {
    console.error("Error joining team:", error);
    return { error: "Failed to join team" };
  }
}
