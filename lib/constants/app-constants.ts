// App-wide constants
export const APP_CONFIG = {
  name: 'Hack-a-Byte',
  version: '0.1.0',
  description: 'A comprehensive hacking simulation platform',
} as const;

// Device types
export const DEVICE_TYPES = {
  HACKPHONE: 'hackphone',
  HACKBOOK_E95: 'hackbook-e95',
  HACKBOOK_W95: 'hackbook-w95',
  HACKDROID: 'hackdroid',
} as const;

// Game settings
export const GAME_SETTINGS = {
  MAX_PLAYERS: 6,
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  POINTS_MULTIPLIER: 1.5,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  DEVICES: '/api/devices',
  GAMES: '/api/games',
  LEADERBOARD: '/api/leaderboard',
} as const;

// Team roles based on team size
export const TEAM_ROLES = {
  // For 1-2 players
  SMALL_TEAM: ['professor', 'berlin'],
  // For 3 players
  MEDIUM_TEAM: ['professor', 'berlin', 'tokyo', 'rio'],
  // For 4-6 players
  LARGE_TEAM: ['professor', 'berlin', 'tokyo', 'rio', 'nairobi', 'denver'],
} as const;

// Role limits per team size
export const ROLE_LIMITS = {
  1: { professor: 1 },
  2: { professor: 1, berlin: 1 },
  3: { professor: 1, berlin: 1, tokyo: 1, rio: 1 },
  4: { professor: 1, berlin: 1, tokyo: 1, rio: 1, nairobi: 1, denver: 1 },
  5: { professor: 1, berlin: 1, tokyo: 1, rio: 1, nairobi: 1, denver: 1 },
  6: { professor: 1, berlin: 1, tokyo: 1, rio: 1, nairobi: 1, denver: 1 },
} as const;

// Character information
export const CHARACTER_INFO = {
  professor: {
    name: "The Professor",
    role: "MASTERMIND",
    description: "Brilliant strategist with an encyclopedic knowledge of security systems and human psychology. Orchestrates every detail with surgical precision.",
    skills: ["Strategic Planning", "System Analysis", "Psychology", "Leadership"],
    specialty: "Every contingency has been calculated",
    color: "emerald-400",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-400",
    bgGradient: "from-emerald-900/30 via-emerald-800/20 to-emerald-900/40",
    image: "/characters/professor.png",
  },
  tokyo: {
    name: "Tokyo",
    role: "ASSAULT SPECIALIST",
    description: "Fearless combatant with explosive expertise and unmatched courage. When things get heated, she's your guardian angel with a detonator.",
    skills: ["Combat Tactics", "Explosives", "Quick Thinking", "Courage"],
    specialty: "Chaos is just another word for opportunity",
    color: "rose-400",
    textColor: "text-rose-400",
    borderColor: "border-rose-400",
    bgGradient: "from-rose-900/30 via-rose-800/20 to-rose-900/40",
    image: "/characters/tokyo.png",
  },
  rio: {
    name: "Rio",
    role: "TECH PRODIGY",
    description: "Young hacking virtuoso who speaks fluent code and can breach any digital fortress. His fingers dance across keyboards like a digital pianist.",
    skills: ["Hacking", "Programming", "Network Security", "Digital Forensics"],
    specialty: "In the digital realm, I am God",
    color: "cyan-400",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-400",
    bgGradient: "from-cyan-900/30 via-cyan-800/20 to-cyan-900/40",
    image: "/characters/rio.png",
  },
  berlin: {
    name: "Berlin",
    role: "SECURITY EXPERT",
    description: "Master of surveillance systems and physical security. Can disable alarms, pick locks, and navigate laser grids with balletic grace.",
    skills: ["Security Systems", "Lock Picking", "Surveillance", "Stealth"],
    specialty: "Every lock whispers its secrets to me",
    color: "amber-400",
    textColor: "text-amber-400",
    borderColor: "border-amber-400",
    bgGradient: "from-amber-900/30 via-amber-800/20 to-amber-900/40",
    image: "/characters/berlin.png",
  },
  nairobi: {
    name: "Nairobi",
    role: "OPERATIONS CHIEF",
    description: "Production mastermind with an eagle eye for quality control and team coordination. Ensures every operation runs like Swiss clockwork.",
    skills: ["Quality Control", "Team Management", "Operations", "Problem Solving"],
    specialty: "Perfection is not a goal, it's a standard",
    color: "violet-400",
    textColor: "text-violet-400",
    borderColor: "border-violet-400",
    bgGradient: "from-violet-900/30 via-violet-800/20 to-violet-900/40",
    image: "/characters/nairobi.png",
  },
  denver: {
    name: "Denver",
    role: "DEMOLITIONS EXPERT",
    description: "Explosive specialist with a laugh that's as dangerous as his bombs. Can level buildings or crack safes with surgical precision.",
    skills: ["Explosives", "Engineering", "Demolition", "Precision"],
    specialty: "Sometimes you need to break things to fix them",
    color: "orange-400",
    textColor: "text-orange-400", 
    borderColor: "border-orange-400",
    bgGradient: "from-orange-900/30 via-orange-800/20 to-orange-900/40",
    image: "/characters/denver.png",
  },
} as const;

// Role groupings (normalized to lowercase)
export const ROLE_GROUPS = {
  attackers: ['rio', 'tokyo'],
  strategist: ['professor'],
  defenders: ['berlin', 'nairobi', 'denver'],
} as const;

// Centralized app access control (keys = appId used in router)
// Value is an array of allowed lowercase role ids.
export const APP_ROLE_ACCESS: Record<string, string[]> = {
  // Economic / offensive tooling
  'appStore': [...ROLE_GROUPS.attackers],
  'worm-phish': [...ROLE_GROUPS.attackers],
  'faucet': [...ROLE_GROUPS.attackers],
  'email-sms': [...ROLE_GROUPS.attackers],
  // Strategic / unique
  'stocks': [...ROLE_GROUPS.strategist],
  // Defensive tooling
  'def-stealth': [...ROLE_GROUPS.defenders],
  'def-ransom': [...ROLE_GROUPS.defenders],
  'security': [...ROLE_GROUPS.defenders, ...ROLE_GROUPS.strategist],
  'bank-status': [...ROLE_GROUPS.defenders, ...ROLE_GROUPS.strategist],
};

// Helper to format allowed roles for UI messaging
export function formatAllowedRoles(appId: string): string {
  const roles = APP_ROLE_ACCESS[appId];
  if (!roles) return '';
  return roles
    .map(r => CHARACTER_INFO[r as keyof typeof CHARACTER_INFO]?.name || r)
    .join(', ');
}
