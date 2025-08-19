import mongoose, { Schema, Document } from 'mongoose';

export interface IEventRegistration extends Document {
    eventId: number;
    email: string;
    playingDevice: "smartphone" | "pc_laptop";
    numberOfPlayers: number;
    paymentStatus: "pending" | "paid" | "failed";
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
    registrationDate: Date;
    // New fields for access code system
    accessCodeId?: mongoose.Schema.Types.ObjectId;
    playspaceId?: mongoose.Schema.Types.ObjectId;
    accessCodeSent?: boolean;
    accessCodeSentAt?: Date;
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
        playingDevice: {
            type: String,
            required: true,
            enum: ["smartphone", "pc_laptop"]
        },
        numberOfPlayers: {
            type: Number,
            required: true,
            min: 1,
            max: 4
        },
        paymentStatus: {
            type: String,
            required: true,
            enum: ["pending", "paid", "failed"],
            default: "pending"
        },
        razorpayPaymentId: { type: String },
        razorpayOrderId: { type: String },
        razorpaySignature: { type: String },
        registrationDate: { type: Date, default: Date.now },
        // New fields for access code system
        accessCodeId: { type: mongoose.Schema.Types.ObjectId, ref: "AccessCode" },
        playspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Playspace" },
        accessCodeSent: { type: Boolean, default: false },
        accessCodeSentAt: { type: Date }
    },
    { timestamps: true }
);

// Create index for better query performance (removed unique constraint to allow multiple registrations)
EventRegistrationSchema.index({ eventId: 1, email: 1 });

export default mongoose.models.EventRegistration || 
    mongoose.model<IEventRegistration>('EventRegistration', EventRegistrationSchema);
