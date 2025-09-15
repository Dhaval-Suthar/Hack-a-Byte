// In-memory mining mini-game state with diminishing returns per window
interface MiningWindow { attempts: number; windowStart: number; totalReward: number }
const g = global as unknown as { __mining?: Record<string, MiningWindow> };
if (!g.__mining) g.__mining = {};
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const DIMINISH = 0.25; // 25% reward reduction each attempt
const BASE_SORT_REWARD = 25; // per successful sort round - increased for better gameplay
const BASE_SNAKE_UNIT = 3; // per snake length unit - increased for better gameplay
export function miningSortReward(teamId: string, rounds: number) {
  const now = Date.now();
  let win = g.__mining![teamId];
  if (!win || now - win.windowStart > WINDOW_MS) { win = { attempts: 0, windowStart: now, totalReward: 0 }; g.__mining![teamId] = win; }
  win.attempts += 1;
  const multiplier = Math.max(0.15, Math.pow(1 - DIMINISH, win.attempts - 1));
  const reward = Math.max(1, Math.round(rounds * BASE_SORT_REWARD * multiplier));
  win.totalReward += reward;
  return { reward, attempts: win.attempts, windowExpires: win.windowStart + WINDOW_MS };
}
export function miningSnakeReward(teamId: string, length: number) {
  const now = Date.now();
  let win = g.__mining![teamId];
  if (!win || now - win.windowStart > WINDOW_MS) { win = { attempts: 0, windowStart: now, totalReward: 0 }; g.__mining![teamId] = win; }
  win.attempts += 1;
  const multiplier = Math.max(0.2, Math.pow(1 - DIMINISH, win.attempts - 1));
  const reward = Math.max(1, Math.round(length * BASE_SNAKE_UNIT * multiplier));
  win.totalReward += reward;
  return { reward, attempts: win.attempts, windowExpires: win.windowStart + WINDOW_MS };
}
