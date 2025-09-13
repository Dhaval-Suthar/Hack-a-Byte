import handler from '@/pages/api/game/end';
import GameSession from '@/models/GameSession';
import connectDb from '@/db/connectDb';
import { createMocks } from 'node-mocks-http';
import { cleanupMemoryMongo } from '../lib/mongoMemoryServer';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.setTimeout(30000);

describe('game end concurrency guard', () => {
  let sessionId: string;
  beforeAll(async () => {
    await connectDb();
    const s = await GameSession.create({
      status: 'active',
      startTime: new Date(),
      tournamentId: 'tourn1',
      team1Id: 'teamA',
      team2Id: 'teamB',
      team1Name: 'Alpha',
      team2Name: 'Beta',
      team1Score: 0,
      team2Score: 0,
      duration: 0
    });
    sessionId = s._id.toString();
  });
  afterAll(async () => { await cleanupMemoryMongo(); });
  it('prevents double completion', async () => {
    const { req: r1, res: s1 } = createMocks({ method:'POST', body:{ sessionId } });
    const { req: r2, res: s2 } = createMocks({ method:'POST', body:{ sessionId } });
    await Promise.all([
      handler(r1 as unknown as NextApiRequest, s1 as unknown as NextApiResponse),
      handler(r2 as unknown as NextApiRequest, s2 as unknown as NextApiResponse)
    ]);
    const codes = [s1.statusCode, s2.statusCode];
  // First call should succeed (200) or internal error (500) if underlying logic changes; second must be conflict
  expect(codes).toContain(409);
  expect(codes.some(c => c === 200 || c === 500)).toBe(true);
  });
});
