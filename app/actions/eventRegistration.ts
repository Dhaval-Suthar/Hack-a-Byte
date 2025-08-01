"use server";

import connectDb from "@/db/connectDb";
import EventRegistration from "@/models/EventRegistration";

export interface EventRegistrationData {
  eventId: number;
  email: string;
  isFromSFIT: boolean;
  playingMode: "online" | "offline";
}

export async function registerForEvent(data: EventRegistrationData) {
  try {
    const { eventId, email, isFromSFIT, playingMode } = data;
    
    // Validate inputs
    if (!eventId || !email) {
      return { 
        success: false, 
        error: "Event ID and email are required" 
      };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { 
        success: false, 
        error: "Please enter a valid email address" 
      };
    }
    
    await connectDb();
    
    // Check if user is already registered for this event
    const existingRegistration = await EventRegistration.findOne({ 
      eventId, 
      email: email.toLowerCase() 
    });
    
    if (existingRegistration) {
      return { 
        success: false, 
        error: "You are already registered for this event" 
      };
    }
    
    // Create registration
    const registration = new EventRegistration({
      eventId,
      email: email.toLowerCase(),
      isFromSFIT: Boolean(isFromSFIT),
      playingMode,
      registrationDate: new Date()
    });
    
    await registration.save();
    
    return { 
      success: true, 
      message: "Successfully registered for the event!",
      registrationId: registration._id.toString()
    };
    
  } catch (error: unknown) {
    console.error("Event registration error:", error);
    
    // Handle duplicate key error specifically
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return { 
        success: false, 
        error: "You are already registered for this event" 
      };
    }
    
    return { 
      success: false, 
      error: "Failed to register for event. Please try again." 
    };
  }
}

export async function unregisterFromEvent(eventId: number, email: string) {
  try {
    if (!eventId || !email) {
      return { 
        success: false, 
        error: "Event ID and email are required" 
      };
    }
    
    await connectDb();
    
    const result = await EventRegistration.findOneAndDelete({ 
      eventId, 
      email: email.toLowerCase() 
    });
    
    if (!result) {
      return { 
        success: false, 
        error: "Registration not found" 
      };
    }
    
    return { 
      success: true, 
      message: "Successfully unregistered from the event" 
    };
    
  } catch (error: unknown) {
    console.error("Event unregistration error:", error);
    return { 
      success: false, 
      error: "Failed to unregister from event. Please try again." 
    };
  }
}

export async function checkRegistrationStatus(eventId: number, email: string) {
  try {
    if (!eventId || !email) {
      return { 
        success: false, 
        isRegistered: false 
      };
    }
    
    await connectDb();
    
    const registration = await EventRegistration.findOne({ 
      eventId, 
      email: email.toLowerCase() 
    });
    
    return { 
      success: true, 
      isRegistered: !!registration,
      registrationData: registration ? {
        isFromSFIT: registration.isFromSFIT,
        registrationDate: registration.registrationDate.toISOString()
      } : null
    };
    
  } catch (error: unknown) {
    console.error("Check registration status error:", error);
    return { 
      success: false, 
      isRegistered: false 
    };
  }
}

export async function getEventRegistrationCount(eventId: number) {
  try {
    await connectDb();
    
    const count = await EventRegistration.countDocuments({ eventId });
    const sfitCount = await EventRegistration.countDocuments({ 
      eventId, 
      isFromSFIT: true 
    });
    
    return { 
      success: true, 
      totalRegistrations: count,
      sfitRegistrations: sfitCount,
      externalRegistrations: count - sfitCount
    };
    
  } catch (error: unknown) {
    console.error("Get registration count error:", error);
    return { 
      success: false, 
      totalRegistrations: 0,
      sfitRegistrations: 0,
      externalRegistrations: 0
    };
  }
}

export async function getAllEventsWithRegistrationCounts() {
  try {
    await connectDb();
    
    // Get all event IDs that have registrations
    const registrationData = await EventRegistration.aggregate([
      {
        $group: {
          _id: "$eventId",
          totalRegistrations: { $sum: 1 },
          sfitRegistrations: {
            $sum: { $cond: [{ $eq: ["$isFromSFIT", true] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Convert to a map for easier lookup
    const registrationMap: Record<number, { total: number; sfit: number }> = {};
    registrationData.forEach(item => {
      registrationMap[item._id] = {
        total: item.totalRegistrations,
        sfit: item.sfitRegistrations
      };
    });
    
    return { 
      success: true, 
      registrationCounts: registrationMap
    };
    
  } catch (error: unknown) {
    console.error("Get all events registration counts error:", error);
    return { 
      success: false, 
      registrationCounts: {}
    };
  }
}
