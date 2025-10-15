"use server";

import connectDb from "@/db/connectDb";
import DeviceUser from "@/models/DeviceUser";
import Device from "@/models/Device";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { logger } from '@/lib/logger';

// Create a new device user
export async function createDeviceUser(
  username: string,
  password: string,
  deviceId: string,
  deviceType: string
) {
  try {
    await connectDb();

    // Check if the device exists - try ObjectId first, then MAC address
    let device;
    try {
      device = await Device.findById(deviceId);
    } catch (error) {
      logger.warn('Device lookup by ObjectId failed, trying MAC address:', { error });
      // If ObjectId lookup fails, try MAC address lookup
      device = await Device.findOne({ deviceMacAddress: deviceId });
    }

    if (!device) {
      return { error: "Device not found" };
    }

    // Check if username is already taken on this device
    const existingUser = await DeviceUser.findOne({
      username,
      deviceId: new mongoose.Types.ObjectId(deviceId),
    });

    if (existingUser) {
      return { error: "Username already exists on this device" };
    }

    // Generate a unique session ID
    const sessionId = `${deviceId}_${deviceType}_${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the new device user
    const newUser = new DeviceUser({
      sessionId,
      username,
      deviceId, // Keep as string, not ObjectId
      deviceType,
      userData: {
        passwordHash: password, // Store password in userData for compatibility
        progress: {
          unlockedApplications: ['Notepad', 'MyComputer'],
          skills: {}
        }
      }
    });

    await newUser.save();

    // Set a cookie to remember this user for this device
    const cookieValue = JSON.stringify({
      deviceId,
      deviceType,
      userId: String(newUser._id),
      username,
      sessionId: newUser.sessionId
    });

    const cookieStore = await cookies();
    cookieStore.set(
      `device_${deviceId}_${deviceType}`,
      cookieValue,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      }
    );

    return { 
      success: true, 
      user: {
        _id: String(newUser._id), // Convert ObjectId to string
        username: newUser.username,
        sessionId: newUser.sessionId,
        progress: newUser.userData?.progress || {
          unlockedApplications: ['Notepad', 'MyComputer'],
          skills: {}
        }
      }
    };
  } catch (error) {
    logger.error('Error creating device user:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to create device user" };
  }
}

// Login with a device user
export async function loginDeviceUser(
  username: string,
  password: string,
  deviceId: string,
  deviceType: string
) {
  try {
    await connectDb();

    // Find the user on this device
    const user = await DeviceUser.findOne({
      username,
      deviceId, // Keep as string, not ObjectId
    });

    if (!user) {
      return { error: "User not found on this device" };
    }

    // Validate password from userData
    const storedPasswordHash = user.userData?.passwordHash;
    if (!storedPasswordHash || storedPasswordHash !== password) {
      return { error: "Invalid password" };
    }

    // Update user's last active time and isActive status
    user.lastActiveTime = new Date();
    user.isActive = true;
    await user.save();

    // Set a cookie to remember this user for this device
    const cookieValue = JSON.stringify({
      deviceId,
      deviceType,
      userId: String(user._id),
      username,
      sessionId: user.sessionId
    });

    const cookieStore = await cookies();
    cookieStore.set(
      `device_${deviceId}_${deviceType}`,
      cookieValue,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      }
    );

    return { 
      success: true, 
      user: {
        _id: String(user._id), // Convert ObjectId to string
        username: user.username,
        sessionId: user.sessionId,
        progress: user.userData?.progress || {
          unlockedApplications: ['Notepad', 'MyComputer'],
          skills: {}
        }
      }
    };
  } catch (error) {
    logger.error('Error logging in device user:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to log in device user" };
  }
}

// Check if a user is already logged in to this device
export async function getDeviceUser(
  deviceId: string,
  deviceType: string
) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { isLoggedIn: false };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();
    
    // Verify user still exists
    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      deviceId, // Keep as string
      deviceType
    });

    if (!user) {
      // Cookie exists but user doesn't - clear the cookie
      cookieStore.delete(`device_${deviceId}_${deviceType}`);
      return { isLoggedIn: false };
    }

    return {
      isLoggedIn: true,
      user: {
        _id: String(user._id), // Convert ObjectId to string
        username: user.username,
        sessionId: user.sessionId,
        progress: user.userData?.progress || {
          unlockedApplications: ['Notepad', 'MyComputer'],
          skills: {}
        }
      }
    };
  } catch (error) {
    logger.error('Error getting device user:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { isLoggedIn: false, error: "Failed to verify user session" };
  }
}

// Log out a user from this device
export async function logoutDeviceUser(
  deviceId: string,
  deviceType: string
) {
  const cookieStore = await cookies();
  cookieStore.delete(`device_${deviceId}_${deviceType}`);
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

    // Check if the device exists - try ObjectId first, then MAC address
    let device;
    try {
      device = await Device.findById(deviceId);
    } catch (error) {
      logger.warn('Device lookup by ObjectId failed, trying MAC address:', { error });
      // If ObjectId lookup fails, try MAC address lookup
      device = await Device.findOne({ deviceMacAddress: deviceId });
    }

    if (!device) {
      return { error: "Device not found" };
    }

    // Get all users for this device using the device's ObjectId
    const users = await DeviceUser.find({ deviceId: device._id });

    return { 
      success: true, 
      users: users.map(user => ({
        _id: String(user._id),
        username: user.username,
        loginTime: user.loginTime,
        lastActiveTime: user.lastActiveTime,
        isActive: user.isActive
      }))
    };
  } catch (error) {
    logger.error('Error fetching users for device:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { 
      error: "Failed to fetch users for device",
      details: error instanceof Error ? error.message : String(error)
    };
  }
}
