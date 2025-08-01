import mongoose, { Schema, Document } from "mongoose";

export type AccessCodeType = 'permanent' | 'time-limited' | 'usage-limited';

export interface AccessCode extends Document {
  code: string;               // 6-digit numeric code
  type: AccessCodeType;
  priority: number;           // Priority for code display/selection (1-9)
  description?: string;       // Optional description for the access code
  isActive: boolean;
  usageCount: number;
  maxUsages?: number;          // For usage-limited codes
  expiresAt?: Date;            // For time-limited codes
  assignedPlayspace?: mongoose.Schema.Types.ObjectId; // Single playspace this code grants access to
}

const AccessCodeSchema = new Schema<AccessCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v: string) {
          return /^\d{6}$/.test(v); // Must be exactly 6 digits
        },
        message: (props) => `${props.value} is not a valid 6-digit numeric code!`,
      },
    },
    type: {
      type: String,
      required: true,
      enum: ["permanent", "time-limited", "usage-limited"],
      default: "permanent",
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 9,
      default: 5,
    },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    maxUsages: { type: Number }, // For usage-limited codes
    expiresAt: { type: Date }, // For time-limited codes
    assignedPlayspace: { type: mongoose.Schema.Types.ObjectId, ref: "Playspace" }
  },
  { timestamps: true }
);

export default mongoose.models.AccessCode || mongoose.model<AccessCode>("AccessCode", AccessCodeSchema);