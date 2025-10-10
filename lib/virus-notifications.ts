import type { NextApiResponse } from 'next';
import { emitScoped } from '@/lib/emitter';
import Team from '@/models/Team';
import { logger } from '@/lib/logger';

/**
 * Sends virus notifications only to team members who have the authority to see them:
 * - Berlin role members (defenders with settings access)
 * - Solo players (team size 1)
 * 
 * This implements the requirement that virus alerts should only be visible to
 * defenders who can manage security settings, not all team members.
 */
export async function emitVirusNotification(
  res: NextApiResponse,
  options: {
    targetTeamId: string;
    event: string;
    payload: Record<string, unknown>;
  }
) {
  try {
    const { targetTeamId, event, payload } = options;

    // Fetch team information to determine size and member roles
    const team = await Team.findById(targetTeamId).select('teamMembers.role numberOfPlayers');
    
    if (!team) {
      logger.warn('Team not found for virus notification', { targetTeamId });
      return;
    }

    const teamSize = team.numberOfPlayers;
    const teamMembers = team.teamMembers || [];

    // Check if this is a solo player (team size 1)
    if (teamSize === 1) {
      // Solo players get all notifications since they handle everything
      emitScoped(res, {
        scope: 'team',
        id: targetTeamId,
        event,
        payload: {
          ...payload,
          visibilityReason: 'solo_player',
          ts: Date.now()
        }
      });
      logger.info('Virus notification sent to solo player', { targetTeamId, event });
      return;
    }

    // For teams with multiple members, check if Berlin (defender) is present
    const hasBerlin = teamMembers.some(member => 
      member.role && member.role.toLowerCase() === 'berlin'
    );

    if (hasBerlin) {
      // Send notification only to Berlin role members via team channel
      // The client-side filtering will ensure only Berlin sees it
      emitScoped(res, {
        scope: 'team',
        id: targetTeamId,
        event,
        payload: {
          ...payload,
          visibilityFilter: 'berlin_only', // Client-side filter flag
          visibilityReason: 'defender_access',
          ts: Date.now()
        }
      });
      logger.info('Virus notification sent to team with Berlin filter', { 
        targetTeamId, 
        event, 
        teamSize,
        hasBerlin 
      });
    } else {
      // No Berlin role in team - this should be rare but handle gracefully
      // In this case, we don't send the notification since no one can defend
      logger.warn('No Berlin defender found in team for virus notification', { 
        targetTeamId, 
        event, 
        teamSize,
        memberRoles: teamMembers.map(m => m.role).filter(Boolean)
      });
      
      // Optionally, we could fall back to Professor if they exist
      const hasProfessor = teamMembers.some(member => 
        member.role && member.role.toLowerCase() === 'professor'
      );
      
      if (hasProfessor) {
        emitScoped(res, {
          scope: 'team',
          id: targetTeamId,
          event,
          payload: {
            ...payload,
            visibilityFilter: 'professor_fallback',
            visibilityReason: 'no_defender_fallback',
            ts: Date.now()
          }
        });
        logger.info('Virus notification sent to Professor (fallback)', { targetTeamId, event });
      }
    }

  } catch (error) {
    logger.error('Error sending virus notification', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      targetTeamId: options.targetTeamId,
      event: options.event
    }, error as Error);
    
    // Fallback: send to entire team if filtering fails
    emitScoped(res, {
      scope: 'team',
      id: options.targetTeamId,
      event: options.event,
      payload: {
        ...options.payload,
        visibilityReason: 'error_fallback',
        ts: Date.now()
      }
    });
  }
}

/**
 * Helper to determine if a user should see virus notifications based on their role and team size
 * This is used on the client side to filter notifications
 */
export function shouldShowVirusNotification(
  userRole: string | null | undefined,
  teamSize: number,
  notificationPayload: Record<string, unknown>
): boolean {
  // Solo players see everything
  if (teamSize === 1) {
    return true;
  }

  // Check visibility filter in payload
  const visibilityFilter = notificationPayload.visibilityFilter as string | undefined;
  
  if (visibilityFilter === 'berlin_only') {
    // Only Berlin role can see this
    return userRole?.toLowerCase() === 'berlin';
  }
  
  if (visibilityFilter === 'professor_fallback') {
    // Fallback to Professor when no Berlin exists
    return userRole?.toLowerCase() === 'professor';
  }

  // Default: all team members can see (for backwards compatibility)
  return true;
}