import mongoose, { Schema, Document } from "mongoose";

// Extended to include legacy test types: deposit, withdrawal, attack
export type TransactionType =
  | 'mining'
  | 'transfer'
  | 'attack_reward'
  | 'defense_penalty'
  | 'bank_heist'
  | 'purchase'
  | 'sale'
  | 'fee'
  | 'bonus'
  | 'refund'
  | 'deposit'
  | 'withdrawal'
  | 'attack';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface WalletTransaction extends Document {
  walletAddress: string;
  teamId: mongoose.Schema.Types.ObjectId;
  gameSessionId?: mongoose.Schema.Types.ObjectId;
  tournamentId?: mongoose.Schema.Types.ObjectId;

  type: TransactionType;
  status: TransactionStatus;

  amount: number; // Positive for credits, negative for debits
  balanceBefore: number;
  balanceAfter: number;

  // Transaction details
  description: string;
  reference: string; // Unique transaction reference

  // Related entities
  fromWallet?: string;
  toWallet?: string;
  attackerId?: mongoose.Schema.Types.ObjectId;
  defenderId?: mongoose.Schema.Types.ObjectId;
  deviceId?: mongoose.Schema.Types.ObjectId;

  // Metadata
  metadata: Record<string, unknown>;
  tags: string[];

  // Processing info
  processedAt?: Date;
  processedBy?: mongoose.Schema.Types.ObjectId;
  failureReason?: string;

  // Audit
  ipAddress?: string;
  userAgent?: string;
}

const WalletTransactionSchema = new Schema<WalletTransaction>(
  {
    walletAddress: {
      type: String,
      required: true,
      index: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true
    },
    gameSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },

    type: {
      type: String,
      enum: [
        'mining',
        'transfer',
        'attack_reward',
        'defense_penalty',
        'bank_heist',
        'purchase',
        'sale',
        'fee',
        'bonus',
        'refund',
        'deposit',
        'withdrawal',
        'attack'
      ],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },

    amount: {
      type: Number,
      required: true
    },
    balanceBefore: {
      type: Number,
      required: true,
      min: 0
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      required: true,
      maxlength: 200
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // Related entities
    fromWallet: String,
    toWallet: String,
    attackerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' },
    defenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' },
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },

    // Metadata
    metadata: { type: Schema.Types.Mixed, default: {} },
    tags: [{ type: String }],

    // Processing
    processedAt: Date,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' },
    failureReason: String,

    // Audit
    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

// Indexes
WalletTransactionSchema.index({ teamId: 1, createdAt: -1 });
WalletTransactionSchema.index({ walletAddress: 1, createdAt: -1 });
WalletTransactionSchema.index({ type: 1 });
WalletTransactionSchema.index({ status: 1 });
WalletTransactionSchema.index({ gameSessionId: 1 });
WalletTransactionSchema.index({ tournamentId: 1 });
WalletTransactionSchema.index({ reference: 1 }, { unique: true });

// Compound indexes for common queries
WalletTransactionSchema.index({ teamId: 1, type: 1, createdAt: -1 });
WalletTransactionSchema.index({ walletAddress: 1, status: 1, createdAt: -1 });

// Instance methods
WalletTransactionSchema.methods.complete = function() {
  this.status = 'completed';
  this.processedAt = new Date();
  return this.save();
};

WalletTransactionSchema.methods.fail = function(reason: string) {
  this.status = 'failed';
  this.failureReason = reason;
  this.processedAt = new Date();
  return this.save();
};

WalletTransactionSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.processedAt = new Date();
  return this.save();
};

// Static methods
WalletTransactionSchema.statics.createTransaction = async function(data: {
  walletAddress: string;
  teamId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  description: string;
  fromWallet?: string;
  toWallet?: string;
  gameSessionId?: mongoose.Types.ObjectId;
  tournamentId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  tags?: string[];
}) {
  // Get current balance
  const Team = mongoose.model('Team');
  const team = await Team.findById(data.teamId);
  if (!team) {
    throw new Error('Team not found');
  }

  const balanceBefore = team.wallet.bitcoinBalance;
  const balanceAfter = balanceBefore + data.amount;

  // Validate sufficient balance for debits
  if (data.amount < 0 && balanceAfter < 0) {
    throw new Error('Insufficient balance');
  }

  // Generate unique reference
  const reference = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const transaction = await this.create({
    ...data,
    reference,
    balanceBefore,
    balanceAfter,
    status: 'completed',
    processedAt: new Date()
  });

  // Update team balance
  team.wallet.bitcoinBalance = balanceAfter;
  await team.save();

  return transaction;
};

WalletTransactionSchema.statics.getBalance = async function(walletAddress: string) {
  const latestTransaction = await this.findOne({ walletAddress })
    .sort({ createdAt: -1 })
    .select('balanceAfter');

  return latestTransaction ? latestTransaction.balanceAfter : 0;
};

WalletTransactionSchema.statics.getTransactionHistory = function(walletAddress: string, options: {
  limit?: number;
  skip?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const query: {
    walletAddress: string;
    type?: TransactionType;
    status?: TransactionStatus;
    createdAt?: { $gte?: Date; $lte?: Date };
  } = { walletAddress };

  if (options.type) query.type = options.type;
  if (options.status) query.status = options.status;
  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) query.createdAt.$gte = options.startDate;
    if (options.endDate) query.createdAt.$lte = options.endDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

WalletTransactionSchema.statics.getTeamBalance = async function(teamId: mongoose.Types.ObjectId) {
  const Team = mongoose.model('Team');
  const team = await Team.findById(teamId);
  return team ? team.wallet.bitcoinBalance : 0;
};

export default mongoose.models.WalletTransaction || mongoose.model<WalletTransaction>("WalletTransaction", WalletTransactionSchema);
