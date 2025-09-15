// In-memory state for Safari faucet & email/SMS extraction loops
// Tracks faucet attempts per team (diminishing) and recent risk events

interface FaucetInfo { attempts: number; windowStart: number; balanceChange: number; }
interface RiskEvent { id: string; type: string; outcome: 'gain' | 'loss' | 'neutral'; amount: number; ts: number; detail?: string; }

const g = global as unknown as { __faucet?: Record<string, FaucetInfo>; __risk?: Record<string, RiskEvent[]> };
if (!g.__faucet) g.__faucet = {};
if (!g.__risk) g.__risk = {};

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes faucet diminishing window
const BASE_REWARD = 80; // base BTC faucet reward - balanced for gameplay
const MIN_REWARD = 10; // floor - balanced minimum
const DIMINISH = 0.25; // 25% reduction each attempt in window

export function performFaucet(teamId: string) {
  const now = Date.now();
  const store = g.__faucet!;
  let info = store[teamId];
  if (!info || now - info.windowStart > WINDOW_MS) {
    info = { attempts: 0, windowStart: now, balanceChange: 0 };
    store[teamId] = info;
  }
  info.attempts += 1;
  const reward = Math.max(MIN_REWARD, Math.round(BASE_REWARD * Math.pow(1 - DIMINISH, info.attempts - 1)));
  info.balanceChange += reward;
  return { reward, attempts: info.attempts, windowExpires: info.windowStart + WINDOW_MS };
}

export function recordRisk(teamId: string, ev: Omit<RiskEvent, 'id' | 'ts'>) {
  const arr = (g.__risk![teamId] = g.__risk![teamId] || []);
  const full: RiskEvent = { id: Math.random().toString(36).slice(2), ts: Date.now(), ...ev };
  arr.unshift(full);
  // Keep last 50
  if (arr.length > 50) arr.pop();
  return full;
}

export function getRiskEvents(teamId: string) {
  return g.__risk![teamId] || [];
}

export function randomEmailSmsOutcome() {
  // Weighted outcomes: gain (45%), neutral (35%), loss (20%)
  const r = Math.random();
  if (r < 0.45) {
    // positive reward scaled
    const amount = Math.round(30 + Math.random() * 120);
    return { outcome: 'gain' as const, amount, detail: 'Credential harvest succeeded' };
  } else if (r < 0.80) {
    return { outcome: 'neutral' as const, amount: 0, detail: 'No actionable data this batch' };
  } else {
    const amount = Math.round(20 + Math.random() * 80);
    return { outcome: 'loss' as const, amount: -amount, detail: 'Spam trap triggered – operational cost' };
  }
}
