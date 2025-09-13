"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/db/connectDb";
import LeaderboardEntry from "@/models/LeaderboardEntry";
import DeviceUser from "@/models/DeviceUser";
import Device from "@/models/Device";
import { logger } from '@/lib/logger';

// Type for serialized leaderboard entry (used in return types)
export interface SerializedLeaderboardEntry {
  _id: string;
  username: string;
  score: number;
  difficulty: string;
  timeRemaining: number;
  completedEvents: number;
  date: string;
}

/**
 * Add a new score to the leaderboard
 */
export async function addLeaderboardEntry(
  deviceId: string,
  gameData: {
    score: number;
    difficulty: string;
    timeRemaining: number;
    completedEvents: number;
    game: string;
  }
) {
  try {
    await connectDB();
    
    // Get the user info from DeviceUser
    const deviceUser = await DeviceUser.findOne({ deviceId });
    if (!deviceUser) {
      return { success: false, error: "Device user not found" };
    }

    // Get the device type from Device model
    const device = await Device.findOne({ deviceMacAddress: deviceId });
    const deviceType = device?.deviceType || "hackbook-w95";

    const username = deviceUser.username || "Anonymous Player";
    
    // Create and save the leaderboard entry
    const entry = new LeaderboardEntry({
      deviceId,
      deviceType,
      username,
      game: gameData.game,
      score: gameData.score,
      difficulty: gameData.difficulty,
      timeRemaining: gameData.timeRemaining,
      completedEvents: gameData.completedEvents,
      date: new Date(),
    });
    
    await entry.save();
    
    // Revalidate any paths that might display the leaderboard
    revalidatePath(`/hackbook-w95`);
    
    return { 
      success: true, 
      entry: {
        _id: entry._id.toString(),
        username,
        score: entry.score,
        difficulty: entry.difficulty,
        date: entry.date.toISOString(),
        timeRemaining: entry.timeRemaining,
        completedEvents: entry.completedEvents,
      }
    };
  } catch (error) {
    logger.error('Error adding leaderboard entry:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to add leaderboard entry" };
  }
}

/**
 * Get top scores from the leaderboard
 */
export async function getTopLeaderboardEntries(
  game: string,
  limit: number = 10,
  difficulty?: string
) {
  try {
    await connectDB();
    
    // Build query based on parameters
    const query: { game: string; difficulty?: string } = { game };
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // Get top scores for the specified game, sorted by score descending
    const entries = await LeaderboardEntry.find(query)
      .sort({ score: -1 })
      .limit(limit)
      .select('username score difficulty timeRemaining completedEvents date')
      .lean();
    
    // Convert MongoDB objects to plain objects for client components
    const serializedEntries = entries.map(entry => {
      const plainEntry = JSON.parse(JSON.stringify(entry));
      return {
        _id: String(plainEntry._id),
        username: plainEntry.username,
        score: plainEntry.score,
        difficulty: plainEntry.difficulty,
        timeRemaining: plainEntry.timeRemaining,
        completedEvents: plainEntry.completedEvents,
        date: new Date(plainEntry.date).toISOString(),
      };
    });
    
    return { success: true, entries: serializedEntries };
  } catch (error) {
    logger.error('Error getting leaderboard entries:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to get leaderboard entries", entries: [] };
  }
}

/**
 * Get user's personal best scores
 */
export async function getUserBestScores(deviceId: string, game: string) {
  try {
    await connectDB();
    
    // Get user's best scores for each difficulty
    const difficulties = ["easy", "normal", "hard", "nightmare"];
    const results = [];
    
    for (const difficulty of difficulties) {
      const bestScore = await LeaderboardEntry.findOne({ deviceId, game, difficulty })
        .sort({ score: -1 })
        .select('score difficulty timeRemaining completedEvents date')
        .lean();
      
      if (bestScore) {
        // Use JSON parse/stringify to convert MongoDB lean document to plain object
        const plainScore = JSON.parse(JSON.stringify(bestScore));
        results.push({
          _id: String(plainScore._id),
          score: plainScore.score,
          difficulty: plainScore.difficulty,
          timeRemaining: plainScore.timeRemaining,
          completedEvents: plainScore.completedEvents,
          date: new Date(plainScore.date).toISOString(),
        });
      }
    }
    
    return { success: true, scores: results };
  } catch (error) {
    logger.error("Error getting user's best scores", { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to get user scores", scores: [] };
  }
}
