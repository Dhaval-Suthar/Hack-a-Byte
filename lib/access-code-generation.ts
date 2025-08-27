"use server";

import connectDb from "@/db/connectDb";
import AccessCodeModel from "@/models/AccessCode";
import Playspace from "@/models/Playspace";
import Device from "@/models/Device";
import mongoose from "mongoose";

export interface CreateAccessCodeAndPlayspaceOptions {
  numberOfPlayers: number;
  playingDevice: "smartphone" | "pc_laptop";
  eventTitle: string;
  registrationId: string;
  codePrefix?: string; // optional prefix for generated access codes (e.g., '3' for event codes)
}

export interface AccessCodeAndPlayspaceResult {
  success: boolean;
  accessCode?: string;
  accessCodeId?: string;
  playspaceId?: string;
  playspaceName?: string;
  // First and only device created for the playspace (shared team device)
  deviceId?: string;
  error?: string;
}

/**
 * Generates a unique 6-digit access code. If a prefix is provided it will
 * be placed at the start (prefix length must be < 6). The remaining digits
 * are randomly generated.
 */
function generateUniqueCode(prefix?: string): string {
  const digits = '0123456789';
  const maxLen = 6;

  const safePrefix = prefix && prefix.length < maxLen ? prefix : '';
  const remaining = maxLen - safePrefix.length;

  let tail = '';
  for (let i = 0; i < remaining; i++) {
    tail += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return `${safePrefix}${tail}`;
}

/**
 * Creates a playspace with one shared device based on the playing device type
 * Each team gets exactly one device regardless of team size
 */
async function createPlayspaceWithDevices(
  playspaceName: string, 
  playspaceDescription: string, 
  deviceType: "hackphone" | "hackbook-e95"
): Promise<{
  success: boolean;
  playspaceId?: string;
  deviceIds?: string[];
  error?: string;
}> {
  try {
    // Create the playspace first
    const newPlayspace = new Playspace({
      name: playspaceName,
      description: playspaceDescription,
      isPublic: false,
      devices: [],
      missions: []
    });

    await newPlayspace.save();
    const playspaceId = newPlayspace._id.toString();

    // Create ONE device for the playspace (shared by the entire team)
    const deviceIds: string[] = [];
    
    // Generate a unique MAC address for the single team device
    const deviceMacAddress = generateDeviceMacAddress();
    
    const newDevice = new Device({
      deviceType,
      deviceMacAddress,
      // Devices should be offline by default; will go online when all team members join
      status: "offline",
      playspace: new mongoose.Types.ObjectId(playspaceId),
      configuration: {
        osVersion: deviceType === "hackphone" ? "iOS 16" : "Windows 95",
        installedApps: deviceType === "hackphone" 
          ? ["Safari", "Calculator", "Settings", "Terminal", "Files", "Network Scanner", "Crypto Toolkit"]
          : ["Notepad", "Calculator", "Paint", "MyComputer", "Terminal", "Minesweeper", "CD Player"],
        theme: "default",
        securityLevel: 1
      },
      logs: []
    });

    await newDevice.save();
    deviceIds.push(newDevice._id.toString());

    return {
      success: true,
      playspaceId,
      deviceIds
    };
  } catch (error) {
    console.error("Error creating playspace with devices:", error);
    return {
      success: false,
      error: "Failed to create playspace and devices"
    };
  }
}

/**
 * Generates a MAC address for the device
 */
function generateDeviceMacAddress(): string {
  const hexChars = '0123456789ABCDEF';
  let mac = '';
  
  for (let i = 0; i < 6; i++) {
    if (i > 0) mac += ':';
    for (let j = 0; j < 2; j++) {
      mac += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    }
  }
  
  return mac;
}

/**
 * Creates an access code and associated playspace for event registration
 */
export async function createAccessCodeAndPlayspace(
  options: CreateAccessCodeAndPlayspaceOptions
): Promise<AccessCodeAndPlayspaceResult> {
  try {
    await connectDb();

    const { numberOfPlayers, playingDevice, eventTitle, registrationId } = options;

    // Generate unique access code
    let accessCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      accessCode = generateUniqueCode(options.codePrefix);
      const existingCode = await AccessCodeModel.findOne({ code: accessCode });
      isUnique = !existingCode;
      attempts++;
    } while (!isUnique && attempts < maxAttempts);

    if (!isUnique) {
      return {
        success: false,
        error: "Failed to generate unique access code after multiple attempts"
      };
    }

    // Determine device type
  const deviceType = playingDevice === "smartphone" ? "hackphone" : "hackbook-e95";
    
    // Create playspace name and description
    const playspaceName = `${eventTitle} - Team ${accessCode}`;
  const playspaceDescription = `Shared gaming environment for ${numberOfPlayers} player${numberOfPlayers > 1 ? 's' : ''} using one ${deviceType === "hackphone" ? "HackPhone (Smartphone)" : "HackBook E95 (PC/Laptop)"} device. Registration ID: ${registrationId}`;

    // Create playspace with one shared device
    const playspaceResult = await createPlayspaceWithDevices(
      playspaceName,
      playspaceDescription,
      deviceType
    );

  if (!playspaceResult.success) {
      return {
        success: false,
        error: playspaceResult.error
      };
    }

    // Create access code with usage limit equal to number of players
    const newAccessCode = new AccessCodeModel({
      code: accessCode,
      type: "usage-limited",
      priority: 5,
      description: `Access code for ${eventTitle} - ${numberOfPlayers} player${numberOfPlayers > 1 ? 's' : ''}`,
      isActive: true,
      usageCount: 0,
      maxUsages: numberOfPlayers,
      assignedPlayspace: new mongoose.Types.ObjectId(playspaceResult.playspaceId!)
    });

    await newAccessCode.save();

    return {
      success: true,
      accessCode: accessCode,
      accessCodeId: newAccessCode._id.toString(),
      playspaceId: playspaceResult.playspaceId!,
      playspaceName,
      deviceId: playspaceResult.deviceIds?.[0]
    };

  } catch (error) {
    console.error("Error creating access code and playspace:", error);
    return {
      success: false,
      error: "Failed to create access code and playspace"
    };
  }
}

/**
 * Validates an access code and checks usage limits
 */
export async function validateAccessCodeUsage(accessCode: string): Promise<{
  success: boolean;
  isValid?: boolean;
  usagesLeft?: number;
  maxUsages?: number;
  error?: string;
}> {
  try {
    await connectDb();

    const codeDocument = await AccessCodeModel.findOne({ code: accessCode });

    if (!codeDocument) {
      return {
        success: true,
        isValid: false
      };
    }

    // Check if code is active
    if (!codeDocument.isActive) {
      return {
        success: true,
        isValid: false
      };
    }

    // Check if code has expired (time-limited codes)
    if (codeDocument.type === "time-limited" && codeDocument.expiresAt && new Date() > codeDocument.expiresAt) {
      return {
        success: true,
        isValid: false
      };
    }

    // Check usage limits
    const usagesLeft = codeDocument.maxUsages ? codeDocument.maxUsages - codeDocument.usageCount : Infinity;
    const isValid = usagesLeft > 0;

    return {
      success: true,
      isValid,
      usagesLeft: typeof usagesLeft === 'number' ? usagesLeft : undefined,
      maxUsages: codeDocument.maxUsages
    };

  } catch (error) {
    console.error("Error validating access code usage:", error);
    return {
      success: false,
      error: "Failed to validate access code"
    };
  }
}
