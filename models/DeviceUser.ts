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
  };
  settings: {
    soundEnabled: boolean;
    showHiddenFiles: boolean;
    difficulty: string;
  };
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
    achievementsUnlocked: { type: [String], default: [] }
  },
  settings: {
    soundEnabled: { type: Boolean, default: true },
    showHiddenFiles: { type: Boolean, default: false },
    difficulty: { type: String, default: 'medium' }
  }
}, { _id: false });

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

// Create indexes for better query performance
DeviceUserSchema.index({ deviceMacAddress: 1, username: 1 }, { unique: true });
DeviceUserSchema.index({ deviceId: 1 });
DeviceUserSchema.index({ sessionId: 1 });
DeviceUserSchema.index({ isActive: 1 });

export default mongoose.models.DeviceUser || mongoose.model<DeviceUser>("DeviceUser", DeviceUserSchema);
