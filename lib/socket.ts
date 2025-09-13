import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { Socket as NetSocket } from 'net';
import Team from '@/models/Team';
import connectDb from '@/db/connectDb';

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
    pingTimeout: 60000,
    pingInterval: 25000,
  });


  // Expose server IO globally for internal emitters (e.g., background schedulers)
  (globalThis as unknown as { __serverIo?: ServerIO }).__serverIo = io;

  // Store connected clients by playspaceId
  const clientsByPlayspace = new Map<string, Set<string>>();
  // Store connected clients by teamId for team-based features
  const clientsByTeam = new Map<string, Set<string>>();
  // Store connected clients by userId for personal notifications
  const clientsByUser = new Map<string, Set<string>>();

  io.on('connection', (socket) => {

    // Helper: emit to a playspace room with standard envelope
    const emitToPlayspace = (playspaceId: string, event: string, payload: Record<string, unknown>) => {
      io.to(playspaceId).emit(event, { ...payload, ts: Date.now(), scope: 'playspace', playspaceId });
    };

    // Join playspace room
    socket.on('join-playspace', (playspaceId: string) => {
      socket.join(playspaceId);

      // Track clients by playspace
      if (!clientsByPlayspace.has(playspaceId)) {
        clientsByPlayspace.set(playspaceId, new Set());
      }
      clientsByPlayspace.get(playspaceId)?.add(socket.id);
    });

    // Join team room for team-based features
    socket.on('join-team', async (teamId: string) => {
      const roomName = `team-${teamId}`;
      // If already in the room, skip noisy re-joins
      if ((socket.rooms as Set<string>).has(roomName)) {
        return;
      }
      socket.join(roomName);

      // Track clients by team
      if (!clientsByTeam.has(teamId)) {
        clientsByTeam.set(teamId, new Set());
      }
      clientsByTeam.get(teamId)?.add(socket.id);

      // Emit role metadata for the team
      try {
        await connectDb();
        const team = await Team.findById(teamId).select('teamMembers.role');
        if (team) {
          const roles = team.teamMembers.map((m: { role?: string }) => m.role).filter(Boolean);
          io.to(roomName).emit('role-metadata', { teamId, roles, ts: Date.now() });
        }
      } catch {}
    });

    // Leave team room
    socket.on('leave-team', (teamId: string) => {
      const roomName = `team-${teamId}`;
      if ((socket.rooms as Set<string>).has(roomName)) {
        socket.leave(roomName);
      }
      // Update tracking map
      const set = clientsByTeam.get(teamId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) clientsByTeam.delete(teamId);
      }
    });

    // Join user room for personal notifications
    socket.on('join-user', (userId: string) => {
      socket.join(`user-${userId}`);

      // Track clients by user
      if (!clientsByUser.has(userId)) {
        clientsByUser.set(userId, new Set());
      }
      clientsByUser.get(userId)?.add(socket.id);
    });

    // Join tournament room
    socket.on('join-tournament', (tournamentId: string) => {
      socket.join(`tournament-${tournamentId}`);
    });

    // Handle malware attacks
    socket.on('malware-attack', (data: {
      attackerPlayspaceId: string;
      targetInfo: string;
      malwareType: string;
      malwareId: string;
      attackerName: string;
    }) => {

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

    });

    // Handle attack effects (playspace-wide or team-scoped)
    socket.on('attack-effect', (data: {
      playspaceId?: string;
      teamId?: string;
      effect: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      duration?: number;
    }) => {

      if (data.teamId) {
        // Team-scoped effect
        const room = `team-${data.teamId}`;
        io.to(room).emit('global-effect', {
          ...data,
          scope: 'team',
          timestamp: Date.now(),
        });
        return;
      }

      if (data.playspaceId) {
        // Playspace-wide effect (legacy/default)
        io.to(data.playspaceId).emit('global-effect', {
          ...data,
          scope: 'playspace',
          timestamp: Date.now(),
        });
      }
    });

    // Handle tournament updates
    socket.on('tournament-update', (data: {
      tournamentId: string;
      type: 'registration' | 'start' | 'match_update' | 'end';
      message: string;
      data?: Record<string, unknown>;
    }) => {

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

      // Broadcast to all clients in team room (except sender)
      socket.to(`team-${data.teamId}`).emit('new-message', {
        ...data,
        timestamp: Date.now(),
      });

    });

    // Handle achievement unlocks
    socket.on('achievement-unlocked', (data: {
      userId: string;
      achievementId: string;
      achievementName: string;
      points: number;
    }) => {

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

      // Send to user's personal room
      io.to(`user-${data.userId}`).emit('new-notification', {
        ...data,
        timestamp: Date.now(),
      });
    });

    // Internal forwarder for API-triggered scoped malware events (if APIs choose socket.emit)
    socket.on('internal-malware-event', (data: { playspaceId: string; event: string; payload?: Record<string, unknown>; }) => {
      if (data?.playspaceId && data?.event) {
        emitToPlayspace(data.playspaceId, data.event, data.payload || {});
      }
    });

    socket.on('disconnect', () => {

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

// Helper to access the Socket.IO server instance outside API routes (may be undefined until /api/socketio initializes)
export const getServerIo = (): ServerIO | undefined => {
  return (globalThis as unknown as { __serverIo?: ServerIO }).__serverIo;
};
