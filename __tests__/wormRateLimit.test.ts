import handler from '@/pages/api/attack/worm';
import { createMocks } from 'node-mocks-http';
import { resetRateLimit } from '@/lib/rateLimit';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.mock('@/db/connectDb', () => jest.fn());
jest.mock('@/lib/role-access', () => ({ assertRoleAccess: jest.fn().mockResolvedValue(true) }));
jest.mock('@/models/Device', () => ({ __esModule: true, default: { find: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'dev1', configuration:{ securitySettings:{} }, status:'online' }]) }) } }));
jest.mock('@/models/Team', () => ({ __esModule: true, default: { findById: jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis() }), find: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id:'tTarget', deviceId:'dev1' }]) }) } }));

describe('worm rate limit', () => {
  beforeEach(()=> resetRateLimit());
  it('returns 429 after exceeding limit', async () => {
    let status429 = false;
    for (let i=0;i<25;i++) {
      const { req, res } = createMocks({ method:'POST', body:{ attackerTeamId:'att', wormId:'worm-001' } });
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      if (res.statusCode === 429) { status429 = true; break; }
    }
    expect(status429).toBe(true);
  });
});
