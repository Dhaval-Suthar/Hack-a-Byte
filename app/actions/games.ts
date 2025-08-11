"use server";

import connectDB from "@/db/connectDb";
import LeaderboardEntry from "@/models/LeaderboardEntry";
import DeviceUser from "@/models/DeviceUser";
import { revalidatePath } from "next/cache";
import { Difficulty, LeaderboardEntryLite, ScoreSubmission } from "@/lib/games/types";
import type { Types } from "mongoose";

export async function submitScore(payload: ScoreSubmission) {
  try {
    await connectDB();

    let username = payload.username;
    if (!username) {
      const deviceUser = await DeviceUser.findOne({ deviceId: payload.deviceId });
      username = deviceUser?.username || "Anonymous Player";
    }

    const entry = new LeaderboardEntry({
      deviceId: payload.deviceId,
      deviceType: payload.deviceType,
      username,
      game: payload.gameTitle || payload.gameId,
      score: payload.score,
      difficulty: payload.difficulty,
      timeRemaining: payload.timeRemaining ?? 0,
      completedEvents: payload.completedEvents ?? 0,
      date: new Date(),
    });

    await entry.save();
    revalidatePath("/");

    return { success: true, id: String(entry._id) };
  } catch (error) {
    console.error("submitScore error", error);
    return { success: false, error: "Failed to submit score" };
  }
}

export async function getLeaderboard(
  game: string,
  opts?: { limit?: number; difficulty?: Difficulty }
): Promise<{ success: boolean; entries: LeaderboardEntryLite[]; error?: string }> {
  try {
    await connectDB();
    const q: { game: string; difficulty?: Difficulty } = { game };
    if (opts?.difficulty) q.difficulty = opts.difficulty;

    type Row = {
      _id: Types.ObjectId | string;
      username: string;
      score: number;
      difficulty: Difficulty;
      timeRemaining: number;
      completedEvents: number;
      date: Date | string;
    };

    const docs = (await LeaderboardEntry.find(q)
      .sort({ score: -1 })
      .limit(opts?.limit ?? 10)
      .select("username score difficulty timeRemaining completedEvents date")
      .lean()) as unknown as Row[];

    const entries: LeaderboardEntryLite[] = docs.map((d: Row): LeaderboardEntryLite => ({
      _id: String(d._id),
      username: d.username,
      score: d.score,
      difficulty: d.difficulty,
      timeRemaining: d.timeRemaining,
      completedEvents: d.completedEvents,
      date: new Date(d.date).toISOString(),
    }));

    return { success: true, entries };
  } catch (error) {
    console.error("getLeaderboard error", error);
    return { success: false, entries: [], error: "Failed to load leaderboard" };
  }
}
