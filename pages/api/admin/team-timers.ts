import type { NextApiRequest, NextApiResponse } from 'next';
import { teamTimerService } from '@/lib/teamTimerService';
import { logger } from '@/lib/logger';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';

// GET /api/admin/team-timers - Get all active team timers
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Admin check (placeholder - implement proper admin authentication)
      const adminKey = req.headers['x-admin-key'];
      if (!adminKey) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

      const activeTimers = teamTimerService.getActiveTimers();
      
      return res.status(200).json({
        success: true,
        activeTimers: activeTimers.map(timer => ({
          ...timer,
          remainingTimeMinutes: Math.ceil(timer.remainingTime / (1000 * 60)),
          remainingTimeFormatted: formatTime(timer.remainingTime)
        }))
      });
    }

    if (req.method === 'POST') {
      const { action, teamId } = req.body;
      
      // Admin check (placeholder - implement proper admin authentication)
      const adminKey = req.headers['x-admin-key'];
      if (!adminKey) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

      if (!teamId || typeof teamId !== 'string') {
        return res.status(400).json({ error: 'teamId is required' });
      }

      switch (action) {
        case 'start':
          // Get team and device info first
          await connectDb();
          const team = await Team.findById(teamId).select('deviceId');
          
          if (!team) {
            return res.status(404).json({ error: 'Team not found' });
          }
          
          if (!team.deviceId) {
            return res.status(400).json({ error: 'Team has no associated device' });
          }
          
          await teamTimerService.startTeamTimer(teamId, team.deviceId.toString());
          logger.info(`Admin started timer for team ${teamId}`);
          return res.status(200).json({ 
            success: true, 
            message: `Timer started for team ${teamId}` 
          });

        case 'stop':
          await teamTimerService.stopTeamTimer(teamId);
          logger.info(`Admin stopped timer for team ${teamId}`);
          return res.status(200).json({ 
            success: true, 
            message: `Timer stopped for team ${teamId}` 
          });

        default:
          return res.status(400).json({ error: 'Invalid action. Supported: start, stop' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('Admin team timers API error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}