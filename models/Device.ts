// filepath: /Users/dhavalsuthar/Desktop/hackabyte/models/Devices.ts
import mongoose, { Schema, Document } from "mongoose";

// Device model interface
export interface Device extends Document {
  deviceMacAddress: string; // Unique identifier for the device instance
  deviceType: string; // e.g., 'hackbook-w95', 'hackdroid', 'hackphone'
  status: "online" | "offline" | "maintenance";
  playspace: mongoose.Schema.Types.ObjectId; // Reference to the Playspace this device belongs to
  teamId?: mongoose.Schema.Types.ObjectId; // Reference to the team that owns this device
  ipAddress?: string; // Shortcut to the device's IP address (for easier queries)
  lastSeen?: Date; // When the device was last seen online

  // Currently logged in users
  currentUsers: {
    userId: mongoose.Schema.Types.ObjectId;
    username: string;
    loginTime: Date;
    isAdmin: boolean;
    sessionId: string;
    ipAddress: string;
  }[];

  // Device-specific settings and configuration
  configuration: {
    osVersion: string;
    installedApps: string[];
    networkSettings: {
      ipAddress: string;
      subnet: string;
      gateway: string;
      dns: string[];
      isNetworkEnabled: boolean;
    };
    securitySettings: {
      firewall: boolean;
      antiVirus: boolean;
      vulnerabilities: string[]; // List of simulated vulnerabilities for CTF scenarios
      vpn?: boolean;
      enc?: boolean;
      ids?: boolean;
    };
  };

  // Additional device settings
  passcode?: string | null;
  pin?: string | null;
  airplaneMode?: boolean;
  wifiEnabled?: boolean;
  bluetoothEnabled?: boolean;
  notifications?: boolean;
  notificationsEnabled?: boolean;
  location?: boolean;
  locationEnabled?: boolean;
  deviceLock?: boolean;
  brightness?: number;
  ringerVolume?: number;
  vibrateEnabled?: boolean;
  ringtone?: string;
  network?: string;
  darkMode?: boolean;
  hapticFeedback?: boolean;
  autoUpdateApps?: boolean;
  autoBrightness?: boolean;

  // Device logs for actions performed
  logs: {
    timestamp: Date;
    action: string;
    userId: mongoose.Schema.Types.ObjectId;
    details: string;
    ipAddress: string;
  }[];
}

const DeviceSchema = new Schema<Device>(
  {
    deviceMacAddress: { type: String, unique: true, required: true }, // Will be auto-generated if not provided
    deviceType: { type: String, required: true },
    status: { type: String, enum: ["online", "offline", "maintenance"], default: "offline" },
    playspace: { type: mongoose.Schema.Types.ObjectId, ref: "Playspace" },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    ipAddress: { type: String },
    lastSeen: { type: Date, default: Date.now },

    currentUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        username: { type: String, required: true },
        loginTime: { type: Date, default: Date.now },
        isAdmin: { type: Boolean, default: false },
        sessionId: { type: String, required: true },
        ipAddress: { type: String, required: true },
      },
    ],

    configuration: {
      osVersion: { type: String, required: true },
      installedApps: [{ type: String }],
      networkSettings: {
        ipAddress: { type: String },
        subnet: { type: String },
        gateway: { type: String },
        dns: [{ type: String }],
        isNetworkEnabled: { type: Boolean, default: true },
      },
      securitySettings: {
        firewall: { type: Boolean, default: true },
        antiVirus: { type: Boolean, default: true },
        vulnerabilities: [{ type: String }],
        vpn: { type: Boolean, default: false },
        enc: { type: Boolean, default: false },
        ids: { type: Boolean, default: false },
      },
    },

    // Additional device settings
    passcode: { type: String, default: null },
    pin: { type: String, default: null },
    airplaneMode: { type: Boolean, default: false },
    wifiEnabled: { type: Boolean, default: true },
    bluetoothEnabled: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true },
    location: { type: Boolean, default: true },
    locationEnabled: { type: Boolean, default: true },
    deviceLock: { type: Boolean, default: false },
    brightness: { type: Number, default: 50 },
    ringerVolume: { type: Number, default: 70 },
    vibrateEnabled: { type: Boolean, default: true },
    ringtone: { type: String, default: "Marimba" },
    network: { type: String, default: "Home WiFi" },
    darkMode: { type: Boolean, default: false },
    hapticFeedback: { type: Boolean, default: true },
    autoUpdateApps: { type: Boolean, default: true },
    autoBrightness: { type: Boolean, default: true },

    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        action: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        details: { type: String },
        ipAddress: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Create indexes for better query performance
// Note: deviceMacAddress already has unique index from schema definition
DeviceSchema.index({ deviceType: 1 });
DeviceSchema.index({ status: 1 });
DeviceSchema.index({ 'configuration.networkSettings.ipAddress': 1 });

// Helper method to add a log entry
DeviceSchema.methods.addLogEntry = function (
  userId: mongoose.Types.ObjectId,
  action: string,
  details: string,
  ipAddress: string
) {
  this.logs.push({
    timestamp: new Date(),
    action,
    userId,
    details,
    ipAddress,
  });
  return this.save();
};

// Helper method to check if a user is currently logged in
DeviceSchema.methods.isUserLoggedIn = function (userId: mongoose.Types.ObjectId) {
  return this.currentUsers.some((user: { userId: mongoose.Types.ObjectId }) => user.userId.equals(userId));
};

// Helper to track user login
DeviceSchema.methods.userLogin = function (
  userId: mongoose.Types.ObjectId,
  username: string,
  isAdmin: boolean,
  sessionId: string,
  ipAddress: string
) {
  // Remove any existing sessions for this user
  this.currentUsers = this.currentUsers.filter(
    (user: { userId: mongoose.Types.ObjectId }) => !user.userId.equals(userId)
  );

  // Add the new session
  this.currentUsers.push({
    userId,
    username,
    loginTime: new Date(),
    isAdmin,
    sessionId,
    ipAddress,
  });

  // Add log entry
  this.logs.push({
    timestamp: new Date(),
    action: "login",
    userId,
    details: `User ${username} logged in`,
    ipAddress,
  });

  return this.save();
};

// Helper to track user logout
DeviceSchema.methods.userLogout = function (userId: mongoose.Types.ObjectId) {
  const userSession = this.currentUsers.find(
    (user: { userId: mongoose.Types.ObjectId; username: string; ipAddress: string }) => user.userId.equals(userId)
  );

  if (userSession) {
    // Add log entry
    this.logs.push({
      timestamp: new Date(),
      action: "logout",
      userId,
      details: `User ${userSession.username} logged out`,
      ipAddress: userSession.ipAddress,
    });

    // Remove the session
    this.currentUsers = this.currentUsers.filter(
      (user: { userId: mongoose.Types.ObjectId }) => !user.userId.equals(userId)
    );
    return this.save();
  }

  return Promise.resolve(this);
};

// Device model
export default mongoose.models.Device || mongoose.model<Device>("Device", DeviceSchema);
