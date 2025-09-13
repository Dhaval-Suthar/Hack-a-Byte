"use server";

import connectDb from "@/db/connectDb";
import Event from "@/models/Event";
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

export async function getEvents(adminKey?: string) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();
    const events = await Event.find({})
      .select(
        "_id title description startDate endDate location category isPublic capacity imageUrl createdAt updatedAt requiredDeviceTypes requiredDevices minTeamMembers maxTeamMembers pricing registrationEnabled"
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
      registrationEnabled: typeof event.registrationEnabled === "boolean" ? event.registrationEnabled : true,
      imageUrl: event.imageUrl || "",
      requiredDeviceTypes: event.requiredDeviceTypes ? {
        mobile: typeof event.requiredDeviceTypes.mobile === "boolean" ? event.requiredDeviceTypes.mobile : false,
        desktop: typeof event.requiredDeviceTypes.desktop === "boolean" ? event.requiredDeviceTypes.desktop : false,
      } : { mobile: false, desktop: false },
      requiredDevices: event.requiredDevices ? {
        mobile: Array.isArray(event.requiredDevices.mobile) ? event.requiredDevices.mobile : [],
        desktop: Array.isArray(event.requiredDevices.desktop) ? event.requiredDevices.desktop : [],
      } : { mobile: [], desktop: [] },
      minTeamMembers: typeof event.minTeamMembers === "number" ? event.minTeamMembers : 1,
      maxTeamMembers: typeof event.maxTeamMembers === "number" ? event.maxTeamMembers : 4,
      pricing: event.pricing ? {
        normal: typeof event.pricing.normal === "number" ? event.pricing.normal : 0,
        extended: typeof event.pricing.extended === "number" ? event.pricing.extended : 0,
      } : { normal: 0, extended: 0 },
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return { events: safeEvents };
  } catch (error) {
    logger.error('Error fetching events:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
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
  requiredDeviceTypes: { mobile: boolean; desktop: boolean },
  requiredDevices: { mobile: string[]; desktop: string[] },
  minTeamMembers: number,
  maxTeamMembers: number,
  pricingNormal: number,
  pricingExtended?: number,
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

  if (!isAdmin) {
    return { error };
  }

  try {
    await connectDb();

    // Validate team member range
    if (minTeamMembers > maxTeamMembers) {
      return { error: "Minimum team members cannot be greater than maximum team members" };
    }

    if (minTeamMembers < 1) {
      return { error: "Minimum team members must be at least 1" };
    }

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
      requiredDeviceTypes,
      requiredDevices,
      minTeamMembers,
      maxTeamMembers,
      pricing: {
        normal: pricingNormal,
        ...(pricingExtended !== undefined && { extended: pricingExtended }),
      },
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
        requiredDeviceTypes: newEvent.requiredDeviceTypes,
        requiredDevices: newEvent.requiredDevices,
        minTeamMembers: newEvent.minTeamMembers,
        maxTeamMembers: newEvent.maxTeamMembers,
        pricing: newEvent.pricing,
        createdAt: newEvent.createdAt.toISOString(),
      },
    };
  } catch (error) {
    logger.error('Error creating event:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
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
    requiredDeviceTypes?: { mobile: boolean; desktop: boolean };
    requiredDevices?: { mobile: string[]; desktop: string[] };
    minTeamMembers?: number;
    maxTeamMembers?: number;
    pricingNormal?: number;
    pricingExtended?: number;
  },
  adminKey?: string
) {
  const { isAdmin, error } = await checkAdminStatus(adminKey);

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
    if (updates.requiredDeviceTypes !== undefined) {
      event.requiredDeviceTypes = updates.requiredDeviceTypes;
    }
    if (updates.requiredDevices !== undefined) {
      event.requiredDevices = updates.requiredDevices;
    }
    if (updates.minTeamMembers !== undefined) {
      event.minTeamMembers = updates.minTeamMembers;
    }
    if (updates.maxTeamMembers !== undefined) {
      event.maxTeamMembers = updates.maxTeamMembers;
    }
    if (updates.pricingNormal !== undefined || updates.pricingExtended !== undefined) {
      event.pricing = {
        normal: updates.pricingNormal !== undefined ? updates.pricingNormal : event.pricing?.normal || 0,
        ...(updates.pricingExtended !== undefined && { extended: updates.pricingExtended }),
      };
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
        requiredDeviceTypes: event.requiredDeviceTypes,
        requiredDevices: event.requiredDevices,
        minTeamMembers: event.minTeamMembers,
        maxTeamMembers: event.maxTeamMembers,
        pricing: event.pricing,
      },
    };
  } catch (error) {
    logger.error('Error updating event:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
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
    logger.error('Error deleting event:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to delete event" };
  }
}

export async function getPublicEvents() {
  try {
    await connectDb();

    const events = await Event.find({ isPublic: true }).sort({ startDate: 1 });

    // Transform database events to match frontend Event interface
    const transformedEvents = events.map((event, index) => ({
      // Keep a stable numeric id for UI (fallback index) but also expose real objectId for actions
      id: parseInt(event._id.toString().slice(-6), 16) || index + 1, // pseudo numeric id for legacy usage
      objectId: event._id.toString(),
      title: event.title,
      date: event.startDate ? event.startDate.toISOString() : new Date().toISOString(),
      time: event.startDate && event.endDate
        ? `${event.startDate.toTimeString().slice(0, 5)} - ${event.endDate.toTimeString().slice(0, 5)}`
        : "TBD",
      location: event.location || "TBD",
      description: event.description || "",
      type: event.category || "Event",
      capacity: event.capacity || 0,
      registered: 0, // This will be updated with registration counts
      registrationEnabled: event.registrationEnabled !== false, // Default to true if not set
      difficulty: "Intermediate" as const,
      tags: event.category ? [event.category] : ["Event"],
      speakers: [],
      prizes: [],
      schedule: [],
      pricing: event.pricing ? { normal: event.pricing.normal, extended: event.pricing.extended } : undefined,
      deviceRequirements: {
        types: event.requiredDeviceTypes || { mobile: false, desktop: false },
        devices: event.requiredDevices || { mobile: [], desktop: [] },
      },
      minTeamMembers: event.minTeamMembers || 1,
      maxTeamMembers: event.maxTeamMembers || 4,
    }));

    return { events: transformedEvents };
  } catch (error) {
    logger.error('Error fetching public events:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { error: "Failed to fetch events" };
  }
}
