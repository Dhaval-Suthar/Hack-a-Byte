import mongoose from "mongoose";
import { Schema, Document } from "mongoose";

// Mission model interface
export interface Mission extends Document {
  title: string;
  description: string;
  objectives: string[];
  difficulty: "easy" | "medium" | "hard";
  instructions?: string; // Optional field for additional instructions
  hints?: string[]; // Optional field for hints
  tips?: string[]; // Optional field for tips
}

const MissionSchema = new Schema<Mission>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    objectives: [{ type: String, required: true }],
    instructions: { type: String, default: "" }, // Optional field for additional instructions
    hints: [{ type: String }], // Optional field for hints
    tips: [{ type: String }], // Optional field for tips
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    }
  },
  { timestamps: true }
);

export default mongoose.models.Mission || mongoose.model<Mission>("Mission", MissionSchema);
