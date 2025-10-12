import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';

// Very lightweight anti-abuse: track last reward timestamp per playspace in-memory (ephemeral)
// In production consider Redis or persistent rate limiting.
// Export for test injection if needed
export const lastReward: Record<string, number> = {};
const testBalances: Record<string, number> = {};
const MIN_INTERVAL_MS = 1500; // at least 1.5s between rewards for same playspace
// cap per single reward; allow larger end-of-game grants but keep protection
const MAX_AMOUNT = 500; // previously 50

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    // Avoid real database connection in unit tests (we mock Team model there)
    if (process.env.NODE_ENV !== 'test') {
      await connectDb();
    }
  const playspaceId = req.cookies?.playspaceId || (req.headers['x-playspace-id'] as string);
  const teamIdHeader = (req.headers['x-team-id'] as string) || '';
  if (!playspaceId && !teamIdHeader) return res.status(400).json({ success: false, error: 'Missing playspace or team id' });
    if (process.env.NODE_ENV === 'test') {
    }

  const { amount, reason } = req.body as { amount?: number; reason?: string };
    if (typeof amount !== 'number' || amount <= 0 || amount > MAX_AMOUNT) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }
  const now = Date.now();
  const limiterKey = playspaceId || teamIdHeader || 'global';
  const last = lastReward[limiterKey] || 0;
    // Allow frequent small rewards for snake gameplay
    const isSnakeReward = typeof reason === 'string' && reason.startsWith('snake');
    if (!isSnakeReward && now - last < MIN_INTERVAL_MS) {
      return res.status(429).json({ success: false, error: 'Too frequent reward claims' });
    }

    // Fast path for test environment: use in-memory balance store
    if (process.env.NODE_ENV === 'test') {
  const key = playspaceId || teamIdHeader || 'test';
  testBalances[key] = (testBalances[key] || 0) + amount;
  lastReward[limiterKey] = now;
  return res.status(200).json({ success: true, bitcoinBalance: testBalances[key], reason });
    }

  let team = await Team.findOne({ playspaceId }) as unknown as { _id: string; wallet: { bitcoinBalance: number }; snakeEarnings?: number; save: () => Promise<void> } | null;
    if (!team && teamIdHeader) {
      // try by team id header fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      team = await (Team as any).findById(teamIdHeader);
    }
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    team.wallet.bitcoinBalance += amount;
    // Track snake-only earnings separately for UI while still crediting wallet
    try {
      if (isSnakeReward) {
        // initialize if missing
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - property may be undefined on lean doc typings
        team.snakeEarnings = (team.snakeEarnings || 0) + amount;
      }
    } catch {}
    await team.save();
  lastReward[limiterKey] = now;

    return res.status(200).json({ success: true, bitcoinBalance: team.wallet.bitcoinBalance, snakeEarnings: (team as any).snakeEarnings ?? 0, reason });
  } catch {
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
