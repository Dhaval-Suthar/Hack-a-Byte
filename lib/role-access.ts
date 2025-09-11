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
  // Faucet available to attackers & extractors (browsing/collection loop)
  'faucet': [...ATTACKERS, ...EXTRACTORS],
  'email-sms': ATTACKERS,
  'appStore': ATTACKERS,
  'stocks': STRATEGIST,
  'security': [...DEFENDERS, ...STRATEGIST],
  'prof-scan': STRATEGIST,
  'fakebank': ATTACKERS,
  'recon': ATTACKERS,
  'systrojan': ATTACKERS,
  'systemlock': ATTACKERS,
  'resolve': ATTACKERS,
  'end-game': STRATEGIST,
  'mining': EXTRACTORS,
  'top-wallets': [...STRATEGIST, ...ATTACKERS, ...EXTRACTORS, ...DEFENDERS],
};

// Determine if a team has at least one member with an allowed role.
// Optional optimization: cache short lived.
export async function teamHasRole(teamId: string, allowed: string[]): Promise<boolean> {
  if (!allowed.length) return true;
  const team = await Team.findById(teamId).select('teamMembers.role numberOfPlayers');
  if (!team) return false;
  const norm = allowed.map(r=>r.toLowerCase());
  return team.teamMembers.some((m: TeamMember) => m.role && norm.includes(m.role.toLowerCase()));
}

// Compute fallback expanded allowed roles for undersized teams so critical apps remain usable.
// Rationale:
//  - Team size 1: Solo player (professor) needs full access.
//  - Team size 2: (professor + berlin) must cover attacker + extractor apps.
//  - Team size 3: Lacks dedicated extractors; allow attackers / strategist to mine / extract.
function expandAllowedForSmallTeams(baseAllowed: string[]|undefined, teamSize: number): string[]|undefined {
  if (!baseAllowed) return baseAllowed;
  // Solo team: unrestricted (return empty to skip checks downstream)
  if (teamSize === 1) return [];
  const allowedSet = new Set(baseAllowed.map(r=>r.toLowerCase()));
  const isOnlyFrom = (group: string[]) => baseAllowed.every(r => group.includes(r.toLowerCase()));

  // 2-player team: professor & berlin cover everything
  if (teamSize === 2) {
    if (isOnlyFrom(ATTACKERS) || isOnlyFrom(EXTRACTORS)) {
      ['professor','berlin'].forEach(r=>allowedSet.add(r));
    }
  }

  // 3-player team: allow attackers or strategist to fill extractor gap
  if (teamSize === 3) {
    if (isOnlyFrom(EXTRACTORS)) {
      [...ATTACKERS, 'professor'].forEach(r=>allowedSet.add(r));
    }
  }
  return Array.from(allowedSet);
}

export async function assertRoleAccess(teamId: string, appId: string) {
  let allowed = SERVER_APP_ACCESS[appId];
  if (!allowed) return; // no restrictions

  // Fetch team once for both access + fallback logic
  const team = await Team.findById(teamId).select('teamMembers.role numberOfPlayers');
  if (!team) {
    interface RoleError extends Error { status?: number; allowed?: string[] }
    const error: RoleError = new Error('TEAM_NOT_FOUND');
    error.status = 404;
    throw error;
  }

  // Apply fallback expansion for small teams
  allowed = expandAllowedForSmallTeams(allowed, team.numberOfPlayers) || allowed;

  // Empty allowed after expansion means unrestricted for solo player
  if (!allowed.length) return;

  const norm = allowed.map(r=>r.toLowerCase());
  const hasRole = team.teamMembers.some((m: TeamMember) => m.role && norm.includes(m.role.toLowerCase()));
  if (!hasRole) {
    interface RoleError extends Error { status?: number; allowed?: string[] }
    const error: RoleError = new Error('FORBIDDEN_ROLE');
    error.status = 403;
    error.allowed = allowed;
    throw error;
  }
}
