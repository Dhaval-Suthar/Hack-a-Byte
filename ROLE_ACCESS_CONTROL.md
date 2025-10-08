# Role-Based Access Control (RBAC) System

This document describes the comprehensive role-based access control system implemented for the Hack-a-Byte platform, which restricts user access to applications based on their assigned roles and team size.

## Overview

The RBAC system ensures that users can only access applications appropriate for their role within the team structure. This creates a more realistic cybersecurity simulation where different team members have specialized responsibilities and access privileges.

## Team Roles

### Professor (Strategic Commander)
- **Responsibilities**: Overall team coordination, strategic planning, approving purchases
- **Access**: Strategic tools, monitoring capabilities, team oversight functions

### Berlin (Defender)
- **Responsibilities**: System security, defensive configurations, threat monitoring
- **Access**: Security tools, communication systems, defensive applications

### Rio / Tokyo (Attackers)
- **Responsibilities**: Cyber warfare, malware deployment, target breaching
- **Access**: Attack tools, malware marketplace, offensive applications

### Nairobi / Denver (Extractors)
- **Responsibilities**: Data extraction, resource acquisition, mining operations
- **Access**: Extraction tools, mining applications, communication systems

## Permission Matrix

### HackPhone Applications

The permission matrix for mobile applications follows this structure:
`[settings, messages, mail, safari, appStore, sentinel, game, mining, stocks, allOthers]`

#### Team Size 1 (Solo Player)
- **Professor**: Full access to all applications ✓✓✓✓✓✓✓✓✓✓

#### Team Size 2
- **Professor**: ✗✗✗✗✓✓✓✓✓✓ (Strategic tools only)
- **Berlin**: ✓✓✓✓✗✗✗✗✗✓ (Communication + basic apps)

#### Team Size 3
- **Professor**: ✗✗✗✗✗✓✓✓✓✓ (Sentinel, game, stocks, others)
- **Berlin**: ✓✓✓✓✗✗✗✗✗✓ (Communication + basic apps)
- **Rio/Tokyo**: ✗✗✗✗✓✗✗✗✗✓ (AppStore + basic apps)

#### Team Size 4+
- **Professor**: ✗✗✗✗✗✓✗✗✓✓ (Sentinel, stocks, others)
- **Berlin**: ✓✗✗✗✗✗✗✗✗✓ (Settings + basic apps only)
- **Rio/Tokyo**: ✗✗✗✗✓✗✗✗✗✓ (AppStore + basic apps)
- **Nairobi/Denver**: ✗✓✓✓✗✗✓✓✗✓ (Communication, mining, games)

### Desktop Applications (Windows 95)

Desktop applications use a role-based restriction system:

#### Unrestricted Apps (All Roles)
- Calculator, Notepad, Paint, Minesweeper, Solitaire, CD Player

#### Technical Roles Only
- **Network Neighborhood**: Professor, Berlin, Nairobi, Denver
- **Terminal**: Professor, Berlin, Nairobi, Denver
- **Dev Tools**: Professor, Berlin

#### Attack-Focused Apps
- **Neural Network Analyzer**: Professor, Rio, Tokyo
- **Password Cracker**: Rio, Tokyo, Nairobi, Denver
- **Firewall Bypass**: Rio, Tokyo

#### Strategic/Security Apps
- **Secure Vault**: Professor, Berlin
- **Emergency Protocol**: Professor only

## Implementation

### File Structure

```
lib/
├── role-access-matrix.ts          # Core permission logic
├── role-access-notifications.ts   # User feedback system
└── constants/
    └── app-constants.ts          # Role definitions and limits

components/devices/
├── hackphone/core/
│   ├── HackPhoneHomeScreen.tsx   # Mobile app filtering
│   └── HackPhoneAppsRouter.tsx   # Mobile app access control
└── hackbook-w95/
    └── desktop.tsx               # Desktop app filtering

__tests__/
└── roleAccessMatrix.test.ts      # Comprehensive test suite
```

### Key Functions

#### `isHackPhoneAppAllowed(appId, teamSize, role)`
Determines if a mobile app is accessible for a specific role and team size.

#### `isDesktopAppAllowed(appName, userRole)`
Determines if a desktop app is accessible for a specific role.

#### `getRolePermissionDescription(teamSize, role)`
Provides human-readable description of role permissions.

## User Experience

### Visual Feedback
- **Locked Apps**: Displayed with reduced opacity, grayscale filter, and lock overlay
- **Access Denied**: Clear notifications explaining why access was denied
- **Role Context**: Messages include user's role and team size for clarity

### Error Handling
- Graceful degradation when role data is unavailable
- Fallback to unrestricted access for system stability
- Comprehensive logging for troubleshooting

## Testing

The system includes comprehensive tests covering:
- All team size and role combinations
- Edge cases (invalid inputs, missing data)
- Permission matrix validation
- Case-insensitive role handling
- Graceful error handling

Run tests with:
```bash
npm test -- roleAccessMatrix.test.ts
```

## Configuration

### Adding New Apps
1. Update the permission matrix in `role-access-matrix.ts`
2. Add app ID to the appropriate category
3. Update tests to cover the new app
4. Document the access requirements

### Modifying Roles
1. Update `CHARACTER_INFO` in `app-constants.ts`
2. Modify permission matrices as needed
3. Update role limits for team sizes
4. Add comprehensive tests for changes

### Team Size Changes
1. Add new team size to `HACKPHONE_PERMISSION_MATRIX`
2. Define permissions for all roles at that size
3. Update `ROLE_LIMITS` in app-constants
4. Test all combinations thoroughly

## Security Considerations

- **Client-Side Enforcement**: Current implementation is client-side only
- **Future Enhancement**: Consider server-side validation for critical operations
- **Data Integrity**: Role assignments should be validated on the server
- **Audit Trail**: Consider logging access attempts for security monitoring

## Troubleshooting

### Common Issues

1. **Apps Not Restricted**: Check that user role and team size are properly loaded
2. **All Apps Locked**: Verify role data is correctly formatted (lowercase)
3. **Inconsistent Behavior**: Clear localStorage and refresh role assignment
4. **Test Failures**: Ensure permission matrix matches test expectations

### Debug Information

Enable debug logging:
```javascript
localStorage.setItem('debug_rbac', 'true');
```

Check console for role assignment and permission checking details.

## Future Enhancements

1. **Server-Side Validation**: Implement backend role verification
2. **Dynamic Permissions**: Allow runtime permission modifications
3. **Audit Logging**: Track all access attempts and denials
4. **Role Inheritance**: Implement hierarchical role permissions
5. **Time-Based Access**: Add temporal restrictions for certain apps
6. **Context-Aware Permissions**: Modify access based on game state or mission progress