import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';

// Debug endpoint to list device MAC addresses
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDb();
    
    // Get all devices with their MAC addresses and basic info, including unassigned ones
    const devices = await Device.find({})
      .select('deviceMacAddress deviceType status teamId playspace pin')
      .populate('teamId', 'name wallet.bitcoinBalance')
      .populate('playspace', 'name')
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      count: devices.length,
      devices: devices.map(device => ({
        id: device._id,
        mac: device.deviceMacAddress,
        type: device.deviceType,
        status: device.status,
        teamId: device.teamId,
        teamName: (device.teamId as { name?: string })?.name || 'Unassigned',
        teamBitcoins: (device.teamId as { wallet?: { bitcoinBalance?: number } })?.wallet?.bitcoinBalance || 0,
        hasPin: !!device.pin,
        pin: device.pin,
        playspace: device.playspace,
        playspaceName: (device.playspace as { name?: string })?.name || 'Unknown'
      }))
    });
  } catch (error) {
    console.error('Debug devices error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
