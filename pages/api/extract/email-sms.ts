import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { randomEmailSmsOutcome, recordRisk } from '@/lib/extractorState';
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
  try { await assertRoleAccess(teamId, 'email-sms'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res, { allowed: err.allowed, appId: 'email-sms' }); }
  const outcome = randomEmailSmsOutcome();
    if (outcome.amount !== 0) team.wallet.bitcoinBalance += outcome.amount;
    await team.save();
    const ev = recordRisk(teamId, { type: 'email-sms', outcome: outcome.outcome, amount: outcome.amount, detail: outcome.detail });
    try {
      const io = getServerIo();
      io?.emit('extractor-email-sms', { teamId, ...outcome, balance: team.wallet.bitcoinBalance, ts: Date.now() });
      io?.emit('extractor-event', { teamId, event: ev });
    } catch {}
    return res.status(200).json({ success: true, ...outcome, balance: team.wallet.bitcoinBalance });
  } catch (e) {
  const msg = e instanceof Error ? e.message : 'unknown';
  return internalError(res, msg);
  }
}
