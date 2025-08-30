"use server";

import connectDb from "../db/connectDb";
import { setCookie } from "cookies-next";
import AccessCodeModel from "../models/AccessCode";
import { logger } from "./logger";

export const handleAccessCode = async (formData: FormData) => {
  try {
    // Connect to the database
    await connectDb();

    // Get the submitted access code
    let accessCode = "";
    for (let i = 0; i < 6; i++) {
      const digit = formData.get(`code-${i}`) as string;
      if (!digit) {
        return { success: false, error: "Please enter a complete 6-digit access code" };
      }
      accessCode += digit;
    }

    // Check if the code is valid (all digits)
    const isFormatValid = /^\d{6}$/.test(accessCode);
    if (!isFormatValid) {
      return { success: false, error: "Invalid code format" };
    }

    // Find the code in the database
    const codeDocument = await AccessCodeModel.findOne({ code: accessCode });

    if (!codeDocument) {
      return { success: false, error: "Invalid access code" };
    }

    // Check if code is active
    if (!codeDocument.isActive) {
      return { success: false, error: "This access code is no longer active" };
    }

    // Check if code has expired (time-limited codes)
    if (codeDocument.type === "time-limited" && codeDocument.expiresAt && new Date() > codeDocument.expiresAt) {
      return { success: false, error: "This access code has expired" };
    }

  // For usage-limited team codes, we don't increment here; we handle usage during role selection

    // Set cookies for the user session - use setCookie from cookies-next
    // Get the first assigned playspace if available
    const playspaceId = codeDocument.assignedPlayspace.toString();

    // Store playspaceId in cookie if available
    if (playspaceId) {
      setCookie("playspaceId", playspaceId, {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }

    return {
      success: true,
      // If usage-limited (team) code, go to role selection flow
      redirect: codeDocument.type === "usage-limited" ? `/role-selection?code=${codeDocument.code}` : "/device-selection",
      userData: codeDocument.userData || {},
      playspaceId: playspaceId,
    };
  } catch (error) {
    logger.error("Database error during access code validation", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: "Database connection failed" };
  }
};

// Helper function to generate new access codes
export const generateAccessCode = async (options = {}) => {
  try {
    await connectDb();

    const codeLength = 6;
    let code = "";

    // Generate a random code
    for (let i = 0; i < codeLength; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }

    // Default options
    const defaultOptions = {
      isOneTimeUse: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      username: "QuantumHacker",
    };

    const codeOptions = { ...defaultOptions, ...options };

    // Create the new code in MongoDB
    const newCode = await AccessCodeModel.create({
      code,
      isExpired: false,
      ...codeOptions,
    });

    return { success: true, code, document: newCode.toObject() };
  } catch (error) {
    logger.error("Failed to generate access code", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: "Failed to generate access code" };
  }
};
