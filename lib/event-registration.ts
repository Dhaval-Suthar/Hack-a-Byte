"use server";

import connectDb from "@/db/connectDb";
import EventRegistration from "@/models/EventRegistration";
import Team from "@/models/Team";
import mongoose from "mongoose";
import crypto from "crypto";
import { createAccessCodeAndPlayspace } from "@/lib/access-code-generation";
import { sendAccessCodeEmail } from "@/lib/nodemailer";
import { logger } from "./logger";

export interface CompleteRegistrationArgs {
  registrationId: string;
  eventId: number;
  eventTitle: string;
  email: string;
  numberOfPlayers: number;
  playingDevice: "smartphone" | "pc_laptop";
}

export interface CompleteRegistrationResult {
  success: boolean;
  error?: string;
  accessCode?: string;
  playspaceName?: string;
}

// Create or fetch a team for this registration
async function ensureTeamForRegistration(params: {
  registrationId: string;
  eventId: number;
  eventTitle: string;
  numberOfPlayers: number;
  accessCodeId?: string;
  playspaceId?: string;
  deviceId?: string;
  accessCode?: string;
}) {
  const existing = await Team.findOne({ registrationId: params.registrationId });
  if (existing) return existing;

  // Generate wallet credentials
  const walletAddress = crypto
    .createHash("sha256")
    .update(`${params.registrationId}:${Date.now()}`)
    .digest("hex")
    .slice(0, 42);
  const privateKey = crypto.randomBytes(32).toString("hex");
  const publicKey = crypto.createHash("sha256").update(privateKey).digest("hex").slice(0, 66);

  // Initialize member slots
  const teamMembers = Array.from({ length: params.numberOfPlayers }, () => ({ accessCodeUsed: false }));

  // Ensure unique team name: include full access code if present; fallback to registration ID short
  const uniqueSuffix = params.accessCode || params.registrationId.slice(-6);
  const name = `${params.eventTitle} - Team ${uniqueSuffix}`;

  const team = new Team({
    name,
    description: `Team for ${params.eventTitle}`,
    leaderUserId: null,
    members: [],
    registrationId: params.registrationId,
    eventId: params.eventId,
    numberOfPlayers: params.numberOfPlayers,
    accessCodeId: params.accessCodeId ? new mongoose.Types.ObjectId(params.accessCodeId) : undefined,
    playspaceId: params.playspaceId ? new mongoose.Types.ObjectId(params.playspaceId) : undefined,
    deviceId: params.deviceId ? new mongoose.Types.ObjectId(params.deviceId) : undefined,
    wallet: {
      walletAddress,
      privateKey,
      publicKey,
      bitcoinBalance: 1000,
    },
    teamMembers,
    timer: {
      isActive: false,
      elapsedTime: 0,
      totalPausedTime: 0,
    },
  });

  await team.save();
  return team;
}

// Central pipeline used by both free and paid flows
export async function completeRegistrationPipeline(
  args: CompleteRegistrationArgs
): Promise<CompleteRegistrationResult> {
  try {
    const { registrationId, eventId, eventTitle, email, numberOfPlayers, playingDevice } = args;
    await connectDb();

    const registration = await EventRegistration.findById(registrationId);
    if (!registration) {
      return { success: false, error: "Registration not found" };
    }

    // Step 1: Generate access code and playspace if missing
    let accessCodeId = registration.accessCodeId?.toString();
    let playspaceId = registration.playspaceId?.toString();
    let accessCode: string | undefined;
    let playspaceName: string | undefined;
    let deviceId: string | undefined;

    if (!accessCodeId || !playspaceId) {
      const acResult = await createAccessCodeAndPlayspace({
        numberOfPlayers,
        playingDevice,
        eventTitle,
        registrationId,
        codePrefix: '3', // event access codes must start with '3'
      });
      if (!acResult.success) {
        return { success: false, error: acResult.error || "Failed to create access code" };
      }
      accessCodeId = acResult.accessCodeId;
      playspaceId = acResult.playspaceId;
      accessCode = acResult.accessCode;
      playspaceName = acResult.playspaceName;
      deviceId = acResult.deviceId;

      // Persist on registration
      registration.accessCodeId = accessCodeId ? new mongoose.Types.ObjectId(accessCodeId) : undefined;
      registration.playspaceId = playspaceId ? new mongoose.Types.ObjectId(playspaceId) : undefined;
      await registration.save();
    }

    // If we already had an access code, fetch its value for email/team naming
    if (!accessCode && registration.accessCodeId) {
      // Lazy import to avoid circular issues
      const AccessCodeModel = (await import("@/models/AccessCode")).default;
      const codeDoc = await AccessCodeModel.findById(registration.accessCodeId);
      accessCode = codeDoc?.code;
    }

    // Step 2: Ensure team exists for this registration
    await ensureTeamForRegistration({
      registrationId,
      eventId,
      eventTitle,
      numberOfPlayers,
      accessCodeId: accessCodeId,
      playspaceId: playspaceId,
      deviceId,
      accessCode,
    });

    // Step 3: Send access code email (idempotent-ish)
    const team = await Team.findOne({ registrationId });
    const walletAddress = team?.wallet?.walletAddress;
    const privateKey = team?.wallet?.privateKey;
    
    const emailResult = await sendAccessCodeEmail({
      email: email.toLowerCase(),
      eventTitle,
      accessCode: accessCode!,
      numberOfPlayers,
      playingDevice: playingDevice === "smartphone" ? "Smartphone" : "PC/Laptop",
      maxUsages: numberOfPlayers,
      playspaceName: playspaceName || `${eventTitle} - Team ${accessCode}`,
      walletAddress,
      privateKey
    });

    if (emailResult.success) {
      registration.accessCodeSent = true;
      registration.accessCodeSentAt = new Date();
      await registration.save();
    }

    return { success: true, accessCode, playspaceName };
  } catch (err) {
    logger.error("Registration pipeline failed", { error: err instanceof Error ? err.message : String(err) });
    return { success: false, error: "Failed to complete registration" };
  }
}
