# Virus Notification Visibility System

## Overview

This system implements role-based visibility for virus notifications (SysTrojan Pro, CryptoLocker Elite, etc.) to ensure that only authorized team members can see virus alerts.

## Implementation

### Core Principle

Virus notifications are only visible to:
1. **Berlin role members** (defenders with settings access)
2. **Solo players** (team size 1, who handle all responsibilities)
3. **Professor role** (fallback when no Berlin exists in the team)

### Files Modified

#### Backend (Server-side filtering)
- `lib/virus-notifications.ts` - Core visibility logic and emission function
- `pages/api/attack/systrojan.ts` - Updated SysTrojan Pro notifications
- `pages/api/attack/cryptolocker.ts` - Updated CryptoLocker Elite notifications  
- `pages/api/attack/dataminer.ts` - Updated DataMiner X notifications
- `pages/api/attack/stealth-viral.ts` - Updated StealthViral notifications

#### Frontend (Client-side filtering)
- `components/devices/hackphone/apps/VirusDefenseCenter.tsx` - Defense center filtering
- `hooks/useNotificationService.ts` - General notification service filtering

### How It Works

#### Server-Side Flow
1. When a virus is deployed, the API calls `emitVirusNotification()` instead of direct `emitScoped()`
2. `emitVirusNotification()` queries the target team to determine:
   - Team size (if 1, it's a solo player)
   - Team member roles (check for Berlin defender)
3. Sends notification with appropriate visibility flags:
   - `visibilityFilter: 'berlin_only'` - Only Berlin can see
   - `visibilityFilter: 'professor_fallback'` - Only Professor can see (when no Berlin)
   - No filter - All team members can see (backwards compatibility)

#### Client-Side Flow
1. Notifications are received by all team members via socket
2. `shouldShowVirusNotification()` function checks:
   - User's role (from `localStorage.selectedRole`)
   - Team size (from `localStorage.teamSize`)
   - Notification payload visibility filter
3. Only authorized users see the notification in their UI

### Team Size Logic

- **Team size 1**: Solo player gets all notifications (handles everything)
- **Team size 2+**: Only Berlin (defender) gets virus notifications
- **No Berlin in team**: Falls back to Professor role
- **No defender roles**: Notification is not shown (graceful degradation)

### Role Access Matrix Reference

Based on the existing RBAC system:

| Team Size | Berlin Settings Access | Virus Notification Visibility |
|-----------|----------------------|------------------------------|
| 1         | ✓ (solo player)      | ✓ (solo player)              |
| 2         | ✓ (settings = true)   | ✓ (defender)                 |
| 3         | ✓ (settings = true)   | ✓ (defender)                 |
| 4+        | ✓ (settings = true)   | ✓ (defender)                 |

### Backwards Compatibility

- Existing virus notifications without visibility filters are shown to all team members
- If role data is unavailable, falls back to showing all notifications
- Error handling ensures system stability even if filtering fails

### Testing

Run the test suite:
```bash
npx jest __tests__/virusNotificationVisibility.test.ts
```

Tests cover:
- Solo player access
- Berlin role filtering
- Professor fallback
- Backwards compatibility
- Null/undefined role handling
- Priority of solo player access

### Benefits

1. **Realistic Defense**: Only designated defenders see threats
2. **Team Coordination**: Enforces proper role responsibilities  
3. **Reduced Noise**: Non-defenders don't get irrelevant security alerts
4. **Scalable**: Works for all team sizes (1-6 players)
5. **Secure**: Server-side validation prevents client manipulation

### Future Enhancements

- Add admin override for testing/debugging
- Implement role-based notification preferences
- Add audit logging for notification access
- Consider time-based restrictions (e.g., only during active gameplay)