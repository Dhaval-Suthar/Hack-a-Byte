import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import Team from '@/models/Team';
import { z } from 'zod';
import { emitScoped } from '@/lib/emitter';
import { computeSuccessChance, RawSecuritySettings } from '@/lib/securityModifiers';
import { logger } from '@/lib/logger';

// CryptoLocker Elite ransomware
// POST body: { targetIP, attackerTeamId }
// Logic: High success rate, encrypts files, spawns typing defense for target team
// If defense fails, demands payment or ends game

// Track active ransomware sessions
const activeSessions: Record<string, {
  attackerTeamId: string;
  targetTeamId: string;
  targetIP: string;
  demand: number;
  expires: number;
  encryptionStarted: number;
}> = {};

const TYPING_PHRASES = [
  'AES-256-GCM',
  'RSA-4096-OAEP', 
  'ECDHE-SECP256K1',
  'SHA3-KECCAK-512',
  'PBKDF2-HMAC-SHA256',
  'CHACHA20-POLY1305',
  'X25519-XSALSA20',
  'SCRYPT-N16384-R8-P1',
  'ARGON2ID-M65536-T3-P4',
  'CURVE25519-ED25519'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  
  const schema = z.object({ 
    targetIP: z.string().min(1),
    attackerTeamId: z.string().min(1),
    demandAmount: z.number().min(1).optional() // Optional custom demand amount
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid body' });
  
  const { targetIP, attackerTeamId, demandAmount } = parsed.data;

  try {
    await connectDb();
    
    // Find target device by IP
    const device = await Device.findOne({ 
      'configuration.networkSettings.ipAddress': targetIP 
    }).select('configuration.securitySettings');
    
    if (!device) {
      return res.status(404).json({ success: false, error: 'Target device not found' });
    }

    // Find target team
    const targetTeam = await Team.findOne({ deviceId: device._id }).select('wallet.bitcoinBalance');
    if (!targetTeam) {
      return res.status(404).json({ success: false, error: 'Target team not found' });
    }

    // Find attacker team
    const attackerTeam = await Team.findById(attackerTeamId).select('wallet.bitcoinBalance');
    if (!attackerTeam) {
      return res.status(404).json({ success: false, error: 'Attacker team not found' });
    }

    // Apply security modifiers (90% base success for ransomware)
    const sec = device.configuration?.securitySettings as RawSecuritySettings | undefined;
    const { finalChance } = computeSuccessChance({ baseSuccess: 0.90, security: sec });
    
    const roll = Math.random();
    const success = roll < finalChance;
    

    if (success) {
      // Calculate ransom demand (use custom amount or 30-50% of target's balance, min 50 BTC)
      const demand = demandAmount || Math.max(50, Math.floor(targetTeam.wallet.bitcoinBalance * (0.3 + (Math.random() * 0.2))));
      
      // Session expires in 3 minutes
      const expires = Date.now() + (3 * 60 * 1000);
      const sessionKey = `${targetIP}-${Date.now()}`;
      
      activeSessions[sessionKey] = {
        attackerTeamId,
        targetTeamId: String(targetTeam._id),
        targetIP,
        demand,
        expires,
        encryptionStarted: Date.now()
      };

      // Random typing phrase for defense
      const defensePhrase = TYPING_PHRASES[Math.floor(Math.random() * TYPING_PHRASES.length)];
      
      // Emit ransomware spawn to target team (triggers typing defense)
      emitScoped(res, { 
        scope: 'team', 
        id: String(targetTeam._id), 
        event: 'cryptolocker-spawn', 
        payload: { 
          sessionKey,
          targetIP,
          attackerTeamId,
          phrase: defensePhrase,
          timeLimit: 45000, // 45 seconds to type the phrase
          demand,
          expires,
          ts: Date.now()
        } 
      });

      // Emit attack confirmation to attacker
      emitScoped(res, { 
        scope: 'team', 
        id: attackerTeamId, 
        event: 'cryptolocker-deployed', 
        payload: { 
          targetIP,
          demand,
          expires,
          status: 'encrypting',
          ts: Date.now()
        } 
      });

      return res.status(200).json({ 
        success: true, 
        outcome: 'deployed',
        sessionKey,
        demand,
        expires,
        successChance: finalChance
      });
    } else {
      // Attack failed
      emitScoped(res, { 
        scope: 'team', 
        id: attackerTeamId, 
        event: 'cryptolocker-failed', 
        payload: { 
          targetIP,
          reason: 'target security too strong',
          ts: Date.now()
        } 
      });

      return res.status(200).json({ 
        success: true, 
        outcome: 'failed',
        successChance: finalChance 
      });
    }
  } catch (error) {
    logger.error('CryptoLocker Elite error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}

// Export for other endpoints to access
export { activeSessions };
