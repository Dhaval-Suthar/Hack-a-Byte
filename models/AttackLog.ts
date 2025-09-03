import mongoose, { Schema, Document } from "mongoose";

export type AttackType =
  | 'malware_injection'
  | 'ransomware'
  | 'ddos'
  | 'phishing'
  | 'sql_injection'
  | 'xss'
  | 'brute_force'
  | 'man_in_the_middle'
  | 'zero_day_exploit'
  | 'social_engineering';

export type AttackStatus = 'attempted' | 'successful' | 'blocked' | 'failed' | 'detected';

export type DefenseType =
  | 'firewall'
  | 'antivirus'
  | 'intrusion_detection'
  | 'encryption'
  | 'backup'
  | 'patching'
  | 'access_control'
  | 'monitoring'
  | 'honeypot'
  | 'air_gapping';

export interface AttackLog extends Document {
  // Attack details
  attackType: AttackType;
  status: AttackStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Involved parties
  attackerTeamId: mongoose.Schema.Types.ObjectId;
  defenderTeamId: mongoose.Schema.Types.ObjectId;
  attackerUserId: mongoose.Schema.Types.ObjectId;
  defenderUserId?: mongoose.Schema.Types.ObjectId;

  // Target information
  targetDeviceId: mongoose.Schema.Types.ObjectId;
  targetType: 'device' | 'wallet' | 'network' | 'data';

  // Game context
  gameSessionId: mongoose.Schema.Types.ObjectId;
  tournamentId?: mongoose.Schema.Types.ObjectId;

  // Attack specifics
  attackVector: string;
  payload?: string;
  entryPoint: string;
  toolsUsed: string[];

  // Defense response
  defenseActions: {
    type: DefenseType;
    timestamp: Date;
    success: boolean;
    description: string;
  }[];

  // Impact assessment
  impact: {
    dataStolen?: boolean;
    systemCompromised?: boolean;
    downtime?: number; // in minutes
    financialLoss?: number;
    reputationDamage?: boolean;
  };

  // Resolution
  resolved: boolean;
  resolvedAt?: Date;
  resolutionMethod?: string;

  // Metadata
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Audit trail
  detectionTime?: Date;
  responseTime?: Date; // Time to respond
  containmentTime?: Date; // Time to contain

  // Additional context
  notes?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

const AttackLogSchema = new Schema<AttackLog>(
  {
    // Attack details
    attackType: {
      type: String,
      enum: [
        'malware_injection',
        'ransomware',
        'ddos',
        'phishing',
        'sql_injection',
        'xss',
        'brute_force',
        'man_in_the_middle',
        'zero_day_exploit',
        'social_engineering'
      ],
      required: true
    },
    status: {
      type: String,
      enum: ['attempted', 'successful', 'blocked', 'failed', 'detected'],
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },

    // Involved parties
    attackerTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    defenderTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    attackerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeviceUser',
      required: true
    },
    defenderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' },

    // Target information
    targetDeviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true
    },
    targetType: {
      type: String,
      enum: ['device', 'wallet', 'network', 'data'],
      required: true
    },

    // Game context
    gameSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameSession',
      required: true
    },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },

    // Attack specifics
    attackVector: { type: String, required: true },
    payload: String,
    entryPoint: { type: String, required: true },
    toolsUsed: [{ type: String }],

    // Defense response
    defenseActions: [{
      type: {
        type: String,
        enum: [
          'firewall',
          'antivirus',
          'intrusion_detection',
          'encryption',
          'backup',
          'patching',
          'access_control',
          'monitoring',
          'honeypot',
          'air_gapping'
        ],
        required: true
      },
      timestamp: { type: Date, default: Date.now },
      success: { type: Boolean, required: true },
      description: { type: String, required: true }
    }],

    // Impact assessment
    impact: {
      dataStolen: Boolean,
      systemCompromised: Boolean,
      downtime: Number, // in minutes
      financialLoss: Number,
      reputationDamage: Boolean
    },

    // Resolution
    resolved: { type: Boolean, default: false },
    resolvedAt: Date,
    resolutionMethod: String,

    // Metadata
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    location: {
      country: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },

    // Audit trail
    detectionTime: Date,
    responseTime: Date,
    containmentTime: Date,

    // Additional context
    notes: String,
    tags: [{ type: String }],
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Indexes
AttackLogSchema.index({ attackerTeamId: 1, createdAt: -1 });
AttackLogSchema.index({ defenderTeamId: 1, createdAt: -1 });
AttackLogSchema.index({ gameSessionId: 1 });
AttackLogSchema.index({ tournamentId: 1 });
AttackLogSchema.index({ attackType: 1 });
AttackLogSchema.index({ status: 1 });
AttackLogSchema.index({ severity: 1 });
AttackLogSchema.index({ targetDeviceId: 1 });

