import mongoose, { Schema, Document } from "mongoose";

export type MessageType = 'text' | 'system' | 'game_event' | 'achievement' | 'attack_alert' | 'defense_alert';

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ChatMessage extends Document {
  // Message content
  content: string;
  type: MessageType;
  priority: MessagePriority;

  // Sender information - simplified to just use senderName
  senderId?: mongoose.Schema.Types.ObjectId; // Made optional
  senderName: string;
  senderRole?: string;

  // Context
  teamId: mongoose.Schema.Types.ObjectId;
  gameSessionId?: mongoose.Schema.Types.ObjectId;
  tournamentId?: mongoose.Schema.Types.ObjectId;

  // Recipients (for private messages)
  recipientIds?: mongoose.Schema.Types.ObjectId[];

  // Message metadata
  isPrivate: boolean;
  isSystemMessage: boolean;
  edited: boolean;
  editedAt?: Date;

  // Reactions
  reactions: Array<{
    emoji: string;
    userId: mongoose.Schema.Types.ObjectId;
    username: string;
    timestamp: Date;
  }>;

  // Attachments/References
  attachments?: Array<{
    type: 'image' | 'file' | 'link';
    url: string;
    filename?: string;
    size?: number;
  }>;

  // Game-specific data
  gameData?: {
    attackType?: string;
    defenseType?: string;
    bitcoinAmount?: number;
    achievementId?: string;
    eventType?: string;
  };

  // Read status
  readBy: Array<{
    userId: mongoose.Schema.Types.ObjectId;
    readAt: Date;
  }>;

  // Moderation
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Schema.Types.ObjectId;

  // Metadata
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
}

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    // Message content
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    type: {
      type: String,
      enum: ['text', 'system', 'game_event', 'achievement', 'attack_alert', 'defense_alert'],
      default: 'text'
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },

    // Sender information
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeviceUser'
      // Made optional - we primarily use senderName for identification
    },
    senderName: {
      type: String,
      required: true
    },
    senderRole: String,

    // Context
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    gameSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },

    // Recipients (for private messages)
    recipientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' }],

    // Message metadata
    isPrivate: { type: Boolean, default: false },
    isSystemMessage: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    editedAt: Date,

    // Reactions
    reactions: [{
      emoji: { type: String, required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser', required: true },
      username: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }],

    // Attachments
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'file', 'link'],
        required: true
      },
      url: { type: String, required: true },
      filename: String,
      size: Number
    }],

    // Game-specific data
    gameData: {
      attackType: String,
      defenseType: String,
      bitcoinAmount: Number,
      achievementId: String,
      eventType: String
    },

    // Read status
    readBy: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser', required: true },
      readAt: { type: Date, default: Date.now }
    }],

    // Moderation
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' },

    // Metadata
    ipAddress: String,
    userAgent: String,
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Indexes
ChatMessageSchema.index({ teamId: 1, createdAt: -1 });
ChatMessageSchema.index({ gameSessionId: 1, createdAt: -1 });
ChatMessageSchema.index({ tournamentId: 1, createdAt: -1 });
ChatMessageSchema.index({ senderId: 1, createdAt: -1 });
ChatMessageSchema.index({ type: 1 });
ChatMessageSchema.index({ priority: 1 });
ChatMessageSchema.index({ isDeleted: 1 });

// Compound indexes
ChatMessageSchema.index({ teamId: 1, isDeleted: 1, createdAt: -1 });
ChatMessageSchema.index({ gameSessionId: 1, type: 1, createdAt: -1 });

// Instance methods
ChatMessageSchema.methods.markAsRead = function(userId: mongoose.Types.ObjectId) {
  const existingRead = this.readBy.find((read: { userId: mongoose.Types.ObjectId }) => read.userId.equals(userId));
  if (!existingRead) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
  }
  return this.save();
};

ChatMessageSchema.methods.addReaction = function(emoji: string, userId: mongoose.Types.ObjectId, username: string) {
  const existingReaction = this.reactions.find(
    (reaction: { emoji: string; userId: mongoose.Types.ObjectId }) => reaction.emoji === emoji && reaction.userId.equals(userId)
  );

  if (!existingReaction) {
    this.reactions.push({
      emoji,
      userId,
      username,
      timestamp: new Date()
    });
  }
  return this.save();
};

