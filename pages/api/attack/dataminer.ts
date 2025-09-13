import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Device from '@/models/Device';
import { redisRateLimit } from '@/lib/redisRateLimit';
import { z } from 'zod';
import { emitScoped } from '@/lib/emitter';
import { computeSuccessChance, RawSecuritySettings } from '@/lib/securityModifiers';
import { logger } from '@/lib/logger';

// Cooldown map to avoid repeated exfil by the same attacker against the same target
const lastExfil: Record<string, number> = {};
const COOLDOWN_MS = 60_000; // 1 min per attacker-target pair

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  
  // Support both legacy (targetTeamId) and new (targetDeviceId) formats
  const schema = z.object({ 
    targetTeamId: z.string().min(1).optional(), 
    targetDeviceId: z.string().min(1).optional(),
    attackerTeamId: z.string().min(1) 
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid body' });
  
  const { targetTeamId, targetDeviceId, attackerTeamId } = parsed.data;
  if (!targetTeamId && !targetDeviceId) {
    return res.status(400).json({ success: false, error: 'Either targetTeamId or targetDeviceId required' });
  }

  const redisRL = await redisRateLimit(`dataminer:${attackerTeamId}`, 5, 60_000);
  if (!redisRL.allowed) return res.status(429).json({ success: false, error: 'Rate limit', reset: redisRL.reset });
  
  const targetKey = targetDeviceId || targetTeamId!;
  const now = Date.now();
  // Apply cooldown per attacker-target pair
  const cooldownKey = `${attackerTeamId}:${targetKey}`;
  if (lastExfil[cooldownKey] && now - lastExfil[cooldownKey] < COOLDOWN_MS) {
    const resetIn = COOLDOWN_MS - (now - lastExfil[cooldownKey]);
    logger.warn('DataMiner cooldown hit', { attackerTeamId, targetKey, resetIn });
    return res.status(429).json({ success: false, error: 'Recent exfil detected. Try later.', reset: now + resetIn });
  }

  try {
    await connectDb();
    
  let targetTeam;
    let successChance = 0.85; // Base 85% success rate for DataMiner X (was 70%)
    
    if (targetDeviceId) {
      // New flow: target by device, check security settings
      const device = await Device.findOne({ deviceMacAddress: targetDeviceId }).select('configuration.securitySettings');
      if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
      
      // If caller passed targetTeamId use it directly; else resolve via device->team mapping
      if (targetTeamId) {
        targetTeam = await Team.findById(targetTeamId).select('wallet.privateKey wallet.walletAddress');
      } else {
        targetTeam = await Team.findOne({ deviceId: device._id }).select('wallet.privateKey wallet.walletAddress');
      }
      if (!targetTeam) return res.status(404).json({ success: false, error: 'Target team not found' });
      
      // Apply security modifiers
      const sec = device.configuration?.securitySettings as RawSecuritySettings | undefined;
      const { finalChance } = computeSuccessChance({ baseSuccess: successChance, security: sec });
      successChance = finalChance;
    } else {
      // Legacy flow: direct team targeting
      targetTeam = await Team.findById(targetTeamId).select('wallet.privateKey wallet.walletAddress');
      if (!targetTeam) return res.status(404).json({ success: false, error: 'Target not found' });
    }

    // Roll for success
    const roll = Math.random();
    const success = roll < successChance;
    
    
    if (success) {
  // Start cooldown only on successful exfil
  lastExfil[cooldownKey] = now;
      // Successful exfiltration
      emitScoped(res, { 
        scope: 'team', 
        id: attackerTeamId, 
        event: 'dataminer-exfil', 
        payload: { 
          targetKey, 
          targetTeamId: String(targetTeam._id),
          walletAddress: targetTeam.wallet.walletAddress,
          outcome: 'success'
        } 
      });

      // Notify target team (Berlin) about the attack (but they can't stop it)
      emitScoped(res, { 
        scope: 'team', 
        id: String(targetTeam._id), 
        event: 'virus-notification', 
        payload: { 
          targetKey,
          targetTeamId: String(targetTeam._id),
          virusType: 'DataMiner X',
          message: 'DataMiner X detected - credentials compromised! Check wallet security immediately.',
          severity: 'critical'
        } 
      });

      // Explicit notification that private key was exfiltrated
      emitScoped(res, {
        scope: 'team',
        id: String(targetTeam._id),
        event: 'private-key-compromised',
        payload: {
          targetKey,
          targetTeamId: String(targetTeam._id),
          virusType: 'DataMiner X',
          compromised: true,
          message: 'Your private key has been stolen by DataMiner X. Rotate keys immediately!'
        }
      });

      return res.status(200).json({ 
        success: true, 
        outcome: 'success',
        privateKey: targetTeam.wallet.privateKey, 
        walletAddress: targetTeam.wallet.walletAddress,
        successChance 
      });
    } else {
      // Failed attack
      emitScoped(res, { 
        scope: 'team', 
        id: attackerTeamId, 
        event: 'dataminer-failure', 
        payload: { 
          targetKey,
          targetTeamId: targetTeamId || undefined,
          outcome: 'failed'
        } 
      });

      return res.status(200).json({ 
        success: true, 
        outcome: 'failed',
        message: 'DataMiner X attack failed - target systems too secure',
        successChance 
      });
    }
  } catch (error) {
    logger.error('DataMiner attack error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
