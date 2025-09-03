import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Device from '@/models/Device';
import { assertRoleAccess } from '@/lib/role-access';
import { redisRateLimit } from '@/lib/redisRateLimit';
import { badRequest, methodNotAllowed, notFound, roleForbidden } from '@/lib/api-errors';
import { emitScoped } from '@/lib/emitter';

/* Multi-worm attack dispatcher (EmailSpread Pro, NetCrawler, SocialHook)
   POST body: { attackerTeamId, wormId }
   wormId: 'worm-001' | 'worm-002' | 'worm-003'
   Generates per-target payload tokens (email and/or sms) with probabilistic success influenced by target security settings.
*/

interface WormToken { id: string; wormId: string; channel: 'email' | 'sms'; attackerTeamId: string; targetTeamId: string; reward: number; created: number; expires: number; consumed: boolean; }
interface WormWindow { attempts: number; windowStart: number }
const W = global as unknown as { __wormWin?: Record<string, WormWindow> };
if (!W.__wormWin) W.__wormWin = {};
const WORM_WINDOW_MS = 5 * 60 * 1000;
const G = global as unknown as { __wormTokens?: Record<string,WormToken> };
if (!G.__wormTokens) G.__wormTokens = {};
export const wormTokens = G.__wormTokens;

function emit(res: NextApiResponse, ev: string, payload: Record<string, unknown>) {
  emitScoped(res, { event: ev, payload });
}

interface SecuritySettings { firewall?: boolean; antiVirus?: boolean; ids?: boolean; vpn?: boolean; enc?: boolean }
function successChance(security: SecuritySettings | undefined) {
  // Base 70%; each active defensive toggle (firewall, antiVirus, ids, vpn, enc) reduces 6% cumulatively min 25%
  const base = 0.7;
  if (!security) return base;
  const toggles = ['firewall','antiVirus','ids','vpn','enc'];
  let active = 0;
  for (const t of toggles) {
    const key = t as keyof SecuritySettings;
    if (security[key]) active++;
  }
  const chance = Math.max(0.25, base - active * 0.06);
  return chance;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const { attackerTeamId, wormId } = req.body as { attackerTeamId?: string; wormId?: string };
  if (!attackerTeamId || !wormId) return badRequest(res, 'attackerTeamId & wormId required');
  if (!['worm-001','worm-002','worm-003'].includes(wormId)) return badRequest(res, 'Unknown wormId');
  try { await assertRoleAccess(attackerTeamId, 'worm-phish'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res,{ allowed: err.allowed, appId: 'worm-phish' }); }
  const rl = await redisRateLimit(`worm:${wormId}:${attackerTeamId}`, 20, 60_000);
  if (!rl.allowed) return res.status(429).json({ success: false, error: 'Rate limit', reset: rl.reset });
  await connectDb();
  const attacker = await Team.findById(attackerTeamId).select('_id');
  if (!attacker) return notFound(res, 'Attacker team not found');
  // Gather online devices and owning teams
  const devices = await Device.find({ status: 'online' }).select('configuration.securitySettings status');
  const teamMap: Record<string,string> = {};
  const deviceIds = devices.map(d=>d._id);
  const teams = await Team.find({ deviceId: { $in: deviceIds } }).select('_id deviceId');
  teams.forEach(t=> { teamMap[String(t.deviceId)] = String(t._id); });
  const now = Date.now();
  const expiresIn = 120_000; // tokens valid 2 minutes
  let generated = 0;
  for (const dev of devices) {
    const targetTeamId = teamMap[String(dev._id)];
    if (!targetTeamId || targetTeamId === attackerTeamId) continue; // skip own team
  const chance = successChance((dev as unknown as { configuration?: { securitySettings?: SecuritySettings } }).configuration?.securitySettings);
    // Determine channels for worm variant
    const channels: ('email'|'sms')[] = wormId === 'worm-001' ? ['email'] : wormId === 'worm-002' ? ['email','sms'] : ['sms'];
    for (const channel of channels) {
      if (Math.random() <= chance) {
  const base = wormId === 'worm-001' ? 10 : wormId === 'worm-002' ? 5 : 10;
  // Apply diminishing returns per attacker window
  let win = W.__wormWin![attackerTeamId];
  const nowWin = Date.now();
  if (!win || nowWin - win.windowStart > WORM_WINDOW_MS) { win = { attempts: 0, windowStart: nowWin }; W.__wormWin![attackerTeamId] = win; }
  win.attempts += 1;
  const multiplier = Math.max(0.2, Math.pow(0.8, win.attempts - 1));
  const reward = Math.round(base * multiplier);
        const id = Math.random().toString(36).slice(2);
        wormTokens[id] = { id, wormId, channel, attackerTeamId, targetTeamId, reward, created: now, expires: now + expiresIn, consumed: false };
        emit(res, 'worm-payload', { tokenId: id, wormId, channel, targetTeamId, expires: now + expiresIn });
        generated++;
      }
    }
  }
  return res.status(200).json({ success: true, generated, expiresIn });
}
