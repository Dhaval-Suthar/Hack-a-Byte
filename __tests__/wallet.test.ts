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
  });

  afterEach(async () => {
    // Clean up after each test
    await WalletTransactionModel.deleteMany({});
    await Team.deleteMany({});
  });

  describe('createWalletTransaction', () => {
    it('should create a wallet transaction successfully', async () => {
      const transactionData = {
        teamId: '507f1f77bcf86cd799439011',
        type: 'deposit' as const,
        amount: 0.001,
        description: 'Test deposit',
        status: 'completed' as const,
      };

      const result = await createWalletTransaction(transactionData);

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.transaction?.teamId).toBe(transactionData.teamId);
      expect(result.transaction?.type).toBe(transactionData.type);
      expect(result.transaction?.amount).toBe(transactionData.amount);
      expect(result.transaction?.status).toBe(transactionData.status);
    });

    it('should create transaction with attacker and defender IDs', async () => {
      const transactionData = {
        teamId: '507f1f77bcf86cd799439011',
        type: 'attack' as const,
        amount: -0.0005,
        description: 'Attack transaction',
        attackerId: '507f1f77bcf86cd799439012',
        defenderId: '507f1f77bcf86cd799439013',
        status: 'completed' as const,
      };

      const result = await createWalletTransaction(transactionData);

      expect(result.success).toBe(true);
      expect(result.transaction?.attackerId).toBe(transactionData.attackerId);
      expect(result.transaction?.defenderId).toBe(transactionData.defenderId);
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
      teamId = '507f1f77bcf86cd799439011';

      // Create test transactions
      await WalletTransactionModel.create([
        {
          teamId,
          type: 'deposit',
          amount: 0.001,
          description: 'First deposit',
          status: 'completed',
          timestamp: new Date('2025-01-01'),
        },
        {
          teamId,
          type: 'withdrawal',
          amount: -0.0005,
          description: 'Withdrawal',
          status: 'completed',
          timestamp: new Date('2025-01-02'),
        },
        {
          teamId: '507f1f77bcf86cd799439012', // Different team
          type: 'deposit',
          amount: 0.002,
          description: 'Other team deposit',
          status: 'completed',
          timestamp: new Date('2025-01-03'),
        },
      ]);
    });

    it('should return team transactions', async () => {
      const result = await getTeamTransactions(teamId);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions?.[0].type).toBe('withdrawal'); // Most recent first
      expect(result.transactions?.[1].type).toBe('deposit');
    });

    it('should limit results', async () => {
      const result = await getTeamTransactions(teamId, 1);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions?.[0].type).toBe('withdrawal');
    });
  });

  describe('getTransactionById', () => {
    let transactionId: string;

    beforeEach(async () => {
      const transaction = await WalletTransactionModel.create({
        teamId: '507f1f77bcf86cd799439011',
        type: 'deposit',
        amount: 0.001,
        description: 'Test transaction',
        status: 'completed',
      });
      transactionId = transaction._id.toString();
    });

    it('should return transaction by ID', async () => {
      const result = await getTransactionById(transactionId);

      expect(result.success).toBe(true);
      expect(result.transaction?.teamId).toBe('507f1f77bcf86cd799439011');
      expect(result.transaction?.type).toBe('deposit');
    });

    it('should fail for non-existent transaction', async () => {
      const fakeId = '507f1f77bcf86cd799439013';
      const result = await getTransactionById(fakeId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction not found');
    });
  });

  describe('updateTransactionStatus', () => {
    let transactionId: string;

    beforeEach(async () => {
      const transaction = await WalletTransactionModel.create({
        teamId: '507f1f77bcf86cd799439011',
        type: 'deposit',
        amount: 0.001,
        description: 'Test transaction',
        status: 'pending',
      });
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
      const fakeId = '507f1f77bcf86cd799439013';
      const result = await updateTransactionStatus(fakeId, 'completed');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction not found');
    });
  });

  describe('getTeamBalance', () => {
    let teamId: string;

    beforeEach(async () => {
      const team = await Team.create({
        name: 'Test Team',
        wallet: {
          bitcoinBalance: 0.005,
          bitcoinAddress: 'test-address',
        },
      });
      teamId = team._id.toString();
    });

    it('should return team balance', async () => {
      const result = await getTeamBalance(teamId);

      expect(result.success).toBe(true);
      expect(result.balance).toBe(0.005);
    });

    it('should fail for non-existent team', async () => {
      const fakeId = '507f1f77bcf86cd799439013';
      const result = await getTeamBalance(fakeId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Team not found');
    });
  });

  describe('transferBitcoin', () => {
    let fromTeamId: string;
    let toTeamId: string;

    beforeEach(async () => {
      const fromTeam = await Team.create({
        name: 'From Team',
        wallet: {
          bitcoinBalance: 0.01,
          bitcoinAddress: 'from-address',
        },
      });

      const toTeam = await Team.create({
        name: 'To Team',
        wallet: {
          bitcoinBalance: 0.005,
          bitcoinAddress: 'to-address',
        },
      });

      fromTeamId = fromTeam._id.toString();
      toTeamId = toTeam._id.toString();
    });

    it('should transfer bitcoin successfully', async () => {
      const result = await transferBitcoin(fromTeamId, toTeamId, 0.003, 'Test transfer');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Transfer completed successfully');

      // Verify balances
      const updatedFromTeam = await Team.findById(fromTeamId);
      const updatedToTeam = await Team.findById(toTeamId);

      expect(updatedFromTeam?.wallet.bitcoinBalance).toBe(0.007); // 0.01 - 0.003
      expect(updatedToTeam?.wallet.bitcoinBalance).toBe(0.008); // 0.005 + 0.003

      // Verify transactions were created
      const transactions = await WalletTransactionModel.find({
        $or: [{ teamId: fromTeamId }, { teamId: toTeamId }]
      });
      expect(transactions).toHaveLength(2);
    });

    it('should fail with insufficient balance', async () => {
      const result = await transferBitcoin(fromTeamId, toTeamId, 0.02, 'Large transfer');

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
