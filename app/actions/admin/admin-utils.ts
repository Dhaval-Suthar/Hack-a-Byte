"use server";

import connectDb from "@/db/connectDb";
import AccessCode from "@/models/AccessCode";
import Playspace from "@/models/Playspace";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { logger } from '@/lib/logger';

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

export async function verifyAdmin(adminKey?: string) {
  try {
    // Check admin status using key authentication
    const { isAdmin, error } = await checkAdminStatus(adminKey);

    if (!isAdmin) {
      return {
        isAdmin: false,
        error: error || "Authentication required",
      };
    }

    // Return admin status
    return { isAdmin: true };
  } catch (error) {
    logger.error('Error verifying admin status:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return {
      isAdmin: false,
      error: "Failed to verify admin status",
    };
  }
}

export async function assignPlayspaceToAccessCode(
  codeId: string,
  playspaceId: string | null,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    const accessCode = await AccessCode.findById(codeId);

    if (!accessCode) {
      return { error: "Access code not found" };
    }

    // If assigning a playspace, check if that playspace already has an access code
    if (playspaceId) {
      const existingCode = await AccessCode.findOne({
        assignedPlayspace: playspaceId,
        _id: { $ne: codeId } // Exclude current code from check
      });

      if (existingCode) {
        return { error: "This playspace already has an access code assigned" };
      }

      // Verify playspace exists
      const playspace = await Playspace.findById(playspaceId);
      if (!playspace) {
        return { error: "Playspace not found" };
      }
    }

    // Update the access code
    accessCode.assignedPlayspace = playspaceId ? new mongoose.Types.ObjectId(playspaceId) : undefined;
    await accessCode.save();

    // If we assigned a playspace, fetch the playspace details for proper serialization
    let assignedPlayspaceData = null;
    if (playspaceId && accessCode.assignedPlayspace) {
      const playspace = await Playspace.findById(playspaceId).select('name description');
      if (playspace) {
        assignedPlayspaceData = {
          _id: playspace._id.toString(),
          name: playspace.name,
          description: playspace.description,
        };
      }
    }

    revalidatePath("/admin");

    return {
      success: true,
      message: playspaceId ? "Playspace assigned successfully" : "Playspace unassigned successfully",
      accessCode: {
        _id: accessCode._id.toString(),
        code: accessCode.code,
        priority: accessCode.priority,
        type: accessCode.type,
        isActive: accessCode.isActive,
        usageCount: accessCode.usageCount,
        maxUsages: accessCode.maxUsages,
        expiresAt: accessCode.expiresAt,
        description: accessCode.description,
        assignedPlayspace: assignedPlayspaceData,
      },
    };
  } catch (error) {
    logger.error('Error assigning playspace to access code:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to assign playspace to access code" };
  }
}

export async function getAvailablePlayspaces(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Get all playspaces that don't have access codes assigned
    const assignedPlayspaceIds = await AccessCode.distinct('assignedPlayspace');

    const availablePlayspaces = await Playspace.find({
      _id: { $nin: assignedPlayspaceIds }
    }).lean();

    // Format the response to ensure consistent structure
    const formattedPlayspaces = availablePlayspaces.map((playspace) => ({
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
    logger.error('Error fetching available playspaces:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to fetch available playspaces" };
  }
}
