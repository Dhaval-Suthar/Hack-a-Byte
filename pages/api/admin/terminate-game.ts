import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import { emitScoped } from '@/lib/emitter';
import { logger } from '@/lib/logger';

interface TerminateGameResponse {
  success: boolean;
  message?: string;
  error?: string;
  devicesOfflined?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TerminateGameResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    await connectDb();

    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID is required'
      });
    }

    // Terminate specific device by setting it to offline
    const device = await Device.findByIdAndUpdate(
      deviceId,
      { 
        status: 'offline',
        lastSeen: new Date().toISOString()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Emit socket event to notify only the specific device
    emitScoped(res, {
      scope: 'global',
      event: 'game-terminated',
      payload: {
        deviceId: device._id.toString(),
        deviceMac: device.deviceMacAddress,
        reason: 'admin-termination',
        message: 'Game has been terminated by admin',
        timestamp: new Date().toISOString()
      }
    });

    // Also emit device status change for real-time updates
    emitScoped(res, {
      scope: 'global',
      event: 'device-status',
      payload: {
        deviceId: device.deviceMacAddress,
        status: 'offline',
        ts: Date.now(),
        reason: 'admin-termination',
      }
    });

    res.status(200).json({
      success: true,
      message: `Device ${device.deviceMacAddress} terminated successfully`,
      devicesOfflined: 1
    });

  } catch (error) {
    logger.error('Game termination error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to terminate game'
    });
  }
}
