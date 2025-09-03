import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import type { NextApiResponseServerIo } from '@/lib/socket';

// GET: ?deviceId=... returns { online: boolean, status }
// POST: { deviceId, status } to update (restricted - placeholder auth header X-Admin-Key)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { deviceId } = req.query;
      if (!deviceId || typeof deviceId !== 'string') return res.status(400).json({ error: 'deviceId required' });
      await connectDb();
      const device = await Device.findById(deviceId).select('status');
      if (!device) return res.status(404).json({ error: 'Device not found' });
      return res.status(200).json({ online: device.status === 'online', status: device.status });
    }
    if (req.method === 'POST') {
      const { deviceId, status } = req.body || {};
      if (!deviceId || !status) return res.status(400).json({ error: 'deviceId & status required' });
      if (!['online','offline','maintenance'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
      // Placeholder admin key check
      const key = req.headers['x-admin-key'];
      if (!key) return res.status(401).json({ error: 'Unauthorized' });
      await connectDb();
      const updated = await Device.findByIdAndUpdate(deviceId, { status }, { new: true }).select('status');
      if (!updated) return res.status(404).json({ error: 'Device not found' });
      try {
        const resAny = res as unknown as NextApiResponseServerIo;
        const io = resAny.socket?.server?.io;
        if (io) io.emit('device-status', { deviceId, status: updated.status, ts: Date.now() });
      } catch {}
      return res.status(200).json({ success: true, status: updated.status });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return res.status(500).json({ error: 'Internal error', detail: msg });
  }
}