import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { badRequest, notFound, methodNotAllowed, internalError } from '@/lib/api-errors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  try {
    const { teamId } = req.query;
    
    if (!teamId || typeof teamId !== 'string') {
      return badRequest(res, 'Team ID is required');
    }

    await connectDb();

    const team = await Team.findById(teamId).select('wallet');
    if (!team) {
      return notFound(res, 'Team not found');
    }

    return res.status(200).json({
      success: true,
      wallet: {
        walletAddress: team.wallet.walletAddress,
        privateKey: team.wallet.privateKey,
        bitcoinBalance: team.wallet.bitcoinBalance
      }
    });
  } catch (error) {
    console.error('Error fetching team wallet:', error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return internalError(res, msg);
  }
}
