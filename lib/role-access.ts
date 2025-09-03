// Central server-side role access utilities
// Mirrors client constants but keeps server independent of UI formatting.
import Team, { TeamMember } from '@/models/Team';

// Groupings
const ATTACKERS = ['rio','tokyo'];
const STRATEGIST = ['professor'];
const DEFENDERS = ['berlin'];
const EXTRACTORS = ['nairobi','denver'];

// App -> allowed roles mapping (lowercase)
export const SERVER_APP_ACCESS: Record<string,string[]> = {
  'worm-phish': ATTACKERS,
  'faucet': ATTACKERS,
  'email-sms': ATTACKERS,
  'appStore': ATTACKERS,
  'stocks': STRATEGIST,
  'def-stealth': DEFENDERS,
  'def-ransom': DEFENDERS,
  'security': [...DEFENDERS, ...STRATEGIST],
  'bank-status': [...DEFENDERS, ...STRATEGIST],
  'prof-scan': STRATEGIST,
  'fakebank': ATTACKERS,
  'end-game': STRATEGIST,
  'mining': EXTRACTORS,
  'top-wallets': [...STRATEGIST, ...ATTACKERS, ...EXTRACTORS, ...DEFENDERS],
};

// Determine if a team has at least one member with an allowed role.
// Optional optimization: cache short lived.
export async function teamHasRole(teamId: string, allowed: string[]): Promise<boolean> {
  if (!allowed.length) return true;
  const team = await Team.findById(teamId).select('teamMembers.role');
  if (!team) return false;
  const norm = allowed.map(r=>r.toLowerCase());
  return team.teamMembers.some((m: TeamMember) => m.role && norm.includes(m.role.toLowerCase()));
}

export async function assertRoleAccess(teamId: string, appId: string) {
  const allowed = SERVER_APP_ACCESS[appId];
  if (!allowed) return; // no restrictions
  const ok = await teamHasRole(teamId, allowed);
  if (!ok) {
  interface RoleError extends Error { status?: number; allowed?: string[] }
  const error: RoleError = new Error('FORBIDDEN_ROLE');
  error.status = 403;
  error.allowed = allowed;
  throw error;
  }
}
