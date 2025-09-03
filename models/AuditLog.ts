import mongoose, { Schema, Document } from "mongoose";

export type AuditEventType =
  | 'user_login'
  | 'user_logout'
  | 'user_registration'
  | 'password_change'
  | 'profile_update'
  | 'access_code_used'
  | 'team_created'
  | 'team_joined'
  | 'team_left'
  | 'game_started'
  | 'game_ended'
  | 'attack_attempted'
  | 'attack_successful'
  | 'defense_activated'
  | 'wallet_transaction'
  | 'achievement_unlocked'
  | 'tournament_joined'
  | 'admin_action'
  | 'system_error'
  | 'security_alert'
  | 'data_access'
  | 'permission_change';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLog extends Document {
  // Event details
  eventType: AuditEventType;
  severity: AuditSeverity;
  description: string;

    // User context
    userId?: mongoose.Schema.Types.ObjectId;
    username?: string;
    userRole?: string;  // Session context
  sessionId?: string;
  ipAddress: string;
  userAgent: string;

  // Location context
  location?: {
    country?: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Resource context
  resourceType?: string; // 'user', 'team', 'device', 'game', 'tournament', etc.
  resourceId?: mongoose.Schema.Types.ObjectId;
  action: string; // 'create', 'read', 'update', 'delete', 'execute'

  // Game context
  teamId?: mongoose.Schema.Types.ObjectId;
  gameSessionId?: mongoose.Schema.Types.ObjectId;
  tournamentId?: mongoose.Schema.Types.ObjectId;
  deviceId?: mongoose.Schema.Types.ObjectId;

  // Change tracking
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changes?: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;

  // Additional metadata
  metadata: Record<string, unknown>;
  tags: string[];

  // Processing
  processed: boolean;
  processedAt?: Date;
  processedBy?: mongoose.Schema.Types.ObjectId;

  // Compliance
  retentionPeriod?: number; // Days to retain this log
  requiresReview: boolean;
  reviewed: boolean;
  reviewedBy?: mongoose.Schema.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
}

const AuditLogSchema = new Schema<AuditLog>(
  {
    // Event details
    eventType: {
      type: String,
      enum: [
        'user_login',
        'user_logout',
        'user_registration',
        'password_change',
        'profile_update',
        'access_code_used',
        'team_created',
        'team_joined',
        'team_left',
        'game_started',
        'game_ended',
        'attack_attempted',
        'attack_successful',
        'defense_activated',
        'wallet_transaction',
        'achievement_unlocked',
        'tournament_joined',
        'admin_action',
        'system_error',
        'security_alert',
        'data_access',
        'permission_change'
      ],
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 500
    },

    // User context
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' },
    username: String,
    userRole: String,

    // Session context
    sessionId: String,
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },

    // Location context
    location: {
      country: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },

    // Resource context
    resourceType: String,
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    action: {
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'execute'],
      required: true
    },

    // Game context
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    gameSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },

    // Change tracking
    oldValues: { type: Schema.Types.Mixed },
    newValues: { type: Schema.Types.Mixed },
    changes: [{
      field: { type: String, required: true },
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed
    }],

    // Additional metadata
    metadata: { type: Schema.Types.Mixed, default: {} },
    tags: [{ type: String }],

    // Processing
    processed: { type: Boolean, default: false },
    processedAt: Date,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' },

    // Compliance
    retentionPeriod: { type: Number, default: 365 }, // 1 year default
    requiresReview: { type: Boolean, default: false },
    reviewed: { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' },
    reviewedAt: Date,
    reviewNotes: String
  },
  { timestamps: true }
);

// Indexes
AuditLogSchema.index({ eventType: 1 });
AuditLogSchema.index({ severity: 1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ teamId: 1 });
AuditLogSchema.index({ gameSessionId: 1 });
AuditLogSchema.index({ tournamentId: 1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ ipAddress: 1 });
AuditLogSchema.index({ requiresReview: 1 });
AuditLogSchema.index({ reviewed: 1 });

// Compound indexes
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ teamId: 1, eventType: 1, createdAt: -1 });
AuditLogSchema.index({ gameSessionId: 1, createdAt: -1 });

// TTL index for automatic deletion
AuditLogSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 365 * 24 * 60 * 60, // 1 year
    partialFilterExpression: { retentionPeriod: { $lte: 365 } }
  }
);

