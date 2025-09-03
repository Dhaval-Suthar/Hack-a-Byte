import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import type { NextApiResponseServerIo } from '@/lib/socket';

jest.mock('@/db/connectDb', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));

// Mock Device & Team query chain used in devices endpoint
const deviceFind = jest.fn();
jest.mock('@/models/Device', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => deviceFind(...a) }
}));
const teamFind = jest.fn();
jest.mock('@/models/Team', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => teamFind(...a) }
}));

// Mock bank state helpers used indirectly
jest.mock('@/lib/bankState', () => ({
  bankState: { online: true },
  evaluateBankState: jest.fn().mockReturnValue(null),
  getBankPublicState: jest.fn().mockReturnValue({ online: true })
}));

// Mock recovery processor to simulate recovered device IDs
jest.mock('@/lib/deviceRecovery', () => ({ processDeviceRecoveries: jest.fn().mockResolvedValue(['devR1']) }));

describe('devices endpoint recovery emission', () => {
  it('emits device-recovered events when recoveries present', async () => {
    const handler = (await import('@/pages/api/devices')).default;
    // Chain mocks: find().select().lean()
    const chain = { select: () => chain, lean: () => Promise.resolve([]) };
    deviceFind.mockReturnValue(chain);
  const teamChain = { select: () => teamChain, lean: () => Promise.resolve([]) };
  teamFind.mockReturnValue(teamChain);

  const { req, res } = createMocks({ method: 'GET' });
  // Inject mocked socket.io emit collector
  interface EmittedEvent { event: string; payload: unknown }
  const emitted: EmittedEvent[] = [];
  const resWithSocket = res as unknown as NextApiResponseServerIo;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sock: any = resWithSocket.socket || (resWithSocket as unknown as { socket: unknown }).socket || {};
  sock.server = { io: { emit: (ev: string, data: unknown) => { emitted.push({ event: ev, payload: data }); return true; } } };
  (resWithSocket as unknown as { socket: unknown }).socket = sock;

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res._getStatusCode()).toBe(200);
    expect(emitted.find(e => e.event === 'device-recovered')).toBeTruthy();
  });
});
