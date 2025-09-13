import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Device from '@/models/Device';
import { emitScoped } from '@/lib/emitter';
import { z } from 'zod';

// SystemLock Pro - PIN cracking attack on devices
// POST /api/attack/systemlock-pro
// Body: { attackerTeamId, targetMAC, pinGuess }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const schema = z.object({
    attackerTeamId: z.string().min(1),
    targetMAC: z.string().min(1),
    pinGuess: z.string().length(4).regex(/^\d{4}$/, 'PIN must be 4 digits')
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid request',
      details: parsed.error.issues 
    });
  }

  const { attackerTeamId, targetMAC, pinGuess } = parsed.data;

  // Normalize MAC address to standard uppercase colon-separated format
  const normalizedMAC = targetMAC.replace(/-/g, ':').toUpperCase().trim();

  await connectDb();

    // Find target device by MAC address (normalized)
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
      console.warn('SystemLock Pro: target device not found', {
        requested: targetMAC,
        normalized: normalizedMAC,
      });
      return res.status(404).json({ 
        success: false, 
        error: 'Target device not found',
        details: { requested: targetMAC, normalized: normalizedMAC }
      });
    }

    // Check if device has a PIN set - devices without PINs are easier to hack
    const hasPin = targetDevice.pin && targetDevice.pin !== null;
    const devicePin = hasPin ? targetDevice.pin : null;

    // Find target team - handle devices without team assignment
    let targetTeam = null;
    if (targetDevice.teamId) {
      targetTeam = await Team.findById(targetDevice.teamId);
      if (!targetTeam) {
        console.warn('SystemLock Pro: target team not found for device', {
          deviceId: targetDevice._id?.toString?.(),
          deviceMacAddress: targetDevice.deviceMacAddress,
          deviceTeamId: targetDevice.teamId?.toString?.(),
        });
        return res.status(404).json({ 
          success: false, 
          error: 'Target team not found',
          details: {
            deviceId: targetDevice._id?.toString?.(),
            deviceMacAddress: targetDevice.deviceMacAddress,
            deviceTeamId: targetDevice.teamId?.toString?.(),
          }
        });
      }
    } else {
      // Device has no team assigned - let's find any team in the same playspace
      // Find any team in the same playspace as the target
      if (targetDevice.playspace) {
        targetTeam = await Team.findOne({ playspaceId: targetDevice.playspace });
      }
    }

    // Find attacker team
    const attackerTeam = await Team.findById(attackerTeamId);
    if (!attackerTeam) {
      console.warn('SystemLock Pro: attacker team not found', { attackerTeamId });
      return res.status(404).json({ 
        success: false, 
        error: 'Attacker team not found' 
      });
    }

    // Check if attacker owns SystemLock Pro
    if (!attackerTeam.purchasedMalware.includes('ransom-003')) {
      console.warn('SystemLock Pro: purchase check failed', {
        attackerTeamId,
        purchasedMalware: attackerTeam.purchasedMalware,
      });
      return res.status(403).json({ 
        success: false, 
        error: 'SystemLock Pro not purchased' 
      });
    }


    // Check if PIN guess is correct
    // For devices without PIN, any guess works
    // For devices with PIN, guess must match exactly
    const pinCracked = hasPin ? (pinGuess === devicePin) : true;

    if (pinCracked) {
      // PIN CRACKED! Execute the attack
      
      // DO NOT change device status - keep it online
      // DO NOT set device offline or change lastSeen
      
      // Transfer bitcoins from target to attacker
      let stolenAmount = 0;
      if (targetTeam) {
        // Device belongs to a team OR we found a team in the playspace - steal ALL their bitcoins
        stolenAmount = targetTeam.wallet.bitcoinBalance;
        targetTeam.wallet.bitcoinBalance = 0;
        attackerTeam.wallet.bitcoinBalance += stolenAmount;
        await targetTeam.save();
        
      } else {
        // No team found anywhere - give a small reward for successful hack
        stolenAmount = 100;
        attackerTeam.wallet.bitcoinBalance += stolenAmount;
      }

      // Save changes
      await attackerTeam.save();
      // DO NOT save targetDevice since we're not changing its status

      // Emit success events
      emitScoped(res, {
        scope: 'team',
        id: attackerTeamId,
        event: 'systemlock-pro-success',
        payload: {
          targetMAC: normalizedMAC,
          stolenAmount,
          targetTeam: targetTeam?.name || 'Unassigned',
          message: "Success",
          ts: Date.now()
        }
      });

      // Send notification to target team (NO GAME OVER)
      if (targetTeam) {
        emitScoped(res, {
          scope: 'team',
          id: targetTeam._id.toString(),
          event: 'systemlock-pro-victim',
          payload: {
            attackerTeamId,
            attackerTeamName: attackerTeam.name,
            stolenAmount,
            targetDevice: normalizedMAC,
            message: `⚠️ SECURITY BREACH! Your device ${normalizedMAC} has been compromised by SystemLock Pro! All ₿${stolenAmount} bitcoins stolen by team "${attackerTeam.name}". Device remains online.`,
            gameOver: false, // DO NOT trigger game over
            ts: Date.now()
          }
        });
      }

      return res.status(200).json({
        success: true,
        pinCracked: true,
        stolenAmount,
        message: "Success"
      });

    } else {
      // PIN guess was wrong (only possible for devices with PINs)
      emitScoped(res, {
        scope: 'team',
        id: attackerTeamId,
        event: 'systemlock-pro-attempt',
        payload: {
          targetMAC: normalizedMAC,
          pinGuess,
          success: false,
          message: `PIN guess ${pinGuess} failed for ${normalizedMAC}`,
          ts: Date.now()
        }
      });

      return res.status(200).json({
        success: true,
        pinCracked: false,
        message: `PIN guess ${pinGuess} incorrect`
      });
    }
}
