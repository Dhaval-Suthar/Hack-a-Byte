import mongoose, { Schema, Document } from "mongoose";

export type NotificationType =
  | 'game_invite'
  | 'game_start'
  | 'game_end'
  | 'team_join'
  | 'team_leave'
  | 'attack_alert'
  | 'defense_alert'
  | 'bank_device_available'
  | 'achievement_unlocked'
  | 'tournament_update'
  | 'system_alert'
  | 'payment_success'
  | 'payment_failed';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification extends Document {
  recipient: mongoose.Schema.Types.ObjectId; // User ID
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;

  // Related entities
  relatedEntities: {
    teamId?: mongoose.Schema.Types.ObjectId;
    gameId?: mongoose.Schema.Types.ObjectId;
    tournamentId?: mongoose.Schema.Types.ObjectId;
    deviceId?: mongoose.Schema.Types.ObjectId;
    attackerId?: mongoose.Schema.Types.ObjectId;
  };

  // Metadata
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date;
  actionRequired: boolean;
  actionUrl?: string;

  // Additional data
  metadata: Record<string, unknown>;

  // Delivery status
  delivered: boolean;
  deliveredAt?: Date;
  deliveryMethod: 'in_app' | 'email' | 'push' | 'sms';

  // Sender info
  sender?: mongoose.Schema.Types.ObjectId;
  senderName?: string;
}

const NotificationSchema = new Schema<Notification>(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeviceUser',
      required: true
    },
  type: {
      type: String,
      enum: [
        'game_invite',
        'game_start',
        'game_end',
        'team_join',
        'team_leave',
        'attack_alert',
        'defense_alert',
        'bank_device_available',
        'achievement_unlocked',
        'tournament_update',
    'system_alert',
    'system_message',
        'payment_success',
        'payment_failed'
      ],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'normal'],
      default: 'medium'
    },

    // Related entities
    relatedEntities: {
      teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' },
      tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
      deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
      attackerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' }
    },

    // Status
    isRead: { type: Boolean, default: false },
    readAt: Date,
    expiresAt: Date,
    actionRequired: { type: Boolean, default: false },
    actionUrl: String,

    // Additional data
    metadata: { type: Schema.Types.Mixed, default: {} },

    // Delivery
    delivered: { type: Boolean, default: false },
    deliveredAt: Date,
    deliveryMethod: {
      type: String,
      enum: ['in_app', 'email', 'push', 'sms'],
      default: 'in_app'
    },

    // Sender
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' },
    senderName: String
  },
  { timestamps: true }
);

// Indexes
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NotificationSchema.index({ 'relatedEntities.teamId': 1 });
NotificationSchema.index({ 'relatedEntities.gameId': 1 });

// Instance methods
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsDelivered = function() {
  this.delivered = true;
  this.deliveredAt = new Date();
  return this.save();
};

NotificationSchema.methods.extendExpiry = function(days: number) {
  this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

// Static methods
NotificationSchema.statics.createGameAlert = function(data: {
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  teamId?: mongoose.Types.ObjectId;
  gameId?: mongoose.Types.ObjectId;
  priority?: NotificationPriority;
}) {
  return this.create({
    ...data,
    priority: data.priority || 'high',
    actionRequired: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    relatedEntities: {
      teamId: data.teamId,
      gameId: data.gameId
    }
  });
};

NotificationSchema.statics.createSystemAlert = function(data: {
  recipients: mongoose.Types.ObjectId[];
  title: string;
  message: string;
  priority?: NotificationPriority;
  expiresAt?: Date;
}) {
  const notifications = data.recipients.map(recipient => ({
    recipient,
    type: 'system_alert' as NotificationType,
    title: data.title,
    message: data.message,
    priority: data.priority || 'medium',
    expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }));

  return this.insertMany(notifications);
};

NotificationSchema.statics.getUnreadCount = function(userId: mongoose.Types.ObjectId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

NotificationSchema.statics.markAllAsRead = function(userId: mongoose.Types.ObjectId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

export default mongoose.models.Notification || mongoose.model<Notification>("Notification", NotificationSchema);
