import sortHandler from '@/pages/api/extract/mining/sort';
import snakeHandler from '@/pages/api/extract/mining/snake';
import Team from '@/models/Team';
import connectDb from '@/db/connectDb';
import { createMocks } from 'node-mocks-http';
import { cleanupMemoryMongo } from '../lib/mongoMemoryServer';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.setTimeout(30_000);

describe('mining endpoints', () => {
  let teamId: string;
  beforeAll(async () => {
    await connectDb();
    const team = await Team.create({ name: 'MiningTeam', description: 'mt', numberOfPlayers:1, wallet: { walletAddress:'wm', privateKey:'pm', bitcoinBalance: 0 }, teamMembers: [{ username:'user1', role:'nairobi', accessCodeUsed:true }] });
    teamId = team._id.toString();
  });
  afterAll(async () => { await cleanupMemoryMongo(); });

  it('awards diminishing sort rewards', async () => {
    const rewards:number[] = [];
    for (let i=0;i<3;i++) {
      const { req, res } = createMocks({ method: 'POST', body: { teamId, rounds: 2 } });
  await sortHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      const data = res._getJSONData();
      expect(data.success).toBe(true);
      rewards.push(data.reward);
    }
    expect(rewards[1]).toBeLessThanOrEqual(rewards[0]);
  });

  it('awards snake reward', async () => {
    const { req, res } = createMocks({ method: 'POST', body: { teamId, length: 15 } });
  await snakeHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    const data = res._getJSONData();
    expect(data.success).toBe(true);
    expect(data.reward).toBeGreaterThan(0);
  });
});
