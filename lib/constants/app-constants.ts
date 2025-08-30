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
  MAX_PLAYERS: 4,
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
