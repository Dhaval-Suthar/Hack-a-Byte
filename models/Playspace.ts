import mongoose, { Schema, Document } from "mongoose";

export interface Playspace extends Document {
  name: string;
  description: string;
  securityLevel?: number;
  missions: mongoose.Schema.Types.ObjectId[];
}

const PlayspaceSchema = new Schema<Playspace>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    securityLevel: { type: Number, default: 0 },
    missions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Mission" }],
  },
  { timestamps: true }
);

export default mongoose.models.Playspace || mongoose.model<Playspace>("Playspace", PlayspaceSchema);
