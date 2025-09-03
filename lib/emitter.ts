import type { NextApiResponse } from 'next';
import type { NextApiResponseServerIo } from '@/lib/socket';

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
    const resAny = res as unknown as NextApiResponseServerIo;
  // Broad cast due to Next.js augmented socket; refine if server.io type exported
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const io = (resAny.socket as any)?.server?.io;
    if (!io) return;
    const reqAny = (res as unknown as { req?: { cookies?: Record<string,string> } }).req;
    const playspaceCookie = reqAny?.cookies?.playspaceId;
    const enriched = { ...payload, ts: Date.now(), playspaceId: playspaceCookie };
    let room: string | undefined;
    if (scope === 'playspace' && id) room = `playspace:${id}`;
    else if (scope === 'team' && id) room = `team:${id}`;
    else if (playspaceCookie) room = `playspace:${playspaceCookie}`;
    if (room) io.to(room).emit(event, enriched); else io.emit(event, enriched);
  } catch {}
}
