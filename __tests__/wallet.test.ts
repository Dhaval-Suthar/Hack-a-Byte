import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import connectDb from '@/db/connectDb';
import WalletTransactionModel from '@/models/WalletTransaction';
import Team from '@/models/Team';
import { createWalletTransaction, getTeamTransactions, getTransactionById, updateTransactionStatus, getTeamBalance, transferBitcoin } from '@/app/actions/wallet';

describe('Wallet Actions', () => {
  beforeEach(async () => {
    await connectDb();
    // Clear collections before each test
  await WalletTransactionModel.deleteMany({});
  await Team.deleteMany({});
  await Team.create({ name:'BaseTeam', description:'d', numberOfPlayers:1, wallet:{ walletAddress:'baseAddr', privateKey:'basePK', bitcoinBalance:1000 }, teamMembers:[] });
  await Team.create({ name:'BaseTeam2', description:'d', numberOfPlayers:1, wallet:{ walletAddress:'baseAddr2', privateKey:'basePK2', bitcoinBalance:500 }, teamMembers:[] });
  });

  afterEach(async () => {
    // Clean up after each test
    await WalletTransactionModel.deleteMany({});
    await Team.deleteMany({});
  });

  describe('createWalletTransaction', () => {
    it('should create a wallet transaction successfully', async () => {
      const baseTeamId = (await Team.findOne({ name:'BaseTeam'}))!._id.toString();
      const transactionData = {
        teamId: baseTeamId,
        type: 'deposit' as const,
        amount: 0.001,
        description: 'Test deposit',
        status: 'completed' as const,
      };

      const result = await createWalletTransaction(transactionData);

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
  expect(result.transaction && result.transaction.teamId.toString()).toBe(transactionData.teamId);
  expect(result.transaction?.type).toBe('deposit');
      expect(result.transaction?.amount).toBe(transactionData.amount);
      expect(result.transaction?.status).toBe(transactionData.status);
    });

    it('should create transaction with attacker and defender IDs', async () => {
      const baseTeamId = (await Team.findOne({ name:'BaseTeam'}))!._id.toString();
      const transactionData = {
        teamId: baseTeamId,
        type: 'attack' as const,
        amount: -0.0005,
        description: 'Attack transaction',
        attackerId: '507f1f77bcf86cd799439012',
        defenderId: '507f1f77bcf86cd799439013',
        status: 'completed' as const,
      };

      const result = await createWalletTransaction(transactionData);

      expect(result.success).toBe(true);
  expect(result.transaction && result.transaction.attackerId?.toString()).toBe(transactionData.attackerId);
  expect(result.transaction && result.transaction.defenderId?.toString()).toBe(transactionData.defenderId);
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
  teamId: '',
        type: 'deposit' as const,
        amount: 0,
        description: '',
        status: 'completed' as const,
      };

      const result = await createWalletTransaction(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getTeamTransactions', () => {
    let teamId: string;

    beforeEach(async () => {
      teamId = (await Team.findOne({ name:'BaseTeam'}))!._id.toString();

      // Create test transactions
      await WalletTransactionModel.create([
  { teamId, walletAddress:'baseAddr', type:'deposit', amount:0.001, description:'First deposit', status:'completed', balanceBefore:1000, balanceAfter:1000.001, reference:'ref_dep1', metadata:{}, tags:[] },
  { teamId, walletAddress:'baseAddr', type:'withdrawal', amount:-0.0005, description:'Withdrawal', status:'completed', balanceBefore:1000.001, balanceAfter:1000.0005, reference:'ref_wd1', metadata:{}, tags:[] },
  { teamId: (await Team.findOne({ name:'BaseTeam2'}))!._id, walletAddress:'baseAddr2', type:'deposit', amount:0.002, description:'Other team deposit', status:'completed', balanceBefore:500, balanceAfter:500.002, reference:'ref_dep2', metadata:{}, tags:[] },
      ]);
    });

    it('should return team transactions', async () => {
      const result = await getTeamTransactions(teamId);

      expect(result.success).toBe(true);
  expect(result.transactions).toHaveLength(2);
  const types = result.transactions!.map(t => t.type).sort();
  expect(types).toEqual(['deposit','withdrawal']);
    });

    it('should limit results', async () => {
      const result = await getTeamTransactions(teamId, 1);

      expect(result.success).toBe(true);
  expect(result.transactions).toHaveLength(1);
  expect(['deposit','withdrawal']).toContain(result.transactions?.[0].type);
    });
  });

  describe('getTransactionById', () => {
    let transactionId: string;

    beforeEach(async () => {
  const teamId = (await Team.findOne({ name:'BaseTeam'}))!._id.toString();
  const transaction = await WalletTransactionModel.create({ teamId, walletAddress:'baseAddr', type:'deposit', amount:0.001, description:'Test transaction', status:'completed', balanceBefore:1000, balanceAfter:1000.001, reference:'ref_tx1', metadata:{}, tags:[] });
      transactionId = transaction._id.toString();
    });

    it('should return transaction by ID', async () => {
      const result = await getTransactionById(transactionId);

      expect(result.success).toBe(true);
  const baseTeamId = (await Team.findOne({ name:'BaseTeam'}))!._id.toString();
  expect(result.transaction && result.transaction.teamId.toString()).toBe(baseTeamId);
  expect(result.transaction?.type).toBe('deposit');
    });

    it('should fail for non-existent transaction', async () => {
  const fakeId = '64aa11111111111111111111';
      const result = await getTransactionById(fakeId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction not found');
    });
  });

  describe('updateTransactionStatus', () => {
    let transactionId: string;

    beforeEach(async () => {
  const teamId = (await Team.findOne({ name:'BaseTeam'}))!._id.toString();
  const transaction = await WalletTransactionModel.create({ teamId, walletAddress:'baseAddr', type:'deposit', amount:0.001, description:'Test transaction', status:'pending', balanceBefore:1000, balanceAfter:1000.001, reference:'ref_tx2', metadata:{}, tags:[] });
      transactionId = transaction._id.toString();
    });

    it('should update transaction status', async () => {
      const result = await updateTransactionStatus(transactionId, 'completed');

      expect(result.success).toBe(true);
      expect(result.transaction?.status).toBe('completed');

      // Verify in database
      const updatedTransaction = await WalletTransactionModel.findById(transactionId);
      expect(updatedTransaction?.status).toBe('completed');
    });

    it('should fail for non-existent transaction', async () => {
  const fakeId = '64aa11111111111111111112';
      const result = await updateTransactionStatus(fakeId, 'completed');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction not found');
    });
  });

  describe('getTeamBalance', () => {
    let teamId: string;

    beforeEach(async () => {
  const team = await Team.create({ name:'BalanceTeam', description:'d', numberOfPlayers:1, wallet:{ walletAddress:'balAddr', privateKey:'balPK', bitcoinBalance:5 }, teamMembers:[] });
  teamId = team._id.toString();
    });

    it('should return team balance', async () => {
      const result = await getTeamBalance(teamId);

      expect(result.success).toBe(true);
  expect(result.balance).toBe(5);
    });

    it('should fail for non-existent team', async () => {
  const fakeId = '64aa11111111111111111113';
      const result = await getTeamBalance(fakeId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Team not found');
    });
  });

  describe('transferBitcoin', () => {
    let fromTeamId: string;
    let toTeamId: string;

    beforeEach(async () => {
  const fromTeam = await Team.create({ name:'FromTeam', description:'d', numberOfPlayers:1, wallet:{ walletAddress:'fromAddr', privateKey:'fromPK', bitcoinBalance:10 }, teamMembers:[] });
  const toTeam = await Team.create({ name:'ToTeam', description:'d', numberOfPlayers:1, wallet:{ walletAddress:'toAddr', privateKey:'toPK', bitcoinBalance:5 }, teamMembers:[] });

      fromTeamId = fromTeam._id.toString();
      toTeamId = toTeam._id.toString();
    });

    it('should transfer bitcoin successfully', async () => {
  const result = await transferBitcoin(fromTeamId, toTeamId, 3, 'Test transfer');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Transfer completed successfully');

      // Verify balances
      const updatedFromTeam = await Team.findById(fromTeamId);
      const updatedToTeam = await Team.findById(toTeamId);

  expect(updatedFromTeam?.wallet.bitcoinBalance).toBe(7); // 10 - 3
  expect(updatedToTeam?.wallet.bitcoinBalance).toBe(8); // 5 + 3

      // Verify transactions were created
      const transactions = await WalletTransactionModel.find({
        $or: [{ teamId: fromTeamId }, { teamId: toTeamId }]
      });
      expect(transactions).toHaveLength(2);
    });

    it('should fail with insufficient balance', async () => {
  const result = await transferBitcoin(fromTeamId, toTeamId, 2000, 'Large transfer');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient balance');
    });

    it('should fail for non-existent teams', async () => {
      const fakeId = '507f1f77bcf86cd799439013';
      const result = await transferBitcoin(fakeId, toTeamId, 0.001, 'Test transfer');

      expect(result.success).toBe(false);
      expect(result.error).toBe('One or both teams not found');
    });
  });
});
