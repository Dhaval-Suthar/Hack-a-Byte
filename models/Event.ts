import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
    category: string;
    isPublic: boolean;
    capacity: number;
    registeredUsers?: mongoose.Schema.Types.ObjectId[];
    imageUrl?: string;
    // New fields for enhanced event configuration
    requiredDeviceTypes: {
        mobile: boolean;
        desktop: boolean;
    };
    requiredDevices: {
        mobile: string[];
        desktop: string[];
    };
    minTeamMembers: number;
    maxTeamMembers: number;
    pricing: {
        normal: number; // Normal pricing
        extended?: number; // Extended pricing (optional)
    };
}

const EventSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        location: { type: String, required: true },
        category: { type: String, required: true },
        isPublic: { type: Boolean, default: true },
        capacity: { type: Number, default: 0 }, // 0 means unlimited
        imageUrl: { type: String },
        // New fields for enhanced event configuration
        requiredDeviceTypes: {
            mobile: { type: Boolean, default: false },
            desktop: { type: Boolean, default: false },
        },
        requiredDevices: {
            mobile: [{ type: String }],
            desktop: [{ type: String }],
        },
        minTeamMembers: { type: Number, required: true, min: 1 },
        maxTeamMembers: { type: Number, required: true, min: 1 },
        pricing: {
            normal: { type: Number, required: true, min: 0 },
            extended: { type: Number, min: 0 }, // Optional
        },
    },
    { timestamps: true }
);

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);