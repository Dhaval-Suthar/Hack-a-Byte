import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Device from '@/models/Device';
import GameSession from '@/models/GameSession';
import { assertRoleAccess } from '@/lib/role-access';
import { badRequest, methodNotAllowed, notFound, roleForbidden } from '@/lib/api-errors';
import type { NextApiResponseServerIo } from '@/lib/socket';

/* Unified game end endpoint
   Modes:
   1) Early team end (Professor): body { teamId }
      - role check: end-game
      - sets device offline and emits game-session-ended (reason: early-end)
   2) Session completion: body { sessionId, winnerId?, force? }
      - ends GameSession document, emits game-session-ended & game-over
   Priority: if sessionId provided, process session completion; else expect teamId.
*/
const g = global as unknown as { __endingSessions?: Set<string> };
if (!g.__endingSessions) g.__endingSessions = new Set();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const { sessionId, winnerId, force, teamId } = req.body || {};
  await connectDb();

  // Session termination path
  if (sessionId) {
  try {
  if (g.__endingSessions && g.__endingSessions.has(sessionId)) return res.status(409).json({ success: false, error: 'Session ending in progress' });
  g.__endingSessions?.add(sessionId);
  const session = await GameSession.findById(sessionId);
      if (!session) return notFound(res, 'Game session not found');
      if (session.status === 'completed') return res.status(200).json({ success: true, message: 'Already completed' });
      if (!force && session.status !== 'active') return badRequest(res, 'Session not active');
  await session.end(winnerId);
      try {
        const io = (res as unknown as NextApiResponseServerIo).socket?.server?.io;
        if (io) {
          const payload = { sessionId, winner: winnerId, ts: Date.now() };
            io.emit('game-session-ended', payload);
            io.emit('game-over', payload);
        }
      } catch {}
      return res.status(200).json({ success: true, sessionId, winner: winnerId, status: 'completed' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      if (msg.includes('No document found')) {
        return res.status(409).json({ success: false, error: 'Session already ended' });
      }
      return res.status(500).json({ error: 'Internal error', detail: msg });
    } finally {
  g.__endingSessions?.delete(sessionId);
    }
  }

  // Early team end path
  if (!teamId) return badRequest(res, 'teamId or sessionId required');
  try { await assertRoleAccess(teamId, 'end-game'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res,{ allowed: err.allowed, appId: 'end-game' }); }
  const team = await Team.findById(teamId).select('deviceId');
  if (!team) return notFound(res, 'Team not found');
  if (team.deviceId) {
    const device = await Device.findById(team.deviceId).select('status');
    if (device) { device.status = 'offline'; await device.save(); }
  }
  try { (res as unknown as NextApiResponseServerIo).socket?.server?.io?.emit('game-session-ended', { teamId, reason: 'early-end', ts: Date.now() }); } catch {}
  return res.status(200).json({ success: true, ended: true, teamId });
}