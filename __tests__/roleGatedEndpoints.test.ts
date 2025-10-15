import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';

// Mock DB & Team model
jest.mock('@/db/connectDb', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));

const teamDoc = (roles: string[], balance = 1000) => ({
  teamMembers: roles.map(r => ({ role: r })),
  wallet: { bitcoinBalance: balance },
  save: jest.fn().mockResolvedValue(undefined),
});

const findByIdMock = jest.fn();
jest.mock('@/models/Team', () => ({
  __esModule: true,
  default: { findById: (...args: unknown[]) => findByIdMock(...args) },
}));

// extractorState side effects mocked to deterministic
jest.mock('@/lib/extractorState', () => ({
  performFaucet: jest.fn().mockReturnValue({ reward: 50, attempts: 1, windowExpires: Date.now() + 300000 }),
  recordRisk: jest.fn().mockReturnValue({ type: 'faucet', outcome: 'gain', amount: 50, detail: 'Faucet claim', ts: Date.now() }),
  randomEmailSmsOutcome: jest.fn(),
}));

// socket no-op
jest.mock('@/lib/socket', () => ({}));

// Role access: rely on real implementation using mocked Team

let handlerFaucet: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

describe('role-gated endpoints', () => {
  beforeAll(async () => {
    handlerFaucet = (await import('@/pages/api/extract/faucet')).default;
  });
  beforeEach(() => { jest.clearAllMocks(); });

  it('blocks faucet for non-attacker team', async () => {
  // First call: faucet handler wallet select, Second: role access select
  findByIdMock.mockImplementationOnce(() => ({ select: () => Promise.resolve(teamDoc(['berlin'])) }));
  findByIdMock.mockImplementationOnce(() => ({ select: () => Promise.resolve(teamDoc(['berlin'])) }));
    const { req, res } = createMocks({ method: 'POST', body: { teamId: 'T1' } });
  await handlerFaucet(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res._getStatusCode()).toBe(403);
    const data = JSON.parse(res._getData());
  expect(data.code).toBe('ROLE_FORBIDDEN');
  });

  it('allows faucet for attacker team', async () => {
  findByIdMock.mockImplementationOnce(() => ({ select: () => Promise.resolve(teamDoc(['tokyo'])) }));
  findByIdMock.mockImplementationOnce(() => ({ select: () => Promise.resolve(teamDoc(['tokyo'])) }));
    const { req, res } = createMocks({ method: 'POST', body: { teamId: 'T2' } });
  await handlerFaucet(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.reward).toBe(50);
  });
});
