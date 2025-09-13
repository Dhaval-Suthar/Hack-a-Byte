import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';

jest.mock('@/db/connectDb', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));

// Mock models
const teamFindById = jest.fn();
const teamFindOne = jest.fn();
jest.mock('@/models/Team', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => teamFindById(...a), findOne: (...a: unknown[]) => teamFindOne(...a) }
}));

const deviceFindById = jest.fn();
jest.mock('@/models/Device', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => deviceFindById(...a) }
}));

// Mock role access always allow
jest.mock('@/lib/role-access', () => ({ assertRoleAccess: jest.fn().mockResolvedValue(undefined) }));

// Force success chance high
jest.mock('@/lib/securityModifiers', () => ({ computeSuccessChance: () => ({ finalChance: 1 }) }));

// Mock device recovery scheduler
const scheduleSpy = jest.fn();
jest.mock('@/lib/deviceRecovery', () => ({ scheduleDeviceRecovery: (...args: unknown[]) => scheduleSpy(...args) }));
jest.mock('@/lib/malwareConfig', () => ({ getMalwareDefinition: (t: string) => ({ id: t, baseSuccess: 1, rewardRange: [10,20], maintenanceChance: 1, offlineSeconds: 30, requiredIntel: 0 }) }));

// Ensure predictable randomness
const realRandom = Math.random;
beforeAll(() => { (Math as unknown as { random: () => number }).random = () => 0.0; }); // always trigger success & maintenance
afterAll(() => { (Math as unknown as { random: () => number }).random = realRandom; });

describe('maintenance-producing endpoints', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('resolve endpoint schedules recovery on maintenance', async () => {
    const handler = (await import('@/pages/api/attack/resolve')).default;
  teamFindById.mockReturnValue({ wallet: { bitcoinBalance: 100 }, save: jest.fn() });
  const deviceObj = { _id: 'devX', configuration: { securitySettings: {} }, status: 'online', save: jest.fn() };
  deviceFindById.mockReturnValue({ select: () => deviceObj });
  const targetTeamObj = { wallet: { bitcoinBalance: 50 }, save: jest.fn() };
  teamFindOne.mockReturnValue({ select: () => targetTeamObj });
    const { req, res } = createMocks({ method: 'POST', body: { attackerTeamId: 'T1', targetDeviceId: 'D1', malwareType: 'worm' } });
    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res._getStatusCode()).toBe(200);
    expect(scheduleSpy).toHaveBeenCalledWith(expect.any(String), 'worm');
  });

  it('systrojan endpoint schedules recovery on maintenance', async () => {
    const handler = (await import('@/pages/api/attack/systrojan')).default;
  const deviceObj2 = { _id: 'devY', configuration: { securitySettings: {} }, status: 'online', save: jest.fn() };
  deviceFindById.mockReturnValue({ select: () => deviceObj2 });
  const attackerObj = { wallet: { bitcoinBalance: 0 }, save: jest.fn() };
  teamFindById.mockReturnValue({ select: () => attackerObj });
  const targetTeamObj = { wallet: { bitcoinBalance: 0 }, save: jest.fn() };
  teamFindOne.mockReturnValue({ select: () => targetTeamObj });
    const { req, res } = createMocks({ method: 'POST', body: { targetDeviceId: 'D2', attackerTeamId: 'T2' } });
    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res._getStatusCode()).toBe(200);
    expect(scheduleSpy).toHaveBeenCalledWith(expect.any(String), 'trojan');
  });
});
