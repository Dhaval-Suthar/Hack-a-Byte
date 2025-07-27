import mongoose, { Schema, Document } from "mongoose";

export interface Team extends Document {
  name: string;
  description: string;
  leaderUserId: mongoose.Schema.Types.ObjectId;
  members: mongoose.Schema.Types.ObjectId[];
  logo: string;
  specialization: string[];  // e.g., ["social_engineering", "cryptography"]
  victories: number;
  ranking: number;
}

const TeamSchema = new Schema<Team>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    leaderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    logo: { type: String, default: "/teams/default-logo.png" },
    specialization: [{ type: String }],
    victories: { type: Number, default: 0 },
    ranking: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.Team || mongoose.model<Team>("Team", TeamSchema);
