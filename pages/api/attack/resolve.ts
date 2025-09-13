import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Device from '@/models/Device';
import { computeSuccessChance, RawSecuritySettings } from '@/lib/securityModifiers';
import { getMalwareDefinition } from '@/lib/malwareConfig';
import { assertRoleAccess } from '@/lib/role-access';
import { scheduleDeviceRecovery } from '@/lib/deviceRecovery';
import { redisRateLimit } from '@/lib/redisRateLimit';
import { z } from 'zod';
import { roleForbidden, methodNotAllowed, internalError, badRequest, notFound } from '@/lib/api-errors';

/*
  POST /api/attack/resolve
  Body: { attackerTeamId, targetDeviceId, malwareType, baseReward? }
  Logic:
    - Look up attacker team & target device (and owning team if any)
    - Compute success probability based on malwareType & target security level
    - On success: transfer bitcoins from target (capped) or mint reward (if bank)
    - On failure: optional penalty
    - Certain malware can push device into maintenance/offline temporarily
*/


function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const schema = z.object({ attackerTeamId: z.string().min(1), targetDeviceId: z.string().min(1), malwareType: z.string().min(3) });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return badRequest(res, 'Invalid body');
  const { attackerTeamId, targetDeviceId, malwareType } = parse.data;
  const rl = await redisRateLimit(`resolve:${attackerTeamId}`, 30, 60_000);
  if (!rl.allowed) return res.status(429).json({ success: false, error: 'Rate limit', reset: rl.reset });
  const def = getMalwareDefinition(malwareType);
  if (!def) return badRequest(res, 'Unknown malwareType');
  try {
  try { await assertRoleAccess(attackerTeamId, 'resolve'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res, { allowed: err.allowed, appId: 'resolve' }); }
    await connectDb();
    const attacker = await Team.findById(attackerTeamId);
    const device = await Device.findById(targetDeviceId).select('status configuration.securitySettings deviceType');
  if (!attacker || !device) return notFound(res, 'Attacker or device not found');

    // Security adjustment: basic heuristic from security level fields
  const sec = device.configuration?.securitySettings as RawSecuritySettings | undefined;
  // Placeholder for intel level (e.g., derived from reconnaissance endpoints). Currently assume 0.5 baseline.
  const intelLevel = 0.5;
  const { finalChance: adjustedSuccess } = computeSuccessChance({ baseSuccess: def.baseSuccess, security: sec, intelLevel, requiredIntel: def.requiredIntel });

    const roll = Math.random();
    const success = roll < adjustedSuccess;
    let reward = 0;
    let deviceStatusChange: string | undefined;

    let targetTeam: typeof attacker | null = null;
    if (device) {
      targetTeam = await Team.findOne({ deviceId: device._id }).select('wallet.bitcoinBalance');
    }

    if (success) {
  reward = randInt(def.rewardRange[0], def.rewardRange[1]);
      // If target team exists, siphon up to 20% of its balance limited by reward
      if (targetTeam) {
        const maxDrain = Math.min(reward, Math.floor(targetTeam.wallet.bitcoinBalance * 0.2));
        targetTeam.wallet.bitcoinBalance -= maxDrain;
        reward = maxDrain; // actual gained
        await targetTeam.save();
      }
      attacker.wallet.bitcoinBalance += reward;
      await attacker.save();
      // Potential maintenance/offline impact
  if (Math.random() < def.maintenanceChance) {
  device.status = 'maintenance';
  deviceStatusChange = 'maintenance';
  await device.save();
  scheduleDeviceRecovery(String(device._id), malwareType);
        // Optionally schedule revert via out-of-band process (not implemented)
      }
    } else {
      // Failure small penalty
      const penalty = randInt(5, 20);
      attacker.wallet.bitcoinBalance = Math.max(0, attacker.wallet.bitcoinBalance - penalty);
      await attacker.save();
    }

    return res.status(200).json({
      success: true,
      outcome: success ? 'success' : 'failure',
      reward,
      newAttackerBalance: attacker.wallet.bitcoinBalance,
      deviceStatusChange,
  successChance: adjustedSuccess,
    });
  } catch {
  return internalError(res);
  }
}

// Backwards compatibility export (deprecated)
export { getMalwareDefinition };