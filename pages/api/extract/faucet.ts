import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { performFaucet, recordRisk } from '@/lib/extractorState';
import { assertRoleAccess } from '@/lib/role-access';
import { roleForbidden, methodNotAllowed, internalError, badRequest, notFound } from '@/lib/api-errors';
import { getServerIo } from '@/lib/socket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  try {
    const { teamId } = req.body || {};
  if (!teamId) return badRequest(res, 'teamId required');
    await connectDb();
    const team = await Team.findById(teamId).select('wallet.bitcoinBalance');
  if (!team) return notFound(res, 'Team not found');
  // Role gating: attackers only
  try { await assertRoleAccess(teamId, 'faucet'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res, { allowed: err.allowed, appId: 'faucet' }); }
  const { reward, attempts, windowExpires } = performFaucet(teamId);
    team.wallet.bitcoinBalance += reward;
    await team.save();
    const ev = recordRisk(teamId, { type: 'faucet', outcome: 'gain', amount: reward, detail: 'Faucet claim' });
    // Emit socket event
    try {
      const io = getServerIo();
      io?.emit('extractor-faucet', { teamId, reward, attempts, windowExpires, balance: team.wallet.bitcoinBalance, ts: Date.now() });
      io?.emit('extractor-event', { teamId, event: ev });
    } catch {}
    return res.status(200).json({ success: true, reward, attempts, windowExpires, balance: team.wallet.bitcoinBalance });
  } catch (e) {
  const msg = e instanceof Error ? e.message : 'unknown';
  return internalError(res, msg);
  }
}
