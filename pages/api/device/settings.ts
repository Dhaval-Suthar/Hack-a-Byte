import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';

/* PATCH /api/device/settings
   Body: {
     deviceId: string,
     settings: {
       security?: Partial<RawSecuritySettings>,
       network?: {
         isNetworkEnabled?: boolean;
         // Note: IP address changes are NOT allowed through this endpoint
       },
       passcode?: string | null,
       pin?: string | null,
       airplaneMode?: boolean,
       wifiEnabled?: boolean,
       notifications?: boolean,
       location?: boolean,
       deviceLock?: boolean,
       brightness?: number,
       ringerVolume?: number,
       vibrateEnabled?: boolean,
       ringtone?: string
     }
   }
   Updates device configuration settings
*/

interface DeviceSettingsUpdate {
  security?: {
    firewall?: boolean;
    antiVirus?: boolean;
    vpn?: boolean;
    enc?: boolean;
    ids?: boolean;
  };
  network?: {
    isNetworkEnabled?: boolean;
    // IP address changes are explicitly NOT allowed
  };
  passcode?: string | null;
  pin?: string | null;
  airplaneMode?: boolean;
  wifiEnabled?: boolean;
  bluetoothEnabled?: boolean;
  notificationsEnabled?: boolean;
  locationEnabled?: boolean;
  deviceLock?: boolean;
  brightness?: number;
  volume?: number;
  ringerVolume?: number;
  vibrateEnabled?: boolean;
  ringtone?: string;
  networkName?: string;
  darkMode?: boolean;
  hapticFeedback?: boolean;
  autoUpdateApps?: boolean;
  autoBrightness?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Handle GET request to fetch device settings
    const { deviceMacAddress } = req.query as { deviceMacAddress?: string };

