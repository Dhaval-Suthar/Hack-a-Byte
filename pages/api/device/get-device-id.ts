import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import { logger } from '@/lib/logger';

interface GetDeviceIdResponse {
  success: boolean;
  deviceId?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetDeviceIdResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { deviceMacAddress } = req.query;

    if (!deviceMacAddress || typeof deviceMacAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Device MAC address is required'
      });
    }

    await connectDb();

    const device = await Device.findOne({ deviceMacAddress }).select('_id');

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.status(200).json({
      success: true,
      deviceId: device._id.toString()
    });

  } catch (error) {
    logger.error('Get device ID error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to get device ID'
    });
  }
}