import { NextResponse } from 'next/server';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Device from '@/models/Device';
import { runRandomMessageSystem } from '@/lib/randomMessageGenerator';
import { logger } from '@/lib/logger';
import { getServerIo } from '@/lib/socket';

export async function GET() {
  try {
    await connectDb();

    // Check for expired timers and set devices offline
    const now = new Date();
    const expiredTeams = await Team.find({
      'autoOfflineTimer.isActive': true,
      'autoOfflineTimer.endTime': { $lt: now }
    }).populate('deviceId');

    for (const team of expiredTeams) {
      if (team.deviceId) {
        // Set device offline
        await Device.findByIdAndUpdate(team.deviceId, { status: 'offline' });

        // Update team timer state
        await Team.findByIdAndUpdate(team._id, {
          $set: {
            'autoOfflineTimer.isActive': false,
            'autoOfflineTimer.completedAt': new Date(),
          }
        });

        // Notify team members about device going offline
        const io = getServerIo();
        if (io) {
          io.to(`team-${team._id}`).emit('team-timer-expired', {
            teamId: team._id.toString(),
            deviceId: team.deviceId.toString(),
            message: 'Your 1-hour playtime has expired. The device is now offline.',
          });
        }

        logger.info(`Cron: Set device offline for team ${team._id}`);
      }
    }

    // Run random message system for online devices
    await runRandomMessageSystem();

    logger.info(`Cron: Processed ${expiredTeams.length} expired timers and scheduled random messages`);

    return NextResponse.json({
      success: true,
      expiredTimers: expiredTeams.length,
      timestamp: now.toISOString()
    });

  } catch (error) {
    logger.error('Cron handler error:', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}