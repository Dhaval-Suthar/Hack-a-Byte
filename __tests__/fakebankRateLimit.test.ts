import handler from '@/pages/api/attack/fakebank';
import Team from '@/models/Team';
import connectDb from '@/db/connectDb';
import { createMocks } from 'node-mocks-http';
import { cleanupMemoryMongo } from '../lib/mongoMemoryServer';
import { resetRateLimit } from '@/lib/rateLimit';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.setTimeout(30_000);

describe('fakebank rate limit', () => {
  let attackerId: string; let victimId: string;
  beforeAll(async () => {
    await connectDb();
    const attacker = await Team.create({ name: 'FBRateAtt', description: 'a', numberOfPlayers:1, wallet:{ walletAddress:'rfa', privateKey:'kfa', bitcoinBalance:0 }, teamMembers:[{ username:'tokyo', role:'tokyo', accessCodeUsed:true }] });
    const victim = await Team.create({ name: 'FBRateVic', description: 'v', numberOfPlayers:1, wallet:{ walletAddress:'rfv', privateKey:'kfv', bitcoinBalance:0 }, teamMembers:[{ username:'rio', role:'rio', accessCodeUsed:true }] });
    attackerId = attacker._id.toString(); victimId = victim._id.toString();
  });
  afterAll(async () => { await cleanupMemoryMongo(); });
  beforeEach(()=> resetRateLimit());

  it('limits to 3 windows per minute', async () => {
  let fourthStatus: number | null = null;
    for (let i=0;i<4;i++) {
      const { req, res } = createMocks({ method:'POST', body:{ attackerTeamId: attackerId, targetTeamId: victimId } });
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      if (i===3) fourthStatus = res.statusCode;
    }
    expect(fourthStatus).toBe(429);
  });
});
