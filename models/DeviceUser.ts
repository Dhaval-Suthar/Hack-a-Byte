import mongoose, { Schema, Document } from "mongoose";

export interface DeviceUser extends Document {
  username: string;
  password: string;
  deviceMacAddress: string;
  loginTime: Date;
  lastActiveTime: Date;
}

const DeviceUserSchema = new Schema<DeviceUser>(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    deviceMacAddress: { type: String, required: true },
    loginTime: { type: Date, default: Date.now },
    lastActiveTime: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.DeviceUser || mongoose.model<DeviceUser>("DeviceUser", DeviceUserSchema);
