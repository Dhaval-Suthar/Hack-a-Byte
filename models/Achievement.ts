import mongoose, { Schema, Document } from "mongoose";

export type AchievementCategory =
  | 'combat'
  | 'defense'
  | 'mining'
  | 'social'
  | 'exploration'
  | 'collection'
  | 'special'
  | 'tournament';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement extends Document {
  code: string; // Unique identifier
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;

  // Requirements
  requirements: {
    type: 'stat' | 'action' | 'milestone' | 'special';
    target: string; // e.g., 'totalWins', 'attacksBlocked', 'bitcoinMined'
    value: number;
    comparison: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  };

  // Rewards
  rewards: {
    experience?: number;
    bitcoin?: number;
    title?: string;
    badge?: string;
    unlockables?: string[]; // Items, skins, etc.
  };

  // Visual elements
  icon: string;
  color: string;
  animation?: string;

  // Metadata
  isActive: boolean;
  isHidden: boolean; // Secret achievements
  prerequisites: string[]; // Achievement codes that must be unlocked first

  // Progress tracking
  maxProgress?: number; // For progress-based achievements
  isStackable: boolean; // Can be earned multiple times

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievement extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  achievementId: mongoose.Schema.Types.ObjectId;

  // Progress
  progress: number;
  isCompleted: boolean;
  completedAt?: Date;

  // For stackable achievements
  count: number; // How many times earned
  lastEarnedAt?: Date;

  // Metadata
  earnedThrough: string; // How it was earned (game session, tournament, etc.)
  metadata: Record<string, unknown>;
}

const AchievementSchema = new Schema<Achievement>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      maxlength: 300
    },
    category: {
      type: String,
      enum: [
        'combat',
        'defense',
        'mining',
        'social',
        'exploration',
        'collection',
        'special',
        'tournament'
      ],
      required: true
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      required: true
    },

    // Requirements
    requirements: {
      type: {
        type: String,
        enum: ['stat', 'action', 'milestone', 'special'],
        required: true
      },
      target: { type: String, required: true },
      value: { type: Number, required: true },
      comparison: {
        type: String,
        enum: ['gte', 'lte', 'eq', 'gt', 'lt'],
        required: true
      }
    },

    // Rewards
    rewards: {
      experience: Number,
      bitcoin: Number,
      title: String,
      badge: String,
      unlockables: [{ type: String }]
    },

    // Visual elements
    icon: { type: String, required: true },
    color: { type: String, required: true },
    animation: String,

    // Metadata
    isActive: { type: Boolean, default: true },
    isHidden: { type: Boolean, default: false },
    prerequisites: [{ type: String }], // Achievement codes

    // Progress tracking
    maxProgress: Number,
    isStackable: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Indexes
AchievementSchema.index({ category: 1 });
AchievementSchema.index({ rarity: 1 });
AchievementSchema.index({ isActive: 1 });
AchievementSchema.index({ isHidden: 1 });

const UserAchievementSchema = new Schema<UserAchievement>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeviceUser',
      required: true
    },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true
    },

    // Progress
    progress: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    completedAt: Date,

    // For stackable achievements
    count: { type: Number, default: 0 },
    lastEarnedAt: Date,

    // Metadata
    earnedThrough: String,
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Indexes
UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
UserAchievementSchema.index({ userId: 1, isCompleted: 1 });
UserAchievementSchema.index({ userId: 1, completedAt: -1 });
UserAchievementSchema.index({ achievementId: 1 });

// Instance methods for Achievement
AchievementSchema.methods.checkPrerequisites = async function(userId: mongoose.Types.ObjectId) {
  if (this.prerequisites.length === 0) return true;

  const UserAchievement = mongoose.model('UserAchievement');
  const completedPrerequisites = await UserAchievement.countDocuments({
    userId,
    achievementId: { $in: this.prerequisites },
    isCompleted: true
  });

  return completedPrerequisites === this.prerequisites.length;
};

AchievementSchema.methods.evaluateRequirement = function(userStats: Record<string, number>) {
  const { target, value, comparison } = this.requirements;
  const currentValue = userStats[target] || 0;

  switch (comparison) {
    case 'gte': return currentValue >= value;
    case 'lte': return currentValue <= value;
    case 'eq': return currentValue === value;
    case 'gt': return currentValue > value;
    case 'lt': return currentValue < value;
    default: return false;
  }
};

// Instance methods for UserAchievement
UserAchievementSchema.methods.updateProgress = function(newProgress: number) {
  this.progress = Math.min(newProgress, this.achievement?.maxProgress || newProgress);

  if (this.progress >= (this.achievement?.requirements?.value || 0) && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
    this.count += 1;
    this.lastEarnedAt = new Date();
  }

  return this.save();
};

UserAchievementSchema.methods.incrementCount = function() {
  this.count += 1;
  this.lastEarnedAt = new Date();
  return this.save();
};

// Static methods
AchievementSchema.statics.getActiveAchievements = function() {
  return this.find({ isActive: true });
};

AchievementSchema.statics.getByCategory = function(category: AchievementCategory) {
  return this.find({ category, isActive: true });
};

UserAchievementSchema.statics.getUserAchievements = function(userId: mongoose.Types.ObjectId) {
  return this.find({ userId })
    .populate('achievementId')
    .sort({ completedAt: -1 });
};

UserAchievementSchema.statics.getCompletedAchievements = function(userId: mongoose.Types.ObjectId) {
  return this.find({ userId, isCompleted: true })
    .populate('achievementId')
    .sort({ completedAt: -1 });
};

UserAchievementSchema.statics.checkAndUnlockAchievements = async function(
  userId: mongoose.Types.ObjectId,
  userStats: Record<string, number>
) {
  const Achievement = mongoose.model('Achievement');
  const UserAchievement = mongoose.model('UserAchievement');

  const achievements = await Achievement.find({ isActive: true });
  const unlockedAchievements = [];

  for (const achievement of achievements) {
    // Check if already unlocked (for non-stackable)
    if (!achievement.isStackable) {
      const existing = await UserAchievement.findOne({
        userId,
        achievementId: achievement._id,
        isCompleted: true
      });
      if (existing) continue;
    }

    // Check prerequisites
    const prerequisitesMet = await achievement.checkPrerequisites(userId);
    if (!prerequisitesMet) continue;

    // Evaluate requirements
    const requirementsMet = achievement.evaluateRequirement(userStats);
    if (!requirementsMet) continue;

    // Create or update user achievement
    let userAchievement = await UserAchievement.findOne({
      userId,
      achievementId: achievement._id
    });

    if (!userAchievement) {
      userAchievement = await UserAchievement.create({
        userId,
        achievementId: achievement._id,
        progress: achievement.requirements.value,
        isCompleted: true,
        completedAt: new Date(),
        count: 1,
        lastEarnedAt: new Date()
      });
    } else if (achievement.isStackable) {
      await userAchievement.incrementCount();
    }

    unlockedAchievements.push(achievement);
  }

  return unlockedAchievements;
};

// Pre-save middleware to populate virtuals
UserAchievementSchema.pre('find', function() {
  this.populate('achievementId');
});

UserAchievementSchema.pre('findOne', function() {
  this.populate('achievementId');
});

// Virtual for achievement details
UserAchievementSchema.virtual('achievement').get(function() {
  return this.populated('achievementId') || this.achievementId;
});

export const AchievementModel = mongoose.models.Achievement || mongoose.model<Achievement>("Achievement", AchievementSchema);
export const UserAchievementModel = mongoose.models.UserAchievement || mongoose.model<UserAchievement>("UserAchievement", UserAchievementSchema);

export default AchievementModel;
