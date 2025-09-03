import { NextApiRequest, NextApiResponse } from 'next';
import { emitScoped } from '@/lib/emitter';
import connectDb from '@/db/connectDb';
import { assertRoleAccess } from '@/lib/role-access';
import { withRedis } from '@/lib/redis';
import { roleForbidden, badRequest, methodNotAllowed, notFound } from '@/lib/api-errors';
import Team from '@/models/Team';

// Track active typing challenges
interface RansomInstance { phrase: string; progress: number; expires: number; rewardDemand: number; attackerTeamId?: string; }
export const activeRansom: Record<string, RansomInstance> = {};
// Track active ransom demands after encryption success pending payment
export const activeRansomDemands: Record<string, { demand: number; attackerTeamId?: string; created: number; expires: number; paid: boolean }> = {}; // fallback when Redis disabled
const PHRASES = ['ENCRYPTION', 'RECOVERY', 'DECRYPT', 'BITCOIN', 'SYSTEMLOCK'];

async function mutateTeamBalance(playspaceId: string | undefined, delta: number) {
  if (!playspaceId) return null;
  try {
    await connectDb();
    const team = await Team.findOne({ playspaceId });
    if (!team) return null;
    team.wallet.bitcoinBalance += delta;
    if (team.wallet.bitcoinBalance < 0) team.wallet.bitcoinBalance = 0;
    await team.save();
    return team.wallet.bitcoinBalance;
  } catch {
    return null;
  }
}

function emitSocket(res: NextApiResponse, event: string, payload: Record<string, unknown>) {
  emitScoped(res, { event, payload });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { targetKey } = req.query as { targetKey?: string };
    if (!targetKey) return badRequest(res, 'Missing targetKey');
  if (req.method === 'POST') {
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    const { attackerTeamId } = (req.body || {}) as { attackerTeamId?: string };
    if (attackerTeamId) {
      try { await assertRoleAccess(attackerTeamId, 'worm-phish'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res, { allowed: err.allowed, appId: 'worm-phish' }); }
    }
    activeRansom[targetKey] = { phrase, progress: 0, expires: Date.now() + 15_000, rewardDemand: 80 + Math.floor(Math.random() * 70), attackerTeamId };
    emitSocket(res, 'ransomware-spawn', { targetKey, phrase, rewardDemand: activeRansom[targetKey].rewardDemand, attackerTeamId });
    return res.status(200).json({ success: true, phrase: activeRansom[targetKey].phrase, rewardDemand: activeRansom[targetKey].rewardDemand, timeLimitMs: 15_000, attackerTeamId });
  }
  if (req.method === 'PUT') {
    // Defender typing challenge progress – restrict to defender roles
    const defenderTeamId = req.headers['x-team-id'] as string | undefined;
    if (defenderTeamId) {
      try { await assertRoleAccess(defenderTeamId, 'def-ransom'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res, { allowed: err.allowed, appId: 'def-ransom' }); }
    }
    const { char } = req.body as { char?: string };
    const inst = activeRansom[targetKey];
  if (!inst) return notFound(res, 'No active ransomware');
    if (Date.now() > inst.expires) {
      const demand = inst.rewardDemand;
      const attackerTeamId = inst.attackerTeamId;
      delete activeRansom[targetKey];
      // Create pending demand (15s payment window)
      const windowMs = 15_000;
  const rec = { demand, attackerTeamId, created: Date.now(), expires: Date.now() + windowMs, paid: false };
  const ttl = Math.ceil(windowMs / 1000);
  const ok = await withRedis(async r => { await r.set(`ransomdemand:${targetKey}`, JSON.stringify(rec), { EX: ttl }); return true; });
  if (!ok) activeRansomDemands[targetKey] = rec;
  emitSocket(res, 'ransomware-demand', { targetKey, demand, attackerTeamId, windowMs });
      return res.status(410).json({ success: false, error: 'Expired', demand, paymentWindowMs: windowMs, attackerTeamId });
    }
    if (!char) return res.status(400).json({ success: false, error: 'Missing char' });
    const expected = inst.phrase[inst.progress];
    if (char.toUpperCase() === expected) {
      inst.progress += 1;
      const completed = inst.progress === inst.phrase.length;
      if (completed) {
        delete activeRansom[targetKey];
        // Reward defenders: credit a fraction of demand (e.g., 25%)
  const bonus = Math.floor(inst.rewardDemand * 0.25);
        const reqAny = (res as unknown as { req?: { cookies?: Record<string,string> } }).req;
        const playspaceId = reqAny?.cookies?.playspaceId as string | undefined;
  const newBalance = await mutateTeamBalance(playspaceId, bonus);
  emitSocket(res, 'ransomware-neutralized', { targetKey, bonus, newBalance });
  return res.status(200).json({ success: true, completed: true, bonus, newBalance });
      }
      emitSocket(res, 'ransomware-progress', { targetKey, progress: inst.progress, total: inst.phrase.length });
      return res.status(200).json({ success: true, completed: false, progress: inst.progress });
    }
    return res.status(200).json({ success: true, completed: false, progress: inst.progress, mismatch: true });
  }
  return methodNotAllowed(res);
}
