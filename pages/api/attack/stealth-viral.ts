import { NextApiRequest, NextApiResponse } from 'next';
import { redisRateLimit } from '@/lib/redisRateLimit';
import { emitScoped } from '@/lib/emitter';

// In-memory state for StealthViral attacks
interface StealthViralState {
  targetKey: string;
  clicksRequired: number;
  clicks: number;
  spawned: number;
  defeated: boolean;
  attackerTeamId?: string;
  lastProgress: number;
}

const stealthStates: Record<string, StealthViralState> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { targetKey } = req.query as { targetKey?: string };
  if (!targetKey) return res.status(400).json({ success: false, error: 'Missing targetKey' });

  if (req.method === 'POST') {
    // Launch StealthViral attack
    const attackerTeamId = req.headers['x-team-id'] as string;
    const targetTeamId = req.headers['x-target-team-id'] as string | undefined;
    if (!targetTeamId) return res.status(400).json({ success: false, error: 'Missing x-target-team-id header' });
    const redisRL = await redisRateLimit(`stealth-viral:${attackerTeamId || 'anon'}`, 3, 120_000);
    if (!redisRL.allowed) return res.status(429).json({ success: false, error: 'Rate limit', reset: redisRL.reset });

    // Check if already active
    if (stealthStates[targetKey] && !stealthStates[targetKey].defeated) {
      return res.status(409).json({ success: false, error: 'StealthViral already active on target' });
    }

    // Create new attack
    const clicksRequired = Math.floor(Math.random() * 50) + 30; // 30-80 clicks
    stealthStates[targetKey] = {
      targetKey,
      clicksRequired,
      clicks: 0,
      spawned: Date.now(),
      defeated: false,
      attackerTeamId,
      lastProgress: Date.now()
    };

    // Emit spawn event to target team only (defenders) and attacker team
    emitScoped(res, {
      scope: 'team',
      id: targetTeamId,
      event: 'malware-stealth-viral-spawn',
      payload: { targetKey, clicksRequired }
    });
    console.log('🦠 StealthViral spawn emitted to target team:', { targetTeamId, targetKey, clicksRequired });
    if (attackerTeamId) {
      emitScoped(res, {
        scope: 'team',
        id: attackerTeamId,
        event: 'malware-stealth-viral-spawn',
        payload: { targetKey, clicksRequired, role: 'attacker' }
      });
      console.log('🦠 StealthViral spawn emitted to attacker team:', { attackerTeamId, targetKey, clicksRequired });
    }

    // Kick off periodic random popup emission (server-driven) for first 60s
    const popupInterval = setInterval(() => {
      const state = stealthStates[targetKey];
      if (!state || state.defeated) { clearInterval(popupInterval); return; }
      // Emit a batch of 1-3 popup nodes with random positions (client clamps to viewport)
      const batch = Array.from({ length: 1 + Math.floor(Math.random()*3) }).map(() => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        x: Math.random(), // normalized 0-1
        y: Math.random(),
        size: 40 + Math.floor(Math.random()*70)
      }));
  emitScoped(res, { scope: 'team', id: targetTeamId, event: 'stealth-viral-popups', payload: { targetKey, batch } });
    }, 2500);
    setTimeout(() => clearInterval(popupInterval), 60_000);

  // Defender notification
  emitScoped(res, { scope: 'team', id: targetTeamId, event: 'virus-notification', payload: { targetKey, virusType: 'StealthViral', message: 'StealthViral detected! Neutralize before spread!', severity: 'warning' } });
  console.log('🚨 StealthViral virus-notification emitted to target team:', { targetTeamId, targetKey });

    // Auto-progress if defender doesn't act
    setTimeout(() => {
      const state = stealthStates[targetKey];
      if (state && !state.defeated) {
        // Virus wins if no defender action within 2 minutes
        state.defeated = true;
        emitScoped(res, { 
          scope: 'team', 
          id: state.attackerTeamId!, 
          event: 'stealth-viral-victory', 
          payload: { targetKey, outcome: 'timeout' } 
        });
        delete stealthStates[targetKey];
      }
    }, 120_000); // 2 minutes timeout

    return res.status(200).json({ 
      success: true, 
      message: 'StealthViral deployed successfully', 
      targetKey, 
      clicksRequired 
    });

  } else if (req.method === 'GET') {
    // Get current state
    const state = stealthStates[targetKey];
    if (!state) {
      return res.status(200).json({ success: true, active: false });
    }

    const coveragePercent = Math.min(100, Math.floor((state.clicks / state.clicksRequired) * 100));
    const progressPercent = 100 - coveragePercent;

    return res.status(200).json({
      success: true,
      active: true,
      clicks: state.clicks,
      clicksRequired: state.clicksRequired,
      coveragePercent,
      progressPercent,
      defeated: state.defeated,
      message: state.defeated ? 'StealthViral neutralized' : 
               coveragePercent > 80 ? 'CRITICAL - Virus spreading rapidly!' :
               coveragePercent > 50 ? 'Virus detected - Act fast!' : 
               'StealthViral infection detected'
    });

  } else if (req.method === 'PUT') {
    // Defender click action
    const targetTeamId = req.headers['x-target-team-id'] as string | undefined;
    if (!targetTeamId) return res.status(400).json({ success: false, error: 'Missing x-target-team-id header' });
    const state = stealthStates[targetKey];
    if (!state) {
      return res.status(404).json({ success: false, error: 'No active StealthViral' });
    }

    if (state.defeated) {
      return res.status(409).json({ success: false, error: 'Already defeated' });
    }

    // Increment clicks
    state.clicks += 1;
    state.lastProgress = Date.now();
    
    const coveragePercent = Math.min(100, Math.floor((state.clicks / state.clicksRequired) * 100));
    const progressPercent = 100 - coveragePercent;

    // Check if virus wins (coverage reaches 100%)
    if (coveragePercent >= 100) {
      state.defeated = true;
      // Emit progress update
  emitScoped(res, { scope: 'team', id: targetTeamId, event: 'malware-stealth-viral-progress', payload: { targetKey, clicks: state.clicks, clicksRequired: state.clicksRequired, coveragePercent, progressPercent, message: 'TOO LATE! StealthViral has taken control!' } });
      
      // Notify attacker of victory
      if (state.attackerTeamId) {
        emitScoped(res, { 
          scope: 'team', 
          id: state.attackerTeamId, 
          event: 'stealth-viral-victory', 
          payload: { targetKey, outcome: 'success' } 
        });
      }

      delete stealthStates[targetKey];
      return res.status(200).json({ 
        success: false, 
        virusWon: true, 
        message: 'TOO LATE! StealthViral has taken control!' 
      });
    }

    // Check if defender wins (enough clicks)
    if (state.clicks >= state.clicksRequired) {
      state.defeated = true;
      
      // Emit defeat event
  emitScoped(res, { scope: 'team', id: targetTeamId, event: 'malware-stealth-viral-defeated', payload: { targetKey } });

      // Notify attacker of defeat
      if (state.attackerTeamId) {
        emitScoped(res, { 
          scope: 'team', 
          id: state.attackerTeamId, 
          event: 'stealth-viral-defeat', 
          payload: { targetKey, outcome: 'neutralized' } 
        });
      }

      delete stealthStates[targetKey];
      return res.status(200).json({
        success: true,
        defeated: true,
        clicks: state.clicks,
        clicksRequired: state.clicksRequired,
        coveragePercent: 0,
        progressPercent: 100,
        message: 'StealthViral neutralized successfully!'
      });
    }

    // Emit progress update
    emitScoped(res, { 
      scope: 'playspace', 
      id: targetKey, 
      event: 'malware-stealth-viral-progress', 
      payload: { 
        targetKey, 
        clicks: state.clicks, 
        clicksRequired: state.clicksRequired, 
        coveragePercent, 
        progressPercent,
        message: coveragePercent > 80 ? 'CRITICAL - Virus spreading rapidly!' :
                 coveragePercent > 50 ? 'Virus detected - Act fast!' : 
                 'StealthViral infection detected',
        ts: Date.now() 
      } 
    });

    return res.status(200).json({
      success: true,
      clicks: state.clicks,
      clicksRequired: state.clicksRequired,
      coveragePercent,
      progressPercent,
      message: coveragePercent > 80 ? 'CRITICAL - Virus spreading rapidly!' :
               coveragePercent > 50 ? 'Virus detected - Act fast!' : 
               'StealthViral infection detected'
    });

  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
