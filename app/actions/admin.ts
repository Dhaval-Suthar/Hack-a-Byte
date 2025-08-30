"use server";

import connectDb from "@/db/connectDb";
import User from "@/models/User";
import AccessCode, { AccessCodeType } from "@/models/AccessCode";
import Team from "@/models/Team";
import Playspace from "@/models/Playspace";
import Device from "@/models/Device";
import Event from "@/models/Event";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { generateMacAddress } from "@/lib/utils";

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

// User Actions
export async function getUsers(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();
    const users = await User.find({})
      .select("_id username email isAuthenticated isMentor isAdmin createdAt")
      .lean() // Use lean() to get plain objects
      .sort({ createdAt: -1 });

    // Ensure all user objects have the required fields with proper defaults
    // Also convert MongoDB objects to plain objects to avoid serialization issues
    const safeUsers = users.map((user) => ({
      _id: user._id ? user._id.toString() : "",
      username: user.username || "Unknown",
      email: user.email || "",
      isAuthenticated: typeof user.isAuthenticated === "boolean" ? user.isAuthenticated : false,
      isMentor: typeof user.isMentor === "boolean" ? user.isMentor : false,
      isAdmin: typeof user.isAdmin === "boolean" ? user.isAdmin : false,
      createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
    }));

    return { users: safeUsers };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error: "Failed to fetch users" };
  }
}

export async function updateUser(userId: string, action: string, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    if (!userId || !action) {
      return { error: "Missing user ID or action" };
    }

    await connectDb();

    // Get the target user
    const user = await User.findById(userId);

    if (!user) {
      return { error: "User not found" };
    }

    // Perform the requested action
    switch (action) {
      case "promoteToAdmin":
        user.isAdmin = true;
        break;
      case "removeAdmin":
        user.isAdmin = false;
        break;
      case "promoteToMentor":
        user.isMentor = true;
        break;
      case "removeMentor":
        user.isMentor = false;
        break;
      case "delete":
        await User.findByIdAndDelete(userId);
        revalidatePath("/admin");
        return {
          success: true,
          message: "User deleted successfully",
        };
      default:
        return { error: "Invalid action" };
    }

    await user.save();
    revalidatePath("/admin");

    return {
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isMentor: user.isMentor,
      },
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return { error: "Failed to update user" };
  }
}

// Access Code Actions
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
    console.error("Error fetching access codes:", error);
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
    console.error("Error generating access code:", error);
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
    console.error("Error creating custom access code:", error);
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
    console.error("Error updating access code:", error);
    return { error: "Failed to update access code" };
  }
}

// Team Actions
export async function getTeams(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();
    const teams = await Team.find({}).select("_id name description leaderUserId members").lean().sort({ createdAt: -1 });

    // Transform the data to include member count and ensure all fields exist
    const teamsWithMemberCount = teams.map((team) => ({
      _id: team._id || "",
      name: team.name || "Unknown Team",
      description: team.description || "No description",
      leaderUserId: team.leaderUserId || "",
      members: Array.isArray(team.members) ? team.members.length : 0,
    }));

    return { teams: teamsWithMemberCount };
  } catch (error) {
    console.error("Error fetching teams:", error);
    return { error: "Failed to fetch teams" };
  }
}

// Playspace Actions
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

// Admin verification and initialization
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
    console.error("Error verifying admin status:", error);
    return {
      isAdmin: false,
      error: "Failed to verify admin status",
    };
  }
}

