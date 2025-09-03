"use server";

import connectDb from "@/db/connectDb";
import Event from "@/models/Event";
import EventRegistration from "@/models/EventRegistration";
import { AccessCode } from "@/models/AccessCode";
import { completeRegistrationPipeline } from "@/lib/event-registration";
import { sendAccessCodeEmail } from "@/lib/nodemailer";

export interface EventRegistrationData {
  eventId: number;
  eventObjectId?: string;
  email: string;
  playingDevice: "smartphone" | "pc_laptop";
  numberOfPlayers: number;
  pricingType?: "normal" | "extended";
}

export interface EventRegistrationResult {
  success: boolean;
  message?: string;
  registrationId?: string;
  accessCode?: string;
  playspaceName?: string;
  error?: string;
}

export async function registerForEvent(data: EventRegistrationData): Promise<EventRegistrationResult> {
  try {
  const { eventId, eventObjectId, email, playingDevice, numberOfPlayers, pricingType = "normal" } = data;
    
    // Validate inputs
    if (!eventId || !email || !playingDevice || !numberOfPlayers) {
      return { 
        success: false, 
        error: "All fields are required" 
      };
    }

    await connectDb();
    
    // Fetch event data to get team size limits
    let event;
    if (eventObjectId) {
      try {
        event = await Event.findById(eventObjectId);
      } catch {
        return { success: false, error: "Invalid event id" };
      }
    } else {
      // Fallback: derive by scanning events and matching transformed numeric id logic
      const all = await Event.find({});
      event = all.find(e => {
        const derived = parseInt(e._id.toString().slice(-6), 16);
        return derived === eventId;
      });
    }
    if (!event) {
      return { 
        success: false, 
        error: "Event not found" 
      };
    }

    const minPlayers = event.minTeamMembers || 1;
    const maxPlayers = event.maxTeamMembers || 4;

    // Validate number of players based on event limits
    if (numberOfPlayers < minPlayers || numberOfPlayers > maxPlayers) {
      return { 
        success: false, 
        error: `Number of players must be between ${minPlayers} and ${maxPlayers}` 
      };
    }
    
    // Create registration (allowing multiple registrations per email)
    const registration = new EventRegistration({
      eventId,
      email: email.toLowerCase(),
      playingDevice,
      numberOfPlayers,
      pricingType,
      paymentStatus: "paid", // For free events or non-Mosaic events
      registrationDate: new Date(),
      accessCodeSent: false
    });
    
    await registration.save();
    const registrationId = registration._id.toString();

    // Complete registration via shared pipeline (access code, team, email)
    const { success, error, accessCode, playspaceName } = await completeRegistrationPipeline({
      registrationId,
      eventId,
      eventTitle: `Event ${eventId}`,
      email,
      numberOfPlayers,
      playingDevice
    });
    if (!success) {
      return { success: false, error };
    }
    
    return { 
      success: true, 
      message: "Successfully registered for the event! Check your email for the access code.",
      registrationId,
      accessCode,
      playspaceName
    };
    
  } catch (error: unknown) {
    console.error("Event registration error:", error);
    
  // Duplicate key is unlikely since we allow multiple registrations; keep generic message
    
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
    return { 
      success: true, 
      totalRegistrations: count
    };
    
  } catch (error: unknown) {
    console.error("Get registration count error:", error);
    return { 
      success: false, 
  totalRegistrations: 0
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
          totalRegistrations: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to a map for easier lookup
    const registrationMap: Record<number, { total: number }> = {};
    registrationData.forEach(item => {
      registrationMap[item._id] = {
        total: item.totalRegistrations
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

export async function resendAccessCode(registrationId: string): Promise<EventRegistrationResult> {
  try {
    await connectDb();
    
    // Find the registration
    const registration = await EventRegistration.findById(registrationId)
      .populate('accessCodeId')
      .populate('playspaceId');
    
    if (!registration) {
      return {
        success: false,
        error: "Registration not found"
      };
    }
    
    if (!registration.accessCodeId) {
      return {
        success: false,
        error: "No access code found for this registration"
      };
    }
    
    // Get the access code details
    const accessCode = registration.accessCodeId as AccessCode;
    const playspace = registration.playspaceId as { _id: string; name: string; description: string };
    
    // Resend the email
    const emailResult = await sendAccessCodeEmail({
      email: registration.email,
      eventTitle: `Event ${registration.eventId}`,
      accessCode: accessCode.code,
      numberOfPlayers: registration.numberOfPlayers,
      playingDevice: registration.playingDevice === "smartphone" ? "Smartphone" : "PC/Laptop",
      maxUsages: accessCode.maxUsages || registration.numberOfPlayers,
      playspaceName: playspace?.name || `Event ${registration.eventId} - Team ${accessCode.code}`,
      instructions: "This is a resent access code. Use it to enter your gaming environment."
    });
    
    if (emailResult.success) {
      // Update the sent status
      registration.accessCodeSent = true;
      registration.accessCodeSentAt = new Date();
      await registration.save();
      
      return {
        success: true,
        message: "Access code resent successfully!",
        registrationId: registration._id.toString(),
        accessCode: accessCode.code,
        playspaceName: playspace?.name
      };
    } else {
      return {
        success: false,
        error: `Failed to resend access code: ${emailResult.error}`
      };
    }
    
  } catch (error: unknown) {
    console.error("Resend access code error:", error);
    return {
      success: false,
      error: "Failed to resend access code. Please try again."
    };
  }
}

export async function getRegistrationDetails(registrationId: string) {
  try {
    await connectDb();
    
    const registration = await EventRegistration.findById(registrationId)
      .populate('accessCodeId')
      .populate('playspaceId');
    
    if (!registration) {
      return {
        success: false,
        error: "Registration not found"
      };
    }
    
    const accessCode = registration.accessCodeId as AccessCode;
    const playspace = registration.playspaceId as { _id: string; name: string; description: string };
    
    return {
      success: true,
      registration: {
        _id: registration._id.toString(),
        eventId: registration.eventId,
        email: registration.email,
        playingDevice: registration.playingDevice,
        numberOfPlayers: registration.numberOfPlayers,
        paymentStatus: registration.paymentStatus,
        registrationDate: registration.registrationDate.toISOString(),
        accessCodeSent: registration.accessCodeSent,
        accessCodeSentAt: registration.accessCodeSentAt?.toISOString(),
        accessCode: accessCode ? {
          code: accessCode.code,
          usageCount: accessCode.usageCount,
          maxUsages: accessCode.maxUsages,
          isActive: accessCode.isActive
        } : null,
        playspace: playspace ? {
          _id: playspace._id.toString(),
          name: playspace.name,
          description: playspace.description
        } : null
      }
    };
    
  } catch (error: unknown) {
    console.error("Get registration details error:", error);
    return {
      success: false,
      error: "Failed to fetch registration details"
    };
  }
}

