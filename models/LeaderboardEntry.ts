import mongoose, { Schema, Document } from "mongoose";

export interface LeaderboardEntryDocument extends Document {
  deviceId: string;
  deviceType: string;
  username: string;
  game: string;
  score: number;
  difficulty: string;
  timeRemaining: number;
  completedEvents: number;
  date: Date;
}

const LeaderboardEntrySchema = new Schema<LeaderboardEntryDocument>(
  {
    deviceId: { type: String, required: true },
    deviceType: { type: String, required: true },
    username: { type: String, required: true },
    game: { type: String, required: true },
    score: { type: Number, required: true },
    difficulty: { type: String, required: true },
    timeRemaining: { type: Number, required: true },
    completedEvents: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Enhanced indexing for better query performance
LeaderboardEntrySchema.index({ game: 1, score: -1 }); // Main leaderboard queries
LeaderboardEntrySchema.index({ game: 1, difficulty: 1, score: -1 }); // Difficulty-filtered leaderboards  
LeaderboardEntrySchema.index({ deviceId: 1, game: 1, date: -1 }); // User's game history
LeaderboardEntrySchema.index({ username: 1, score: -1 }); // User-specific leaderboards
LeaderboardEntrySchema.index({ date: -1 }); // Recent entries
LeaderboardEntrySchema.index({ deviceType: 1, game: 1, score: -1 }); // Device-specific leaderboards

export default mongoose.models.LeaderboardEntry ||
  mongoose.model<LeaderboardEntryDocument>("LeaderboardEntry", LeaderboardEntrySchema);