export async function initializeAdmin(username: string, email: string, password: string, adminCode: string) {
  try {
    // Connect to database
    await connectDb();

    // Check if admin code is valid (should match env variable)
    const validAdminCode = process.env.ADMIN_INITIALIZATION_CODE;

    if (!validAdminCode || adminCode !== validAdminCode) {
      return { error: "Invalid admin code" };
    }

    // Validate input
    if (!username || !email || !password) {
      return { error: "Missing required fields" };
    }

    // Check if any admin user already exists
    const existingAdmin = await User.findOne({ isAdmin: true });

    if (existingAdmin) {
      return {
        error: "Admin account already initialized. Use the admin dashboard to create additional admin accounts.",
      };
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return { error: "Username already exists" };
      }
      if (existingUser.email === email) {
        return { error: "Email already exists" };
      }
    }

    // Create new admin user
    const newAdmin = new User({
      username,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      isAuthenticated: true,
      isAdmin: true,
      progress: {
        currentChapter: 1,
        unlockedApplications: ["Notepad", "MyComputer"],
        skills: {},
      },
      bankAccount: {
        balance: 1000, // Admins start with more credits
        transactions: [
          {
            amount: 1000,
            description: "Admin account initialization",
            timestamp: new Date(),
          },
        ],
      },
    });

    await newAdmin.save();

    // Return success without exposing sensitive information
    const adminData = newAdmin.toObject();
    delete adminData.passwordHash;

    return {
      success: true,
      message: "Admin account created successfully",
      admin: adminData,
    };
  } catch (error) {
    console.error("Error creating admin:", error);
    return { error: "Failed to create admin user" };
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
    console.error("Error updating access code:", error);
    return { error: "Failed to update access code" };
  }
}

// Event Actions
export async function getEvents(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();
    const events = await Event.find({})
      .select(
        "_id title description startDate endDate location category isPublic capacity imageUrl createdAt updatedAt"
      )
      .lean() // Use lean() to get plain objects
      .sort({ startDate: 1, createdAt: -1 });

    // Ensure all event objects have the required fields with proper defaults
    // Also convert MongoDB objects to plain objects to avoid serialization issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeEvents = events.map((event: any) => ({
      _id: event._id ? event._id.toString() : "",
      title: event.title || "No title",
      description: event.description || "",
      startDate: event.startDate ? new Date(event.startDate).toISOString() : new Date().toISOString(),
      endDate: event.endDate ? new Date(event.endDate).toISOString() : new Date().toISOString(),
      location: event.location || "",
      category: event.category || "",
      isPublic: typeof event.isPublic === "boolean" ? event.isPublic : true,
      capacity: typeof event.capacity === "number" ? event.capacity : 0,
      imageUrl: event.imageUrl || "",
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return { events: safeEvents };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { error: "Failed to fetch events" };
  }
}

export async function createEvent(
  title: string,
  description: string,
  startDate: Date,
  endDate: Date,
  location: string,
  category: string,
  isPublic: boolean = true,
  capacity: number = 0,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Create the event
    const newEvent = new Event({
      title,
      description,
      startDate,
      endDate,
      location,
      category,
      isPublic,
      capacity,
    });

    await newEvent.save();
    revalidatePath("/admin");

    return {
      success: true,
      event: {
        _id: newEvent._id.toString(),
        title: newEvent.title,
        description: newEvent.description,
        startDate: newEvent.startDate,
        endDate: newEvent.endDate,
        location: newEvent.location,
        category: newEvent.category,
        isPublic: newEvent.isPublic,
        capacity: newEvent.capacity,
        createdAt: newEvent.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error creating event:", error);
    return { error: "Failed to create event" };
  }
}

export async function updateEvent(
  eventId: string,
  updates: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    category?: string;
    isPublic?: boolean;
    capacity?: number;
  }
) {
  const { isAdmin, error } = await checkAdminStatus();

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    const event = await Event.findById(eventId);

    if (!event) {
      return { error: "Event not found" };
    }

    // Update fields if provided
    if (updates.title !== undefined) {
      event.title = updates.title;
    }
    if (updates.description !== undefined) {
      event.description = updates.description;
    }
    if (updates.startDate !== undefined) {
      event.startDate = updates.startDate;
    }
    if (updates.endDate !== undefined) {
      event.endDate = updates.endDate;
    }
    if (updates.location !== undefined) {
      event.location = updates.location;
    }
    if (updates.category !== undefined) {
      event.category = updates.category;
    }
    if (updates.isPublic !== undefined) {
      event.isPublic = updates.isPublic;
    }
    if (updates.capacity !== undefined) {
      event.capacity = updates.capacity;
    }

    await event.save();
    revalidatePath("/admin");

    return {
      success: true,
      message: "Event updated successfully",
      event: {
        _id: event._id.toString(),
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        category: event.category,
        isPublic: event.isPublic,
        capacity: event.capacity,
      },
    };
  } catch (error) {
    console.error("Error updating event:", error);
    return { error: "Failed to update event" };
  }
}

