import mongoose, { Schema, Document } from "mongoose";

export interface TeamMember {
  username?: string | null;
  role?: string | null;
  accessCodeUsed: boolean;
  accessCodeUsedAt?: Date;
}

export interface TeamTimer {
  isActive: boolean;
  startTime?: Date;
  elapsedTime: number; // ms
  totalPausedTime: number; // ms
}

export interface StockPortfolio {
  symbol: string;
  shares: number;
  avgPrice: number;
}

export interface EventTeam extends Document {
  name: string;
  description: string;
  leaderUserId?: mongoose.Schema.Types.ObjectId | null;
  members: mongoose.Schema.Types.ObjectId[]; // legacy/user links if any
  // Event linkage and resources
  registrationId?: string;
  eventId?: number | string;
  numberOfPlayers: number;
  accessCodeId?: mongoose.Schema.Types.ObjectId;
  playspaceId?: mongoose.Schema.Types.ObjectId;
  deviceId?: mongoose.Schema.Types.ObjectId;
  // Team wallet
  wallet: {
    walletAddress: string;
    privateKey: string;
    publicKey?: string;
    bitcoinBalance: number;
  };
  // Stock portfolio
  stockPortfolio: StockPortfolio[];
  // Purchased malware from App Store
  purchasedMalware: string[];
  // Members joining progress and roles
  teamMembers: TeamMember[];
  // Timer starts when all members join
  timer: TeamTimer;
}

const TeamMemberSchema = new Schema<TeamMember>({
  username: { type: String, default: null },
  role: { type: String, default: null },
  accessCodeUsed: { type: Boolean, default: false },
  accessCodeUsedAt: { type: Date },
});

const StockPortfolioSchema = new Schema<StockPortfolio>({
  symbol: { type: String, required: true },
  shares: { type: Number, required: true },
  avgPrice: { type: Number, required: true },
});

const TeamSchema = new Schema<EventTeam>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    leaderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Event linkage
    registrationId: { type: String },
    eventId: { type: Schema.Types.Mixed },
  numberOfPlayers: { type: Number, required: true, min: 1 },
    accessCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessCode' },
    playspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Playspace' },
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    // Wallet
    wallet: {
      walletAddress: { type: String, required: true },
      privateKey: { type: String, required: true },
      publicKey: { type: String },
      bitcoinBalance: { type: Number, default: 10000 }, // Increased default balance for new price scale
    },
    // Stock portfolio
    stockPortfolio: { type: [StockPortfolioSchema], default: [] },
    // Purchased malware from App Store
    purchasedMalware: { type: [String], default: [] },
    // Members state
    teamMembers: { type: [TeamMemberSchema], default: [] },
    // Timer
    timer: {
      isActive: { type: Boolean, default: false },
      startTime: { type: Date },
      elapsedTime: { type: Number, default: 0 },
      totalPausedTime: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Team || mongoose.model<EventTeam>("Team", TeamSchema);
