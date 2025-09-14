import type { NextApiResponse } from 'next';
import { emitSocketEvent } from '@/lib/externalSocket';

// Keep this type so imports don't break across API routes.
export type NextApiResponseServerIo = NextApiResponse & {
  // Not used anymore; kept for compatibility.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket: any;
};

// A lightweight shim that mimics a subset of Socket.IO server API and forwards to the external server.
type IoShim = {
  emit: (event: string, data: Record<string, unknown>) => void;
  to: (room: string) => { emit: (event: string, data: Record<string, unknown>) => void };
};

let shim: IoShim | undefined;

export const getServerIo = (): IoShim | undefined => {
  if (shim) return shim;
  shim = {
    emit: (event, data) => {
      // Global broadcast: no room; external server will broadcast.
      emitSocketEvent('', event, data).catch(() => {});
    },
    to: (room: string) => ({
      emit: (event, data) => {
        emitSocketEvent(room, event, data).catch(() => {});
      },
    }),
  };
  return shim;
};