export async function deleteEvent(eventId: string, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();
    await Event.findByIdAndDelete(eventId);
    revalidatePath("/admin");

    return {
      success: true,
      message: "Event deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { error: "Failed to delete event" };
  }
}

/**
 * Get all devices with their assignment status
 * @param adminKey Optional admin key for authentication
 * @returns List of all devices with playspace assignment info
 */
export async function getAllDevices(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    const devices = await Device.find({})
      .populate("playspace", "name description")
      .select("_id deviceMacAddress deviceType status playspace createdAt")
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedDevices = devices.map((device: any) => ({
      _id: device._id?.toString() || '',
      deviceMacAddress: device.deviceMacAddress || '',
      deviceType: device.deviceType || '',
      status: device.status || 'offline',
      playspace: device.playspace ? {
        _id: device.playspace._id?.toString() || '',
        name: device.playspace.name || '',
        description: device.playspace.description || ''
      } : null,
      createdAt: device.createdAt ? new Date(device.createdAt).toISOString() : new Date().toISOString(),
    }));

    return { devices: formattedDevices };
  } catch (error) {
    console.error("Error fetching devices:", error);
    return { error: "Failed to fetch devices" };
  }
}

/**
 * Create a new device
 * @param deviceType The type of device to create
 * @param adminKey Optional admin key for authentication
 * @returns Success response with created device or error
 */
export async function createDevice(
  deviceType: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Validate device type
    const validDeviceTypes = ["hackbook-w95", "hackbook-e95", "hackbook-l", "hackdroid", "hackphone", "admin-console"];
    if (!validDeviceTypes.includes(deviceType)) {
      return { error: "Invalid device type" };
    }

    // Create default configuration based on device type
    const defaultConfig: {
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
        vulnerabilities: string[];
      };
    } = {
      osVersion: "1.0.0",
      installedApps: [],
      networkSettings: {
        ipAddress: "192.168.1.100",
        subnet: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: ["8.8.8.8", "8.8.4.4"],
        isNetworkEnabled: true,
      },
      securitySettings: {
        firewall: true,
        antiVirus: true,
        vulnerabilities: [],
      },
    };

    // Customize config based on device type
    switch (deviceType) {
      case "hackbook-w95":
        defaultConfig.osVersion = "Windows 95";
        defaultConfig.installedApps = ["Notepad", "Calculator", "Paint"];
        break;
      case "hackbook-e95":
        defaultConfig.osVersion = "Windows 95 Essential";
        defaultConfig.installedApps = ["Notepad", "Calculator", "Paint", "My Computer", "Internet Explorer"];
        break;
      case "hackbook-l":
        defaultConfig.osVersion = "Linux Ubuntu 22.04";
        defaultConfig.installedApps = ["bash", "vim", "gcc"];
        break;
      case "hackdroid":
        defaultConfig.osVersion = "Android 13";
        defaultConfig.installedApps = ["Browser", "Calculator", "Settings"];
        break;
      case "hackphone":
        defaultConfig.osVersion = "iOS 16";
        defaultConfig.installedApps = ["Safari", "Calculator", "Settings"];
        break;
      case "admin-console":
        defaultConfig.osVersion = "Admin Console v1.0";
        defaultConfig.installedApps = ["Terminal", "System Monitor", "User Manager"];
        break;
    }

    // Generate a unique device MacAddress
    const deviceMacAddress = `${generateMacAddress()}`;

    // Create new device
    const newDevice = new Device({
      deviceType,
      deviceMacAddress,
      status: "offline",
      configuration: defaultConfig,
      logs: [],
    });

    await newDevice.save();

    revalidatePath("/admin");

    return {
      success: true,
      message: `Device ${deviceType} created successfully`,
      device: {
        _id: newDevice._id.toString(),
        deviceId: newDevice.deviceMacAddress,
        deviceType: newDevice.deviceType,
        status: newDevice.status,
        playspace: null,
        createdAt: newDevice.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error creating device:", error);
    return { error: "Failed to create device" };
  }
}

