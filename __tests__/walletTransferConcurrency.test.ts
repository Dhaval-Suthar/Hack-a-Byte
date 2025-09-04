import handler from '@/pages/api/wallet/transfer';
import Team from '@/models/Team';
import connectDb from '@/db/connectDb';
import { createMocks } from 'node-mocks-http';
import { cleanupMemoryMongo } from '../lib/mongoMemoryServer';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.setTimeout(30000);

describe('wallet transfer concurrency safety', () => {
  let senderAddr: string; let receiverAddr: string; let senderKey: string;
  beforeAll(async () => {
    await connectDb();
    const sender = await Team.create({ name: 'WTCSender', description:'c', numberOfPlayers:1, wallet:{ walletAddress:'wcs', privateKey:'kcs', bitcoinBalance:10 }, teamMembers:[] });
    const receiver = await Team.create({ name: 'WTCReceiver', description:'cr', numberOfPlayers:1, wallet:{ walletAddress:'wcr', privateKey:'kcr', bitcoinBalance:0 }, teamMembers:[] });
    senderAddr = sender.wallet.walletAddress; senderKey = sender.wallet.privateKey; receiverAddr = receiver.wallet.walletAddress;
  });
  afterAll(async () => { await cleanupMemoryMongo(); });

  it('allows only one of two concurrent overspending transfers', async () => {
    const { req: r1, res: s1 } = createMocks({ method:'POST', body:{ fromAddress: senderAddr, toAddress: receiverAddr, amount:7, privateKey: senderKey }});
    const { req: r2, res: s2 } = createMocks({ method:'POST', body:{ fromAddress: senderAddr, toAddress: receiverAddr, amount:7, privateKey: senderKey }});
    await Promise.all([
      handler(r1 as unknown as NextApiRequest, s1 as unknown as NextApiResponse),
      handler(r2 as unknown as NextApiRequest, s2 as unknown as NextApiResponse)
    ]);
    const d1 = s1._getJSONData();
    const d2 = s2._getJSONData();
    const successCount = [d1, d2].filter(d => d.success).length;
    expect(successCount).toBe(1);
    const senderFinal = await Team.findOne({ 'wallet.walletAddress': senderAddr }).select('wallet.bitcoinBalance');
    const receiverFinal = await Team.findOne({ 'wallet.walletAddress': receiverAddr }).select('wallet.bitcoinBalance');
    // One success (10 - 7 =3) & receiver +7
    expect(senderFinal!.wallet.bitcoinBalance).toBe(3);
    expect(receiverFinal!.wallet.bitcoinBalance).toBe(7);
  });
});
