// Central export for all types
export * from './global';
export * from './devices';
// Local hook-defined realtime event types (augment as needed)
export interface BankStateEvent { online: boolean; offlineUntil?: number; reason?: string; ts: number }

// Re-export for convenience
export type { Device, GameSession, ApiResponse } from './global';
