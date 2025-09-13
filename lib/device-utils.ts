import connectDb from "@/db/connectDb";
import Device from "@/models/Device";
import { logger } from '@/lib/logger';

interface NetworkSettings {
  ipAddress?: string;
  subnet?: string;
  gateway?: string;
  dns?: string[];
  isNetworkEnabled?: boolean;
}

interface SecuritySettings {
  firewall?: boolean;
  antiVirus?: boolean;
  vulnerabilities?: string[];
}

interface DeviceConfiguration {
  osVersion?: string;
  installedApps?: string[];
  networkSettings?: NetworkSettings;
  securitySettings?: SecuritySettings;
}

/**
 * Generates a unique IP address for a device
 * Uses private IP ranges (192.168.x.x or 10.x.x.x) to ensure uniqueness
 */
export async function generateUniqueIPAddress(): Promise<string> {
  const maxAttempts = 50;
  let attempts = 0;

  while (attempts < maxAttempts) {
    // Generate IP in private ranges: 192.168.x.x (most common) or 10.x.x.x
    const use192Range = Math.random() > 0.3; // 70% chance for 192.168 range

    let ipAddress: string;
    if (use192Range) {
      // 192.168.x.x range
      const subnet = Math.floor(Math.random() * 254) + 1; // 1-254
      const host = Math.floor(Math.random() * 254) + 1; // 1-254
      ipAddress = `192.168.${subnet}.${host}`;
    } else {
      // 10.x.x.x range
      const subnet1 = Math.floor(Math.random() * 254) + 1; // 1-254
      const subnet2 = Math.floor(Math.random() * 254) + 1; // 1-254
      const host = Math.floor(Math.random() * 254) + 1; // 1-254
      ipAddress = `10.${subnet1}.${subnet2}.${host}`;
    }

    // Check if this IP is already in use
    const existingDevice = await Device.findOne({
      'configuration.networkSettings.ipAddress': ipAddress
    });

    if (!existingDevice) {
      return ipAddress;
    }

    attempts++;
  }

  // Fallback: if we can't find a unique IP after many attempts, use a timestamp-based approach
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1000);
  return `192.168.${(timestamp % 254) + 1}.${randomPart % 254 + 1}`;
}

/**
 * Generates a MAC address for a device
 */
export function generateDeviceMacAddress(): string {
  const hexChars = '0123456789ABCDEF';
  let mac = '';

  for (let i = 0; i < 6; i++) {
    if (i > 0) mac += ':';
    for (let j = 0; j < 2; j++) {
      mac += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    }
  }

  return mac;
}

/**
 * Creates a new device with unique IP address and MAC address
 */
export async function createDeviceWithUniqueNetworkConfig(
  deviceType: string,
  playspaceId: string,
  additionalConfig: Partial<DeviceConfiguration> = {}
) {
  try {
    await connectDb();

    // Generate unique network identifiers
    const deviceMacAddress = generateDeviceMacAddress();
    const deviceIPAddress = await generateUniqueIPAddress();

    // Determine default configuration based on device type
    const defaultConfig = getDefaultDeviceConfig(deviceType, deviceIPAddress);

    const newDevice = new Device({
      deviceType,
      deviceMacAddress,
      status: "offline",
      playspace: playspaceId,
      configuration: {
        ...defaultConfig,
        ...additionalConfig
      },
      currentUsers: [],
      logs: []
    });

    await newDevice.save();
    return {
      success: true,
      device: newDevice,
      ipAddress: deviceIPAddress,
      macAddress: deviceMacAddress
    };
  } catch (error) {
    logger.error('Failed to create device with unique network config:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Gets default configuration for a device type
 */
function getDefaultDeviceConfig(deviceType: string, ipAddress: string) {
  const baseConfig = {
    networkSettings: {
      ipAddress,
      subnet: ipAddress.includes('192.168') ? '255.255.255.0' : '255.0.0.0',
      gateway: ipAddress.includes('192.168')
        ? ipAddress.replace(/\d+$/, '1')
        : ipAddress.replace(/\d+\.\d+$/, '0.1'),
      dns: ['8.8.8.8', '8.8.4.4'],
      isNetworkEnabled: true
    },
    securitySettings: {
      firewall: true,
      antiVirus: true,
      vulnerabilities: []
    }
  };

  switch (deviceType) {
    case 'hackphone':
      return {
        ...baseConfig,
        osVersion: "iOS 16",
        installedApps: ["Safari", "Calculator", "Settings", "Terminal", "Files", "Network Scanner", "Crypto Toolkit"]
      };
    case 'hackdroid':
      return {
        ...baseConfig,
        osVersion: "Android 13",
        installedApps: ["Chrome", "Calculator", "Settings", "Terminal", "Files", "Network Scanner", "Crypto Toolkit"]
      };
    case 'hackbook-w95':
      return {
        ...baseConfig,
        osVersion: "Windows 95",
        installedApps: ["Notepad", "Calculator", "Paint", "MyComputer", "Terminal", "Minesweeper", "CD Player"]
      };
    case 'hackbook-l':
      return {
        ...baseConfig,
        osVersion: "Linux Ubuntu 22.04",
        installedApps: ["Terminal", "Files", "Text Editor", "Calculator", "Network Scanner", "Crypto Toolkit"]
      };
    default:
      return {
        ...baseConfig,
        osVersion: "Unknown",
        installedApps: ["Terminal"]
      };
  }
}
