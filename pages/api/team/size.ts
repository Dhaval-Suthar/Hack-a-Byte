import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { methodNotAllowed, badRequest, notFound, internalError } from '@/lib/api-errors';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  
  try {
    const { teamId } = req.query;
    
    if (!teamId || typeof teamId !== 'string') {
      return badRequest(res, 'teamId is required');
    }
    
    await connectDb();
    
    // Find team by id
    const team = await Team.findById(teamId).select('numberOfPlayers');
    
    if (!team) {
      return notFound(res, 'Team not found');
    }
    
    return res.status(200).json({ 
      success: true, 
      numberOfPlayers: team.numberOfPlayers
    });
    
  } catch (error) {
    logger.error('Error getting team size:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return internalError(res, msg);
  }
}