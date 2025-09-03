"use server";

import connectDb from "@/db/connectDb";
import Playspace from "@/models/Playspace";
import AccessCode from "@/models/AccessCode";
import Device from "@/models/Device";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

// Helper function to check admin status
async function checkAdminStatus(adminKey?: string) {
  // If admin key is provided, validate it (file upload authentication)
  if (adminKey) {
    const validKey = process.env.ADMIN_AUTH_KEY || "hackabyte-admin-key-2024"; // This should match your admin-key.txt file
    if (adminKey.trim() === validKey) {
      return { isAdmin: true, error: null };
    } else {
      return {
        isAdmin: false,
        error: "Invalid authentication key",
      };
    }
  }

  // No session-based authentication fallback
  return {
    isAdmin: false,
    error: "Authentication key required",
  };
}

export async function getPlayspaces(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();
    const playspaces = await Playspace.find().lean();

    // Format the response to ensure consistent structure and convert MongoDB objects to plain objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedPlayspaces = playspaces.map((playspace: any) => ({
      _id: playspace._id ? playspace._id.toString() : "",
      name: playspace.name || "",
      description: playspace.description || "",
      isPublic: typeof playspace.isPublic === "boolean" ? playspace.isPublic : false,
      devices: Array.isArray(playspace.devices)
        ? playspace.devices.map((device: string) => device)
        : [],
      createdAt: playspace.createdAt ? new Date(playspace.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: playspace.updatedAt ? new Date(playspace.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return { playspaces: formattedPlayspaces };
  } catch (error) {
    console.error("Error fetching playspaces:", error);
    return { error: "Failed to fetch playspaces" };
  }
}

export async function getPlayspaceDetails(playspaceId: string) {
  const { isAdmin, error } = await checkAdminStatus();

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Find playspace
    const playspace = await Playspace.findById(playspaceId);

    if (!playspace) {
      return { error: "Playspace not found" };
    }

    // Find access code for this playspace
    const accessCode = await AccessCode.findOne({ assignedPlayspace: playspaceId });

    return {
      success: true,
      playspace: {
        _id: playspace._id.toString(),
        name: playspace.name,
        description: playspace.description,
        isPublic: playspace.isPublic,
        devices: playspace.devices || [],
        accessCode: accessCode ? {
          _id: accessCode._id.toString(),
          code: accessCode.code,
          priority: accessCode.priority,
          type: accessCode.type,
          isActive: accessCode.isActive,
          usageCount: accessCode.usageCount,
          maxUsages: accessCode.maxUsages,
          expiresAt: accessCode.expiresAt,
          description: accessCode.description,
        } : null,
        createdAt: playspace.createdAt.toISOString(),
        updatedAt: playspace.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching playspace details:", error);
    return { error: "Failed to fetch playspace details" };
  }
}

export async function createPlayspace(
  name: string,
  description: string,
  isPublic: boolean = false,
  devices: string[] = [],
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Create the playspace
    const newPlayspace = new Playspace({
      name,
      description,
      isPublic,
      devices,
      creatorId: null, // No creator tracking without sessions
    });

    await newPlayspace.save();

    revalidatePath("/admin");

    return {
      success: true,
      playspace: {
        _id: newPlayspace._id.toString(),
        name: newPlayspace.name,
        description: newPlayspace.description,
        isPublic: newPlayspace.isPublic,
        devices: newPlayspace.devices || [],
        createdAt: newPlayspace.createdAt ? new Date(newPlayspace.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: newPlayspace.updatedAt ? new Date(newPlayspace.updatedAt).toISOString() : new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error creating playspace:", error);
    return { error: "Failed to create playspace" };
  }
}

/**
 * Delete a playspace and all associated resources (access codes, etc.)
 *
 * @param playspaceId The ID of the playspace to delete
 * @param adminKey Optional admin authentication key
 * @returns Success status or error message
 */
export async function deletePlayspace(playspaceId: string, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    if (!playspaceId) {
      return { error: "Missing playspace ID" };
    }

    // Find and remove any access codes assigned to this playspace
    await AccessCode.deleteMany({ assignedPlayspace: playspaceId });

    // Find playspace to remove
    const playspace = await Playspace.findById(playspaceId);

    if (!playspace) {
      return { error: "Playspace not found" };
    }

    // Remove any device assignments for this playspace
    await Device.updateMany(
      { playspace: playspaceId },
      { $unset: { playspace: "" } }
    );

    // Delete the playspace
    await Playspace.findByIdAndDelete(playspaceId);

    revalidatePath("/admin");

    return {
      success: true,
      message: "Playspace and all associated resources deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting playspace:", error);
    return { error: "Failed to delete playspace" };
  }
}

/**
 * Update a playspace's name and description
 *
 * @param playspaceId The ID of the playspace to update
 * @param name New name for the playspace
 * @param description New description for the playspace
 * @param adminKey Optional admin authentication key
 * @returns Success status with updated playspace data or error message
 */
export async function updatePlayspace(
  playspaceId: string,
  name: string,
  description: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    if (!playspaceId) {
      return { error: "Missing playspace ID" };
    }

    if (!name || name.trim() === "") {
      return { error: "Playspace name is required" };
    }

    // Find and update the playspace
    const updatedPlayspace = await Playspace.findByIdAndUpdate(
      playspaceId,
      {
        name: name.trim(),
        description: description.trim(),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedPlayspace) {
      return { error: "Playspace not found" };
    }

    revalidatePath("/admin");

    return {
      success: true,
      playspace: {
        _id: updatedPlayspace._id.toString(),
        name: updatedPlayspace.name,
        description: updatedPlayspace.description,
        isPublic: updatedPlayspace.isPublic,
        devices: updatedPlayspace.devices || [],
        createdAt: updatedPlayspace.createdAt ? new Date(updatedPlayspace.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: updatedPlayspace.updatedAt ? new Date(updatedPlayspace.updatedAt).toISOString() : new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error updating playspace:", error);
    return { error: "Failed to update playspace" };
  }
}

/**
 * Get devices that are accessible with a specific playspace ID
 * This function doesn't require admin privileges
 *
 * @param playspaceId The ID of the playspace
 * @returns An array of device types or an error
 */
export async function getDevicesByPlayspaceId(playspaceId: string) {
  try {
    if (!playspaceId) {
      return { error: "Playspace ID is required" };
    }

    await connectDb();

    // First check if the playspace exists
    const playspace = await Playspace.findById(new mongoose.Types.ObjectId(playspaceId));

    if (!playspace) {
      return { error: "Playspace not found" };
    }

    // In the Device model, each device references its playspace
    // We need to query the Device collection to find all devices belonging to this playspace
    const devices = await Device.find({
      playspace: new mongoose.Types.ObjectId(playspaceId),
    }).select("deviceMacAddress deviceType status");

    return {
      success: true,
      devices: devices.map((device) => ({
        id: device.deviceMacAddress,
        type: device.deviceType, // This is what's used for matching in the UI
        status: device.status,
      })),
    };
  } catch (error) {
    console.error("Error fetching devices for playspace:", error);
    return {
      error: "Failed to fetch devices for playspace",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