/**
 * Assign a device to a playspace
 * @param deviceId The ID of the device to assign (can be ObjectId or MAC address)
 * @param playspaceId The ID of the playspace
 * @param adminKey Optional admin key for authentication
 * @returns Success response or error
 */
export async function assignDeviceToPlayspace(
  deviceId: string,
  playspaceId: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Find device - try ObjectId first, then MAC address if that fails
    let device;
    try {
      device = await Device.findById(deviceId);
    } catch {
      // If ObjectId lookup fails, try finding by MAC address
      device = await Device.findOne({ deviceMacAddress: deviceId });
    }

    if (!device) {
      return { error: "Device not found" };
    }

    // Check if device is already assigned
    if (device.playspace) {
      return { error: "Device is already assigned to a playspace" };
    }

    // Find playspace
    const playspace = await Playspace.findById(playspaceId);
    if (!playspace) {
      return { error: "Playspace not found" };
    }

    // Assign device to playspace
    device.playspace = new mongoose.Types.ObjectId(playspaceId);
    await device.save();

    revalidatePath("/admin");

    return {
      success: true,
      message: `Device assigned to playspace ${playspace.name}`,
      device: {
        _id: device._id.toString(),
        deviceType: device.deviceType,
        status: device.status,
        playspace: {
          _id: playspace._id.toString(),
          name: playspace.name,
          description: playspace.description
        },
      },
    };
  } catch (error) {
    console.error("Error assigning device to playspace:", error);
    return { error: "Failed to assign device to playspace" };
  }
}

/**
 * Unassign a device from its current playspace
 * @param deviceId The ID of the device to unassign (can be ObjectId or MAC address)
 * @param adminKey Optional admin key for authentication
 * @returns Success response or error
 */
export async function unassignDeviceFromPlayspace(
  deviceId: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Find device - try ObjectId first, then MAC address if that fails
    let device;
    try {
      device = await Device.findById(deviceId);
    } catch {
      // If ObjectId lookup fails, try finding by MAC address
      device = await Device.findOne({ deviceMacAddress: deviceId });
    }

    if (!device) {
      return { error: "Device not found" };
    }

    // Check if device is assigned
    if (!device.playspace) {
      return { error: "Device is not assigned to any playspace" };
    }

    // Unassign device
    device.playspace = undefined;
    await device.save();

    revalidatePath("/admin");

    return {
      success: true,
      message: "Device unassigned from playspace",
      device: {
        _id: device._id.toString(),
        deviceType: device.deviceType,
        status: device.status,
        playspace: null,
      },
    };
  } catch (error) {
    console.error("Error unassigning device from playspace:", error);
    return { error: "Failed to unassign device from playspace" };
  }
}

/**
 * Get devices assigned to a specific playspace
 * @param playspaceId The ID of the playspace
 * @param adminKey Optional admin key for authentication
 * @returns List of devices assigned to the playspace
 */
export async function getDevicesByPlayspace(
  playspaceId: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    const devices = await Device.find({ playspace: playspaceId })
      .select('_id deviceType status createdAt')
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedDevices = devices.map((device: any) => ({
      _id: device._id?.toString() || '',
      deviceType: device.deviceType || '',
      status: device.status || 'offline',
      createdAt: device.createdAt ? new Date(device.createdAt).toISOString() : new Date().toISOString(),
    }));

    return { devices: formattedDevices };
  } catch (error) {
    console.error("Error fetching devices for playspace:", error);
    return { error: "Failed to fetch devices for playspace" };
  }
}

/**
 * Delete a device (only if not assigned to any playspace)
 * @param deviceId The ID of the device to delete
 * @param adminKey Optional admin key for authentication
 * @returns Success response or error
 */
