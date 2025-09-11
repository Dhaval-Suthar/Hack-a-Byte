import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import Team from '@/models/Team';

/* Resolve a teamId by device MAC or IP.
   GET /api/device/resolve-team?mac=XX:XX:... or ?ip=1.2.3.4
   Returns { success:true, teamId } or { success:false, error }
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const { mac, ip } = req.query as { mac?: string; ip?: string };
  if (!mac && !ip) return res.status(400).json({ success: false, error: 'mac or ip required' });
  try {
    await connectDb();
  const deviceQuery: Record<string, unknown> = {};
    if (mac) deviceQuery.deviceMacAddress = mac;
    else if (ip) deviceQuery['configuration.networkSettings.ipAddress'] = ip;
    const device = await Device.findOne(deviceQuery).select('_id');
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
    const team = await Team.findOne({ deviceId: device._id }).select('_id');
    if (!team) return res.status(404).json({ success: false, error: 'Team not found for device' });
    return res.status(200).json({ success: true, teamId: String(team._id) });
  } catch (e) {
    console.error('resolve-team error', e);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
