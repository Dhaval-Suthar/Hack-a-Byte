import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Internal Socket.IO endpoint removed. Use the external socket server.
  res.status(410).json({ error: 'Socket.IO moved to external server' });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