ChatMessageSchema.methods.removeReaction = function(emoji: string, userId: mongoose.Types.ObjectId) {
  this.reactions = this.reactions.filter(
    (reaction: { emoji: string; userId: mongoose.Types.ObjectId }) => !(reaction.emoji === emoji && reaction.userId.equals(userId))
  );
  return this.save();
};

ChatMessageSchema.methods.edit = function(newContent: string) {
  this.content = newContent;
  this.edited = true;
  this.editedAt = new Date();
  return this.save();
};

ChatMessageSchema.methods.delete = function(deletedBy?: mongoose.Types.ObjectId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  if (deletedBy) {
    this.deletedBy = deletedBy;
  }
  return this.save();
};

// Static methods
ChatMessageSchema.statics.createSystemMessage = function(data: {
  teamId: mongoose.Types.ObjectId;
  content: string;
  gameSessionId?: mongoose.Types.ObjectId;
  tournamentId?: mongoose.Types.ObjectId;
  priority?: MessagePriority;
  gameData?: Record<string, unknown>;
}) {
  return this.create({
    content: data.content,
    type: 'system',
    priority: data.priority || 'normal',
    senderId: null, // System messages don't have a sender
    senderName: 'System',
    teamId: data.teamId,
    gameSessionId: data.gameSessionId,
    tournamentId: data.tournamentId,
    isSystemMessage: true,
    gameData: data.gameData
  });
};

ChatMessageSchema.statics.createGameEvent = function(data: {
  teamId: mongoose.Types.ObjectId;
  content: string;
  eventType: string;
  gameSessionId?: mongoose.Types.ObjectId;
  priority?: MessagePriority;
  metadata?: Record<string, unknown>;
}) {
  return this.create({
    content: data.content,
    type: 'game_event',
    priority: data.priority || 'high',
    senderId: null,
    senderName: 'Game System',
    teamId: data.teamId,
    gameSessionId: data.gameSessionId,
    isSystemMessage: true,
    gameData: {
      eventType: data.eventType
    },
    metadata: data.metadata || {}
  });
};

ChatMessageSchema.statics.getTeamMessages = function(
  teamId: mongoose.Types.ObjectId,
  options: {
    limit?: number;
    skip?: number;
    includeDeleted?: boolean;
    startDate?: Date;
    endDate?: Date;
    messageTypes?: MessageType[];
  } = {}
) {
  const query: {
    teamId: mongoose.Types.ObjectId;
    isDeleted?: boolean;
    createdAt?: { $gte?: Date; $lte?: Date };
    type?: { $in: MessageType[] };
  } = { teamId };

  if (!options.includeDeleted) {
    query.isDeleted = false;
  }

  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) query.createdAt.$gte = options.startDate;
    if (options.endDate) query.createdAt.$lte = options.endDate;
  }

  if (options.messageTypes && options.messageTypes.length > 0) {
    query.type = { $in: options.messageTypes };
  }

  return this.find(query)
    .populate('senderId', 'username')
    .populate('recipientIds', 'username')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

ChatMessageSchema.statics.getUnreadCount = function(
  teamId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
) {
  return this.countDocuments({
    teamId,
    isDeleted: false,
    'readBy.userId': { $ne: userId }
  });
};

ChatMessageSchema.statics.markTeamMessagesAsRead = function(
  teamId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
) {
  return this.updateMany(
    {
      teamId,
      isDeleted: false,
      'readBy.userId': { $ne: userId }
    },
    {
      $push: {
        readBy: {
          userId,
          readAt: new Date()
        }
      }
    }
  );
};

ChatMessageSchema.statics.getGameSessionMessages = function(
  gameSessionId: mongoose.Types.ObjectId,
  options: {
    limit?: number;
    includeSystem?: boolean;
  } = {}
) {
  const query: {
    gameSessionId: mongoose.Types.ObjectId;
    isDeleted: boolean;
    type?: { $ne: 'system' };
  } = {
    gameSessionId,
    isDeleted: false
  };

  if (!options.includeSystem) {
    query.type = { $ne: 'system' };
  }

  return this.find(query)
    .populate('senderId', 'username')
    .sort({ createdAt: 1 }) // Chronological order for game sessions
    .limit(options.limit || 100);
};

export default mongoose.models.ChatMessage || mongoose.model<ChatMessage>("ChatMessage", ChatMessageSchema);
