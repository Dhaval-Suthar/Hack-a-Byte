import handler from '@/pages/api/wallet/transfer';
import Team from '@/models/Team';
import connectDb from '@/db/connectDb';
import { createMocks } from 'node-mocks-http';
import { cleanupMemoryMongo } from '../lib/mongoMemoryServer';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.setTimeout(30_000);

describe('wallet transfer edge cases', () => {
  let senderAddr: string; let receiverAddr: string; let senderKey: string;
  beforeAll(async () => {
    await connectDb();
    const sender = await Team.create({ name: 'WTESender', description: 's', numberOfPlayers:1, wallet:{ walletAddress:'ws1', privateKey:'ks1', bitcoinBalance: 5 }, teamMembers:[] });
    const receiver = await Team.create({ name: 'WTEReceiver', description: 'r', numberOfPlayers:1, wallet:{ walletAddress:'wr1', privateKey:'kr1', bitcoinBalance: 0 }, teamMembers:[] });
    senderAddr = sender.wallet.walletAddress; receiverAddr = receiver.wallet.walletAddress; senderKey = sender.wallet.privateKey;
  });
  afterAll(async () => { await cleanupMemoryMongo(); });

  it('rejects invalid private key', async () => {
    const { req, res } = createMocks({ method:'POST', body:{ fromAddress: senderAddr, toAddress: receiverAddr, amount: 1, privateKey: 'wrong' }});
    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    const data = res._getJSONData();
    expect(data.success).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it('rejects insufficient balance', async () => {
    const { req, res } = createMocks({ method:'POST', body:{ fromAddress: senderAddr, toAddress: receiverAddr, amount: 999, privateKey: senderKey }});
    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    const data = res._getJSONData();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Insufficient/);
  });
});