export async function deleteDevice(
  deviceId: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Find device - try ObjectId first, then MAC address
    let device;
    try {
      device = await Device.findById(deviceId);
    } catch {
      // If ObjectId lookup fails, try MAC address lookup
      device = await Device.findOne({ deviceMacAddress: deviceId });
    }

    if (!device) {
      return { error: "Device not found" };
    }

    // Check if device is assigned
    if (device.playspace) {
      return { error: "Cannot delete device that is assigned to a playspace. Unassign it first." };
    }

    // Delete device - try ObjectId first, then MAC address
    try {
      await Device.findByIdAndDelete(deviceId);
    } catch {
      // If ObjectId delete fails, try MAC address delete
      await Device.findOneAndDelete({ deviceMacAddress: deviceId });
    }

    revalidatePath("/admin");

    return {
      success: true,
      message: "Device deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting device:", error);
    return { error: "Failed to delete device" };
  }
}

/**
 * Update device status
 * @param deviceId Device ID to update
 * @param newStatus New status for the device
 * @param adminKey Optional admin key for authentication
 * @returns Success response or error
 */
export async function updateDeviceStatus(
  deviceId: string,
  newStatus: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Validate status
    const validStatuses = ['online', 'offline', 'maintenance'];
    if (!validStatuses.includes(newStatus)) {
      return { error: "Invalid status. Must be one of: online, offline, maintenance" };
    }

    // Find and update device - try ObjectId first, then MAC address
    let device;
    try {
      device = await Device.findById(deviceId);
    } catch {
      // If ObjectId lookup fails, try MAC address lookup
      device = await Device.findOne({ deviceMacAddress: deviceId });
    }

    if (!device) {
      return { error: "Device not found" };
    }

    device.status = newStatus;
    await device.save();

    // Convert MongoDB document to plain object for serialization
    const serializedDevice = JSON.parse(JSON.stringify(device));

    revalidatePath("/admin");

    return {
      success: true,
      message: "Device status updated successfully",
      device: serializedDevice,
    };
  } catch (error) {
    console.error("Error updating device status:", error);
    return { error: "Failed to update device status" };
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
    console.error("Error assigning playspace to access code:", error);
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
    console.error("Error fetching available playspaces:", error);
    return { error: "Failed to fetch available playspaces" };
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
    console.error("Error deleting access code:", error);
    return { error: "Failed to delete access code" };
  }
}

