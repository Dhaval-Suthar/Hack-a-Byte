import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { methodNotAllowed, badRequest, notFound, internalError } from '@/lib/api-errors';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  
  try {
    const { playspaceId } = req.query;
    
    if (!playspaceId || typeof playspaceId !== 'string') {
      return badRequest(res, 'playspaceId is required');
    }
    
    await connectDb();
    
    // Find team by playspaceId
    const team = await Team.findOne({ playspaceId }).select('_id');
    
    if (!team) {
      return notFound(res, 'Team not found for this playspace');
    }
    
    return res.status(200).json({ 
      success: true, 
      teamId: team._id.toString()
    });
    
  } catch (error) {
    logger.error('Error getting team ID:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return internalError(res, msg);
  }
}
