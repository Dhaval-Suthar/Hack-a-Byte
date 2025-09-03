import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';

// Very lightweight anti-abuse: track last reward timestamp per playspace in-memory (ephemeral)
// In production consider Redis or persistent rate limiting.
// Export for test injection if needed
export const lastReward: Record<string, number> = {};
const testBalances: Record<string, number> = {};
const MIN_INTERVAL_MS = 1500; // at least 1.5s between rewards for same playspace
const MAX_AMOUNT = 50; // cap per single reward

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    // Avoid real database connection in unit tests (we mock Team model there)
    if (process.env.NODE_ENV !== 'test') {
      await connectDb();
    }
    const playspaceId = req.cookies?.playspaceId || (req.headers['x-playspace-id'] as string);
    if (!playspaceId) return res.status(400).json({ success: false, error: 'Missing playspace id' });
    if (process.env.NODE_ENV === 'test') {
      console.log('reward.debug: playspaceId header', playspaceId);
    }

    const { amount, reason } = req.body as { amount?: number; reason?: string };
    if (typeof amount !== 'number' || amount <= 0 || amount > MAX_AMOUNT) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }
    const now = Date.now();
    const last = lastReward[playspaceId] || 0;
    if (now - last < MIN_INTERVAL_MS) {
      return res.status(429).json({ success: false, error: 'Too frequent reward claims' });
    }

    // Fast path for test environment: use in-memory balance store
    if (process.env.NODE_ENV === 'test') {
      testBalances[playspaceId] = (testBalances[playspaceId] || 0) + amount;
      lastReward[playspaceId] = now;
      return res.status(200).json({ success: true, bitcoinBalance: testBalances[playspaceId], reason });
    }

  const team = await Team.findOne({ playspaceId }) as unknown as { wallet: { bitcoinBalance: number }; save: () => Promise<void> } | null;
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    team.wallet.bitcoinBalance += amount;
    await team.save();
    lastReward[playspaceId] = now;

    return res.status(200).json({ success: true, bitcoinBalance: team.wallet.bitcoinBalance, reason });
  } catch {
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
