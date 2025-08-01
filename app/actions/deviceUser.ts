"use server";

import connectDb from "@/db/connectDb";
import DeviceUser from "@/models/DeviceUser";
import Device from "@/models/Device";
import { cookies } from "next/headers";
import mongoose from "mongoose";

// Create a new device user
export async function createDeviceUser(
  username: string,
  password: string,
  deviceId: string,
  deviceType: string
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

    // Generate a unique session ID
    const sessionId = `${deviceId}_${deviceType}_${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the new device user with proper game state initialization
    const newUser = new DeviceUser({
      username,
      deviceMacAddress: deviceId, // Store MAC address
      deviceId: deviceId, // Also store as deviceId for easier querying
      password,
      sessionId,
      isActive: true,
      gameState: {
        unlockedApplications: ['Notepad', 'MyComputer'],
        skills: {},
        missions: new Map(),
        gameStats: {
          totalPlayTime: 0,
          loginCount: 1,
          lastLoginDate: new Date(),
          achievementsUnlocked: []
        },
        settings: {
          soundEnabled: true,
          showHiddenFiles: false,
          difficulty: 'medium'
        }
      },
      // Keep userData for backward compatibility
      userData: {
        passwordHash: password,
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
      userId: newUser._id.toString(),
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
        _id: newUser._id.toString(),
        username: newUser.username,
        sessionId: newUser.sessionId,
        progress: {
          unlockedApplications: newUser.gameState.unlockedApplications,
          skills: Object.fromEntries(newUser.gameState.skills || new Map())
        }
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
  deviceType: string
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

    // Update user's last active time and login stats
    user.lastActiveTime = new Date();
    user.isActive = true;
    
    // Update login count and last login date
    if (user.gameState && user.gameState.gameStats) {
      user.gameState.gameStats.loginCount = (user.gameState.gameStats.loginCount || 0) + 1;
      user.gameState.gameStats.lastLoginDate = new Date();
    } else {
      // Initialize game stats if they don't exist (for older users)
      user.gameState = user.gameState || {};
      user.gameState.gameStats = {
        totalPlayTime: 0,
        loginCount: 1,
        lastLoginDate: new Date(),
        achievementsUnlocked: []
      };
    }

    // Generate new session ID
    const sessionId = `${deviceId}_${deviceType}_${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    user.sessionId = sessionId;

    await user.save();

    // Set a cookie to remember this user for this device
    const cookieValue = JSON.stringify({
      deviceId,
      deviceType,
      userId: user._id.toString(),
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
        _id: user._id.toString(),
        username: user.username,
        sessionId: user.sessionId,
        progress: {
          unlockedApplications: user.gameState?.unlockedApplications || ['Notepad', 'MyComputer'],
          skills: user.gameState?.skills ? Object.fromEntries(user.gameState.skills) : {}
        }
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
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { isLoggedIn: false };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();
    
    // Verify user still exists and session is valid
    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      sessionId: userData.sessionId // Also verify session ID for security
    });

    if (!user) {
      // Cookie exists but user doesn't or session is invalid - clear the cookie
      cookieStore.delete(`device_${deviceId}_${deviceType}`);
      return { isLoggedIn: false };
    }

    // Update last active time
    user.lastActiveTime = new Date();
    await user.save();

    return {
      isLoggedIn: true,
      user: {
        _id: user._id.toString(),
        username: user.username,
        sessionId: user.sessionId,
        progress: {
          unlockedApplications: user.gameState?.unlockedApplications || ['Notepad', 'MyComputer'],
          skills: user.gameState?.skills ? Object.fromEntries(user.gameState.skills) : {}
        },
        gameState: {
          ...user.gameState,
          skills: user.gameState?.skills ? Object.fromEntries(user.gameState.skills) : {},
          missions: user.gameState?.missions ? Object.fromEntries(user.gameState.missions) : {}
        }
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