// Analytics Actions
export async function getAnalyticsData(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Get counts for all entities
    const [
      totalUsers,
      totalTeams,
      totalAccessCodes,
      totalPlayspaces,
      totalDevices,
      totalEvents,
      activeUsers
    ] = await Promise.all([
      User.countDocuments({}),
      Team.countDocuments({}),
      AccessCode.countDocuments({}),
      Playspace.countDocuments({}),
      Device.countDocuments({}),
      Event.countDocuments({}),
      // Active users (users who have been active in the last 24 hours)
      User.countDocuments({
        updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    // Get sponsor count safely
    let totalSponsors = 0;
    try {
      if (mongoose.connection.db) {
        totalSponsors = await mongoose.connection.db.collection('sponsorcontacts').countDocuments({});
      }
    } catch (error) {
      console.warn("Could not fetch sponsor count:", error);
    }

    // Get recent activity (last 10 activities across all collections)
    const recentActivities: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: string;
    }> = [];

    // Get recent user registrations
    const recentUsers = await User.find({})
      .select("username email createdAt")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    recentUsers.forEach(user => {
      recentActivities.push({
        id: `user-${user._id}`,
        type: "user",
        description: `New user registered: ${user.username}`,
        timestamp: user.createdAt.toISOString()
      });
    });

    // Get recent teams
    const recentTeams = await Team.find({})
      .select("name createdAt")
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();

    recentTeams.forEach(team => {
      recentActivities.push({
        id: `team-${team._id}`,
        type: "team",
        description: `Team '${team.name}' created`,
        timestamp: team.createdAt.toISOString()
      });
    });

    // Get recent devices
    const recentDevices = await Device.find({})
      .select("deviceMacAddress deviceType createdAt")
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();

    recentDevices.forEach(device => {
      recentActivities.push({
        id: `device-${device._id}`,
        type: "device",
        description: `New ${device.deviceType} device registered: ${device.deviceMacAddress}`,
        timestamp: device.createdAt.toISOString()
      });
    });

    // Sort activities by timestamp (most recent first)
    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = recentActivities.slice(0, 10);

    // Get system health data (mock for now, can be enhanced with real system monitoring)
    const systemHealth = {
      status: 'healthy' as const,
      uptime: await getSystemUptime(),
      memoryUsage: await getMemoryUsage(),
      cpuUsage: await getCpuUsage()
    };

    return {
      totalUsers,
      totalTeams,
      totalAccessCodes,
      totalPlayspaces,
      totalDevices,
      totalEvents,
      totalSponsors,
      activeUsers,
      recentActivity,
      systemHealth
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return { error: "Failed to fetch analytics data" };
  }
}

export async function getUserGrowthData(adminKey?: string, days: number = 30) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get user growth data
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    // Get team growth data
    const teamGrowth = await Team.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    return {
      userGrowth,
      teamGrowth,
      period: { startDate, endDate, days }
    };
  } catch (error) {
    console.error("Error fetching growth data:", error);
    return { error: "Failed to fetch growth data" };
  }
}

export async function getDeviceStats(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Get device statistics by type
    const deviceStats = await Device.aggregate([
      {
        $group: {
          _id: "$deviceType",
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get device status distribution
    const statusStats = await Device.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      deviceStats,
      statusStats
    };
  } catch (error) {
    console.error("Error fetching device stats:", error);
    return { error: "Failed to fetch device stats" };
  }
}

export async function getAccessCodeStats(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Get access code statistics
    const totalCodes = await AccessCode.countDocuments({});
    const activeCodes = await AccessCode.countDocuments({ isActive: true });
    const usedCodes = await AccessCode.countDocuments({ usageCount: { $gt: 0 } });

    // Get usage statistics
    const usageStats = await AccessCode.aggregate([
      {
        $group: {
          _id: null,
          totalUsage: { $sum: "$usageCount" },
          avgUsage: { $avg: "$usageCount" },
          maxUsage: { $max: "$usageCount" }
        }
      }
    ]);

    return {
      totalCodes,
      activeCodes,
      usedCodes,
      usageStats: usageStats[0] || { totalUsage: 0, avgUsage: 0, maxUsage: 0 }
    };
  } catch (error) {
    console.error("Error fetching access code stats:", error);
    return { error: "Failed to fetch access code stats" };
  }
}

// System monitoring functions (basic implementations)
async function getSystemUptime(): Promise<string> {
  try {
    // In a real application, you might use process.uptime() or external monitoring
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  } catch {
    return "Unknown";
  }
}

async function getMemoryUsage(): Promise<number> {
  try {
    const memUsage = process.memoryUsage();
    const used = memUsage.heapUsed;
    const total = memUsage.heapTotal;
    return Math.round((used / total) * 100);
  } catch {
    return 0;
  }
}

async function getCpuUsage(): Promise<number> {
  try {
    // Basic CPU usage estimation
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);

    const totalUsage = endUsage.user + endUsage.system;
    const usagePercent = (totalUsage / 1000000) * 100; // Convert to percentage

    return Math.min(Math.round(usagePercent), 100);
  } catch {
    return 0;
  }
}

// Tournament Management Actions
export async function getTournaments(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // For now, we'll return mock tournament data since we don't have a Tournament model
    // In a real implementation, you'd query the Tournament collection
    const mockTournaments = [
      {
        _id: "tournament-1",
        name: "CryptoHeist Championship 2025",
        description: "The ultimate PvP cryptocurrency tournament",
        startDate: new Date("2025-09-01T10:00:00Z").toISOString(),
        endDate: new Date("2025-09-02T18:00:00Z").toISOString(),
        status: "upcoming" as const,
        maxTeams: 32,
        registeredTeams: 24,
        prizePool: 50000,
        gameMode: "tournament",
        createdAt: new Date("2025-08-01T00:00:00Z").toISOString()
      },
      {
        _id: "tournament-2",
        name: "Quick Heist Challenge",
        description: "Fast-paced 30-minute matches",
        startDate: new Date("2025-08-30T14:00:00Z").toISOString(),
        endDate: new Date("2025-08-30T16:00:00Z").toISOString(),
        status: "active" as const,
        maxTeams: 16,
        registeredTeams: 12,
        prizePool: 10000,
        gameMode: "quick",
        createdAt: new Date("2025-08-25T00:00:00Z").toISOString()
      }
    ];

    return { tournaments: mockTournaments };
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return { error: "Failed to fetch tournaments" };
  }
}

