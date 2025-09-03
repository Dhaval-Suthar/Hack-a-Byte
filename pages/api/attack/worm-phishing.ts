import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { assertRoleAccess } from '@/lib/role-access';
import { roleForbidden, methodNotAllowed, badRequest, notFound, internalError } from '@/lib/api-errors';
import type { NextApiResponseServerIo } from '@/lib/socket';

/* Worm Phishing reward system
   POST body: { attackerTeamId }
   Logic: Simple timed reward with diminishing returns per team within a cooldown window.
   - First success in 5 min window: 60-100 BTC
   - Subsequent successes within window: -20% each (min 10)
*/

interface PhishState { lastWindowStart: number; attempts: number }
const state: Record<string, PhishState> = {};

function emitScoped(res: NextApiResponse, event: string, payload: Record<string, unknown>) {
  try {
    const resAny = res as unknown as NextApiResponseServerIo;
    const maybeSocket = resAny.socket as unknown as { server?: { io?: { emit: (ev:string,data:unknown)=>void; to?: (room:string)=>{ emit:(ev:string,data:unknown)=>void } } } };
    const io = maybeSocket.server?.io;
    const reqAny = (res as unknown as { req?: { cookies?: Record<string,string> } }).req;
    const playspaceId = reqAny?.cookies?.playspaceId;
    if (io && playspaceId && io.to) io.to(playspaceId).emit(event, { ...payload, ts: Date.now(), playspaceId });
    else if (io) io.emit(event, { ...payload, ts: Date.now() });
  } catch {}
}

function randInt(min:number,max:number){return Math.floor(Math.random()*(max-min+1))+min;}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const { attackerTeamId } = req.body as { attackerTeamId?: string };
  if (!attackerTeamId) return badRequest(res, 'Missing attackerTeamId');
  try {
    await connectDb();
  const team = await Team.findById(attackerTeamId).select('wallet.bitcoinBalance');
  if (!team) return notFound(res, 'Team not found');
  // Role gating: attackers only
  try { await assertRoleAccess(attackerTeamId, 'worm-phish'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res, { allowed: err.allowed, appId: 'worm-phish' }); }
  const now = Date.now();
    const windowMs = 5*60*1000;
    const rec = state[attackerTeamId] || { lastWindowStart: now, attempts: 0 };
    if (now - rec.lastWindowStart > windowMs) { rec.lastWindowStart = now; rec.attempts = 0; }
    rec.attempts += 1; state[attackerTeamId] = rec;
    const base = randInt(60,100);
    const multiplier = Math.max(0.1, 1 - 0.2*(rec.attempts-1));
    const reward = Math.max(10, Math.floor(base*multiplier));
    team.wallet.bitcoinBalance += reward;
    await team.save();
    emitScoped(res,'worm-phishing-reward',{ attackerTeamId, reward, attempts: rec.attempts });
    return res.status(200).json({ success:true, reward, attempts: rec.attempts, newBalance: team.wallet.bitcoinBalance });
  } catch (e) {
    return internalError(res, e instanceof Error ? e.message : undefined);
  }
}
