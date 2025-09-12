"use server";

import connectDb from "@/db/connectDb";
import Device from "@/models/Device";
import Playspace from "@/models/Playspace";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { generateMacAddress } from "@/lib/utils";
import { createSampleMessagesForDevice } from "@/lib/randomMessageGenerator";

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
    const validDeviceTypes = ["hackbook-w95", "hackbook-l", "hackdroid", "hackphone", "admin-console"];
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

    // If this is a hackphone device, create sample messages
    if (deviceType === 'hackphone') {
      try {
        await createSampleMessagesForDevice(newDevice._id.toString());
      } catch (error) {
        console.error('Error creating sample messages for hackphone:', error);
        // Don't fail device creation if sample message creation fails
      }
    }

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
 * Update device details
 * @param deviceId The ID of the device to update (can be ObjectId or MAC address)
 * @param updates The fields to update
 * @param adminKey Optional admin key for authentication
 * @returns Success response or error
 */
export async function updateDevice(
  deviceId: string,
  updates: { deviceType?: string; status?: string; playspaceId?: string },
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

    // Validate device type if being updated
    if (updates.deviceType) {
      const validDeviceTypes = ["hackbook-w95", "hackbook-l", "hackdroid", "hackphone", "admin-console"];
      if (!validDeviceTypes.includes(updates.deviceType)) {
        return { error: "Invalid device type" };
      }
      device.deviceType = updates.deviceType;
    }

    // Update status if provided
    if (updates.status) {
      const validStatuses = ["online", "offline", "maintenance"];
      if (!validStatuses.includes(updates.status)) {
        return { error: "Invalid device status" };
      }
      device.status = updates.status;
    }

    // Update playspace assignment if provided
    if (updates.playspaceId !== undefined) {
      if (updates.playspaceId) {
        // Assign to new playspace
        const playspace = await Playspace.findById(updates.playspaceId);
        if (!playspace) {
          return { error: "Playspace not found" };
        }
        device.playspace = new mongoose.Types.ObjectId(updates.playspaceId);
      } else {
        // Unassign from current playspace
        device.playspace = undefined;
      }
    }

    await device.save();

    // Populate playspace info for response
    await device.populate("playspace", "name description");

    revalidatePath("/admin");

    return {
      success: true,
      message: "Device updated successfully",
      device: {
        _id: device._id.toString(),
        deviceMacAddress: device.deviceMacAddress,
        deviceType: device.deviceType,
        status: device.status,
        playspace: device.playspace ? {
          _id: device.playspace._id.toString(),
          name: device.playspace.name,
          description: device.playspace.description
        } : null,
      },
    };
  } catch (error) {
    console.error("Error updating device:", error);
    return { error: "Failed to update device" };
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
