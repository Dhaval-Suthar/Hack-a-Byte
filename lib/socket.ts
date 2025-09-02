import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { Socket as NetSocket } from 'net';

export type NextApiResponseServerIo = NextApiResponse & {
  socket: NetSocket & {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export const initSocket = (httpServer: NetServer) => {
  const io = new ServerIO(httpServer, {
    path: '/api/socketio',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store connected clients by playspaceId
  const clientsByPlayspace = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    console.log('Total connected clients:', io.sockets.sockets.size);

    // Join playspace room
    socket.on('join-playspace', (playspaceId: string) => {
      socket.join(playspaceId);
      console.log(`Client ${socket.id} joined playspace: ${playspaceId}`);
      console.log('Clients in room', playspaceId, ':', io.sockets.adapter.rooms.get(playspaceId)?.size || 0);

      // Track clients by playspace
      if (!clientsByPlayspace.has(playspaceId)) {
        clientsByPlayspace.set(playspaceId, new Set());
      }
      clientsByPlayspace.get(playspaceId)?.add(socket.id);
    });

    // Handle malware attacks
    socket.on('malware-attack', (data: {
      attackerPlayspaceId: string;
      targetInfo: string;
      malwareType: string;
      malwareId: string;
      attackerName: string;
    }) => {
      console.log('Malware attack received on server:', data);
      console.log('Socket rooms:', Array.from(socket.rooms));
      console.log('Clients in playspace:', clientsByPlayspace.get(data.attackerPlayspaceId)?.size || 0);

      // Broadcast attack to all clients in the same playspace (except attacker)
      socket.to(data.attackerPlayspaceId).emit('incoming-attack', {
        ...data,
        timestamp: Date.now(),
      });

      // Also broadcast to attacker for confirmation
      socket.emit('attack-sent', {
        ...data,
        timestamp: Date.now(),
      });

      console.log('Attack broadcasted to playspace:', data.attackerPlayspaceId);
    });

    // Handle attack effects
    socket.on('attack-effect', (data: {
      playspaceId: string;
      effect: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      duration?: number;
    }) => {
      console.log('Attack effect triggered:', data);

      // Broadcast effect to all clients in playspace
      io.to(data.playspaceId).emit('global-effect', {
        ...data,
        timestamp: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      // Remove from all playspace tracking
      clientsByPlayspace.forEach((clients, playspaceId) => {
        clients.delete(socket.id);
        if (clients.size === 0) {
          clientsByPlayspace.delete(playspaceId);
        }
      });
    });
  });

  return io;
};
