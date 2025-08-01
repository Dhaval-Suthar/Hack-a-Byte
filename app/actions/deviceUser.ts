"use server";

import connectDb from "@/db/connectDb";
import DeviceUser from "@/models/DeviceUser";
import Device from "@/models/Device";
import mongoose from "mongoose";
import { createDeviceSession, clearDeviceSession, validateDeviceSession } from "@/lib/device-session";

// Create a new device user
export async function createDeviceUser(
  username: string,
  password: string,
  deviceId: string,
  deviceType: string,
  playspaceId: string
) {
  try {
    await connectDb();

    // Instead of trying to find by ID directly, let's check if the device exists by deviceId field
    const device = await Device.findOne({ deviceMacAddress: deviceId });
    if (!device) {
      return { error: "Device not found" };
    }

    // Check if username is already taken on this device
    const existingUser = await DeviceUser.findOne({
      username,
      deviceMacAddress: deviceId,
    });

    if (existingUser) {
      return { error: "Username already exists on this device" };
    }

    // Create the new device user
    const newUser = new DeviceUser({
      username,
      deviceMacAddress: deviceId, // Store MAC address
      password
    });

    await newUser.save();

    // Create secure session instead of simple cookie
    await createDeviceSession(
      newUser._id.toString(),
      newUser.username,
      deviceId,
      deviceType,
      playspaceId
    );

    return { 
      success: true, 
      user: {
        _id: newUser._id.toString(),
        username: newUser.username
      }
    };
  } catch (error) {
    console.error("Error creating device user:", error);
    return { error: "Failed to create device user" };
  }
}

// Login with a device user
export async function loginDeviceUser(
  username: string,
  password: string,
  deviceId: string,
  deviceType: string,
  playspaceId: string
) {
  try {
    await connectDb();

    // Find the user on this device
    const user = await DeviceUser.findOne({
      username,
      deviceMacAddress: deviceId,
    });

    if (!user) {
      return { error: "User not found on this device" };
    }

    // Validate password from userData
    const storedPasswordHash = user.password;
    if (!storedPasswordHash || storedPasswordHash !== password) {
      return { error: "Invalid password" };
    }

    // Update user's last active time and isActive status
    user.lastActiveTime = new Date();
    user.isActive = true;
    await user.save();

    // Create secure session instead of simple cookie
    await createDeviceSession(
      user._id.toString(),
      user.username,
      deviceId,
      deviceType,
      playspaceId
    );

    return { 
      success: true, 
      user: {
        _id: user._id.toString(),
        username: user.username
      }
    };
  } catch (error) {
    console.error("Error logging in device user:", error);
    return { error: "Failed to log in device user" };
  }
}

// Check if a user is already logged in to this device
export async function getDeviceUser(
  deviceId: string,
  deviceType: string
) {
  try {
    // Use secure session validation instead of cookie parsing
    const sessionData = await validateDeviceSession(deviceId, deviceType);
    
    if (!sessionData) {
      return { isLoggedIn: false };
    }

    await connectDb();

    // Verify user still exists
    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(sessionData.userId),
    });

    if (!user) {
      // Session exists but user doesn't - clear the session
      await clearDeviceSession(deviceId, deviceType);
      return { isLoggedIn: false };
    }

    return {
      isLoggedIn: true,
      user: {
        _id: user._id.toString(),
        username: user.username
      }
    };
  } catch (error) {
    console.error("Error getting device user:", error);
    return { isLoggedIn: false, error: "Failed to verify user session" };
  }
}

// Log out a user from this device
export async function logoutDeviceUser(
  deviceId: string,
  deviceType: string
) {
  await clearDeviceSession(deviceId, deviceType);
  return { success: true };
}

/**
 * Get all users for a specific device
 * 
 * @param deviceId The ID of the device
 * @returns An array of users or an error
 */
export async function getUsersByDeviceId(deviceId: string) {
  try {
    if (!deviceId) {
      return { error: "Device ID is required" };
    }

    await connectDb();

    // Check if the device exists
    const device = await Device.findOne({ deviceMacAddress: deviceId });

    if (!device) {
      return { error: "Device not found" };
    }


    // Get all users for this device
    const users = await DeviceUser.find({ deviceMacAddress: deviceId });

    return { 
      success: true, 
      users: users.map(user => ({
        _id: user._id.toString(),
        username: user.username,
        loginTime: user.loginTime,
        lastActiveTime: user.lastActiveTime,
        isActive: user.isActive
      }))
    };
  } catch (error) {
    console.error("Error fetching users for device:", error);
    return { 
      error: "Failed to fetch users for device",
      details: error instanceof Error ? error.message : String(error)
    };
  }
}
