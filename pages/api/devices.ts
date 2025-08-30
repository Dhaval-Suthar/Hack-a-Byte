import { NextApiRequest, NextApiResponse } from "next/types";
import connectDb from "@/db/connectDb";
import Device from "@/models/Device";
import { logger } from "@/lib/logger";
import { checkFormSubmissionRate } from "@/lib/validation";

interface DeviceResponse {
  id: string;
  deviceMacAddress: string;
  deviceType: string;
  status: string;
  ipAddress: string;
  securityLevel: "low" | "medium" | "high";
  vulnerabilities: string[];
  lastSeen: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    logger.warn('Invalid method attempted on devices API', { method: req.method, ip: req.socket.remoteAddress });
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limiting check
  const clientIP = req.socket.remoteAddress || req.headers['x-forwarded-for'] as string || 'unknown';
  if (!checkFormSubmissionRate(clientIP)) {
    logger.warn('Rate limit exceeded for devices API', { ip: clientIP });
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  try {
    await connectDb();

    // Fetch all devices with their basic information
    const devices = await Device.find({})
      .select(
        "deviceMacAddress deviceType status configuration.networkSettings.ipAddress configuration.securitySettings createdAt"
      )
      .lean();

    // Transform the data to match our app's interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedDevices: DeviceResponse[] = (devices as any[]).map((device) => ({
      id: device._id.toString(),
      deviceMacAddress: device.deviceMacAddress,
      deviceType: device.deviceType,
      status: device.status,
      ipAddress: device.configuration?.networkSettings?.ipAddress || "Unknown",
      securityLevel: calculateSecurityLevel(device.configuration?.securitySettings),
      vulnerabilities: device.configuration?.securitySettings?.vulnerabilities || [],
      lastSeen: device.createdAt,
    }));

    logger.info('Devices fetched successfully', { count: transformedDevices.length, ip: clientIP });
    res.status(200).json({
      success: true,
      devices: transformedDevices,
    });
  } catch (error) {
    logger.error("Failed to fetch devices", { 
      error: error instanceof Error ? error.message : String(error),
      ip: clientIP
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch devices",
    });
  }
}

function calculateSecurityLevel(securitySettings?: {
  firewall?: boolean;
  antiVirus?: boolean;
  vulnerabilities?: string[];
}): "low" | "medium" | "high" {
  if (!securitySettings) return "low";

  let score = 0;

  if (securitySettings.firewall) score += 1;
  if (securitySettings.antiVirus) score += 1;
  if (!securitySettings.vulnerabilities || securitySettings.vulnerabilities.length === 0) score += 1;

  if (score >= 2) return "high";
  if (score === 1) return "medium";
  return "low";
}
