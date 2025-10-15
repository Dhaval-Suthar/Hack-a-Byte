import mongoose, { Schema, Document, Model } from "mongoose";

export interface SMS extends Document {
  recipient: mongoose.Schema.Types.ObjectId; // Team ID
  deviceId?: mongoose.Schema.Types.ObjectId; // Device ID for targeting
  sender: string;
  senderPhone: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  
  // System SMS properties
  type: 'system' | 'user' | 'sample';
  attackerTeamId?: mongoose.Schema.Types.ObjectId; // Track deployer to route replies
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
  
  // SMS specific
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface SMSModel extends Model<SMS> {
  createSystemSMS(data: {
    recipient: mongoose.Types.ObjectId;
    deviceId?: mongoose.Types.ObjectId;
  attackerTeamId?: mongoose.Types.ObjectId;
    sender: string;
    senderPhone: string;
    content: string;
    isScam?: boolean;
    rewardAmount?: number;
    lossAmount?: number;
    templateId?: string;
    probabilityWeight?: number;
    expiresAt?: Date;
  }): Promise<SMS>;
  
  createSampleSMS(data: {
    recipient: mongoose.Types.ObjectId;
    deviceId?: mongoose.Types.ObjectId;
    sender: string;
    senderPhone: string;
    content: string;
    isRead?: boolean;
  }): Promise<SMS>;
  
  getUnreadCount(teamId: mongoose.Types.ObjectId): Promise<number>;
  getByTeam(teamId: mongoose.Types.ObjectId, limit?: number): Promise<SMS[]>;
  getConversationsBySender(teamId: mongoose.Types.ObjectId): Promise<Array<{
    _id: string;
    sender: string;
    senderPhone: string;
    latestMessage: {
      content: string;
      timestamp: Date;
      isRead: boolean;
    };
    unreadCount: number;
  }>>;
}

const SMSSchema = new Schema<SMS>(
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
    senderPhone: { 
      type: String, 
      required: true 
    },
    attackerTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
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
    
    // System SMS properties
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
    },
    
    // SMS specific
    status: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'failed'], 
      default: 'delivered' 
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
SMSSchema.index({ recipient: 1, timestamp: -1 });
SMSSchema.index({ recipient: 1, isRead: 1 });
SMSSchema.index({ type: 1 });
SMSSchema.index({ processed: 1 });
SMSSchema.index({ sender: 1, recipient: 1 }); // For grouping by conversation
SMSSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
SMSSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.status = 'read';
  return this.save();
};

SMSSchema.methods.markAsProcessed = function(outcome: 'gain' | 'loss' | 'neutral') {
  this.processed = true;
  this.processedAt = new Date();
  this.outcome = outcome;
  this.isRead = true;
  this.status = 'read';
  return this.save();
};

// Static methods
SMSSchema.statics.createSystemSMS = function(data: {
  recipient: mongoose.Types.ObjectId;
  deviceId?: mongoose.Types.ObjectId;
  attackerTeamId?: mongoose.Types.ObjectId;
  sender: string;
  senderPhone: string;
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

SMSSchema.statics.createSampleSMS = function(data: {
  recipient: mongoose.Types.ObjectId;
  deviceId?: mongoose.Types.ObjectId;
  sender: string;
  senderPhone: string;
  content: string;
  isRead?: boolean;
}) {
  return this.create({
    ...data,
    type: 'sample',
    isRead: data.isRead || false
  });
};

SMSSchema.statics.getUnreadCount = function(teamId: mongoose.Types.ObjectId) {
  return this.countDocuments({ recipient: teamId, isRead: false });
};

SMSSchema.statics.getByTeam = function(teamId: mongoose.Types.ObjectId, limit = 50) {
  return this.find({ recipient: teamId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

SMSSchema.statics.getConversationsBySender = function(teamId: mongoose.Types.ObjectId) {
  return this.aggregate([
    { $match: { recipient: teamId } },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$sender',
        latestMessage: { $first: '$$ROOT' },
        messages: { $push: '$$ROOT' },
        unreadCount: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        }
      }
    },
    { $sort: { 'latestMessage.timestamp': -1 } }
  ]);
};

export default mongoose.models.SMS || mongoose.model<SMS, SMSModel>("SMS", SMSSchema);
