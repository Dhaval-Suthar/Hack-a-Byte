import { io, Socket } from 'socket.io-client';

let externalSocket: Socket | null = null;

/**
 * Get or create a socket connection to the external Socket.IO server
 * Used for emitting events from API routes in production (Vercel)
 */
export function getExternalSocket(): Socket | null {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const authToken = process.env.SOCKET_SERVER_EMIT_TOKEN?.trim();

  if (!socketUrl) {
    console.warn('NEXT_PUBLIC_SOCKET_URL not set, cannot connect to external socket server');
    return null;
  }

  if (!externalSocket || externalSocket.disconnected) {
    try {
      externalSocket = io(socketUrl, {
        path: '/api/socketio',
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: authToken ? { token: authToken } : undefined,
      });

      externalSocket.on('connect', () => {
        console.log('Connected to external Socket.IO server for emitting');
      });

      externalSocket.on('disconnect', () => {
        console.log('Disconnected from external Socket.IO server');
      });

      externalSocket.on('connect_error', (error) => {
        console.error('Failed to connect to external Socket.IO server:', error);
      });
    } catch (error) {
      console.error('Error creating external socket connection:', error);
      return null;
    }
  }

  return externalSocket;
}

/**
 * Emit an event to Socket.IO server (internal in dev, external in prod)
 * @param room - The room to emit to (e.g., 'team-123')
 * @param event - The event name
 * @param data - The event data
 */
export async function emitSocketEvent(room: string, event: string, data: Record<string, unknown>): Promise<boolean> {
  // Always use external Socket.IO server; ensure env is set in all environments.

  // Use external Socket.IO relay. The external server must support a `server-emit` event.
  const socket = getExternalSocket();
  console.log('🔍 emitSocketEvent: Using external server', { room, event, hasSocket: !!socket });
  if (!socket) return false;

  // Ensure connected before emitting, with a short wait if needed
  if (!socket.connected) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('connect timeout')), 8000);
      const onConnect = () => { clearTimeout(timer); socket.off('connect', onConnect); resolve(); };
      socket.on('connect', onConnect);
    }).catch(() => {});
  }

  try {
    const payload = { room, event, data } as const;
    // Ask the external server to emit to the room on our behalf
    const ack = await new Promise<boolean>((resolve) => {
      // Use timeout() so we don't hang forever
      (socket as Socket).timeout(5000).emit('server-emit', payload, (err: unknown, ok?: boolean) => {
        if (err) {
          console.warn('server-emit timeout or error:', err);
          return resolve(false);
        }
        if (!ok) {
          console.warn('server-emit rejected by server');
          return resolve(false);
        }
        resolve(true);
      });
    });
    if (!ack) {
      console.warn('❌ External server did not ack server-emit');
      return false;
    }
    console.log('✅ Emitted via external server', { room, event });
    return true;
  } catch (error) {
    console.error('❌ Error emitting via external server:', error);
    return false;
  }
}
