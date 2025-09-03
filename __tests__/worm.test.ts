import handler from '@/pages/api/attack/worm';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.mock('@/db/connectDb', () => jest.fn());
jest.mock('@/lib/role-access', () => ({ assertRoleAccess: jest.fn().mockResolvedValue(true) }));
jest.mock('@/models/Device', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { _id: 'dev1', configuration: { securitySettings: {} }, status: 'online' }
      ])
    })
  }
}));
jest.mock('@/models/Team', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis() }),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { _id: 'teamTarget', deviceId: 'dev1' }
      ])
    })
  }
}));

describe('worm endpoint', () => {
  beforeAll(() => { jest.spyOn(Math, 'random').mockReturnValue(0.1); });
  afterAll(() => { (Math.random as unknown as { mockRestore?: () => void }).mockRestore?.(); });
  it('generates payload tokens', async () => {
  const { req, res } = createMocks({ method: 'POST', body: { attackerTeamId: 'teamA', wormId: 'worm-001' } });
  await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    const data = res._getJSONData();
  expect(data.success).toBe(true);
  expect(typeof data.generated).toBe('number');
  });
});
