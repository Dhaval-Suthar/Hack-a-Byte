import { NextApiRequest, NextApiResponse } from "next/types";
import connectDb from "@/db/connectDb";
import Device from "@/models/Device";
import Team from "@/models/Team";
import { bankState, evaluateBankState, getBankPublicState } from '@/lib/bankState';
import { processDeviceRecoveries } from '@/lib/deviceRecovery';
import { getServerIo } from '@/lib/socket';
import { logger } from "@/lib/logger";
import { checkFormSubmissionRate } from "@/lib/validation";

interface DeviceResponse {
  id: string;
  deviceMacAddress: string;
  deviceType: string;
  status: string;
  ipAddress: string;
  securityLevel: "low" | "medium" | "high" | "extreme";
  vulnerabilities: string[];
  lastSeen: string;
  teamId?: string;
  bitcoinBalance?: number;
  isBank?: boolean;
  configuration?: {
    securitySettings?: {
      firewall?: boolean;
      antiVirus?: boolean;
      vpn?: boolean;
      enc?: boolean;
      ids?: boolean;
      vulnerabilities?: string[];
    };
  };
}

// Helper: build synthetic bank device based on centralized state
function buildBankDevice(): DeviceResponse | null {
  if (!bankState.online) return null;
  
  // Banks typically have all security features enabled
  const bankSecuritySettings = {
    firewall: true,
    antiVirus: true,
    vpn: true,
    enc: true,
    ids: true,
    vulnerabilities: []
  };
  
  return {
    id: 'bank-sim-device',
    deviceMacAddress: 'BA:NK:' + Math.random().toString(16).slice(2, 8).toUpperCase(),
    deviceType: 'bank',
    status: 'online',
    ipAddress: `10.0.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`,
    securityLevel: calculateSecurityLevel(bankSecuritySettings),
    vulnerabilities: [],
    lastSeen: new Date().toISOString(),
    isBank: true,
    configuration: {
      securitySettings: bankSecuritySettings
    }
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    logger.warn('Invalid method attempted on devices/scan API', { method: req.method, ip: req.socket.remoteAddress });
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limiting check
  const clientIP = req.socket.remoteAddress || req.headers['x-forwarded-for'] as string || 'unknown';
  if (!checkFormSubmissionRate(clientIP)) {
    logger.warn('Rate limit exceeded for devices/scan API', { ip: clientIP });
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

    // Collect device ids to map to teams for wallet data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deviceIds = (devices as any[]).map(d => d._id);
    const teams = await Team.find({ deviceId: { $in: deviceIds } })
      .select("deviceId wallet.bitcoinBalance _id")
      .lean();
    const teamByDevice: Record<string, { teamId: string; bitcoinBalance: number }> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (teams as any[]).forEach(t => {
      if (t.deviceId) teamByDevice[String(t.deviceId)] = { teamId: String(t._id), bitcoinBalance: t.wallet?.bitcoinBalance ?? 0 };
    });

    // Transform the data to match our app's interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedDevices: DeviceResponse[] = (devices as any[]).map((device) => {
      const teamInfo = teamByDevice[String(device._id)];
      return {
        id: device._id.toString(),
        deviceMacAddress: device.deviceMacAddress,
        deviceType: device.deviceType,
        status: device.status,
        ipAddress: device.configuration?.networkSettings?.ipAddress || "Unknown",
        securityLevel: calculateSecurityLevel(device.configuration?.securitySettings),
        vulnerabilities: device.configuration?.securitySettings?.vulnerabilities || [],
        lastSeen: device.createdAt,
        teamId: teamInfo?.teamId,
        bitcoinBalance: teamInfo?.bitcoinBalance,
        isBank: device.deviceType === 'bank',
        configuration: {
          securitySettings: device.configuration?.securitySettings || {}
        }
      };
    });

    // Process any device maintenance recoveries opportunistically
    try {
      const recovered = await processDeviceRecoveries();
      if (recovered.length) {
        try {
          const io = getServerIo();
          recovered.forEach(id => io?.emit('device-recovered', { deviceId: id, ts: Date.now() }));
        } catch {}
      }
    } catch {}

    // Evaluate bank state (may flip) and emit events if changed
    const transition = evaluateBankState();
    if (transition) {
      try {
        const io = getServerIo();
        if (io) {
          const payload = { online: bankState.online, offlineUntil: getBankPublicState().offlineUntil, reason: transition.reason, ts: Date.now() };
          io.emit('bank-state', payload);
          if (payload.online) io.emit('bank-online', payload);
        }
      } catch {}
    }
    const bankDevice = buildBankDevice();
    if (bankDevice) transformedDevices.push(bankDevice);

    logger.info('Device scan completed successfully', { count: transformedDevices.length, ip: clientIP, bankOnline: !!bankDevice });
    res.status(200).json({
      success: true,
      devices: transformedDevices,
    });
  } catch (error) {
    logger.error("Failed to scan devices", {
      error: error instanceof Error ? error.message : String(error),
      ip: clientIP
    });
    res.status(500).json({
      success: false,
      error: "Failed to scan devices",
    });
  }
}

function calculateSecurityLevel(securitySettings?: {
  firewall?: boolean;
  antiVirus?: boolean;
  vpn?: boolean;
  enc?: boolean;
  ids?: boolean;
  vulnerabilities?: string[];
}): "low" | "medium" | "high" | "extreme" {
  if (!securitySettings) return "low";

  let score = 0;

  // Add score for enabled security features (check if explicitly true)
  if (securitySettings.firewall === true) score += 25;
  if (securitySettings.antiVirus === true) score += 20;
  if (securitySettings.vpn === true) score += 15;
  if (securitySettings.enc === true) score += 20;
  if (securitySettings.ids === true) score += 20;

  // Determine level based on score
  if (score >= 80) return "extreme"; // 4-5 security features enabled
  if (score >= 60) return "high";    // 3 security features enabled
  if (score >= 25) return "medium";  // 1-2 security features enabled
  return "low";                      // No security features enabled
}