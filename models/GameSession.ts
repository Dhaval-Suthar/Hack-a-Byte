import mongoose, { Schema, Document } from 'mongoose';

export interface IGameSession extends Document {
    tournamentId: string;
    team1Id: string;
    team2Id: string;
    team1Name: string;
    team2Name: string;
    status: 'waiting' | 'active' | 'completed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    team1Score: number;
    team2Score: number;
    duration: number; // in seconds
    winner?: string; // team ID or "draw"
    deviceId?: string; // for device-based sessions
}

const GameSessionSchema: Schema = new Schema(
    {
        tournamentId: { type: String, required: true },
        team1Id: { type: String, required: true },
        team2Id: { type: String, required: true },
        team1Name: { type: String, required: true },
        team2Name: { type: String, required: true },
        status: {
            type: String,
            enum: ['waiting', 'active', 'completed', 'cancelled'],
            default: 'waiting'
        },
        startTime: { type: Date, default: Date.now },
        endTime: { type: Date },
        team1Score: { type: Number, default: 0 },
        team2Score: { type: Number, default: 0 },
        duration: { type: Number, default: 0 }, // in seconds
        winner: { type: String },
        deviceId: { type: String },

        // Additional fields for better tracking
        gameMode: {
            type: String,
            enum: ['quick_match', 'standard_match', 'extended_match', 'tournament'],
            default: 'standard_match'
        },
        maxDuration: { type: Number, default: 1500 }, // 25 minutes in seconds
        pauseTime: { type: Number, default: 0 }, // Total paused time in seconds
        lastActivity: { type: Date, default: Date.now },
        disconnectCount: { type: Number, default: 0 },

        // Game events log
        events: [{
            timestamp: { type: Date, default: Date.now },
            type: {
                type: String,
                enum: ['attack', 'defense', 'mining', 'bank_heist', 'pause', 'resume', 'disconnect', 'reconnect']
            },
            description: String,
            data: Schema.Types.Mixed
        }],

        // Final statistics
        statistics: {
            totalAttacks: { type: Number, default: 0 },
            successfulAttacks: { type: Number, default: 0 },
            totalDefenses: { type: Number, default: 0 },
            successfulDefenses: { type: Number, default: 0 },
            bitcoinMined: { type: Number, default: 0 },
            bankHeists: { type: Number, default: 0 },
            disconnects: { type: Number, default: 0 }
        }
    },
    { timestamps: true }
);

// Index for efficient queries
GameSessionSchema.index({ status: 1, startTime: -1 });
GameSessionSchema.index({ tournamentId: 1 });
GameSessionSchema.index({ team1Id: 1 });
GameSessionSchema.index({ team2Id: 1 });
GameSessionSchema.index({ gameMode: 1 });
GameSessionSchema.index({ lastActivity: -1 });

// Instance methods
GameSessionSchema.methods.start = function() {
  this.status = 'active';
  this.startTime = new Date();
  this.lastActivity = new Date();
  return this.save();
};

GameSessionSchema.methods.end = function(winner?: string) {
  this.status = 'completed';
  this.endTime = new Date();
  this.duration = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000) - this.pauseTime;
  if (winner) {
    this.winner = winner;
  }
  return this.save();
};

GameSessionSchema.methods.pause = function() {
  if (this.status === 'active') {
    this.status = 'waiting';
    this.addEvent('pause', 'Game paused');
  }
  return this.save();
};

GameSessionSchema.methods.resume = function() {
  if (this.status === 'waiting') {
    this.status = 'active';
    this.lastActivity = new Date();
    this.addEvent('resume', 'Game resumed');
  }
  return this.save();
};

GameSessionSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.endTime = new Date();
  return this.save();
};

GameSessionSchema.methods.updateScore = function(team1Score: number, team2Score: number) {
  this.team1Score = team1Score;
  this.team2Score = team2Score;
  this.lastActivity = new Date();
  return this.save();
};

GameSessionSchema.methods.addEvent = function(type: string, description: string, data?: Record<string, unknown>) {
  this.events.push({
    timestamp: new Date(),
    type,
    description,
    data
  });
  this.lastActivity = new Date();
  return this.save();
};

GameSessionSchema.methods.recordDisconnect = function() {
  this.disconnectCount += 1;
  this.statistics.disconnects += 1;
  this.addEvent('disconnect', 'Player disconnected');
  return this.save();
};

GameSessionSchema.methods.recordReconnect = function() {
  this.addEvent('reconnect', 'Player reconnected');
  return this.save();
};

GameSessionSchema.methods.isExpired = function() {
  if (this.status !== 'active') return false;
  const elapsed = (Date.now() - this.startTime.getTime()) / 1000;
  return elapsed > this.maxDuration;
};

GameSessionSchema.methods.getRemainingTime = function() {
  if (this.status !== 'active') return 0;
  const elapsed = (Date.now() - this.startTime.getTime()) / 1000;
  return Math.max(0, this.maxDuration - elapsed + this.pauseTime);
};

// Static methods
GameSessionSchema.statics.getActiveSessions = function() {
  return this.find({ status: 'active' });
};

GameSessionSchema.statics.getTournamentSessions = function(tournamentId: string) {
  return this.find({ tournamentId }).sort({ startTime: -1 });
};

GameSessionSchema.statics.getTeamSessions = function(teamId: string) {
  return this.find({
    $or: [{ team1Id: teamId }, { team2Id: teamId }]
  }).sort({ startTime: -1 });
};

GameSessionSchema.statics.cleanupExpiredSessions = function() {
  const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  return this.updateMany(
    {
      status: 'active',
      lastActivity: { $lt: expiredTime }
    },
    {
      status: 'cancelled',
      endTime: new Date()
    }
  );
};

export default mongoose.models.GameSession || mongoose.model<IGameSession>('GameSession', GameSessionSchema);
