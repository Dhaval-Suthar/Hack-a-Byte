import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import Team from '@/models/Team';
import type { NextApiResponseServerIo } from '@/lib/socket';
import { assertRoleAccess } from '@/lib/role-access';
import { roleForbidden, methodNotAllowed, badRequest, internalError, notFound } from '@/lib/api-errors';
import { computeSuccessChance, RawSecuritySettings } from '@/lib/securityModifiers';
import { scheduleDeviceRecovery } from '@/lib/deviceRecovery';

/* SysTrojan Pro destructive attack
   POST body: { targetDeviceId, attackerTeamId }
   Logic: 30% base success (reduced by security), on success sets device status=maintenance and broadcasts event; 
   also small bitcoin siphon (up to 10% balance capped 150) credited to attacker.
*/

function emitScoped(res: NextApiResponse, event: string, payload: Record<string, unknown>) {
  try {
    const resAny = res as unknown as NextApiResponseServerIo;
    const maybeSocket = resAny.socket as unknown as { server?: { io?: { emit: (ev:string,data:unknown)=>void; to?: (room:string)=>{ emit:(ev:string,data:unknown)=>void } } } };
    const io = maybeSocket.server?.io;
    
    // If payload has teamId, emit to team room; otherwise use playspace
    if (io && payload.teamId && io.to) {
      const teamRoom = `team-${payload.teamId}`;
      io.to(teamRoom).emit(event, { ...payload, ts: Date.now() });
    } else {
      const reqAny = (res as unknown as { req?: { cookies?: Record<string,string> } }).req;
      const playspaceId = reqAny?.cookies?.playspaceId;
      if (io && playspaceId && io.to) io.to(playspaceId).emit(event, { ...payload, ts: Date.now(), playspaceId });
      else if (io) io.emit(event, { ...payload, ts: Date.now() });
    }
  } catch {}
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const { targetDeviceId, attackerTeamId } = req.body as { targetDeviceId?: string; attackerTeamId?: string };
  if (!targetDeviceId || !attackerTeamId) return badRequest(res, 'Missing fields');
  try {
    try { await assertRoleAccess(attackerTeamId, 'systrojan'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res, { allowed: err.allowed, appId: 'systrojan' }); }
    await connectDb();
    const device = await Device.findOne({ deviceMacAddress: targetDeviceId }).select('configuration.securitySettings status');
    const attacker = await Team.findById(attackerTeamId).select('wallet.bitcoinBalance');
  if (!device || !attacker) return notFound(res, 'Not found');
    if (device.status === 'maintenance') {
      return res.status(409).json({ success: false, error: 'Target already in maintenance' });
    }
  const sec = device.configuration?.securitySettings as RawSecuritySettings | undefined;
  const { finalChance: adjusted } = computeSuccessChance({ baseSuccess: 0.30, security: sec });
  const roll = Math.random();
  if (roll < adjusted) {
      // success
      const targetTeam = await Team.findOne({ deviceId: device._id }).select('wallet.bitcoinBalance');
      let siphon = 0;
      if (targetTeam) {
        siphon = Math.min(150, Math.floor(targetTeam.wallet.bitcoinBalance * 0.10));
        targetTeam.wallet.bitcoinBalance -= siphon;
        await targetTeam.save();
      }
      attacker.wallet.bitcoinBalance += siphon;
      await attacker.save();
  device.status = 'maintenance';
  await device.save();
  scheduleDeviceRecovery(String(device._id), 'trojan');
      
      // Emit success event to attacker
      emitScoped(res, 'systrojan-success', { targetDeviceId, siphon, newAttackerBalance: attacker.wallet.bitcoinBalance });
      
      // Send critical notification to target team before device destruction
      if (targetTeam) {
        emitScoped(res, 'virus-notification', { 
          targetKey: targetDeviceId, 
          virusType: 'SysTrojan Pro',
          message: 'DEVICE COMPROMISED! SysTrojan Pro has destroyed your device. Redirecting to game over...',
          severity: 'critical',
          ts: Date.now()
        });
        
        // Emit game-over event to target team to force redirection
        emitScoped(res, 'game-over', { 
          teamId: String(targetTeam._id),
          sessionId: String(targetTeam._id), 
          reason: 'SysTrojan Pro destroyed your device', 
          redirectTo: 'device-maintenance',
          ts: Date.now()
        });
      }
      
      return res.status(200).json({ success: true, outcome: 'destroyed', siphon, attackerBalance: attacker.wallet.bitcoinBalance, successChance: adjusted });
    } else {
      // failure
      emitScoped(res, 'systrojan-failure', { targetDeviceId });
      return res.status(200).json({ success: true, outcome: 'failed', successChance: adjusted });
    }
  } catch (e) {
    return internalError(res, e instanceof Error ? e.message : undefined);
  }
}
