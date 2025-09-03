import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import { RawSecuritySettings } from '@/lib/securityModifiers';

/* PATCH /api/device/security
   Body: { deviceId, toggles: Partial<RawSecuritySettings> }
   Updates device.configuration.securitySettings toggles (vpn, enc, ids, firewall, antiVirus)
*/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ success:false, error:'Method not allowed' });
  const { deviceId, toggles } = req.body as { deviceId?: string; toggles?: Partial<RawSecuritySettings> };
  if (!deviceId || !toggles) return res.status(400).json({ success:false, error:'Missing deviceId or toggles' });
  try {
    await connectDb();
    const device = await Device.findById(deviceId).select('configuration.securitySettings');
    if (!device) return res.status(404).json({ success:false, error:'Device not found' });
  const sec = device.configuration.securitySettings as RawSecuritySettings;
    (Object.keys(toggles) as (keyof RawSecuritySettings)[]).forEach(k => {
      const val = toggles[k];
      if (val !== undefined) {
        (sec as Record<string, unknown>)[k as string] = val as unknown;
      }
    });
    await device.save();
    return res.status(200).json({ success:true, securitySettings: sec });
  } catch (e) {
    return res.status(500).json({ success:false, error:'Internal error', detail: (e as Error).message });
  }
}
