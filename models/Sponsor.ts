import mongoose, { Schema, Document } from "mongoose";

export interface ISponsor extends Document {
  name: string;
  tier: 'quantum-guardians' | 'cyber-sentinels' | 'binary-titans' | 'firewall-champions';
  logo: string;
  description: string;
  benefits?: string[];
  websiteUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SponsorSchema = new Schema<ISponsor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: ['quantum-guardians', 'cyber-sentinels', 'binary-titans', 'firewall-champions'],
      required: true,
    },
    logo: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    benefits: [{
      type: String,
      trim: true,
    }],
    websiteUrl: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
SponsorSchema.index({ tier: 1, isActive: 1 });
SponsorSchema.index({ createdAt: -1 });

export default mongoose.models.Sponsor || mongoose.model<ISponsor>("Sponsor", SponsorSchema);
