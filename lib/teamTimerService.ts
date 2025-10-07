import { EventEmitter } from 'events';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Device from '@/models/Device';
import { getServerIo } from '@/lib/socket';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';

interface TeamTimerInfo {
  teamId: string;
  deviceId: string;
  startTime: number;
  endTime: number;
  timeout: NodeJS.Timeout;
}

class TeamTimerService extends EventEmitter {
  private activeTimers: Map<string, TeamTimerInfo> = new Map();
  private readonly ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour (was 5 * 60 * 1000 for testing)

  constructor() {
    super();
    this.restoreActiveTimers();
  }

  /**
   * Restore active timers from database on service restart
   */
  private async restoreActiveTimers(): Promise<void> {
    try {
      await connectDb();
      
      // Find teams that should have active auto-offline timers
      const activeTeams = await Team.find({
        'autoOfflineTimer.isActive': true,
        'autoOfflineTimer.endTime': { $gt: new Date() }
      }).populate('deviceId');

      for (const team of activeTeams) {
        if (team.deviceId && team.autoOfflineTimer?.endTime) {
          const remainingTime = team.autoOfflineTimer.endTime.getTime() - Date.now();
          
          if (remainingTime > 0) {
            this.scheduleDeviceOffline(
              team._id.toString(),
              (team.deviceId as mongoose.Types.ObjectId).toString(),
              remainingTime
            );
            
            logger.info(`Restored timer for team ${team._id}`, {
              teamId: team._id.toString(),
              deviceId: (team.deviceId as mongoose.Types.ObjectId).toString(),
              remainingTime: Math.round(remainingTime / 1000 / 60), // minutes
            });
          } else {
            // Timer already expired, set device offline immediately
            await this.setDeviceOffline(team._id.toString(), (team.deviceId as mongoose.Types.ObjectId).toString());
          }
        }
      }
    } catch (error) {
      logger.error('Failed to restore active timers:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  }

  /**
   * Start a 1-hour timer for a team when their first member comes online
   */
  async startTeamTimer(teamId: string, deviceId: string): Promise<void> {
    try {
      // Check if timer is already active for this team
      if (this.activeTimers.has(teamId)) {
        logger.warn(`Timer already active for team ${teamId}`);
        return;
      }

      const startTime = Date.now();
      const endTime = startTime + this.ONE_HOUR_MS;

      // Update team in database
      await connectDb();
      await Team.findByIdAndUpdate(teamId, {
        $set: {
          'autoOfflineTimer.isActive': true,
          'autoOfflineTimer.startTime': new Date(startTime),
          'autoOfflineTimer.endTime': new Date(endTime),
        }
      });

      // Schedule the device to go offline
      this.scheduleDeviceOffline(teamId, deviceId, this.ONE_HOUR_MS);

      // Notify team members about timer start
      const io = getServerIo();
      if (io) {
        io.to(`team-${teamId}`).emit('team-timer-started', {
          teamId,
          deviceId,
          startTime,
          endTime,
          duration: this.ONE_HOUR_MS,
          message: 'Your team has 1 hour of playtime. Device will go offline automatically when time expires.',
        });
      }

      logger.info(`Started 1-hour timer for team ${teamId}`, {
        teamId,
        deviceId,
        endTime: new Date(endTime).toISOString(),
      });

      this.emit('timerStarted', { teamId, deviceId, startTime, endTime });
    } catch (error) {
      logger.error(`Failed to start timer for team ${teamId}:`, { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      throw error;
    }
  }

  /**
   * Schedule device to go offline after specified time
   */
  private scheduleDeviceOffline(teamId: string, deviceId: string, timeoutMs: number): void {
    const timeout = setTimeout(async () => {
      await this.setDeviceOffline(teamId, deviceId);
    }, timeoutMs);

    const timerInfo: TeamTimerInfo = {
      teamId,
      deviceId,
      startTime: Date.now(),
      endTime: Date.now() + timeoutMs,
      timeout,
    };

    this.activeTimers.set(teamId, timerInfo);
  }

  /**
   * Set team's device offline and clean up timer
   */
  private async setDeviceOffline(teamId: string, deviceId: string): Promise<void> {
    try {
      await connectDb();

      // Set device status to offline
      const device = await Device.findByIdAndUpdate(
        deviceId,
        { status: 'offline' },
        { new: true }
      );

      if (!device) {
        logger.error(`Device ${deviceId} not found when setting offline`);
        return;
      }

      // Update team timer state
      await Team.findByIdAndUpdate(teamId, {
        $set: {
          'autoOfflineTimer.isActive': false,
          'autoOfflineTimer.completedAt': new Date(),
        }
      });

      // Remove from active timers
      const timerInfo = this.activeTimers.get(teamId);
      if (timerInfo) {
        clearTimeout(timerInfo.timeout);
        this.activeTimers.delete(teamId);
      }

      // Notify team members about device going offline
      const io = getServerIo();
      if (io) {
        io.to(`team-${teamId}`).emit('team-timer-expired', {
          teamId,
          deviceId,
          message: 'Your 1-hour playtime has expired. The device is now offline.',
        });

        // Also emit device status change
        io.emit('device-status', {
          deviceId: device.deviceMacAddress,
          status: 'offline',
          ts: Date.now(),
          reason: 'timer-expired',
        });
      }

      logger.info(`Team ${teamId} timer expired, device ${deviceId} set offline`, {
        teamId,
        deviceId,
        deviceMac: device.deviceMacAddress,
      });

      this.emit('timerExpired', { teamId, deviceId });
    } catch (error) {
      logger.error(`Failed to set device offline for team ${teamId}:`, { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  }

  /**
   * Stop timer for a team (if needed for admin intervention)
   */
  async stopTeamTimer(teamId: string): Promise<void> {
    const timerInfo = this.activeTimers.get(teamId);
    if (!timerInfo) {
      logger.warn(`No active timer found for team ${teamId}`);
      return;
    }

    try {
      // Clear the timeout
      clearTimeout(timerInfo.timeout);
      this.activeTimers.delete(teamId);

      // Update database
      await connectDb();
      await Team.findByIdAndUpdate(teamId, {
        $set: {
          'autoOfflineTimer.isActive': false,
          'autoOfflineTimer.stoppedAt': new Date(),
        }
      });

      // Notify team members
      const io = getServerIo();
      if (io) {
        io.to(`team-${teamId}`).emit('team-timer-stopped', {
          teamId,
          message: 'Team timer has been stopped by admin.',
        });
      }

      logger.info(`Timer stopped for team ${teamId}`, { teamId });
      this.emit('timerStopped', { teamId });
    } catch (error) {
      logger.error(`Failed to stop timer for team ${teamId}:`, { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      throw error;
    }
  }

  /**
   * Get remaining time for a team's timer
   */
  getRemainingTime(teamId: string): number | null {
    const timerInfo = this.activeTimers.get(teamId);
    if (!timerInfo) {
      return null;
    }

    const remaining = timerInfo.endTime - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Get all active timers (for admin/monitoring)
   */
  getActiveTimers(): { teamId: string; deviceId: string; remainingTime: number }[] {
    const result: { teamId: string; deviceId: string; remainingTime: number }[] = [];
    
    for (const [teamId, timerInfo] of this.activeTimers.entries()) {
      const remainingTime = this.getRemainingTime(teamId);
      if (remainingTime !== null && remainingTime > 0) {
        result.push({
          teamId,
          deviceId: timerInfo.deviceId,
          remainingTime,
        });
      }
    }
    
    return result;
  }

  /**
   * Check if a team has an active timer
   */
  hasActiveTimer(teamId: string): boolean {
    return this.activeTimers.has(teamId);
  }
}

// Create singleton instance
export const teamTimerService = new TeamTimerService();

// Export the service class for type definitions
export { TeamTimerService };