export async function createTournament(
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  maxTeams: number,
  prizePool: number,
  gameMode: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Validate input
    if (!name || !startDate || !endDate) {
      return { error: "Missing required fields" };
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return { error: "End date must be after start date" };
    }

    // In a real implementation, you'd create a Tournament document
    // For now, we'll return a mock success response
    const newTournament = {
      _id: `tournament-${Date.now()}`,
      name,
      description,
      startDate,
      endDate,
      status: "upcoming" as const,
      maxTeams: maxTeams || 16,
      registeredTeams: 0,
      prizePool: prizePool || 0,
      gameMode: gameMode || "standard",
      createdAt: new Date().toISOString()
    };

    revalidatePath("/admin");

    return {
      success: true,
      message: "Tournament created successfully",
      tournament: newTournament
    };
  } catch (error) {
    console.error("Error creating tournament:", error);
    return { error: "Failed to create tournament" };
  }
}

export async function updateTournament(
  tournamentId: string,
  updates: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    maxTeams?: number;
    prizePool?: number;
    gameMode?: string;
    status?: string;
  },
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // In a real implementation, you'd update the Tournament document
    // For now, we'll return a mock success response
    const updatedTournament = {
      _id: tournamentId,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    revalidatePath("/admin");

    return {
      success: true,
      message: "Tournament updated successfully",
      tournament: updatedTournament
    };
  } catch (error) {
    console.error("Error updating tournament:", error);
    return { error: "Failed to update tournament" };
  }
}

export async function deleteTournament(tournamentId: string, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // In a real implementation, you'd delete the Tournament document
    // For now, we'll return a mock success response

    revalidatePath("/admin");

    return {
      success: true,
      message: "Tournament deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return { error: "Failed to delete tournament" };
  }
}

// Game Session Management Actions
export async function getGameSessions(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // For now, we'll return mock game session data
    // In a real implementation, you'd query the GameSession collection
    const mockSessions = [
      {
        _id: "session-1",
        tournamentId: "tournament-2",
        team1Id: "team-1",
        team2Id: "team-2",
        team1Name: "CryptoKings",
        team2Name: "DigitalThieves",
        status: "active" as const,
        startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        team1Score: 1250,
        team2Score: 980,
        duration: 900, // 15 minutes in seconds
      },
      {
        _id: "session-2",
        tournamentId: "tournament-2",
        team1Id: "team-3",
        team2Id: "team-4",
        team1Name: "HackMasters",
        team2Name: "CodeBreakers",
        status: "waiting" as const,
        startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        team1Score: 0,
        team2Score: 0,
        duration: 300, // 5 minutes in seconds
      }
    ];

    return { sessions: mockSessions };
  } catch (error) {
    console.error("Error fetching game sessions:", error);
    return { error: "Failed to fetch game sessions" };
  }
}

export async function createGameSession(
  tournamentId: string,
  team1Id: string,
  team2Id: string,
  team1Name: string,
  team2Name: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // In a real implementation, you'd create a GameSession document
    const newSession = {
      _id: `session-${Date.now()}`,
      tournamentId,
      team1Id,
      team2Id,
      team1Name,
      team2Name,
      status: "waiting" as const,
      startTime: new Date().toISOString(),
      team1Score: 0,
      team2Score: 0,
      duration: 0
    };

    revalidatePath("/admin");

    return {
      success: true,
      message: "Game session created successfully",
      session: newSession
    };
  } catch (error) {
    console.error("Error creating game session:", error);
    return { error: "Failed to create game session" };
  }
}

export async function updateGameSessionScore(
  sessionId: string,
  team1Score: number,
  team2Score: number,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // In a real implementation, you'd update the GameSession document
    const updatedSession = {
      _id: sessionId,
      team1Score,
      team2Score,
      updatedAt: new Date().toISOString()
    };

    revalidatePath("/admin");

    return {
      success: true,
      message: "Game session scores updated successfully",
      session: updatedSession
    };
  } catch (error) {
    console.error("Error updating game session:", error);
    return { error: "Failed to update game session" };
  }
}

