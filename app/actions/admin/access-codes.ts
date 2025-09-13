"use server";

import connectDb from "@/db/connectDb";
import AccessCode, { AccessCodeType } from "@/models/AccessCode";
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

export async function getAccessCodes(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();
    const accessCodes = await AccessCode.find({})
      .select("_id code priority type isActive usageCount maxUsages expiresAt description assignedPlayspace createdAt")
      .populate({
        path: "assignedPlayspace",
        select: "name description",
      })
      .lean() // Use lean() to get plain objects instead of Mongoose documents
      .sort({ priority: 1, createdAt: -1 }); // Sort by priority first (lower numbers first), then by creation date

    // Ensure all access codes have the required fields
    // Also convert MongoDB objects to plain objects to avoid serialization issues
    const safeAccessCodes = accessCodes.map((code) => ({
      _id: code._id ? code._id.toString() : "",
      code: code.code || "",
      priority: code.priority || 5,
      type: code.type || "temporary",
      isActive: typeof code.isActive === "boolean" ? code.isActive : true,
      usageCount: typeof code.usageCount === "number" ? code.usageCount : 0,
      maxUsages: code.maxUsages ? code.maxUsages : undefined,
      expiresAt: code.expiresAt ? new Date(code.expiresAt).toISOString() : undefined,
      description: code.description || "",
      // Serialize assigned playspace properly with additional safety checks
      assignedPlayspace: code.assignedPlayspace
        ? {
            _id: code.assignedPlayspace._id ? code.assignedPlayspace._id.toString() : "",
            name: code.assignedPlayspace.name || "",
            description: code.assignedPlayspace.description || "",
          }
        : null,
      createdAt: code.createdAt ? new Date(code.createdAt).toISOString() : new Date().toISOString(),
    }));

    return { accessCodes: safeAccessCodes };
  } catch (error) {
    logger.error('Error fetching access codes:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to fetch access codes" };
  }
}

export async function generateAccessCode(
  type: string = "temporary",
  priority: number = 5,
  maxUsages?: number,
  expiresInHours?: number,
  description?: string,
  playspaceId?: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Check if playspace already has an access code (one-to-one relationship)
    if (playspaceId) {
      const existingCode = await AccessCode.findOne({ assignedPlayspace: playspaceId });
      if (existingCode) {
        return { error: "This playspace already has an access code assigned. Each playspace can only have one access code." };
      }
    }

    // Validate priority (first digit of code)
    const validatedPriority = Math.max(1, Math.min(9, priority));

    // Generate a 6-digit numeric code with the first digit being the priority
    const remainingDigits = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
    const code = `${validatedPriority}${remainingDigits}`;

    // Calculate expiration date if provided
    const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : undefined;

    // Create new access code
    const newAccessCode = new AccessCode({
      code,
      priority: validatedPriority,
      type: type || "temporary",
      isActive: true,
      usageCount: 0,
      maxUsages: maxUsages,
      expiresAt: expiresAt,
      description: description,
      assignedPlayspace: playspaceId ? new mongoose.Types.ObjectId(playspaceId) : undefined,
    });

    await newAccessCode.save();
    revalidatePath("/admin");

    return {
      success: true,
      accessCode: {
        _id: newAccessCode._id.toString(),
        code: newAccessCode.code,
        priority: newAccessCode.priority,
        type: newAccessCode.type,
        isActive: newAccessCode.isActive,
        usageCount: newAccessCode.usageCount,
        maxUsages: newAccessCode.maxUsages,
        expiresAt: newAccessCode.expiresAt,
        description: newAccessCode.description,
        assignedPlayspace: newAccessCode.assignedPlayspace ? newAccessCode.assignedPlayspace.toString() : null,
        createdAt: newAccessCode.createdAt.toISOString(),
      },
    };
  } catch (error) {
    logger.error('Error generating access code:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to generate access code" };
  }
}

export async function createCustomAccessCode(
  code: string,
  type: string = "permanent",
  priority: number = 1,
  maxUsages?: number,
  expiresInHours?: number,
  description?: string,
  playspaceId?: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Validate code format (must be exactly 6 digits)
    if (!/^\d{6}$/.test(code)) {
      return { error: "Access code must be exactly 6 digits" };
    }

    // Check if the code already exists
    const existingCode = await AccessCode.findOne({ code });
    if (existingCode) {
      return { error: "Access code already exists" };
    }

    // Check if playspace already has an access code (one-to-one relationship)
    if (playspaceId) {
      const existingPlayspaceCode = await AccessCode.findOne({ assignedPlayspace: playspaceId });
      if (existingPlayspaceCode) {
        return { error: "This playspace already has an access code assigned. Each playspace can only have one access code." };
      }
    }

    // Validate priority
    const validatedPriority = Math.max(1, Math.min(9, priority));

    // Calculate expiration date if provided
    const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : undefined;

    // Create new access code
    const newAccessCode = new AccessCode({
      code,
      priority: validatedPriority,
      type: type || "permanent",
      isActive: true,
      usageCount: 0,
      maxUsages: maxUsages,
      expiresAt: expiresAt,
      description: description,
      assignedPlayspace: playspaceId ? new mongoose.Types.ObjectId(playspaceId) : undefined,
    });

    await newAccessCode.save();
    revalidatePath("/admin");

    return {
      success: true,
      accessCode: {
        _id: newAccessCode._id.toString(),
        code: newAccessCode.code,
        priority: newAccessCode.priority,
        type: newAccessCode.type,
        isActive: newAccessCode.isActive,
        usageCount: newAccessCode.usageCount,
        maxUsages: newAccessCode.maxUsages,
        expiresAt: newAccessCode.expiresAt,
        description: newAccessCode.description,
        assignedPlayspace: newAccessCode.assignedPlayspace ? newAccessCode.assignedPlayspace.toString() : null,
        createdAt: newAccessCode.createdAt.toISOString(),
      },
    };
  } catch (error) {
    logger.error('Error creating custom access code:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to create custom access code" };
  }
}

