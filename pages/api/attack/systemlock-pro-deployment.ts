import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Device from '@/models/Device';
import { emitScoped } from '@/lib/emitter';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// SystemLock Pro deployment notification
// POST /api/attack/systemlock-pro-deployment
// Body: { attackerTeamId, targetMAC, attackerName }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const schema = z.object({
    attackerTeamId: z.string().min(1),
    targetMAC: z.string().min(1),
    attackerName: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid request',
      details: parsed.error.issues 
    });
  }

  const { attackerTeamId, targetMAC, attackerName } = parsed.data;

  try {
    await connectDb();

    // Normalize MAC address to standard uppercase colon-separated format
    const normalizedMAC = targetMAC.replace(/-/g, ':').toUpperCase().trim();

    // Find target device by MAC address (using same logic as systemlock-pro.ts)
    let targetDevice = await Device.findOne({ deviceMacAddress: normalizedMAC });
    if (!targetDevice) {
      // Fallback 1: case-insensitive exact match
      const ciRegex = new RegExp(`^${normalizedMAC}$`, 'i');
      targetDevice = await Device.findOne({ deviceMacAddress: { $regex: ciRegex } });
    }
    if (!targetDevice) {
      // Fallback 2: flexible separators (allow ':' or '-' or no separator)
      const hex = normalizedMAC.replace(/[^0-9A-F]/g, ''); // 12 hex chars
      if (hex.length === 12) {
        const parts = hex.match(/.{1,2}/g) || [];
        const flex = `^${parts.join('[:\\-]?')}$`;
        const flexRegex = new RegExp(flex, 'i');
        targetDevice = await Device.findOne({ deviceMacAddress: { $regex: flexRegex } });
      }
    }

    if (!targetDevice) {
      logger.warn('SystemLock Pro deployment notification: target device not found', {
        requested: targetMAC,
        normalized: normalizedMAC,
      });
      return res.status(404).json({ 
        success: false, 
        error: 'Target device not found' 
      });
    }

    // Find target team
    let targetTeam = null;
    if (targetDevice.teamId) {
      targetTeam = await Team.findById(targetDevice.teamId);
    } else if (targetDevice.playspace) {
      // Device has no team assigned - find any team in the same playspace
      targetTeam = await Team.findOne({ playspaceId: targetDevice.playspace });
    }

    if (!targetTeam) {
      logger.warn('SystemLock Pro deployment notification: target team not found', {
        deviceId: targetDevice._id?.toString?.(),
        deviceMacAddress: targetDevice.deviceMacAddress,
        deviceTeamId: targetDevice.teamId?.toString?.(),
      });
      return res.status(404).json({ 
        success: false, 
        error: 'Target team not found' 
      });
    }

    // Verify attacker team exists
    const attackerTeam = await Team.findById(attackerTeamId);
    if (!attackerTeam) {
      logger.warn('SystemLock Pro deployment notification: attacker team not found', { attackerTeamId });
      return res.status(404).json({ 
        success: false, 
        error: 'Attacker team not found' 
      });
    }

    // Send deployment notification to target team
    emitScoped(res, {
      scope: 'team',
      id: targetTeam._id.toString(),
      event: 'systemlock-pro-deployment',
      payload: {
        attackerTeamId,
        attackerTeamName: attackerTeam.name,
        attackerName: attackerName || attackerTeam.name,
        targetDevice: normalizedMAC,
        message: `⚠️ SECURITY ALERT! SystemLock Pro attack initiated on your device ${normalizedMAC} by ${attackerName || attackerTeam.name}. PIN cracking in progress...`,
        severity: 'critical',
        type: 'attack-deployment',
        ts: Date.now()
      }
    });

    // Also send a notification to display in the notification system
    emitScoped(res, {
      scope: 'team',
      id: targetTeam._id.toString(),
      event: 'notification',
      payload: {
        title: 'Security Breach Alert',
        message: `SystemLock Pro attack detected on device ${normalizedMAC}!`,
        type: 'critical',
        attackerTeam: attackerTeam.name,
        targetDevice: normalizedMAC,
        ts: Date.now()
      }
    });

    logger.info('SystemLock Pro deployment notification sent', {
      attackerTeamId,
      targetTeamId: targetTeam._id.toString(),
      targetMAC: normalizedMAC
    });

    return res.status(200).json({
      success: true,
      message: 'Deployment notification sent',
      targetTeamId: targetTeam._id.toString()
    });

  } catch (error) {
    logger.error('SystemLock Pro deployment notification error:', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, error as Error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}