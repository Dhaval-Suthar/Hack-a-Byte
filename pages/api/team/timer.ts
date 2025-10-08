import type { NextApiRequest, NextApiResponse } from 'next';
import { teamTimerService } from '@/lib/teamTimerService';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { teamId } = req.query;
      
      if (!teamId || typeof teamId !== 'string') {
        return res.status(400).json({ error: 'teamId is required' });
      }

      // Get timer status from service
      const remainingTime = teamTimerService.getRemainingTime(teamId);
      const hasActiveTimer = teamTimerService.hasActiveTimer(teamId);

      // Get timer info from database
      await connectDb();
      const team = await Team.findById(teamId).select('autoOfflineTimer timer');
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // Calculate remaining time from database if service doesn't have it
      let actualRemainingTime = remainingTime || 0;
      let actualIsActive = hasActiveTimer;

      if (team.autoOfflineTimer?.isActive && team.autoOfflineTimer?.endTime) {
        const dbRemainingTime = team.autoOfflineTimer.endTime.getTime() - Date.now();
        if (dbRemainingTime > 0) {
          actualRemainingTime = dbRemainingTime;
          actualIsActive = true;
        } else {
          // Timer has expired, update database
          await Team.findByIdAndUpdate(teamId, {
            $set: {
              'autoOfflineTimer.isActive': false,
            }
          });
          actualIsActive = false;
          actualRemainingTime = 0;
        }
      }

      return res.status(200).json({
        success: true,
        teamId,
        autoOfflineTimer: {
          isActive: actualIsActive,
          remainingTime: actualRemainingTime,
          startTime: team.autoOfflineTimer?.startTime,
          endTime: team.autoOfflineTimer?.endTime,
        },
        gameTimer: {
          isActive: team.timer?.isActive || false,
          startTime: team.timer?.startTime,
          elapsedTime: team.timer?.elapsedTime || 0,
        }
      });
    }

    if (req.method === 'POST') {
      const { action, teamId } = req.body;
      
      if (!teamId || typeof teamId !== 'string') {
        return res.status(400).json({ error: 'teamId is required' });
      }

      // Admin check (placeholder - implement proper admin authentication)
      const adminKey = req.headers['x-admin-key'];
      if (!adminKey) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

      switch (action) {
        case 'stop':
          await teamTimerService.stopTeamTimer(teamId);
          logger.info(`Admin stopped timer for team ${teamId}`);
          return res.status(200).json({ 
            success: true, 
            message: 'Timer stopped successfully' 
          });

        case 'status':
          const activeTimers = teamTimerService.getActiveTimers();
          return res.status(200).json({
            success: true,
            activeTimers
          });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('Team timer API error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}