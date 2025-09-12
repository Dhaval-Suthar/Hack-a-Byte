import { NextApiRequest } from 'next';
import { NextApiResponseServerIo, initSocket } from '@/lib/socket';

export default function handler(req: NextApiRequest, res: NextApiResponseServerIo) {

  // Check if Socket.IO is already initialized
  if (!res.socket?.server?.io) {
    try {
      // Ensure we have the server object
      if (!res.socket?.server) {
        console.error('❌ No server object available in response');
        res.status(500).end();
        return;
      }

      const io = initSocket(res.socket.server);
      res.socket.server.io = io;
    } catch (error) {
      console.error('❌ Failed to initialize Socket.IO:', error);
      res.status(500).end();
      return;
    }
  } else {
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
