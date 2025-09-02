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
  console.log('🔌 Initializing Socket.IO server...');
  const io = new ServerIO(httpServer, {
    path: '/api/socketio',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  console.log('🔌 Socket.IO server created with path: /api/socketio');

  // Store connected clients by playspaceId
  const clientsByPlayspace = new Map<string, Set<string>>();
  // Store connected clients by teamId for team-based features
  const clientsByTeam = new Map<string, Set<string>>();
  // Store connected clients by userId for personal notifications
  const clientsByUser = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    console.log('🔌 Total connected clients:', io.sockets.sockets.size);

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

    // Join team room for team-based features
    socket.on('join-team', (teamId: string) => {
      socket.join(`team-${teamId}`);
      console.log(`🔌 Client ${socket.id} joined team: ${teamId}`);
      console.log(`🔌 Clients in team-${teamId}:`, io.sockets.adapter.rooms.get(`team-${teamId}`)?.size || 0);

      // Track clients by team
      if (!clientsByTeam.has(teamId)) {
        clientsByTeam.set(teamId, new Set());
      }
      clientsByTeam.get(teamId)?.add(socket.id);
    });

    // Join user room for personal notifications
    socket.on('join-user', (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`Client ${socket.id} joined user: ${userId}`);

      // Track clients by user
      if (!clientsByUser.has(userId)) {
        clientsByUser.set(userId, new Set());
      }
      clientsByUser.get(userId)?.add(socket.id);
    });

    // Join tournament room
    socket.on('join-tournament', (tournamentId: string) => {
      socket.join(`tournament-${tournamentId}`);
      console.log(`Client ${socket.id} joined tournament: ${tournamentId}`);
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

    // Handle tournament updates
    socket.on('tournament-update', (data: {
      tournamentId: string;
      type: 'registration' | 'start' | 'match_update' | 'end';
      message: string;
      data?: Record<string, unknown>;
    }) => {
      console.log('Tournament update:', data);

      // Broadcast to all clients in tournament room
      io.to(`tournament-${data.tournamentId}`).emit('tournament-notification', {
        ...data,
        timestamp: Date.now(),
      });
    });

    // Handle team chat messages
    socket.on('send-message', (data: {
      teamId: string;
      message: string;
      senderId?: string; // Made optional
      senderName: string;
      type?: string;
    }) => {
      console.log('📨 Team message received:', data);
      console.log('📨 Broadcasting to room:', `team-${data.teamId}`);

      // Broadcast to all clients in team room (except sender)
      socket.to(`team-${data.teamId}`).emit('new-message', {
        ...data,
        timestamp: Date.now(),
      });

      console.log('📨 Message broadcast complete');
    });

    // Handle achievement unlocks
    socket.on('achievement-unlocked', (data: {
      userId: string;
      achievementId: string;
      achievementName: string;
      points: number;
    }) => {
      console.log('Achievement unlocked:', data);

      // Broadcast to user's personal room
      io.to(`user-${data.userId}`).emit('achievement-notification', {
        ...data,
        timestamp: Date.now(),
      });

      // Also broadcast to team if user is in a team
      // This would require additional team lookup logic
    });

    // Handle wallet transactions
    socket.on('wallet-transaction', (data: {
      teamId: string;
      type: 'credit' | 'debit';
      amount: number;
      description: string;
    }) => {
      console.log('Wallet transaction:', data);

      // Broadcast to all clients in team room
      io.to(`team-${data.teamId}`).emit('wallet-update', {
        ...data,
        timestamp: Date.now(),
      });
    });

    // Handle notifications
    socket.on('send-notification', (data: {
      userId: string;
      title: string;
      message: string;
      type: string;
    }) => {
      console.log('Notification sent:', data);

      // Send to user's personal room
      io.to(`user-${data.userId}`).emit('new-notification', {
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

      // Remove from all team tracking
      clientsByTeam.forEach((clients, teamId) => {
        clients.delete(socket.id);
        if (clients.size === 0) {
          clientsByTeam.delete(teamId);
        }
      });

      // Remove from all user tracking
      clientsByUser.forEach((clients, userId) => {
        clients.delete(socket.id);
        if (clients.size === 0) {
          clientsByUser.delete(userId);
        }
      });
    });
  });

  return io;
};
