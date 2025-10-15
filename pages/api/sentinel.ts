import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { type } = req.query;

    if (type === 'wallets') {
      try {
        await connectDb();

        // Get playspaceId from cookies to identify current user's team
        const playspaceId = req.cookies?.playspaceId;
        let currentTeamId = null;

        if (playspaceId) {
          const currentTeam = await Team.findOne({ playspaceId }).select('_id').lean() as { _id: string } | null;
          currentTeamId = currentTeam?._id?.toString();
        }

        // Get top 10 teams sorted by bitcoin balance (descending)
        const teams = await Team.find({})
          .select('name wallet _id')
          .sort({ 'wallet.bitcoinBalance': -1 })
          .limit(10)
          .lean();

        // Map to wallet format
        const wallets = teams.map((team) => ({
          address: team.wallet?.walletAddress || `bc1q${'0'.repeat(38)}`,
          balance: team.wallet?.bitcoinBalance || 0,
          teamName: team.name,
          lastActivity: new Date().toLocaleDateString(),
          isOwnTeam: currentTeamId && team._id?.toString() === currentTeamId
        }));

        return res.status(200).json({
          success: true,
          wallets
        });
      } catch (error) {
        logger.error('Error fetching wallets:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch wallet data'
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid type parameter'
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}