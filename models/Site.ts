import mongoose, { Schema, Document } from 'mongoose';

export interface ISite extends Document {
  _id: string;
  url: string;
  title: string;
  description: string;
  category: 'news' | 'social' | 'ecommerce' | 'search' | 'entertainment' | 'crypto' | 'reward' | 'other' | 'fake';
  content: string;
  isRewardSite: boolean;
  rewardAmount?: number;
  rewardClaimed?: boolean;
  rewardClaimedBy?: string;
  rewardClaimedAt?: Date;
  rewardCooldownMinutes?: number; // Cooldown period in minutes before reward can be claimed again
  isFakeSite?: boolean; // True if this is a malware-deployed fake site
  fakeTargetAmount?: number; // Amount to steal from visitors
  deployedBy?: string; // Team ID that deployed this fake site
  deployedAt?: Date;
  favicon?: string;
  backgroundColor?: string;
  textColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const siteSchema = new Schema<ISite>({
  url: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['news', 'social', 'ecommerce', 'search', 'entertainment', 'crypto', 'reward', 'other', 'fake'],
    default: 'other'
  },
  content: { type: String, required: true },
  isRewardSite: { type: Boolean, default: false },
  rewardAmount: { type: Number },
  rewardClaimed: { type: Boolean, default: false },
  rewardClaimedBy: { type: String },
  rewardClaimedAt: { type: Date },
  rewardCooldownMinutes: { type: Number, default: 3 }, // Default 3 minutes cooldown
  isFakeSite: { type: Boolean, default: false },
  fakeTargetAmount: { type: Number },
  deployedBy: { type: String },
  deployedAt: { type: Date },
  favicon: { type: String },
  backgroundColor: { type: String, default: '#ffffff' },
  textColor: { type: String, default: '#000000' },
}, {
  timestamps: true
});

export default mongoose.models.Site || mongoose.model<ISite>('Site', siteSchema);
