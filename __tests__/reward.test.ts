process.env.MONGODB_URI = 'http://localhost'; // dummy for zod url requirement
process.env.JWT_SECRET = 'x'.repeat(32);
process.env.RAZORPAY_KEY_ID = 'rkid';
process.env.RAZORPAY_KEY_SECRET = 'rks';
process.env.EMAIL_FROM = 'test@example.com';
process.env.SMTP_HOST = 'smtp';
process.env.SMTP_PORT = '1025';
process.env.SMTP_USER = 'user';
process.env.SMTP_PASS = 'pass';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';
process.env.LOG_LEVEL = 'error';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';

// In-memory team store to simulate minimal persistence without Mongo
const teams: Record<string, { wallet: { bitcoinBalance: number }; save: () => Promise<void> }> = {};

// Mock connectDb to be a no-op
jest.mock('@/db/connectDb', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (jest.fn(() => Promise.resolve()) as any),
}));

// Mock Team model with just the methods used by the reward endpoint
jest.mock('@/models/Team', () => ({
  __esModule: true,
  default: {
    // mimic mongoose model method signature
    findOne: jest.fn(async (query: { playspaceId: string }) => {
      const team = teams[query.playspaceId];
      return team ? { ...team } : null;
    }),
  },
}));

// Import handler AFTER mocks
import handler, { lastReward } from '@/pages/api/reward';

// Helper to run API handler
async function runReward(amount: number, playspaceId: string, reason = 'test') {
  const { req, res } = createMocks({
    method: 'POST',
    headers: { 'x-playspace-id': playspaceId },
    body: { amount, reason }
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await handler(req as unknown as any, res as unknown as any);
  return res._getJSONData();
}

describe('Reward API', () => {
  let playspaceId: string;

  beforeEach(async () => {
    // Reset in-memory state
    for (const k of Object.keys(teams)) delete teams[k];
  playspaceId = `playspace-${Math.random().toString(36).slice(2)}`;
  teams[playspaceId] = {
      wallet: { bitcoinBalance: 0 },
      // mimic save mutator
      save: async () => Promise.resolve(),
    };
  // Reset rate limiter state for this playspace
  delete lastReward[playspaceId];
  });

  it('credits valid reward', async () => {
    const json = await runReward(10, String(playspaceId));
  console.log('credit response', json);
    expect(json.success).toBe(true);
    expect(json.bitcoinBalance).toBe(10);
  });

  it('rejects too large reward', async () => {
    const json = await runReward(1000, String(playspaceId));
    expect(json.success).toBe(false);
  });

  it('rate limits rapid rewards', async () => {
    const first = await runReward(5, String(playspaceId));
  console.log('first reward response', first);
    expect(first.success).toBe(true);
    const second = await runReward(5, String(playspaceId));
  console.log('second reward response', second);
    expect(second.success).toBe(false);
  });
});
