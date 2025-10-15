import type { NextApiResponse } from 'next';
import { getServerIo } from '@/lib/socket';

type Scope = 'playspace' | 'team' | 'global';

interface EmitOptions {
  scope?: Scope;
  id?: string; // playspaceId or teamId based on scope
  event: string;
  payload: Record<string, unknown>;
}

// Unified emission helper. If scope + id provided, targets room. Else attempts playspace cookie fallback, else global.
export function emitRoom(res: NextApiResponse, event: string, payload: Record<string, unknown>) {
  return emitScoped(res, { event, payload });
}

export function emitScoped(res: NextApiResponse, opts: EmitOptions) {
  try {
    const { scope, id, event, payload } = opts;
    const io = getServerIo();
      if (!io) return;
    const reqAny = (res as unknown as { req?: { cookies?: Record<string,string> } }).req;
    const playspaceCookie = reqAny?.cookies?.playspaceId;
    const enriched = { ...payload, ts: Date.now(), playspaceId: playspaceCookie };
    let room: string | undefined;
  // Align with socket server: playspace rooms are joined by raw playspaceId; team rooms are `team-<teamId>`
  if (scope === 'playspace' && id) room = id;
  else if (scope === 'team' && id) room = `team-${id}`;
  else if (playspaceCookie) room = playspaceCookie; // fallback broadcast to current playspace
  if (room) io.to(room).emit(event, enriched); else io.emit(event, enriched);
  } catch {}
}
