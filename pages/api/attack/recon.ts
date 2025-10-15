import type { NextApiRequest, NextApiResponse } from 'next';
import { getMalwareDefinition } from '../../../lib/malwareConfig';
import { computeSuccessChance, RawSecuritySettings } from '../../../lib/securityModifiers';
import { getIntelLevel, applyRecon } from '../../../lib/intelStore';
import connectDb from '../../../db/connectDb';
import { assertRoleAccess } from '@/lib/role-access';
import { roleForbidden, methodNotAllowed, badRequest, unauthorized, notFound, internalError } from '@/lib/api-errors';
import Device from '../../../models/Device';

// Simple recon endpoint: attacker performs reconnaissance on a target device to raise intel.
// Body: { targetDeviceId, malwareType } (malwareType optional for preview)
// Returns: { intel: number, successChancePreview?: number }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  try {
  // Placeholder auth extraction – assume teamId provided via header X-Team-Id until integrated with real auth
  const attackerTeamId = req.headers['x-team-id'] as string | undefined;
    const { targetDeviceId, malwareType } = req.body || {};
  if (!attackerTeamId) return unauthorized(res);
  if (!targetDeviceId) return badRequest(res, 'targetDeviceId required');
  await connectDb();
  try { if (attackerTeamId) await assertRoleAccess(attackerTeamId, 'recon'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res, { allowed: err.allowed, appId: 'recon' }); }
    const target = await Device.findById(targetDeviceId).select('securitySettings teamId');
  if (!target) return notFound(res, 'Device not found');
  if (String(target.teamId) === String(attackerTeamId)) return badRequest(res, 'Cannot recon own device');
    const rec = applyRecon(String(attackerTeamId), String(target._id));

    let successChancePreview: number | undefined;
    if (malwareType) {
      const def = getMalwareDefinition(malwareType);
      if (def) {
        const intel = getIntelLevel(String(attackerTeamId), String(target._id));
        const { finalChance } = computeSuccessChance({ baseSuccess: def.baseSuccess, security: target.securitySettings as RawSecuritySettings, intelLevel: intel, requiredIntel: def.requiredIntel });
        successChancePreview = finalChance;
      }
    }
    return res.status(200).json({ intel: rec.level, successChancePreview });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
  return internalError(res, msg);
  }
}
