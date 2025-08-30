import mongoose, { Schema, Document } from 'mongoose';

export interface IGameSession extends Document {
    tournamentId: string;
    team1Id: string;
    team2Id: string;
    team1Name: string;
    team2Name: string;
    status: 'waiting' | 'active' | 'completed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    team1Score: number;
    team2Score: number;
    duration: number; // in seconds
    winner?: string; // team ID or "draw"
    deviceId?: string; // for device-based sessions
}

const GameSessionSchema: Schema = new Schema(
    {
        tournamentId: { type: String, required: true },
        team1Id: { type: String, required: true },
        team2Id: { type: String, required: true },
        team1Name: { type: String, required: true },
        team2Name: { type: String, required: true },
        status: {
            type: String,
            enum: ['waiting', 'active', 'completed', 'cancelled'],
            default: 'waiting'
        },
        startTime: { type: Date, default: Date.now },
        endTime: { type: Date },
        team1Score: { type: Number, default: 0 },
        team2Score: { type: Number, default: 0 },
        duration: { type: Number, default: 0 }, // in seconds
        winner: { type: String },
        deviceId: { type: String },
    },
    { timestamps: true }
);

// Index for efficient queries
GameSessionSchema.index({ status: 1, startTime: -1 });
GameSessionSchema.index({ tournamentId: 1 });

export default mongoose.models.GameSession || mongoose.model<IGameSession>('GameSession', GameSessionSchema);
