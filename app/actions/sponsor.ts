"use server";

import connectDb from "@/db/connectDb";
import SponsorContact from "@/models/SponsorContact";
import { revalidatePath } from "next/cache";
import { logger } from '@/lib/logger';

export interface SponsorContactFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  message: string;
}

export interface SponsorContactResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

// Submit sponsor contact form
export async function submitSponsorContact(
  formData: SponsorContactFormData
): Promise<SponsorContactResponse> {
  try {
    // Validate required fields
    if (!formData.companyName || !formData.contactName || !formData.email || !formData.message) {
      return {
        success: false,
        message: "All required fields must be filled",
        error: "Missing required fields",
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return {
        success: false,
        message: "Please enter a valid email address",
        error: "Invalid email format",
      };
    }

    // Connect to database
    await connectDb();

    // Check if there's already a recent submission from this email (within last 24 hours)
    const recentSubmission = await SponsorContact.findOne({
      email: formData.email,
      submittedAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      },
    });

    if (recentSubmission) {
      return {
        success: false,
        message: "A contact request from this email was already submitted within the last 24 hours",
        error: "Duplicate submission",
      };
    }

    // Create new sponsor contact record
    const sponsorContact = new SponsorContact({
      companyName: formData.companyName.trim(),
      contactName: formData.contactName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || undefined,
      message: formData.message.trim(),
    });

    // Save to database
    const savedContact = await sponsorContact.save();

    // Revalidate admin pages if they exist
    revalidatePath("/admin");

    return {
      success: true,
      message: "Thank you for your interest! We'll get back to you within 24 hours.",
      data: {
        id: savedContact._id.toString(),
        submittedAt: savedContact.submittedAt.toISOString(),
      },
    };
  } catch (error) {
    logger.error('Error submitting sponsor contact:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    
    return {
      success: false,
      message: "An error occurred while submitting your request. Please try again later.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get all sponsor contacts (admin function)
export async function getSponsorContacts(
  adminKey?: string
): Promise<SponsorContactResponse> {
  try {
    // Basic admin check (you can enhance this based on your admin auth system)
    const validKey = process.env.ADMIN_AUTH_KEY || "hackabyte-admin-key-2024";
    if (adminKey !== validKey) {
      return {
        success: false,
        message: "Unauthorized access",
        error: "Invalid admin key",
      };
    }

    await connectDb();

    const contacts = await SponsorContact.find({})
      .sort({ submittedAt: -1 })
      .lean();

    // Serialize the contact data
    const serializedContacts = contacts.map(contact => ({
      ...contact,
      _id: String(contact._id),
      submittedAt: (contact.submittedAt as Date).toISOString(),
      createdAt: contact.createdAt ? (contact.createdAt as Date).toISOString() : undefined,
      updatedAt: contact.updatedAt ? (contact.updatedAt as Date).toISOString() : undefined,
    }));

    return {
      success: true,
      message: "Sponsor contacts retrieved successfully",
      data: serializedContacts,
    };
  } catch (error) {
    logger.error('Error fetching sponsor contacts:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    
    return {
      success: false,
      message: "Error fetching sponsor contacts",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Update sponsor contact status (admin function)
export async function updateSponsorContactStatus(
  contactId: string,
  status: 'new' | 'contacted' | 'in-progress' | 'closed',
  notes?: string,
  adminKey?: string
): Promise<SponsorContactResponse> {
  try {
    // Basic admin check
    const validKey = process.env.ADMIN_AUTH_KEY || "hackabyte-admin-key-2024";
    if (adminKey !== validKey) {
      return {
        success: false,
        message: "Unauthorized access",
        error: "Invalid admin key",
      };
    }

    await connectDb();

    const updateData: { status: string; notes?: string } = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedContact = await SponsorContact.findByIdAndUpdate(
      contactId,
      updateData,
      { new: true }
    );

    if (!updatedContact) {
      return {
        success: false,
        message: "Sponsor contact not found",
        error: "Contact not found",
      };
    }

    revalidatePath("/admin");

    return {
      success: true,
      message: "Sponsor contact updated successfully",
      data: {
        ...updatedContact.toObject(),
        _id: updatedContact._id.toString(),
        submittedAt: updatedContact.submittedAt.toISOString(),
        createdAt: updatedContact.createdAt?.toISOString(),
        updatedAt: updatedContact.updatedAt?.toISOString(),
      },
    };
  } catch (error) {
    logger.error('Error updating sponsor contact:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    
    return {
      success: false,
      message: "Error updating sponsor contact",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Delete sponsor contact (admin function)
export async function deleteSponsorContact(
  contactId: string,
  adminKey?: string
): Promise<SponsorContactResponse> {
  try {
    // Basic admin check
    const validKey = process.env.ADMIN_AUTH_KEY || "hackabyte-admin-key-2024";
    if (adminKey !== validKey) {
      return {
        success: false,
        message: "Unauthorized access",
        error: "Invalid admin key",
      };
    }

    await connectDb();

    const deletedContact = await SponsorContact.findByIdAndDelete(contactId);

    if (!deletedContact) {
      return {
        success: false,
        message: "Sponsor contact not found",
        error: "Contact not found",
      };
    }

    revalidatePath("/admin");

    return {
      success: true,
      message: "Sponsor contact deleted successfully",
      data: {
        ...deletedContact.toObject(),
        _id: deletedContact._id.toString(),
        submittedAt: deletedContact.submittedAt.toISOString(),
        createdAt: deletedContact.createdAt?.toISOString(),
        updatedAt: deletedContact.updatedAt?.toISOString(),
      },
    };
  } catch (error) {
    logger.error('Error deleting sponsor contact:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    
    return {
      success: false,
      message: "Error deleting sponsor contact",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
