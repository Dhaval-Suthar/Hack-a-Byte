/**
 * Client-side utilities for virus notifications.
 * This file is safe to import on the client side as it doesn't import any server-only models.
 */

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