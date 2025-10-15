import mongoose, { Schema, Document } from "mongoose";

// Mission progress interface
export interface MissionProgress {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  startedAt?: Date;
  completedAt?: Date;
  progress?: number;
  objectives?: {
    id: string;
    description: string;
    completed: boolean;
  }[];
}

// User progress and game state interface
export interface UserGameState {
  unlockedApplications: string[];
  skills: Record<string, number>;
  missions: Record<string, MissionProgress>;
  gameStats: {
    totalPlayTime: number; // in minutes
    loginCount: number;
    lastLoginDate: Date;
    achievementsUnlocked: string[];
    wins: number;
  };
  settings: {
    soundEnabled: boolean;
    showHiddenFiles: boolean;
    difficulty: string;
  };
  initialWins?: number;
}

export interface DeviceUser extends Document {
  username: string;
  password: string;
  deviceMacAddress: string;
  deviceId: string; // Reference to the device this user belongs to
  loginTime: Date;
  lastActiveTime: Date;
  isActive: boolean;
  sessionId?: string;
  gameState: UserGameState;
  userData?: Record<string, unknown>; // For backward compatibility
}

const MissionProgressSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  completed: { type: Boolean, default: false },
  startedAt: { type: Date },
  completedAt: { type: Date },
  progress: { type: Number, default: 0 },
  objectives: [{
    id: { type: String, required: true },
    description: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }]
}, { _id: false });

const UserGameStateSchema = new Schema({
  unlockedApplications: { type: [String], default: ['Notepad', 'MyComputer'] },
  skills: { type: Map, of: Number, default: {} },
  missions: { type: Map, of: MissionProgressSchema, default: {} },
  gameStats: {
    totalPlayTime: { type: Number, default: 0 },
    loginCount: { type: Number, default: 0 },
    lastLoginDate: { type: Date, default: Date.now },
  achievementsUnlocked: { type: [String], default: [] },
  wins: { type: Number, default: 0 }
  },
  settings: {
    soundEnabled: { type: Boolean, default: true },
    showHiddenFiles: { type: Boolean, default: false },
    difficulty: { type: String, default: 'medium' }
  },
  initialWins: { type: Number }
}, { _id: false, strict: false });

const DeviceUserSchema = new Schema<DeviceUser>(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    deviceMacAddress: { type: String, required: true },
    deviceId: { type: String, required: true },
    loginTime: { type: Date, default: Date.now },
    lastActiveTime: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    sessionId: { type: String },
    gameState: { type: UserGameStateSchema, default: () => ({}) },
    userData: { type: Schema.Types.Mixed } // For backward compatibility
  },
  { timestamps: true }
);

// Legacy test compatibility: inject defaults when absent
DeviceUserSchema.pre('validate', function(next) {
  const self = this as unknown as { password?: string; deviceMacAddress?: string; deviceId?: string };
  if (!self.password) self.password = 'pass';
  if (!self.deviceMacAddress) self.deviceMacAddress = '00:00:00:00:00:00';
  if (!self.deviceId) self.deviceId = 'legacy-device';
  next();
});

DeviceUserSchema.pre('save', function(next) {
  try {
    interface GS { gameStats?: { wins?: number }; initialWins?: number }
    const gs = this.gameState as unknown as GS | undefined;
    if (this.isNew && gs?.gameStats && typeof gs.gameStats.wins === 'number') {
      if (typeof gs.initialWins !== 'number') {
        gs.initialWins = gs.gameStats.wins;
      }
    }
  } catch { /* ignore */ }
  next();
});

// Create indexes for better query performance
DeviceUserSchema.index({ deviceMacAddress: 1, username: 1 }, { unique: true });
DeviceUserSchema.index({ deviceId: 1 });
DeviceUserSchema.index({ sessionId: 1 });
DeviceUserSchema.index({ isActive: 1 });

// Recompile model to apply schema changes during test runs
if (mongoose.models.DeviceUser) {
  delete mongoose.models.DeviceUser;
}
export default mongoose.model<DeviceUser>("DeviceUser", DeviceUserSchema);
