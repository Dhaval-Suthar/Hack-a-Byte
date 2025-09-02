import { NextApiRequest } from 'next';
import { NextApiResponseServerIo, initSocket } from '@/lib/socket';

export default function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  console.log('Socket.IO API route called, method:', req.method);
  if (res.socket.server.io) {
    console.log('Socket.IO already running');
  } else {
    console.log('Initializing Socket.IO server');
    const io = initSocket(res.socket.server);
    res.socket.server.io = io;
    console.log('Socket.IO server initialized');
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
