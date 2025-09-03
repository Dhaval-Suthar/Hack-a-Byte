import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { redisRateLimit } from '@/lib/redisRateLimit';
import { z } from 'zod';
import { emitScoped } from '@/lib/emitter';

// Simple cooldown map to avoid repeated exfil
const lastExfil: Record<string, number> = {};
const COOLDOWN_MS = 60_000; // 1 min per target

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const schema = z.object({ targetTeamId: z.string().min(1), attackerTeamId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid body' });
  const { targetTeamId, attackerTeamId } = parsed.data;
  const redisRL = await redisRateLimit(`dataminer:${attackerTeamId}`, 5, 60_000);
  if (!redisRL.allowed) return res.status(429).json({ success: false, error: 'Rate limit', reset: redisRL.reset });
  const now = Date.now();
  if (lastExfil[targetTeamId] && now - lastExfil[targetTeamId] < COOLDOWN_MS) {
    return res.status(429).json({ success: false, error: 'Recent exfil detected. Try later.' });
  }
  try {
    await connectDb();
  const targetTeam = await Team.findById(targetTeamId).select('wallet.privateKey wallet.walletAddress');
    if (!targetTeam) return res.status(404).json({ success: false, error: 'Target not found' });
    lastExfil[targetTeamId] = now;
  emitScoped(res, { scope: 'team', id: attackerTeamId, event: 'dataminer-exfil', payload: { targetTeamId, walletAddress: targetTeam.wallet.walletAddress } });
  return res.status(200).json({ success: true, privateKey: targetTeam.wallet.privateKey, walletAddress: targetTeam.wallet.walletAddress });
  } catch {
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