export async function toggleAccessCodeStatus(codeId: string, isActive: boolean, adminKey?: string) {
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

    accessCode.isActive = isActive;
    await accessCode.save();
    revalidatePath("/admin");

    return {
      success: true,
      message: "Access code updated successfully",
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
        assignedPlayspace: accessCode.assignedPlayspace ? {
          _id: accessCode.assignedPlayspace._id ? accessCode.assignedPlayspace._id.toString() : "",
          name: accessCode.assignedPlayspace.name || "",
          description: accessCode.assignedPlayspace.description || "",
        } : null,
      },
    };
  } catch (error) {
    logger.error('Error updating access code:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to update access code" };
  }
}

export async function deleteAccessCode(codeId: string, adminKey?: string) {
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

    await AccessCode.findByIdAndDelete(codeId);
    revalidatePath("/admin");

    return {
      success: true,
      message: "Access code deleted successfully",
    };
  } catch (error) {
    logger.error('Error deleting access code:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to delete access code" };
  }
}

export async function updateAccessCode(
  codeId: string,
  updates: {
    code?: string;
    type?: string;
    priority?: number;
    description?: string;
    maxUsages?: number;
    expiresAt?: Date | null;
    isActive?: boolean;
  },
  authKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(authKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    const accessCode = await AccessCode.findById(codeId);

    if (!accessCode) {
      return { error: "Access code not found" };
    }

    // Check if code already exists when updating code value
    if (updates.code && updates.code !== accessCode.code) {
      const existingCode = await AccessCode.findOne({ code: updates.code });
      if (existingCode) {
        return { error: "Access code already exists" };
      }
    }

    // Update fields if provided
    if (updates.code) {
      accessCode.code = updates.code;
    }
    if (updates.type) {
      accessCode.type = updates.type as AccessCodeType;
    }
    if (updates.priority !== undefined) {
      // Validate priority between 1-9
      accessCode.priority = Math.max(1, Math.min(9, updates.priority));
    }
    if (updates.description !== undefined) {
      accessCode.description = updates.description;
    }
    if (updates.maxUsages !== undefined) {
      accessCode.maxUsages = updates.maxUsages;
    }
    if (updates.expiresAt !== undefined) {
      accessCode.expiresAt = updates.expiresAt || undefined;
    }
    if (updates.isActive !== undefined) {
      accessCode.isActive = updates.isActive;
    }

    await accessCode.save();
    revalidatePath("/admin");

    return {
      success: true,
      message: "Access code updated successfully",
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
        assignedPlayspace: accessCode.assignedPlayspace ? {
          _id: accessCode.assignedPlayspace._id ? accessCode.assignedPlayspace._id.toString() : "",
          name: accessCode.assignedPlayspace.name || "",
          description: accessCode.assignedPlayspace.description || "",
        } : null,
      },
    };
  } catch (error) {
    logger.error('Error updating access code:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to update access code" };
  }
}

export async function linkAccessCodeToPlayspace(codeId: string, playspaceId: string | null, adminKey?: string) {
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

    if (playspaceId) {
      // Check if playspace already has an access code
      const existingCode = await AccessCode.findOne({ assignedPlayspace: playspaceId });
      if (existingCode && existingCode._id.toString() !== codeId) {
        return { error: "This playspace already has an access code assigned. Each playspace can only have one access code." };
      }

      // Verify playspace exists
      const playspace = await Playspace.findById(playspaceId);
      if (!playspace) {
        return { error: "Playspace not found" };
      }

      accessCode.assignedPlayspace = new mongoose.Types.ObjectId(playspaceId);
    } else {
      // Unlink from current playspace
      accessCode.assignedPlayspace = undefined;
    }

    await accessCode.save();
    revalidatePath("/admin");

    return {
      success: true,
      message: playspaceId ? "Access code linked to playspace successfully" : "Access code unlinked from playspace successfully",
      accessCode: {
        _id: accessCode._id.toString(),
        code: accessCode.code,
        assignedPlayspace: accessCode.assignedPlayspace ? {
          _id: accessCode.assignedPlayspace._id ? accessCode.assignedPlayspace._id.toString() : "",
          name: accessCode.assignedPlayspace.name || "",
          description: accessCode.assignedPlayspace.description || "",
        } : null,
      },
    };
  } catch (error) {
    logger.error('Error linking access code to playspace:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to link access code to playspace" };
  }
}