// Compound indexes
AttackLogSchema.index({ attackerTeamId: 1, defenderTeamId: 1, createdAt: -1 });
AttackLogSchema.index({ gameSessionId: 1, status: 1 });

// Instance methods
AttackLogSchema.methods.resolve = function(method: string) {
  this.resolved = true;
  this.resolvedAt = new Date();
  this.resolutionMethod = method;
  return this.save();
};

AttackLogSchema.methods.addDefenseAction = function(action: {
  type: DefenseType;
  success: boolean;
  description: string;
}) {
  this.defenseActions.push({
    ...action,
    timestamp: new Date()
  });
  return this.save();
};

AttackLogSchema.methods.calculateResponseTime = function() {
  if (this.detectionTime && this.responseTime) {
    return this.responseTime.getTime() - this.detectionTime.getTime();
  }
  return null;
};

AttackLogSchema.methods.calculateContainmentTime = function() {
  if (this.detectionTime && this.containmentTime) {
    return this.containmentTime.getTime() - this.detectionTime.getTime();
  }
  return null;
};

// Static methods
AttackLogSchema.statics.getAttackStats = function(teamId: mongoose.Types.ObjectId, options: {
  startDate?: Date;
  endDate?: Date;
  attackType?: AttackType;
} = {}) {
  const matchConditions: {
    $or: Array<{ attackerTeamId: mongoose.Types.ObjectId } | { defenderTeamId: mongoose.Types.ObjectId }>;
    createdAt?: { $gte?: Date; $lte?: Date };
    attackType?: AttackType;
  } = {
    $or: [
      { attackerTeamId: teamId },
      { defenderTeamId: teamId }
    ]
  };

  if (options.startDate || options.endDate) {
    matchConditions.createdAt = {};
    if (options.startDate) matchConditions.createdAt.$gte = options.startDate;
    if (options.endDate) matchConditions.createdAt.$lte = options.endDate;
  }

  if (options.attackType) {
    matchConditions.attackType = options.attackType;
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          attackType: '$attackType',
          status: '$status',
          isAttacker: { $eq: ['$attackerTeamId', teamId] }
        },
        count: { $sum: 1 },
        avgSeverity: { $avg: { $switch: {
          branches: [
            { case: { $eq: ['$severity', 'low'] }, then: 1 },
            { case: { $eq: ['$severity', 'medium'] }, then: 2 },
            { case: { $eq: ['$severity', 'high'] }, then: 3 },
            { case: { $eq: ['$severity', 'critical'] }, then: 4 }
          ],
          default: 1
        }}}
      }
    }
  ]);
};

AttackLogSchema.statics.getRecentAttacks = function(teamId: mongoose.Types.ObjectId, limit = 10) {
  return this.find({
    $or: [
      { attackerTeamId: teamId },
      { defenderTeamId: teamId }
    ]
  })
  .populate('attackerUserId', 'username')
  .populate('defenderUserId', 'username')
  .populate('targetDeviceId', 'deviceType')
  .sort({ createdAt: -1 })
  .limit(limit);
};

export default mongoose.models.AttackLog || mongoose.model<AttackLog>("AttackLog", AttackLogSchema);
