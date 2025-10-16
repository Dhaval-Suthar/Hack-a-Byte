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

export interface AutoOfflineTimer {
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  completedAt?: Date;
  stoppedAt?: Date;
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
  // Auto-offline timer (30 minutes after first member joins)
  autoOfflineTimer: AutoOfflineTimer;
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
    leaderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser', default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' }],
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
      bitcoinBalance: { type: Number, default: 100 }, // Initial balance - 100 BTC
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
    // Auto-offline timer
    autoOfflineTimer: {
      isActive: { type: Boolean, default: false },
      startTime: { type: Date },
      endTime: { type: Date },
      completedAt: { type: Date },
      stoppedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Instance methods
TeamSchema.methods.addMember = function(username: string, role?: string) {
  // Find first available slot
  const availableSlot = this.teamMembers.find((member: TeamMember) => !member.username);
  if (availableSlot) {
    availableSlot.username = username;
    if (role) availableSlot.role = role;
    availableSlot.accessCodeUsed = true;
    availableSlot.accessCodeUsedAt = new Date();
  }
  return this.save();
};

TeamSchema.methods.removeMember = function(username: string) {
  const memberIndex = this.teamMembers.findIndex((member: TeamMember) => member.username === username);
  if (memberIndex > -1) {
    this.teamMembers[memberIndex].username = null;
    this.teamMembers[memberIndex].role = null;
    this.teamMembers[memberIndex].accessCodeUsed = false;
    this.teamMembers[memberIndex].accessCodeUsedAt = undefined;
  }
  return this.save();
};

TeamSchema.methods.updateWalletBalance = function(amount: number) {
  this.wallet.bitcoinBalance += amount;
  // Ensure balance doesn't go below 0
  if (this.wallet.bitcoinBalance < 0) {
    this.wallet.bitcoinBalance = 0;
  }
  return this.save();
};

TeamSchema.methods.startTimer = function() {
  this.timer.isActive = true;
  this.timer.startTime = new Date();
  this.timer.elapsedTime = 0;
  this.timer.totalPausedTime = 0;
  return this.save();
};

TeamSchema.methods.pauseTimer = function() {
  if (this.timer.isActive && this.timer.startTime) {
    const now = new Date();
    const elapsed = now.getTime() - this.timer.startTime.getTime();
    this.timer.elapsedTime += elapsed;
    this.timer.isActive = false;
  }
  return this.save();
};

TeamSchema.methods.resumeTimer = function() {
  if (!this.timer.isActive && this.timer.startTime) {
    this.timer.startTime = new Date();
    this.timer.isActive = true;
  }
  return this.save();
};

TeamSchema.methods.getTotalTime = function() {
  let total = this.timer.elapsedTime;
  if (this.timer.isActive && this.timer.startTime) {
    const now = new Date();
    total += now.getTime() - this.timer.startTime.getTime();
  }
  return total;
};

TeamSchema.methods.addStock = function(symbol: string, shares: number, price: number) {
  const existingStock = this.stockPortfolio.find((stock: StockPortfolio) => stock.symbol === symbol);
  if (existingStock) {
    const totalShares = existingStock.shares + shares;
    const totalCost = (existingStock.shares * existingStock.avgPrice) + (shares * price);
    existingStock.avgPrice = totalCost / totalShares;
    existingStock.shares = totalShares;
  } else {
    this.stockPortfolio.push({ symbol, shares, avgPrice: price });
  }
  return this.save();
};

TeamSchema.methods.removeStock = function(symbol: string, shares: number) {
  const stockIndex = this.stockPortfolio.findIndex((stock: StockPortfolio) => stock.symbol === symbol);
  if (stockIndex > -1) {
    if (this.stockPortfolio[stockIndex].shares <= shares) {
      this.stockPortfolio.splice(stockIndex, 1);
    } else {
      this.stockPortfolio[stockIndex].shares -= shares;
    }
  }
  return this.save();
};

TeamSchema.methods.getStockValue = function(symbol: string, currentPrice: number) {
  const stock = this.stockPortfolio.find((s: StockPortfolio) => s.symbol === symbol);
  return stock ? stock.shares * currentPrice : 0;
};

TeamSchema.methods.getPortfolioValue = function(currentPrices: Record<string, number>) {
  return this.stockPortfolio.reduce((total: number, stock: StockPortfolio) => {
    const currentPrice = currentPrices[stock.symbol] || stock.avgPrice;
    return total + (stock.shares * currentPrice);
  }, 0);
};

TeamSchema.methods.addMalware = function(malwareId: string) {
  if (!this.purchasedMalware.includes(malwareId)) {
    this.purchasedMalware.push(malwareId);
  }
  return this.save();
};

TeamSchema.methods.hasMalware = function(malwareId: string) {
  return this.purchasedMalware.includes(malwareId);
};

// Static methods
TeamSchema.statics.findByAccessCode = function(accessCodeId: mongoose.Types.ObjectId) {
  return this.findOne({ accessCodeId });
};

TeamSchema.statics.findByWalletAddress = function(walletAddress: string) {
  return this.findOne({ 'wallet.walletAddress': walletAddress });
};

TeamSchema.statics.getLeaderboard = function(options: {
  limit?: number;
  sortBy?: 'bitcoinBalance' | 'totalTime';
} = {}) {
  const sortField = options.sortBy === 'totalTime' ? 'timer.elapsedTime' : 'wallet.bitcoinBalance';
  const sortOrder = options.sortBy === 'totalTime' ? 1 : -1;

  return this.find({ 'timer.elapsedTime': { $gt: 0 } })
    .sort({ [sortField]: sortOrder })
    .limit(options.limit || 10);
};

TeamSchema.statics.getActiveTeams = function() {
  return this.find({ 'timer.isActive': true });
};

// Performance indexes for Team queries
TeamSchema.index({ accessCodeId: 1 }); // findByAccessCode queries
TeamSchema.index({ 'wallet.walletAddress': 1 }); // findByWalletAddress queries
TeamSchema.index({ 'wallet.bitcoinBalance': -1 }); // Leaderboard by bitcoin balance
TeamSchema.index({ 'timer.elapsedTime': 1 }); // Leaderboard by time
TeamSchema.index({ 'timer.isActive': 1 }); // Active teams queries
TeamSchema.index({ createdAt: -1 }); // Recent teams
TeamSchema.index({ numberOfPlayers: 1 }); // Team size queries
TeamSchema.index({ playingDevice: 1 }); // Device type queries

export default mongoose.models.Team || mongoose.model<EventTeam>("Team", TeamSchema);
