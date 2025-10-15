import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import Team from '@/models/Team';
import { assertRoleAccess } from '@/lib/role-access';
import { roleForbidden, methodNotAllowed, badRequest, internalError, notFound } from '@/lib/api-errors';
import { computeSuccessChance, RawSecuritySettings } from '@/lib/securityModifiers';
import { scheduleDeviceRecovery } from '@/lib/deviceRecovery';
import { emitVirusNotification } from '@/lib/virus-notifications';
import { emitScoped } from '@/lib/emitter';

/* SysTrojan Pro destructive attack
   POST body: { targetDeviceId, attackerTeamId }
   Logic: 30% base success (reduced by security), on success sets device status=maintenance and broadcasts event; 
   also small bitcoin siphon (up to 10% balance capped 150) credited to attacker.
*/

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
      emitScoped(res, {
        scope: 'team',
        id: attackerTeamId,
        event: 'systrojan-success',
        payload: { targetDeviceId, siphon, newAttackerBalance: attacker.wallet.bitcoinBalance, ts: Date.now() }
      });
      
      // Send critical notification to target team before device destruction
      if (targetTeam) {
        await emitVirusNotification(res, {
          targetTeamId: String(targetTeam._id),
          event: 'virus-notification',
          payload: {
            targetKey: targetDeviceId, 
            virusType: 'SysTrojan Pro',
            message: 'DEVICE COMPROMISED! SysTrojan Pro has destroyed your device. Redirecting to game over...',
            severity: 'critical'
          }
        });
        
        // Emit game-over event to target team to force redirection
        emitScoped(res, {
          scope: 'team',
          id: String(targetTeam._id),
          event: 'game-over',
          payload: {
            teamId: String(targetTeam._id),
            sessionId: String(targetTeam._id), 
            reason: 'SysTrojan Pro destroyed your device', 
            redirectTo: 'device-maintenance',
            ts: Date.now()
          }
        });
      }
      
      return res.status(200).json({ success: true, outcome: 'destroyed', siphon, attackerBalance: attacker.wallet.bitcoinBalance, successChance: adjusted });
    } else {
      // failure
      emitScoped(res, {
        scope: 'team',
        id: attackerTeamId,
        event: 'systrojan-failure',
        payload: { targetDeviceId, ts: Date.now() }
      });
      return res.status(200).json({ success: true, outcome: 'failed', successChance: adjusted });
    }
  } catch (e) {
    return internalError(res, e instanceof Error ? e.message : undefined);
  }
}