export async function endGameSession(
  sessionId: string,
  winnerId: string,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // In a real implementation, you'd update the GameSession document
    const endedSession = {
      _id: sessionId,
      status: "completed" as const,
      winner: winnerId,
      endTime: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    revalidatePath("/admin");

    return {
      success: true,
      message: "Game session ended successfully",
      session: endedSession
    };
  } catch (error) {
    console.error("Error ending game session:", error);
    return { error: "Failed to end game session" };
  }
}

// Team Management Actions
export async function getTournamentTeams(tournamentId: string, adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // For now, we'll return mock team data
    // In a real implementation, you'd query teams by tournament
    const mockTeams = [
      {
        _id: "team-1",
        name: "CryptoKings",
        captain: "user-1",
        members: ["user-1", "user-2", "user-3"],
        tournamentId,
        status: "active" as const,
        walletAddress: "1A2B3C4D5E6F",
        currentBalance: 1250,
        createdAt: new Date("2025-08-25T00:00:00Z").toISOString()
      },
      {
        _id: "team-2",
        name: "DigitalThieves",
        captain: "user-4",
        members: ["user-4", "user-5", "user-6"],
        tournamentId,
        status: "active" as const,
        walletAddress: "2B3C4D5E6F7G",
        currentBalance: 980,
        createdAt: new Date("2025-08-25T00:00:00Z").toISOString()
      }
    ];

    return { teams: mockTeams };
  } catch (error) {
    console.error("Error fetching tournament teams:", error);
    return { error: "Failed to fetch tournament teams" };
  }
}

// Leaderboard Actions
export async function getLeaderboards(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // For now, we'll return mock leaderboard data
    // In a real implementation, you'd aggregate data from games and tournaments
    const globalLeaderboard = [
      { rank: 1, teamName: "CryptoKings", totalEarnings: 15420, wins: 12, losses: 2 },
      { rank: 2, teamName: "DigitalThieves", totalEarnings: 12890, wins: 10, losses: 4 },
      { rank: 3, teamName: "HackMasters", totalEarnings: 11250, wins: 9, losses: 5 },
      { rank: 4, teamName: "CodeBreakers", totalEarnings: 9870, wins: 8, losses: 6 },
      { rank: 5, teamName: "CyberNinjas", totalEarnings: 8760, wins: 7, losses: 7 }
    ];

    const currentTournamentLeaderboard = [
      { rank: 1, teamName: "CryptoKings", score: 1250, status: "active" },
      { rank: 2, teamName: "DigitalThieves", score: 980, status: "active" },
      { rank: 3, teamName: "HackMasters", score: 750, status: "eliminated" },
      { rank: 4, teamName: "CodeBreakers", score: 620, status: "waiting" }
    ];

    return {
      globalLeaderboard,
      currentTournamentLeaderboard
    };
  } catch (error) {
    console.error("Error fetching leaderboards:", error);
    return { error: "Failed to fetch leaderboards" };
  }
}

// Wallet/Crypto Management Actions
export async function getWalletStats(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // For now, we'll return mock wallet statistics
    // In a real implementation, you'd aggregate wallet data
    const walletStats = {
      totalWallets: 156,
      activeWallets: 89,
      totalBalance: 456780, // Total crypto across all wallets
      averageBalance: 2920,
      topWallets: [
        { address: "1A2B3C4D5E6F", balance: 15420, owner: "CryptoKings" },
        { address: "2B3C4D5E6F7G", balance: 12890, owner: "DigitalThieves" },
        { address: "3C4D5E6F7G8H", balance: 11250, owner: "HackMasters" }
      ],
      recentTransactions: [
        {
          id: "tx-1",
          from: "1A2B3C4D5E6F",
          to: "2B3C4D5E6F7G",
          amount: 500,
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          type: "transfer"
        },
        {
          id: "tx-2",
          from: "system",
          to: "3C4D5E6F7G8H",
          amount: 1000,
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          type: "mining"
        }
      ]
    };

    return { walletStats };
  } catch (error) {
    console.error("Error fetching wallet stats:", error);
    return { error: "Failed to fetch wallet stats" };
  }
}
