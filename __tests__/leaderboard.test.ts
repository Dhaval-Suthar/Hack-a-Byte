import handler from '@/pages/api/leaderboard/top-wallets';
import Team from '@/models/Team';
import connectDb from '@/db/connectDb';
import { createMocks } from 'node-mocks-http';
import { cleanupMemoryMongo } from '../lib/mongoMemoryServer';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.setTimeout(30_000);

describe('leaderboard top-wallets', () => {
  beforeAll(async () => {
    await connectDb();
    await Team.create([
      { name: 'A', description: 'A', numberOfPlayers:1, wallet: { walletAddress:'wa', privateKey:'pa', bitcoinBalance: 50 }, teamMembers: [] },
      { name: 'B', description: 'B', numberOfPlayers:1, wallet: { walletAddress:'wb', privateKey:'pb', bitcoinBalance: 150 }, teamMembers: [] },
      { name: 'C', description: 'C', numberOfPlayers:1, wallet: { walletAddress:'wc', privateKey:'pc', bitcoinBalance: 100 }, teamMembers: [] },
    ]);
  });
  afterAll(async () => { await cleanupMemoryMongo(); });
  it('returns sorted teams by balance desc', async () => {
    const { req, res } = createMocks({ method: 'GET' });
  await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    const data = res._getJSONData();
    expect(data.success).toBe(true);
    expect(data.teams[0].wallet.bitcoinBalance).toBe(150);
    expect(data.teams[1].wallet.bitcoinBalance).toBe(100);
    expect(data.teams[2].wallet.bitcoinBalance).toBe(50);
  });
});
