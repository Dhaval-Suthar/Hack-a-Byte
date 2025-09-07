import { NextApiRequest } from 'next';
import { NextApiResponseServerIo, initSocket } from '@/lib/socket';

export default function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  console.log('🔌 Socket.IO API route called, method:', req.method);

  // Check if Socket.IO is already initialized
  if (!res.socket?.server?.io) {
    console.log('🔌 Socket.IO not initialized, initializing now...');
    try {
      // Ensure we have the server object
      if (!res.socket?.server) {
        console.error('❌ No server object available in response');
        res.status(500).end();
        return;
      }

      const io = initSocket(res.socket.server);
      res.socket.server.io = io;
      console.log('✅ Socket.IO server initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Socket.IO:', error);
      res.status(500).end();
      return;
    }
  } else {
    console.log('✅ Socket.IO already running');
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