    if (!deviceMacAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing deviceMacAddress parameter'
      });
    }

    try {
      await connectDb();

      const device = await Device.findOne({ deviceMacAddress });
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      return res.status(200).json({
        success: true,
        device: {
          airplaneMode: device.airplaneMode,
          wifiEnabled: device.wifiEnabled,
          bluetoothEnabled: device.bluetoothEnabled,
          notificationsEnabled: device.notificationsEnabled,
          locationEnabled: device.locationEnabled,
          brightness: device.brightness,
          volume: device.ringerVolume,
          ringtone: device.ringtone,
          network: device.network,
          darkMode: device.darkMode,
          hapticFeedback: device.hapticFeedback,
          autoUpdateApps: device.autoUpdateApps,
          vibrateEnabled: device.vibrateEnabled,
          autoBrightness: device.autoBrightness,
          pin: device.pin
        }
      });

    } catch (error) {
      console.error('Error fetching device settings:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        detail: (error as Error).message
      });
    }
  }

  if (req.method === 'POST') {
    // Handle POST request to update device settings
    const { deviceMacAddress, ...settings } = req.body as {
      deviceMacAddress?: string;
    } & DeviceSettingsUpdate;

    if (!deviceMacAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing deviceMacAddress'
      });
    }

    try {
      await connectDb();

      const device = await Device.findOne({ deviceMacAddress });
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      // Update settings one by one
      if (settings.airplaneMode !== undefined) {
        device.airplaneMode = settings.airplaneMode;
      }
      if (settings.wifiEnabled !== undefined) {
        device.wifiEnabled = settings.wifiEnabled;
      }
      if (settings.bluetoothEnabled !== undefined) {
        device.bluetoothEnabled = settings.bluetoothEnabled;
      }
      if (settings.notificationsEnabled !== undefined) {
        device.notificationsEnabled = settings.notificationsEnabled;
      }
      if (settings.locationEnabled !== undefined) {
        device.locationEnabled = settings.locationEnabled;
      }
      if (settings.brightness !== undefined) {
        device.brightness = settings.brightness;
      }
      if (settings.volume !== undefined) {
        device.ringerVolume = settings.volume;
      }
      if (settings.ringtone !== undefined) {
        device.ringtone = settings.ringtone;
      }
      if (settings.network !== undefined) {
        device.network = settings.network;
      }
      if (settings.darkMode !== undefined) {
        device.darkMode = settings.darkMode;
      }
      if (settings.hapticFeedback !== undefined) {
        device.hapticFeedback = settings.hapticFeedback;
      }
      if (settings.autoUpdateApps !== undefined) {
        device.autoUpdateApps = settings.autoUpdateApps;
      }
      if (settings.vibrateEnabled !== undefined) {
        device.vibrateEnabled = settings.vibrateEnabled;
      }
      if (settings.autoBrightness !== undefined) {
        device.autoBrightness = settings.autoBrightness;
      }

      // Handle PIN settings
      if (settings.pin !== undefined) {
        device.pin = settings.pin;
      }

      await device.save();

      return res.status(200).json({
        success: true,
        message: 'Device settings updated successfully',
        device: {
          airplaneMode: device.airplaneMode,
          wifiEnabled: device.wifiEnabled,
          bluetoothEnabled: device.bluetoothEnabled,
          notificationsEnabled: device.notificationsEnabled,
          locationEnabled: device.locationEnabled,
          brightness: device.brightness,
          volume: device.ringerVolume,
          ringtone: device.ringtone,
          network: device.network,
          darkMode: device.darkMode,
          hapticFeedback: device.hapticFeedback,
          autoUpdateApps: device.autoUpdateApps,
          vibrateEnabled: device.vibrateEnabled,
          autoBrightness: device.autoBrightness,
          pin: device.pin
        }
      });

    } catch (error) {
      console.error('Error updating device settings:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        detail: (error as Error).message
      });
    }
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { deviceId, settings } = req.body as {
    deviceId?: string;
    settings?: DeviceSettingsUpdate;
  };

  if (!deviceId || !settings) {
    return res.status(400).json({
      success: false,
      error: 'Missing deviceId or settings'
    });
  }

  try {
    await connectDb();

    const device = await Device.findOne({ deviceMacAddress: deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Update security settings if provided
    if (settings.security) {
      const securitySettings = device.configuration.securitySettings || {};

      if (settings.security.firewall !== undefined) {
        securitySettings.firewall = settings.security.firewall;
      }
      if (settings.security.antiVirus !== undefined) {
        securitySettings.antiVirus = settings.security.antiVirus;
      }
      if (settings.security.vpn !== undefined) {
        securitySettings.vpn = settings.security.vpn;
      }
      if (settings.security.enc !== undefined) {
        securitySettings.enc = settings.security.enc;
      }
      if (settings.security.ids !== undefined) {
        securitySettings.ids = settings.security.ids;
      }

      device.configuration.securitySettings = securitySettings;
    }

    // Update network settings if provided (but NOT IP address)
    if (settings.network) {
      const networkSettings = device.configuration.networkSettings || {};

      if (settings.network.isNetworkEnabled !== undefined) {
        networkSettings.isNetworkEnabled = settings.network.isNetworkEnabled;
      }

      // Explicitly DO NOT update IP address here
      // IP address changes should only happen during device creation

      device.configuration.networkSettings = networkSettings;
    }

    // Update other device settings
    if (settings.passcode !== undefined) {
      // You might want to hash the passcode in a real application
      device.passcode = settings.passcode;
    }

    if (settings.pin !== undefined) {
      // You might want to hash the PIN in a real application
      device.pin = settings.pin;
    }

    if (settings.airplaneMode !== undefined) {
      device.airplaneMode = settings.airplaneMode;
    }

    if (settings.wifiEnabled !== undefined) {
      device.wifiEnabled = settings.wifiEnabled;
    }

    if (settings.notificationsEnabled !== undefined) {
      device.notifications = settings.notificationsEnabled;
    }

    if (settings.locationEnabled !== undefined) {
      device.location = settings.locationEnabled;
    }

    if (settings.deviceLock !== undefined) {
      device.deviceLock = settings.deviceLock;
    }

    if (settings.brightness !== undefined) {
      device.brightness = settings.brightness;
    }

    if (settings.ringerVolume !== undefined) {
      device.ringerVolume = settings.ringerVolume;
    }

    if (settings.vibrateEnabled !== undefined) {
      device.vibrateEnabled = settings.vibrateEnabled;
    }

    if (settings.ringtone !== undefined) {
      device.ringtone = settings.ringtone;
    }

    await device.save();

    return res.status(200).json({
      success: true,
      message: 'Device settings updated successfully',
      configuration: device.configuration,
      pin: device.pin
    });

  } catch (error) {
    console.error('Error updating device settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      detail: (error as Error).message
    });
  }
}
