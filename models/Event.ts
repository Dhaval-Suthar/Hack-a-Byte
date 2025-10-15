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
    // Registration controls
    registrationEnabled?: boolean;
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

        // Additional fields for better event management
        status: {
            type: String,
            enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
            default: 'draft'
        },
        organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceUser' },
        tags: [{ type: String }],
        featured: { type: Boolean, default: false },
        registrationCount: { type: Number, default: 0 },
        maxRegistrations: { type: Number, default: 0 }, // 0 means unlimited
        waitlistEnabled: { type: Boolean, default: false },
        waitlistCount: { type: Number, default: 0 },

        // Registration controls
        registrationEnabled: { type: Boolean, default: true },

        // Event settings
        settings: {
            allowLateRegistration: { type: Boolean, default: false },
            requireApproval: { type: Boolean, default: false },
            autoConfirm: { type: Boolean, default: true },
            notifications: {
                emailReminders: { type: Boolean, default: true },
                dayBefore: { type: Boolean, default: true },
                hourBefore: { type: Boolean, default: true }
            }
        }
    },
    { timestamps: true }
);

// Create indexes
EventSchema.index({ startDate: 1 });
EventSchema.index({ endDate: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ organizer: 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ featured: 1 });

// Instance methods
EventSchema.methods.publish = function() {
  this.status = 'published';
  return this.save();
};

EventSchema.methods.start = function() {
  this.status = 'ongoing';
  return this.save();
};

EventSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

EventSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

EventSchema.methods.incrementRegistration = function() {
  this.registrationCount += 1;
  return this.save();
};

EventSchema.methods.decrementRegistration = function() {
  this.registrationCount = Math.max(0, this.registrationCount - 1);
  return this.save();
};

EventSchema.methods.enableRegistration = function() {
  this.registrationEnabled = true;
  return this.save();
};

EventSchema.methods.disableRegistration = function() {
  this.registrationEnabled = false;
  return this.save();
};

EventSchema.methods.isFull = function() {
  return this.maxRegistrations > 0 && this.registrationCount >= this.maxRegistrations;
};

EventSchema.methods.canRegister = function() {
  return this.status === 'published' &&
         this.registrationEnabled !== false && // Check registration is enabled
         !this.isFull() &&
         new Date() < this.endDate;
};

EventSchema.methods.isOngoing = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

// Static methods
EventSchema.statics.getUpcoming = function(limit = 10) {
  return this.find({
    status: 'published',
    startDate: { $gt: new Date() }
  })
  .sort({ startDate: 1 })
  .limit(limit);
};

EventSchema.statics.getOngoing = function() {
  const now = new Date();
  return this.find({
    status: 'ongoing',
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

EventSchema.statics.getByCategory = function(category: string) {
  return this.find({
    category,
    status: { $in: ['published', 'ongoing'] }
  }).sort({ startDate: 1 });
};

EventSchema.statics.getFeatured = function(limit = 5) {
  return this.find({
    featured: true,
    status: 'published',
    startDate: { $gt: new Date() }
  })
  .sort({ startDate: 1 })
  .limit(limit);
};

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);