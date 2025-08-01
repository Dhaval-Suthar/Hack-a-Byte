"use server";

import connectDb from "@/db/connectDb";
import SponsorContact from "@/models/SponsorContact";
import { revalidatePath } from "next/cache";

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
        id: savedContact._id,
        submittedAt: savedContact.submittedAt,
      },
    };
  } catch (error) {
    console.error("Error submitting sponsor contact:", error);
    
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
    if (adminKey !== "hackabyte-admin-key-2024") {
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

    return {
      success: true,
      message: "Sponsor contacts retrieved successfully",
      data: contacts,
    };
  } catch (error) {
    console.error("Error fetching sponsor contacts:", error);
    
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
    if (adminKey !== "hackabyte-admin-key-2024") {
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
      data: updatedContact,
    };
  } catch (error) {
    console.error("Error updating sponsor contact:", error);
    
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
    if (adminKey !== "hackabyte-admin-key-2024") {
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
      data: deletedContact,
    };
  } catch (error) {
    console.error("Error deleting sponsor contact:", error);
    
    return {
      success: false,
      message: "Error deleting sponsor contact",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
