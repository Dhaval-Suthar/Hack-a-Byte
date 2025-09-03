import mongoose, { Schema, Document } from "mongoose";

export type AccessCodeType = 'permanent' | 'time-limited' | 'usage-limited';

export interface AccessCode extends Document {
  code: string;               // 6-digit numeric code
  type: AccessCodeType;
  priority: number;           // Priority for code display/selection (1-9)
  description?: string;       // Optional description for the access code
  isActive: boolean;
  usageCount: number;
  maxUsages?: number;          // For usage-limited codes
  expiresAt?: Date;            // For time-limited codes
  assignedPlayspace?: mongoose.Schema.Types.ObjectId; // Single playspace this code grants access to

  // Additional fields for better management
  createdBy?: mongoose.Schema.Types.ObjectId;
  assignedTeam?: mongoose.Schema.Types.ObjectId;
  lastUsedAt?: Date;
  lastUsedBy?: mongoose.Schema.Types.ObjectId;
  usageHistory?: Array<{
    usedAt: Date;
    usedBy: mongoose.Schema.Types.ObjectId;
    ipAddress?: string;
    userAgent?: string;
  }>;
}

const AccessCodeSchema = new Schema<AccessCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v: string) {
          return /^\d{6}$/.test(v); // Must be exactly 6 digits
        },
        message: (props) => `${props.value} is not a valid 6-digit numeric code!`,
      },
    },
    type: {
      type: String,
      required: true,
      enum: ["permanent", "time-limited", "usage-limited"],
      default: "permanent",
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 9,
      default: 5,
    },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    maxUsages: { type: Number }, // For usage-limited codes
    expiresAt: { type: Date }, // For time-limited codes
    assignedPlayspace: { type: mongoose.Schema.Types.ObjectId, ref: "Playspace" },

    // Additional fields for better management
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedTeam: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    lastUsedAt: { type: Date },
    lastUsedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    usageHistory: [{
      usedAt: { type: Date, default: Date.now },
      usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      ipAddress: String,
      userAgent: String
    }]
  },
  { timestamps: true }
);

// Create indexes for better query performance
AccessCodeSchema.index({ code: 1 });
AccessCodeSchema.index({ type: 1 });
AccessCodeSchema.index({ isActive: 1 });
AccessCodeSchema.index({ expiresAt: 1 });
AccessCodeSchema.index({ assignedPlayspace: 1 });
AccessCodeSchema.index({ assignedTeam: 1 });

// Instance methods
AccessCodeSchema.methods.isExpired = function() {
  if (this.type === 'time-limited' && this.expiresAt) {
    return new Date() > this.expiresAt;
  }
  return false;
};

AccessCodeSchema.methods.isUsable = function() {
  return this.isActive && !this.isExpired() &&
         (this.type !== 'usage-limited' || !this.maxUsages || this.usageCount < this.maxUsages);
};

AccessCodeSchema.methods.recordUsage = function(userId: mongoose.Types.ObjectId, ipAddress?: string, userAgent?: string) {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  this.lastUsedBy = userId;

  if (ipAddress || userAgent) {
    this.usageHistory.push({
      usedAt: new Date(),
      usedBy: userId,
      ipAddress,
      userAgent
    });
  }

  return this.save();
};

AccessCodeSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

AccessCodeSchema.methods.extendExpiry = function(newExpiryDate: Date) {
  if (this.type === 'time-limited') {
    this.expiresAt = newExpiryDate;
  }
  return this.save();
};

// Static methods
AccessCodeSchema.statics.generateCode = function() {
  // Generate a random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

AccessCodeSchema.statics.findUsableCodes = function(playspaceId?: mongoose.Types.ObjectId) {
  const query: {
    isActive: boolean;
    assignedPlayspace?: mongoose.Types.ObjectId;
  } = { isActive: true };

  if (playspaceId) {
    query.assignedPlayspace = playspaceId;
  }

  return this.find(query).sort({ priority: -1, createdAt: -1 });
};

AccessCodeSchema.statics.cleanupExpiredCodes = function() {
  return this.updateMany(
    {
      type: 'time-limited',
      expiresAt: { $lt: new Date() },
      isActive: true
    },
    { isActive: false }
  );
};

export default mongoose.models.AccessCode || mongoose.model<AccessCode>("AccessCode", AccessCodeSchema);