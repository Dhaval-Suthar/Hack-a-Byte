import fakebankHandler from '@/pages/api/attack/fakebank';
import transferHandler from '@/pages/api/wallet/transfer';
import Team from '@/models/Team';
import connectDb from '@/db/connectDb';
import { createMocks } from 'node-mocks-http';
import { cleanupMemoryMongo } from '../lib/mongoMemoryServer';
import type { NextApiRequest, NextApiResponse } from 'next';
import { activeFakeBank } from '@/pages/api/attack/fakebank';

jest.setTimeout(30_000);

describe('FakeBank siphon + wallet transfer', () => {
  let attackerId: string; let victimId: string; let attackerWallet: string; let victimWallet: string; let victimKey: string;
  beforeAll(async () => {
    await connectDb();
    const attacker = await Team.create({ name: 'AttackerTeam', description: 'att', numberOfPlayers:1, wallet:{ walletAddress:'wa1', privateKey:'ka1', bitcoinBalance: 0 }, teamMembers:[{ username:'tokyo', role:'tokyo', accessCodeUsed:true }] });
    const victim = await Team.create({ name: 'VictimTeam', description: 'vic', numberOfPlayers:1, wallet:{ walletAddress:'wv1', privateKey:'kv1', bitcoinBalance: 100 }, teamMembers:[{ username:'rio', role:'rio', accessCodeUsed:true }] });
    attackerId = attacker._id.toString(); victimId = victim._id.toString(); attackerWallet = attacker.wallet.walletAddress; victimWallet = victim.wallet.walletAddress; victimKey = victim.wallet.privateKey;
  });
  afterAll(async () => { await cleanupMemoryMongo(); });

  it('creates fakebank window and siphons on transfer', async () => {
    const { req: fr, res: fs } = createMocks({ method: 'POST', body: { attackerTeamId: attackerId, targetTeamId: victimId } });
  await fakebankHandler(fr as unknown as NextApiRequest, fs as unknown as NextApiResponse);
    const fbData = fs._getJSONData();
    expect(fbData.success).toBe(true);
    expect(activeFakeBank[victimId]).toBeDefined();
    const { req, res } = createMocks({ method: 'POST', body: { fromAddress: victimWallet, toAddress: attackerWallet, amount: 10, privateKey: victimKey } });
  await transferHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    const txData = res._getJSONData();
    expect(txData.success).toBe(true);
    const updatedAttacker = await Team.findById(attackerId).select('wallet.bitcoinBalance');
    const updatedVictim = await Team.findById(victimId).select('wallet.bitcoinBalance');
    // Victim sends 10 to attacker (attacker gains 10), siphon duplicates -> attacker total +20 vs start 0
    expect(updatedAttacker!.wallet.bitcoinBalance).toBe(20);
    expect(updatedVictim!.wallet.bitcoinBalance).toBe(90); // 100 - 10
  });
});
