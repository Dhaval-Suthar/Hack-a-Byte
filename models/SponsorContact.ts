import mongoose, { Schema, Document } from "mongoose";

export interface ISponsorContact extends Document {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  message: string;
  submittedAt: Date;
  status: 'new' | 'contacted' | 'in-progress' | 'closed';
  notes?: string;
}

const SponsorContactSchema = new Schema<ISponsorContact>(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'in-progress', 'closed'],
      default: 'new',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
SponsorContactSchema.index({ email: 1 });
SponsorContactSchema.index({ submittedAt: -1 });
SponsorContactSchema.index({ status: 1 });

const SponsorContact = mongoose.models.SponsorContact || mongoose.model<ISponsorContact>("SponsorContact", SponsorContactSchema);

export default SponsorContact;
