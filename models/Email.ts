import mongoose, { Schema, Document, Model } from "mongoose";

export interface Email extends Document {
  recipient: mongoose.Schema.Types.ObjectId; // Team ID
  deviceId?: mongoose.Schema.Types.ObjectId; // Device ID for targeting
  sender: string;
  senderEmail: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment?: boolean;
  
  // System email properties
  type: 'system' | 'user' | 'sample';
  isScam?: boolean;
  rewardAmount?: number; // BTC reward if legitimate
  lossAmount?: number; // BTC loss if scam
  processed?: boolean;
  processedAt?: Date;
  outcome?: 'gain' | 'loss' | 'neutral';
  
  // Template info
  templateId?: string;
  probabilityWeight?: number;
  
  // Expiry
  expiresAt?: Date;
}

export interface EmailModel extends Model<Email> {
  createSystemEmail(data: {
    recipient: mongoose.Types.ObjectId;
    deviceId?: mongoose.Types.ObjectId;
    sender: string;
    senderEmail: string;
    subject: string;
    content: string;
    isScam?: boolean;
    rewardAmount?: number;
    lossAmount?: number;
    templateId?: string;
    probabilityWeight?: number;
    expiresAt?: Date;
  }): Promise<Email>;
  
  createSampleEmail(data: {
    recipient: mongoose.Types.ObjectId;
    deviceId?: mongoose.Types.ObjectId;
    sender: string;
    senderEmail: string;
    subject: string;
    content: string;
    isRead?: boolean;
  }): Promise<Email>;
  
  getUnreadCount(teamId: mongoose.Types.ObjectId): Promise<number>;
  getByTeam(teamId: mongoose.Types.ObjectId, limit?: number): Promise<Email[]>;
}

const EmailSchema = new Schema<Email>(
  {
    recipient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Team', 
      required: true 
    },
    deviceId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Device' 
    },
    sender: { 
      type: String, 
      required: true 
    },
    senderEmail: { 
      type: String, 
      required: true 
    },
    subject: { 
      type: String, 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    },
    isStarred: { 
      type: Boolean, 
      default: false 
    },
    hasAttachment: { 
      type: Boolean, 
      default: false 
    },
    
    // System email properties
    type: { 
      type: String, 
      enum: ['system', 'user', 'sample'], 
      required: true 
    },
    isScam: { 
      type: Boolean, 
      default: false 
    },
    rewardAmount: { 
      type: Number, 
      default: 0 
    },
    lossAmount: { 
      type: Number, 
      default: 0 
    },
    processed: { 
      type: Boolean, 
      default: false 
    },
    processedAt: { 
      type: Date 
    },
    outcome: { 
      type: String, 
      enum: ['gain', 'loss', 'neutral'] 
    },
    
    // Template info
    templateId: { 
      type: String 
    },
    probabilityWeight: { 
      type: Number 
    },
    
    // Expiry
    expiresAt: { 
      type: Date
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
EmailSchema.index({ recipient: 1, timestamp: -1 });
EmailSchema.index({ recipient: 1, isRead: 1 });
EmailSchema.index({ type: 1 });
EmailSchema.index({ processed: 1 });
EmailSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
EmailSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

EmailSchema.methods.markAsProcessed = function(outcome: 'gain' | 'loss' | 'neutral') {
  this.processed = true;
  this.processedAt = new Date();
  this.outcome = outcome;
  this.isRead = true;
  return this.save();
};

// Static methods
EmailSchema.statics.createSystemEmail = function(data: {
  recipient: mongoose.Types.ObjectId;
  deviceId?: mongoose.Types.ObjectId;
  sender: string;
  senderEmail: string;
  subject: string;
  content: string;
  isScam?: boolean;
  rewardAmount?: number;
  lossAmount?: number;
  templateId?: string;
  probabilityWeight?: number;
  expiresAt?: Date;
}) {
  return this.create({
    ...data,
    type: 'system',
    isScam: data.isScam || false,
    rewardAmount: data.rewardAmount || 0,
    lossAmount: data.lossAmount || 0,
    expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours default
  });
};

EmailSchema.statics.createSampleEmail = function(data: {
  recipient: mongoose.Types.ObjectId;
  deviceId?: mongoose.Types.ObjectId;
  sender: string;
  senderEmail: string;
  subject: string;
  content: string;
  isRead?: boolean;
}) {
  return this.create({
    ...data,
    type: 'sample',
    isRead: data.isRead || false
  });
};

EmailSchema.statics.getUnreadCount = function(teamId: mongoose.Types.ObjectId) {
  return this.countDocuments({ recipient: teamId, isRead: false });
};

EmailSchema.statics.getByTeam = function(teamId: mongoose.Types.ObjectId, limit = 50) {
  return this.find({ recipient: teamId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

export default mongoose.models.Email || mongoose.model<Email, EmailModel>("Email", EmailSchema);
