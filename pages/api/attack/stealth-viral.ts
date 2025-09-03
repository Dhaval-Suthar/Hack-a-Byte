import { NextApiRequest, NextApiResponse } from 'next';
import { assertRoleAccess } from '@/lib/role-access';
import { emitRoom } from '@/lib/emitter';
import { roleForbidden, methodNotAllowed, badRequest, notFound } from '@/lib/api-errors';

// In-memory active virus instances keyed by playspace or device
interface ViralInstance { spawned: number; clicksRequired: number; clicks: number; expires: number; }
const active: Record<string, ViralInstance> = {};

// Helper to emit socket events if socket server available
// Lightweight emitter with loose typing (payload kept generic)
// Debounce map for progress events
const lastProgressEmit: Record<string, number> = {};
function progressEmit(res: NextApiResponse, targetKey: string, event: string, payload: Record<string, unknown>) {
  const now = Date.now();
  const key = `${targetKey}:${event}`;
  if (event.includes('progress')) {
    if (lastProgressEmit[key] && now - lastProgressEmit[key] < 300) return; // 300ms throttle
    lastProgressEmit[key] = now;
  }
  emitRoom(res, event, payload);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { targetKey } = req.query as { targetKey?: string };
  if (!targetKey) return badRequest(res, 'Missing targetKey');

  // GET: Fetch current infection status (for defender polling / initial UI load)
  if (req.method === 'GET') {
    const inst = active[targetKey];
  if (!inst) return notFound(res, 'No active infection');
    if (Date.now() > inst.expires) {
      delete active[targetKey];
      return res.status(410).json({ success: false, error: 'Expired' });
    }
    return res.status(200).json({ success: true, clicks: inst.clicks, clicksRequired: inst.clicksRequired, remainingMs: inst.expires - Date.now() });
  }

    if (req.method === 'POST') {
      const teamId = req.headers['x-team-id'] as string | undefined;
      if (teamId) {
        try { await assertRoleAccess(teamId, 'worm-phish'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res, { allowed: err.allowed, appId: 'worm-phish' }); }
      }
    // Start a new stealth viral mini-game instance
    active[targetKey] = {
      spawned: Date.now(),
      clicksRequired: 6 + Math.floor(Math.random() * 5),
      clicks: 0,
      expires: Date.now() + 10_000, // 10s to defeat
    };
  emitRoom(res, 'malware-stealth-viral-spawn', { targetKey, clicksRequired: active[targetKey].clicksRequired });
  return res.status(200).json({ success: true, instance: active[targetKey] });
  }
  if (req.method === 'PUT') {
    // Defender action: require defender/strategist role
    const teamId = req.headers['x-team-id'] as string | undefined;
    if (teamId) {
      try { await assertRoleAccess(teamId, 'def-stealth'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res, { allowed: err.allowed, appId: 'def-stealth' }); }
    }
    const inst = active[targetKey];
  if (!inst) return notFound(res, 'No active infection');
    if (Date.now() > inst.expires) {
      delete active[targetKey];
      return res.status(410).json({ success: false, error: 'Expired', defeated: false });
    }
    inst.clicks += 1;
    const defeated = inst.clicks >= inst.clicksRequired;
    if (defeated) {
      delete active[targetKey];
  emitRoom(res, 'malware-stealth-viral-defeated', { targetKey });
    } else {
  progressEmit(res, targetKey, 'malware-stealth-viral-progress', { targetKey, clicks: inst.clicks, clicksRequired: inst.clicksRequired });
    }
    return res.status(200).json({ success: true, defeated, clicks: inst.clicks, clicksRequired: inst.clicksRequired, remainingMs: inst.expires - Date.now() });
  }
  return methodNotAllowed(res);
}
