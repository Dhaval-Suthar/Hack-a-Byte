"use server";

import connectDb from "@/db/connectDb";
import DeviceUser from "@/models/DeviceUser";
import { cookies } from "next/headers";
import mongoose from "mongoose";

/**
 * Handle game failure - delete user account and logout
 * This function is called when a user fails any mini-game
 */
export async function handleGameFailure(deviceId: string, deviceType: string) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(`device_${deviceId}_${deviceType}`);
    
    if (!userCookie || !userCookie.value) {
      return { error: "User not logged in" };
    }

    const userData = JSON.parse(userCookie.value);
    
    await connectDb();

    // Find the user to delete
    const user = await DeviceUser.findOne({
      _id: new mongoose.Types.ObjectId(userData.userId),
      deviceMacAddress: deviceId
    });

    if (!user) {
      return { error: "User not found" };
    }

    const username = user.username;

    // Delete the user account completely
    await DeviceUser.findByIdAndDelete(userData.userId);

    // Clear the user's session cookie
    cookieStore.delete(`device_${deviceId}_${deviceType}`);

    console.log(`User ${username} account deleted due to game failure on device ${deviceId}`);

    return { 
      success: true, 
      message: "Account terminated due to mission failure. Your hacker credentials have been revoked.",
      deletedUsername: username
    };
  } catch (error) {
    console.error("Error handling game failure:", error);
    return { error: "Failed to process account termination" };
  }
}

/**
 * Get redirect URL for hackbook-w95 login page
 */
export async function getHackbookLoginUrl(deviceId?: string, playspaceId?: string) {
  const baseUrl = `/hackbook-w95/login`;
  const params = new URLSearchParams();
  
  if (deviceId) {
    params.append('device', deviceId);
  }
  if (playspaceId) {
    params.append('playspace', playspaceId);
  }
  
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}
