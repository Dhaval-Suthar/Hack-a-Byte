import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  username: string;
  email: string;
  password: string; // Hashed password
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    socialLinks?: {
      github?: string;
      linkedin?: string;
      twitter?: string;
    };
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      gameUpdates: boolean;
      teamMessages: boolean;
    };
    language: string;
  };
  stats: {
    totalGamesPlayed: number;
    totalWins: number;
    totalLosses: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    totalPlayTime: number; // in minutes
    achievements: string[];
    lastActive: Date;
  };
  security: {
    failedLoginAttempts: number;
    lockoutUntil?: Date;
    lastLogin?: Date;
    lastLoginIP?: string;
    trustedDevices: string[];
  };
}

const UserSchema = new Schema<User>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    profile: {
      firstName: String,
      lastName: String,
      avatar: String,
      bio: String,
      socialLinks: {
        github: String,
        linkedin: String,
        twitter: String
      }
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        gameUpdates: { type: Boolean, default: true },
        teamMessages: { type: Boolean, default: true }
      },
      language: { type: String, default: 'en' }
    },
    stats: {
      totalGamesPlayed: { type: Number, default: 0 },
      totalWins: { type: Number, default: 0 },
      totalLosses: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      bestScore: { type: Number, default: 0 },
      totalPlayTime: { type: Number, default: 0 },
      achievements: [{ type: String }],
      lastActive: { type: Date, default: Date.now }
    },
    security: {
      failedLoginAttempts: { type: Number, default: 0 },
      lockoutUntil: Date,
      lastLogin: Date,
      lastLoginIP: String,
      trustedDevices: [{ type: String }]
    }
  },
  { timestamps: true }
);

// Indexes for performance
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ 'stats.totalScore': -1 });
UserSchema.index({ 'stats.lastActive': -1 });

// Instance methods
UserSchema.methods.isLocked = function() {
  return this.security.lockoutUntil && this.security.lockoutUntil > new Date();
};

UserSchema.methods.recordLogin = function(ipAddress: string) {
  this.security.lastLogin = new Date();
  this.security.lastLoginIP = ipAddress;
  this.security.failedLoginAttempts = 0;
  this.stats.lastActive = new Date();
  return this.save();
};

UserSchema.methods.recordFailedLogin = function() {
  this.security.failedLoginAttempts += 1;
  if (this.security.failedLoginAttempts >= 5) {
    this.security.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  return this.save();
};

UserSchema.methods.updateStats = function(gameResult: { score: number; won: boolean; playTime: number }) {
  this.stats.totalGamesPlayed += 1;
  this.stats.totalScore += gameResult.score;
  this.stats.averageScore = this.stats.totalScore / this.stats.totalGamesPlayed;
  this.stats.bestScore = Math.max(this.stats.bestScore, gameResult.score);
  this.stats.totalPlayTime += gameResult.playTime;

  if (gameResult.won) {
    this.stats.totalWins += 1;
  } else {
    this.stats.totalLosses += 1;
  }

  this.stats.lastActive = new Date();
  return this.save();
};

export default mongoose.models.User || mongoose.model<User>("User", UserSchema);
