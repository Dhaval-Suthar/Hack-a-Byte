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
    },
    { timestamps: true }
);

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);