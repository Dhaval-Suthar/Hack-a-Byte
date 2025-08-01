import mongoose, { Schema, Document } from 'mongoose';

export interface IEventRegistration extends Document {
    eventId: number;
    email: string;
    isFromSFIT: boolean;
    playingMode: "online" | "offline";
    registrationDate: Date;
}

const EventRegistrationSchema: Schema = new Schema(
    {
        eventId: { type: Number, required: true },
        email: { 
            type: String, 
            required: true,
            lowercase: true,
            trim: true
        },
        isFromSFIT: { type: Boolean, required: true },
        playingMode: { 
            type: String, 
            required: true,
            enum: ["online", "offline"],
            default: "online"
        },
        registrationDate: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

// Create compound index to prevent duplicate registrations for same event
EventRegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });

export default mongoose.models.EventRegistration || 
    mongoose.model<IEventRegistration>('EventRegistration', EventRegistrationSchema);
