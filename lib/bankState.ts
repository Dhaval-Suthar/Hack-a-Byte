// Centralized bank state & helpers for online/offline windows and SystemLock forced downtime.
// Ephemeral in-memory; persists across hot reloads via global.

export interface BankState {
  online: boolean;
  nextFlip: number; // timestamp when evaluation may flip state (random schedule) or offline end
  forcedOfflineUntil?: number; // explicit offline end (SystemLock)
}

const DEFAULT_ONLINE_DURATION_MIN: [number, number] = [2, 3]; // bank visible window
const DEFAULT_OFFLINE_DURATION_MIN: [number, number] = [10, 15]; // downtime between appearances

function minutesRange([min, max]: [number, number]) {
  return (min + Math.random() * (max - min)) * 60 * 1000;
}

const g = global as unknown as { __bankState?: BankState };
if (!g.__bankState) {
  g.__bankState = {
    online: false,
    nextFlip: Date.now() + minutesRange(DEFAULT_OFFLINE_DURATION_MIN),
  };
}

export const bankState = g.__bankState;

export interface BankTransition { prevOnline: boolean; newOnline: boolean; reason: string; offlineUntil?: number }

// Evaluate and update bank state; returns a transition if state changed.
export function evaluateBankState(now = Date.now()): BankTransition | null {
  // Respect forced offline
  if (bankState.forcedOfflineUntil && now < bankState.forcedOfflineUntil) {
    bankState.online = false;
    return null; // still forced offline, no change
  }
  if (now < bankState.nextFlip) return null;
  const prev = bankState.online;
  if (bankState.online) {
    // Going offline
    bankState.online = false;
    bankState.nextFlip = now + minutesRange(DEFAULT_OFFLINE_DURATION_MIN);
    return { prevOnline: prev, newOnline: bankState.online, reason: 'auto-window-ended' };
  } else {
    // Coming online
    bankState.online = true;
    bankState.nextFlip = now + minutesRange(DEFAULT_ONLINE_DURATION_MIN);
    return { prevOnline: prev, newOnline: bankState.online, reason: 'auto-window-start' };
  }
}

export function forceOffline(durationMs: number, now = Date.now()): BankTransition {
  const prev = bankState.online;
  bankState.online = false;
  bankState.forcedOfflineUntil = now + durationMs;
  bankState.nextFlip = bankState.forcedOfflineUntil; // schedule evaluation after forced offline ends
  return { prevOnline: prev, newOnline: false, reason: 'systemlock', offlineUntil: bankState.forcedOfflineUntil };
}

export function getBankPublicState() {
  return {
    online: bankState.online && !(bankState.forcedOfflineUntil && Date.now() < bankState.forcedOfflineUntil),
    offlineUntil: bankState.online ? undefined : bankState.forcedOfflineUntil || bankState.nextFlip,
  };
}
