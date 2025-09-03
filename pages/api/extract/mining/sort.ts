import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { miningSortReward } from '@/lib/miningState';
import { assertRoleAccess } from '@/lib/role-access';
import { ensureRateLimit } from '@/lib/rateLimit';
import { badRequest, methodNotAllowed, notFound, roleForbidden } from '@/lib/api-errors';
import type { NextApiResponseServerIo } from '@/lib/socket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const { teamId, rounds } = req.body as { teamId?: string; rounds?: number };
  if (!teamId || !rounds || rounds < 1) return badRequest(res, 'teamId & rounds>=1 required');
  const rl = ensureRateLimit(`mining:sort:${teamId}`, 60, 5*60_000);
  if (!rl.allowed) return res.status(429).json({ success: false, error: 'Rate limit', reset: rl.reset });
  try { await assertRoleAccess(teamId, 'mining'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res,{ allowed: err.allowed, appId: 'mining' }); }
  await connectDb();
  const team = await Team.findById(teamId).select('wallet.bitcoinBalance');
  if (!team) return notFound(res, 'Team not found');
  const { reward, attempts, windowExpires } = miningSortReward(teamId, rounds);
  team.wallet.bitcoinBalance += reward;
  await team.save();
  try { (res as unknown as NextApiResponseServerIo).socket?.server?.io?.emit('mining-reward', { teamId, type: 'sort', reward, attempts, windowExpires, balance: team.wallet.bitcoinBalance, ts: Date.now() }); } catch {}
  return res.status(200).json({ success: true, reward, attempts, windowExpires, balance: team.wallet.bitcoinBalance });
}
