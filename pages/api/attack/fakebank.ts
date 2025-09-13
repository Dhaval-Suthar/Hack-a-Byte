import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { assertRoleAccess } from '@/lib/role-access';
import { roleForbidden, badRequest, methodNotAllowed, notFound } from '@/lib/api-errors';
import { redisRateLimit } from '@/lib/redisRateLimit';
import { withRedis } from '@/lib/redis';
import { emitScoped } from '@/lib/emitter';

// Active FakeBank windows keyed by target teamId
interface FakeBankWindow { attackerTeamId: string; started: number; expires: number; }
const g = global as unknown as { __fakeBank?: Record<string, FakeBankWindow> };
if (!g.__fakeBank) g.__fakeBank = {};
export const activeFakeBank = g.__fakeBank; // fallback when Redis disabled

async function getWindow(targetTeamId: string): Promise<FakeBankWindow | null> {
  return (await withRedis(async r => {
    const raw = await r.get(`fakebank:${targetTeamId}`);
    return raw ? JSON.parse(raw) as FakeBankWindow : null;
  })) || activeFakeBank[targetTeamId] || null;
}

async function setWindow(targetTeamId: string, win: FakeBankWindow) {
  const ttl = Math.max(1, Math.floor((win.expires - Date.now()) / 1000));
  const ok = await withRedis(async r => { await r.set(`fakebank:${targetTeamId}`, JSON.stringify(win), { EX: ttl }); return true; });
  if (!ok) activeFakeBank[targetTeamId] = win;
}

/* FakeBank Portal (ransom-002)
   POST: { attackerTeamId, targetTeamId }
   Creates 60s siphon window: any wallet transfers initiated BY targetTeam during window also credit attacker same amount.
   Returns window metadata. Idempotent while active (returns existing window info).
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const { attackerTeamId, targetTeamId } = req.body as { attackerTeamId?: string; targetTeamId?: string };
  if (!attackerTeamId || !targetTeamId) return badRequest(res, 'attackerTeamId and targetTeamId required');
  const rl = await redisRateLimit(`fakebank:${attackerTeamId}`, 3, 60_000);
  if (!rl.allowed) return res.status(429).json({ success: false, error: 'Rate limit', reset: rl.reset });
  try { await assertRoleAccess(attackerTeamId, 'fakebank'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res,{ allowed: err.allowed, appId: 'fakebank' }); }
  try {
    await connectDb();
    const target = await Team.findById(targetTeamId).select('_id');
    if (!target) return notFound(res, 'Target team not found');
  const existing = await getWindow(targetTeamId);
    const now = Date.now();
    if (existing && existing.expires > now) {
      return res.status(200).json({ success: true, window: existing, remainingMs: existing.expires - now, reused: true });
    }
    const windowMs = 60_000;
    const window: FakeBankWindow = { attackerTeamId, started: now, expires: now + windowMs };
  await setWindow(targetTeamId, window);
  // Scoped emissions: victim team room & attacker team room; plus playspace broadcast
  emitScoped(res, { scope: 'team', id: targetTeamId, event: 'fake-bank-victim', payload: { targetTeamId, attackerTeamId, windowMs } });
  emitScoped(res, { scope: 'team', id: attackerTeamId, event: 'fake-bank-attacker', payload: { targetTeamId, attackerTeamId, windowMs } });
  emitScoped(res, { event: 'fake-bank-warning', payload: { targetTeamId, attackerTeamId, windowMs } });
    return res.status(200).json({ success: true, window, windowMs });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : 'Internal error' });
  }
}
