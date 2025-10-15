import type { NextApiRequest, NextApiResponse } from 'next';
import Device from '@/models/Device';
import Team from '@/models/Team';
import connectDb from '@/db/connectDb';
import { assertRoleAccess } from '@/lib/role-access';
import { ensureRateLimit } from '@/lib/rateLimit';
import { z } from 'zod';
import { methodNotAllowed, badRequest, notFound, roleForbidden } from '@/lib/api-errors';

interface PendingScan { teamId: string; started: number; readyAt: number; deviceId: string; }
const g = global as unknown as { __profScan?: Record<string, PendingScan> };
if (!g.__profScan) g.__profScan = {};
const scans = g.__profScan;

/* Professor Scan Flow
   POST { teamId } -> initiate scan (60s) selects a random online device (excluding own) and returns scanId + eta
   GET  ?scanId= -> if ready returns device intel else pending
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
  const schema = z.object({ teamId: z.string().min(5) });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return badRequest(res, 'Invalid body');
  const { teamId } = parse.data;
  const rl = ensureRateLimit(`prof-scan:${teamId}`, 2, 60_000);
  if (!rl.allowed) return res.status(429).json({ success: false, error: 'Rate limit', reset: rl.reset });
    try { await assertRoleAccess(teamId, 'stocks'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res,{ allowed: err.allowed, appId: 'stocks' }); }
    await connectDb();
    const own = await Team.findById(teamId).select('deviceId');
    if (!own) return notFound(res, 'Team not found');
    const devices = await Device.find({ status: 'online', _id: { $ne: own.deviceId } }).select('deviceMacAddress configuration.networkSettings.ipAddress configuration.securitySettings status');
    if (devices.length === 0) return res.status(404).json({ success: false, error: 'No targets online' });
    const pick = devices[Math.floor(Math.random()*devices.length)];
    const scanId = Math.random().toString(36).slice(2);
    const started = Date.now();
    const readyAt = started + 60_000; // 1 minute scan
    scans[scanId] = { teamId, started, readyAt, deviceId: String(pick._id) };
    return res.status(202).json({ success: true, scanId, etaMs: 60_000 });
  }
  if (req.method === 'GET') {
  const scanId = typeof req.query.scanId === 'string' ? req.query.scanId : undefined;
  if (!scanId) return badRequest(res, 'scanId required');
    const rec = scans[scanId];
    if (!rec) return notFound(res, 'Scan not found');
    const now = Date.now();
    if (now < rec.readyAt) return res.status(200).json({ success: true, pending: true, remainingMs: rec.readyAt - now });
    // Provide intel
    await connectDb();
    const device = await Device.findById(rec.deviceId).select('deviceMacAddress configuration.networkSettings.ipAddress configuration.securitySettings');
    if (!device) return notFound(res, 'Device disappeared');
    const team = await Team.findOne({ deviceId: rec.deviceId }).select('wallet.bitcoinBalance wallet.walletAddress');
    return res.status(200).json({ success: true, pending: false, intel: {
      mac: device.deviceMacAddress,
      ip: device.configuration?.networkSettings?.ipAddress,
      balance: team?.wallet.bitcoinBalance ?? null,
      walletAddress: team?.wallet.walletAddress ?? null,
      security: device.configuration?.securitySettings,
      email: 'unknown@example.com', // placeholder (spec requirement)
      phone: '+10000000000', // placeholder
    }});
  }
  return methodNotAllowed(res);
}
