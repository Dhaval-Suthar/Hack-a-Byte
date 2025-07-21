/**
 * Capture The Flag Game Utilities
 * 
 * This file contains helper functions specific to the CTF game mode.
 */

import { Flag, TeamBase, Player, GameEvent } from '@/app/(pages)/pvp/capture-the-flag/types';

/**
 * Calculate team score based on individual player scores
 */
export function calculateTeamScore(players: Player[], team: 'red' | 'blue'): number {
  return players
    .filter(p => p.team === team)
    .reduce((sum, player) => sum + player.score, 0);
}

/**
 * Check if a flag capture is valid (can only capture if your flag is safe)
 */
export function isCapturePossible(
  flags: Flag[],
  playerTeam: 'red' | 'blue',
  playerHasFlag: boolean
): boolean {
  // Player must be carrying a flag
  if (!playerHasFlag) return false;
  
  // Player's team flag must be at their base (safe)
  const teamFlag = flags.find(f => f.team === playerTeam);
  return teamFlag?.status === 'safe';
}

/**
 * Calculate chance of stealing a flag based on base security
 */
export function calculateStealChance(baseSecurityLevel: number): number {
  // Base chance of 30%, increasing as security decreases
  const baseChance = 0.3;
  const securityFactor = (100 - baseSecurityLevel) / 100; // 0 to 1
  
  return Math.min(0.8, baseChance + securityFactor * 0.5);
}

/**
 * Generate a game log entry
 */
export function createGameEvent(
  message: string,
  type: 'flag' | 'defense' | 'attack' | 'system'
): GameEvent {
  return {
    timestamp: new Date(),
    message,
    type
  };
}

/**
 * Calculate defense effectiveness based on installed security features
 */
export function calculateDefenseEffectiveness(
  defenses: { firewall: boolean; encryption: boolean; ids: boolean; honeypot: boolean }
): number {
  let effectiveness = 0;
  if (defenses.firewall) effectiveness += 25;
  if (defenses.encryption) effectiveness += 30;
  if (defenses.ids) effectiveness += 20;
  if (defenses.honeypot) effectiveness += 25;
  
  return effectiveness;
}

/**
 * Format team name for display (capitalize first letter)
 */
export function formatTeamName(team: 'red' | 'blue'): string {
  return team.charAt(0).toUpperCase() + team.slice(1);
}

/**
 * Convert game events to API-ready format
 */
export function prepareEventsForAPI(
  events: GameEvent[],
  matchId: string
): { matchId: string; events: GameEvent[] } {
  return {
    matchId,
    events: events.map(event => ({
      ...event,
      timestamp: event.timestamp.toISOString()
    }))
  };
}

/**
 * Calculate player level based on score
 */
export function calculatePlayerLevel(score: number): number {
  // Simple level calculation based on score
  return Math.floor(score / 100) + 1;
}

/**
 * Format time remaining as MM:SS
 */
export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
