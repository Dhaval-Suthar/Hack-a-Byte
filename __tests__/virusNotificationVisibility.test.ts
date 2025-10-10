import { describe, it, expect } from '@jest/globals';
import { shouldShowVirusNotification } from '@/lib/virus-notifications';

describe('Virus Notification Visibility', () => {
  it('should show virus notifications to solo players (team size 1)', () => {
    const result = shouldShowVirusNotification('professor', 1, {});
    expect(result).toBe(true);
  });

  it('should show virus notifications to Berlin role in multi-member teams', () => {
    const payload = { visibilityFilter: 'berlin_only' };
    
    // Berlin should see it
    expect(shouldShowVirusNotification('berlin', 2, payload)).toBe(true);
    expect(shouldShowVirusNotification('Berlin', 3, payload)).toBe(true); // case insensitive
    
    // Other roles should not see it
    expect(shouldShowVirusNotification('professor', 2, payload)).toBe(false);
    expect(shouldShowVirusNotification('rio', 2, payload)).toBe(false);
    expect(shouldShowVirusNotification('tokyo', 2, payload)).toBe(false);
    expect(shouldShowVirusNotification('nairobi', 4, payload)).toBe(false);
    expect(shouldShowVirusNotification('denver', 4, payload)).toBe(false);
  });

  it('should fallback to Professor when no Berlin exists', () => {
    const payload = { visibilityFilter: 'professor_fallback' };
    
    // Professor should see it in fallback mode
    expect(shouldShowVirusNotification('professor', 2, payload)).toBe(true);
    
    // Other roles should not see it
    expect(shouldShowVirusNotification('berlin', 2, payload)).toBe(false);
    expect(shouldShowVirusNotification('rio', 2, payload)).toBe(false);
  });

  it('should show to all team members for backwards compatibility (no filter)', () => {
    const payload = {}; // No visibility filter
    
    expect(shouldShowVirusNotification('professor', 3, payload)).toBe(true);
    expect(shouldShowVirusNotification('berlin', 3, payload)).toBe(true);
    expect(shouldShowVirusNotification('rio', 3, payload)).toBe(true);
    expect(shouldShowVirusNotification('tokyo', 3, payload)).toBe(true);
    expect(shouldShowVirusNotification('nairobi', 3, payload)).toBe(true);
  });

  it('should handle null/undefined roles gracefully', () => {
    const payload = { visibilityFilter: 'berlin_only' };
    
    expect(shouldShowVirusNotification(null, 2, payload)).toBe(false);
    expect(shouldShowVirusNotification(undefined, 2, payload)).toBe(false);
    expect(shouldShowVirusNotification('', 2, payload)).toBe(false);
  });

  it('should prioritize solo player access over filters', () => {
    const payload = { visibilityFilter: 'berlin_only' };
    
    // Solo player should see everything regardless of filter
    expect(shouldShowVirusNotification('professor', 1, payload)).toBe(true);
    expect(shouldShowVirusNotification('rio', 1, payload)).toBe(true);
    expect(shouldShowVirusNotification('berlin', 1, payload)).toBe(true);
  });
});