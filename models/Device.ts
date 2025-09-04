// filepath: /Users/dhavalsuthar/Desktop/hackabyte/models/Devices.ts
import mongoose, { Schema, Document } from "mongoose";

export interface FileSystemNode {
  name: string;
  type: "file" | "directory";
  content?: string; // For files
  metadata?: {
    createdAt: Date;
    modifiedAt: Date;
    size: number;
    permissions: string; // e.g., 'rwx', 'r--', etc.
    owner: string;
    isHidden: boolean;
    isSystem: boolean;
    fileType?: string; // e.g., 'txt', 'exe', 'jpg'
    icon?: string; // Path to icon representation
  };
  children?: mongoose.Types.ObjectId[]; // For directories, references to other FileSystemNodes
}

// Schema for file system nodes (files and directories)
const FileSystemNodeSchema = new Schema<FileSystemNode>({
  name: { type: String, required: true },
  type: { type: String, enum: ["file", "directory"], required: true },
  content: { type: String }, // Only for files
  metadata: {
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
    size: { type: Number, default: 0 },
    permissions: { type: String, default: "rw-" },
    owner: { type: String, default: "system" },
    isHidden: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
    fileType: { type: String },
    icon: { type: String },
  },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: "FileSystemNode" }], // Only for directories
});

// Device model interface
export interface Device extends Document {
  deviceMacAddress: string; // Unique identifier for the device instance
  deviceType: string; // e.g., 'hackbook-w95', 'hackdroid', 'hackphone'
  status: "online" | "offline" | "maintenance";
  playspace: mongoose.Schema.Types.ObjectId; // Reference to the Playspace this device belongs to 

  // File system root directory
  fileSystemRoot: mongoose.Schema.Types.ObjectId;

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
    };
  };

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

    fileSystemRoot: { type: mongoose.Schema.Types.ObjectId, ref: "FileSystemNode" },

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

// FileSystemNode model
export const FileSystemNodeModel =
  mongoose.models.FileSystemNode || mongoose.model<FileSystemNode>("FileSystemNode", FileSystemNodeSchema);

// Device model
export default mongoose.models.Device || mongoose.model<Device>("Device", DeviceSchema);
