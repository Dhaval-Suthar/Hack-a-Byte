import type { NextApiRequest, NextApiResponse } from 'next';
import { runRandomMessageSystem } from '@/lib/randomMessageGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runRandomMessageSystem();

    return res.status(200).json({
      success: true,
      message: 'Random message system triggered manually'
    });
  } catch (error) {
    console.error('❌ Error triggering random message system:', error);
    return res.status(500).json({
      error: 'Failed to trigger random message system',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