// Instance methods
AuditLogSchema.methods.markProcessed = function(processedBy?: mongoose.Types.ObjectId) {
  this.processed = true;
  this.processedAt = new Date();
  if (processedBy) {
    this.processedBy = processedBy;
  }
  return this.save();
};

AuditLogSchema.methods.markReviewed = function(reviewedBy: mongoose.Types.ObjectId, notes?: string) {
  this.reviewed = true;
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  if (notes) {
    this.reviewNotes = notes;
  }
  return this.save();
};

AuditLogSchema.methods.addChange = function(field: string, oldValue: unknown, newValue: unknown) {
  if (!this.changes) {
    this.changes = [];
  }
  this.changes.push({ field, oldValue, newValue });
  return this.save();
};

// Static methods
AuditLogSchema.statics.logEvent = async function(data: {
  eventType: AuditEventType;
  severity: AuditSeverity;
  description: string;
  userId?: mongoose.Types.ObjectId;
  username?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  requiresReview?: boolean;
}) {
  const logData = {
    ...data,
    requiresReview: data.requiresReview || data.severity === 'critical' || data.severity === 'high'
  };

  return this.create(logData);
};

AuditLogSchema.statics.logUserAction = async function(data: {
  userId: mongoose.Types.ObjectId;
  username: string;
  action: string;
  resourceType?: string;
  resourceId?: mongoose.Types.ObjectId;
  description: string;
  ipAddress: string;
  userAgent: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  // Determine event type and severity based on action
  let eventType: AuditEventType = 'data_access';
  let severity: AuditSeverity = 'low';

  switch (data.action) {
    case 'create':
      eventType = 'user_registration';
      break;
    case 'update':
      eventType = 'profile_update';
      severity = 'low';
      break;
    case 'delete':
      eventType = 'admin_action';
      severity = 'medium';
      break;
    case 'execute':
      eventType = 'admin_action';
      severity = 'medium';
      break;
  }

  // Calculate changes if old and new values provided
  let changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];
  if (data.oldValues && data.newValues) {
    changes = Object.keys(data.newValues).map(field => ({
      field,
      oldValue: data.oldValues![field],
      newValue: data.newValues![field]
    }));
  }

  return this.create({
    eventType,
    severity,
    description: data.description,
    userId: data.userId,
    username: data.username,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    action: data.action,
    oldValues: data.oldValues,
    newValues: data.newValues,
    changes,
    metadata: data.metadata || {},
    requiresReview: severity === 'high' as AuditSeverity || severity === 'critical' as AuditSeverity
  });
};

AuditLogSchema.statics.getSecurityEvents = function(options: {
  startDate?: Date;
  endDate?: Date;
  severity?: AuditSeverity[];
  eventTypes?: AuditEventType[];
  ipAddress?: string;
  limit?: number;
} = {}) {
  const query: {
    createdAt?: { $gte?: Date; $lte?: Date };
    severity?: { $in: AuditSeverity[] };
    eventType?: { $in: AuditEventType[] };
    ipAddress?: string;
  } = {};

  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) query.createdAt.$gte = options.startDate;
    if (options.endDate) query.createdAt.$lte = options.endDate;
  }

  if (options.severity && options.severity.length > 0) {
    query.severity = { $in: options.severity };
  }

  if (options.eventTypes && options.eventTypes.length > 0) {
    query.eventType = { $in: options.eventTypes };
  }

  if (options.ipAddress) {
    query.ipAddress = options.ipAddress;
  }

  return this.find(query)
    .populate('userId', 'username email')
    .populate('reviewedBy', 'username')
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

AuditLogSchema.statics.getUnreviewedEvents = function(limit = 50) {
  return this.find({
    requiresReview: true,
    reviewed: false
  })
  .populate('userId', 'username email')
  .sort({ createdAt: -1 })
  .limit(limit);
};

AuditLogSchema.statics.getUserActivity = function(
  userId: mongoose.Types.ObjectId,
  options: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
) {
  const query: {
    userId: mongoose.Types.ObjectId;
    createdAt?: { $gte?: Date; $lte?: Date };
  } = { userId };

  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) query.createdAt.$gte = options.startDate;
    if (options.endDate) query.createdAt.$lte = options.endDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

export default mongoose.models.AuditLog || mongoose.model<AuditLog>("AuditLog", AuditLogSchema);
