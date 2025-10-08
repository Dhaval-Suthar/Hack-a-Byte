/**
 * Centralized role-based access control for HackPhone apps
 * This matches the permission matrix provided by the user
 */

// Permission matrix: teamSize -> role -> [settings, messages, mail, safari, appStore, sentinel, game, mining, stocks, allOthers]
export const HACKPHONE_PERMISSION_MATRIX: Record<number, Record<string, boolean[]>> = {
  1: {
    professor: [true, true, true, true, true, true, true, true, true, true]
  },
  2: {
    professor: [false, false, false, false, true, true, true, true, true, true],
    berlin: [true, true, true, true, false, false, false, false, false, true]
  },
  3: {
    professor: [false, false, false, false, false, true, true, true, true, true],
    berlin: [true, true, true, true, false, false, false, false, false, true],
    rio: [false, false, false, false, true, false, false, false, false, true],
    tokyo: [false, false, false, false, true, false, false, false, false, true]
  },
  4: {
    professor: [false, false, false, false, false, true, false, false, true, true],
    berlin: [true, false, false, false, false, false, false, false, false, true],
    rio: [false, false, false, false, true, false, false, false, false, true],
    tokyo: [false, false, false, false, true, false, false, false, false, true],
    nairobi: [false, true, true, true, false, false, true, true, false, true],
    denver: [false, true, true, true, false, false, true, true, false, true]
  },
  5: {
    professor: [false, false, false, false, false, true, false, false, true, true],
    berlin: [true, false, false, false, false, false, false, false, false, true],
    rio: [false, false, false, false, true, false, false, false, false, true],
    tokyo: [false, false, false, false, true, false, false, false, false, true],
    nairobi: [false, true, true, true, false, false, true, true, false, true],
    denver: [false, true, true, true, false, false, true, true, false, true]
  },
  6: {
    professor: [false, false, false, false, false, true, false, false, true, true],
    berlin: [true, false, false, false, false, false, false, false, false, true],
    rio: [false, false, false, false, true, false, false, false, false, true],
    tokyo: [false, false, false, false, true, false, false, false, false, true],
    nairobi: [false, true, true, true, false, false, true, true, false, true],
    denver: [false, true, true, true, false, false, true, true, false, true]
  }
};

// App order mapping: [settings, messages, mail, safari, appStore, sentinel, game, mining, stocks, allOthers]
export const SPECIAL_APPS_ORDER = ['settings', 'messages', 'mail', 'safari', 'appStore', 'sentinel', 'game', 'mining', 'stocks'];

/**
 * Check if a user with a specific role in a team of given size can access an app
 */
export function isHackPhoneAppAllowed(appId: string, teamSize: number, role: string): boolean {
  const normalizedRole = role.toLowerCase();
  const matrix = HACKPHONE_PERMISSION_MATRIX[teamSize]?.[normalizedRole];
  
  if (!matrix) {
    // If no matrix defined for this team size/role combination, allow access
    return true;
  }

  const specialIndex = SPECIAL_APPS_ORDER.indexOf(appId);
  if (specialIndex !== -1) {
    // App is in the special apps list, check its specific permission
    return matrix[specialIndex];
  } else {
    // App is not in special apps list, use "all others" permission (index 9)
    return matrix[9];
  }
}

/**
 * Get all allowed apps for a specific role and team size
 */
export function getAllowedHackPhoneApps(teamSize: number, role: string): string[] {
  const normalizedRole = role.toLowerCase();
  const matrix = HACKPHONE_PERMISSION_MATRIX[teamSize]?.[normalizedRole];
  
  if (!matrix) {
    // If no matrix defined, allow all apps
    return ['all'];
  }

  const allowedApps: string[] = [];
  
  // Check special apps
  SPECIAL_APPS_ORDER.forEach((appId, index) => {
    if (matrix[index]) {
      allowedApps.push(appId);
    }
  });
  
  // If "all others" is allowed, note it
  if (matrix[9]) {
    allowedApps.push('*others*');
  }
  
  return allowedApps;
}

/**
 * Get human-readable permission description for a role and team size
 */
export function getRolePermissionDescription(teamSize: number, role: string): string {
  const allowedApps = getAllowedHackPhoneApps(teamSize, role);
  
  if (allowedApps.includes('all')) {
    return 'Full access to all applications';
  }
  
  const specialApps = allowedApps.filter(app => app !== '*others*');
  const hasOthers = allowedApps.includes('*others*');
  
  let description = '';
  
  if (specialApps.length > 0) {
    description += `Access to: ${specialApps.join(', ')}`;
  }
  
  if (hasOthers) {
    description += specialApps.length > 0 ? ' and other applications' : 'Access to miscellaneous applications';
  }
  
  if (description === '') {
    description = 'Limited access - most applications restricted';
  }
  
  return description;
}

/**
 * Desktop/Windows 95 role-based access control
 * This extends the existing unlock-based system with role restrictions
 */
export const DESKTOP_ROLE_RESTRICTIONS: Record<string, string[]> = {
  // Apps that require specific roles (if user doesn't have role, app is locked even if unlocked)
  'Network Neighborhood': ['professor', 'berlin', 'nairobi', 'denver'],
  'Neural Network Analyzer': ['professor', 'rio', 'tokyo'],
  'Secure Vault': ['professor', 'berlin'],
  'Password Cracker': ['rio', 'tokyo', 'nairobi', 'denver'],
  'Firewall Bypass': ['rio', 'tokyo'],
  'Emergency Protocol': ['professor'],
  'Dev Tools': ['professor', 'berlin'],
  'Calculator': [], // No restrictions (all roles)
  'Notepad': [], // No restrictions (all roles)
  'Paint': [], // No restrictions (all roles)
  'Minesweeper': [], // No restrictions (all roles)
  'Solitaire': [], // No restrictions (all roles)
  'CD Player': [], // No restrictions (all roles)
  'Terminal': ['professor', 'berlin', 'nairobi', 'denver'], // Technical roles
};

/**
 * Check if a desktop app is allowed for a specific role
 */
export function isDesktopAppAllowed(appName: string, userRole: string): boolean {
  const requiredRoles = DESKTOP_ROLE_RESTRICTIONS[appName];
  
  // If no restrictions defined for this app, allow it
  if (!requiredRoles) {
    return true;
  }
  
  // If empty array (no restrictions), allow all roles
  if (requiredRoles.length === 0) {
    return true;
  }
  
  // Check if user's role is in the allowed roles
  return requiredRoles.includes(userRole.toLowerCase());
}