import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { getServerIo } from '@/lib/socket';
import { assertRoleAccess } from '@/lib/role-access';
import { redisRateLimit } from '@/lib/redisRateLimit';
import { z } from 'zod';
import { roleForbidden, methodNotAllowed, badRequest, internalError } from '@/lib/api-errors';
import { bankState, forceOffline, getBankPublicState } from '@/lib/bankState';

/* SystemLock Pro special bank attack
  POST body: { attackerTeamId }
  Guarantee +150 BTC credit and forces bank offline 5–10 minutes using centralized bankState.
  Denies if bank currently forced offline.
*/

function emitScoped(res: NextApiResponse, event: string, payload: Record<string, unknown>) {
  try {
    const io = getServerIo();
    const reqAny = (res as unknown as { req?: { cookies?: Record<string,string> } }).req;
    const playspaceId = reqAny?.cookies?.playspaceId;
    if (io && playspaceId) io.to(playspaceId).emit(event, { ...payload, ts: Date.now(), playspaceId });
    else io?.emit(event, { ...payload, ts: Date.now() });
  } catch {}
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json(getBankPublicState());
  }
  if (req.method !== 'POST') return methodNotAllowed(res);
  const schema = z.object({ attackerTeamId: z.string().min(1) });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return badRequest(res, 'Invalid body');
  const { attackerTeamId } = parse.data;
  const rl = await redisRateLimit(`systemlock:${attackerTeamId}`, 1, 60_000);
  if (!rl.allowed) return res.status(429).json({ success: false, error: 'Rate limit', reset: rl.reset });
  try { await assertRoleAccess(attackerTeamId, 'systemlock'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res, { allowed: err.allowed, appId: 'systemlock' }); }
  const now = Date.now();
  if (bankState.forcedOfflineUntil && now < bankState.forcedOfflineUntil) {
    return res.status(409).json({ success: false, error: 'Bank forced offline', offlineUntil: bankState.forcedOfflineUntil });
  }
  try {
    await connectDb();
    const attacker = await Team.findById(attackerTeamId).select('wallet.bitcoinBalance');
    if (!attacker) return res.status(404).json({ success: false, error: 'Attacker team not found' });
    attacker.wallet.bitcoinBalance += 150;
    await attacker.save();
  const offlineMs = (5 + Math.floor(Math.random()*6)) * 60 * 1000; // 5-10 min
  const transition = forceOffline(offlineMs, now); // updates centralized bank state
  const publicState = getBankPublicState();
  emitScoped(res, 'systemlock-success', { attackerTeamId, amount: 100, offlineUntil: publicState.offlineUntil });
  // Also broadcast unified bank-state event so UI stays in sync
  emitScoped(res, 'bank-state', { online: publicState.online, offlineUntil: publicState.offlineUntil, reason: transition.reason });
  if (publicState.online) emitScoped(res, 'bank-online', { offlineUntil: publicState.offlineUntil, reason: transition.reason });
  return res.status(200).json({ success: true, amount: 100, offlineUntil: publicState.offlineUntil });
  } catch (e) {
    return internalError(res, e instanceof Error ? e.message : undefined);
  }
}
