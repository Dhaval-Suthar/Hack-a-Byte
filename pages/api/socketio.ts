import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';

type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log('🔌 Setting up Socket.IO server...');
    
    const io = new ServerIO(res.socket.server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Handle team room management
    io.on('connection', (socket) => {
      console.log('✅ Client connected:', socket.id);

      // Join team room for virus notifications
      socket.on('join-team', (teamId: string) => {
        socket.join(`team-${teamId}`);
        console.log(`👥 Client ${socket.id} joined team-${teamId}`);
      });

      // Leave team room
      socket.on('leave-team', (teamId: string) => {
        socket.leave(`team-${teamId}`);
        console.log(`👋 Client ${socket.id} left team-${teamId}`);
      });

      // Join playspace room (legacy support)
      socket.on('join-playspace', (playspaceId: string) => {
        socket.join(playspaceId);
        console.log(`🌐 Client ${socket.id} joined playspace ${playspaceId}`);
      });

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};