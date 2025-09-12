import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import { z } from 'zod';
import { emitScoped } from '@/lib/emitter';
import { activeSessions } from './cryptolocker';

// CryptoLocker typing defense endpoint
// POST body: { sessionKey, phrase, teamId }
// GET: { sessionKey } - get session status

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { sessionKey } = req.query as { sessionKey?: string };
    if (!sessionKey) return res.status(400).json({ success: false, error: 'sessionKey required' });
    
    const session = activeSessions[sessionKey];
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    
    const timeLeft = Math.max(0, session.expires - Date.now());
    return res.status(200).json({
      success: true,
      session: {
        ...session,
        timeLeft,
        expired: timeLeft <= 0
      }
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  
  const schema = z.object({ 
    sessionKey: z.string().min(1),
    targetIP: z.string().min(1),
    success: z.boolean(),
    completedPhrases: z.number().min(0),
    requiredPhrases: z.number().min(1),
    action: z.enum(['quit', 'timeout']).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid body' });
  
  const { sessionKey, targetIP, success, completedPhrases, requiredPhrases, action } = parsed.data;

  try {
    await connectDb();
    
    const session = activeSessions[sessionKey];
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or expired' });
    }

    // Verify target IP matches
    if (session.targetIP !== targetIP) {
      return res.status(403).json({ success: false, error: 'Target IP mismatch' });
    }

    if (success) {
      // Defense successful - ransomware neutralized
      emitScoped(res, { 
        scope: 'team', 
        id: session.targetTeamId, 
        event: 'cryptolocker-neutralized', 
        payload: { 
          sessionKey,
          message: 'Defense successful! Ransomware neutralized.',
          completedPhrases,
          requiredPhrases,
          ts: Date.now()
        } 
      });

      // Notify attacker
      emitScoped(res, { 
        scope: 'team', 
        id: session.attackerTeamId, 
        event: 'cryptolocker-blocked', 
        payload: { 
          targetIP: session.targetIP,
          message: 'Target successfully defended against ransomware',
          ts: Date.now()
        } 
      });

      delete activeSessions[sessionKey];
      return res.status(200).json({ 
        success: true, 
        outcome: 'defense_successful',
        message: 'Ransomware successfully neutralized!'
      });
    } else {
      // Defense failed
      if (action === 'quit') {
        // Player chose to quit - trigger game over
        emitScoped(res, { 
          scope: 'team', 
          id: session.targetTeamId, 
          event: 'cryptolocker-game-over', 
          payload: { 
            reason: 'Player quit after ransomware attack',
            demanded: session.demand,
            available: 0, // Will be filled by client
            message: 'Game Over: You chose to quit after failing to defend against CryptoLocker Elite',
            ts: Date.now()
          } 
        });

        // Notify attacker of victim quitting
        emitScoped(res, { 
          scope: 'team', 
          id: session.attackerTeamId, 
          event: 'cryptolocker-victim-quit', 
          payload: { 
            targetIP: session.targetIP,
            demand: session.demand,
            message: 'Target chose to quit the game rather than pay ransom',
            ts: Date.now()
          } 
        });

        delete activeSessions[sessionKey];
        return res.status(200).json({ 
          success: false, 
          outcome: 'victim_quit',
          message: 'Target quit the game'
        });
      } else {
        // Time ran out - trigger payment demand
        await triggerPaymentDemand(res, session);
        // Don't delete session yet - payment might still come
        return res.status(200).json({ 
          success: false, 
          outcome: 'defense_failed_timeout',
          message: 'Defense failed - files encrypted! Payment demand triggered.',
          completedPhrases,
          requiredPhrases
        });
      }
    }
  } catch (error) {
    console.error('CryptoLocker defense error:', error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}

async function triggerPaymentDemand(res: NextApiResponse, session: typeof activeSessions[string]) {
  // Emit payment demand to all team members
  emitScoped(res, { 
    scope: 'team', 
    id: session.targetTeamId, 
    event: 'cryptolocker-payment-demand', 
    payload: { 
      attackerTeamId: session.attackerTeamId,
      demand: session.demand,
      targetIP: session.targetIP,
      deadline: Date.now() + (2 * 60 * 1000), // 2 minutes to pay
      message: `FILES ENCRYPTED! Pay ${session.demand} BTC or lose everything!`,
      ts: Date.now()
    } 
  });

  // Notify attacker of successful encryption
  emitScoped(res, { 
    scope: 'team', 
    id: session.attackerTeamId, 
    event: 'cryptolocker-encrypted', 
    payload: { 
      targetIP: session.targetIP,
      demand: session.demand,
      message: 'Target files encrypted! Awaiting payment...',
      ts: Date.now()
    } 
  });
}
