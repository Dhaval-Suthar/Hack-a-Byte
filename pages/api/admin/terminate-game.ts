import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import { emitScoped } from '@/lib/emitter';

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

    // Update all devices to offline status
    const updateResult = await Device.updateMany(
      { status: { $ne: 'offline' } }, // Only update devices that aren't already offline
      { 
        status: 'offline',
        lastSeen: new Date().toISOString()
      }
    );

    const devicesOfflined = updateResult.modifiedCount;

    // Emit game over event to all connected clients
    emitScoped(res, {
      scope: 'global',
      event: 'game-terminated',
      payload: {
        message: 'Game has been terminated by administrator',
        timestamp: new Date().toISOString(),
        devicesOfflined
      }
    });


    res.status(200).json({
      success: true,
      message: 'Game terminated successfully',
      devicesOfflined
    });

  } catch (error) {
    console.error('Game termination error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to terminate game'
    });
  }
}
