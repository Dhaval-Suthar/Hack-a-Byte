"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDb from "@/db/connectDb";
import PVPMatch from "@/models/PVPMatch";
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

// Create a new PVP match
export async function createPVPMatch(data: {
  type: string;
  participants: string[];
  teams?: Record<string, string[]>;
  playspaceId: string;
}) {
  const { isAuthenticated, error, user } = await checkAuth();
  
  if (!isAuthenticated) {
    return { error };
  }
  
  try {
    await connectDb();
    
    const { type, participants, teams, playspaceId } = data;
    
    // Validate match data
    if (!type || !participants || !playspaceId) {
      return { error: "Invalid match data" };
    }
    
    // Create new match
    const newMatch = await PVPMatch.create({
      type,
      startTime: new Date(),
      status: "in-progress",
      participants,
      teams,
      scores: {
        attackers: 0,
        defenders: 0
      },
      playspaceId,
      spectators: []
    });
    
    return { 
      success: true,
      matchId: newMatch._id.toString()
    };
  } catch (error) {
    console.error("Error creating PVP match:", error);
    return { error: "Failed to create match" };
  }
}

// Get a specific match
export async function getPVPMatch(matchId: string) {
  const { isAuthenticated, error } = await checkAuth();
  
  if (!isAuthenticated) {
    return { error };
  }
  
  try {
    await connectDb();
    
    const match = await PVPMatch.findById(matchId);
    
    if (!match) {
      return { error: "Match not found" };
    }
    
    return { match };
  } catch (error) {
    console.error("Error getting PVP match:", error);
    return { error: "Failed to get match" };
  }
}

// Save game state
export async function saveGameState(data: {
  userId: string;
  gameType: string;
  state: any;
}) {
  const { isAuthenticated, error, user } = await checkAuth();
  
  if (!isAuthenticated) {
    return { error };
  }
  
  try {
    await connectDb();
    
    const { userId, gameType, state } = data;
    
    // Ensure user can only save their own game state or is an admin
    if (user?.id !== userId && !user?.isAdmin) {
      return { error: "Unauthorized" };
    }
    
    // Find the user
    const dbUser = await User.findById(userId);
    
    if (!dbUser) {
      return { error: "User not found" };
    }
    
    // Update the game state
    if (!dbUser.gameState) {
      dbUser.gameState = {};
    }
    
    dbUser.gameState[gameType] = state;
    await dbUser.save();
    
    revalidatePath(`/pvp/${gameType}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error saving game state:", error);
    return { error: "Failed to save game state" };
  }
}

// Load game state
export async function loadGameState(userId: string, gameType: string) {
  const { isAuthenticated, error, user } = await checkAuth();
  
  if (!isAuthenticated) {
    return { error };
  }
  
  // Ensure user can only load their own game state or is an admin
  if (user?.id !== userId && !user?.isAdmin) {
    return { error: "Unauthorized" };
  }
  
  try {
    await connectDb();
    
    // Find the user
    const dbUser = await User.findById(userId);
    
    if (!dbUser) {
      return { error: "User not found" };
    }
    
    // Get the game state
    const state = dbUser.gameState?.[gameType] || null;
    
    return { state };
  } catch (error) {
    console.error("Error loading game state:", error);
    return { error: "Failed to load game state" };
  }
}
