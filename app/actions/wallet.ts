"use server";

import connectDb from "@/db/connectDb";
import WalletTransactionModel from "@/models/WalletTransaction";
import Team from "@/models/Team";
import { logger } from '@/lib/logger';

// Map action-layer legacy types to schema enum values
const typeMap: Record<string, string> = {
  tournament_fee: 'fee',
  prize: 'bonus',
  defense: 'defense_penalty'
};

function generateReference(prefix: string = 'TXN'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function createWalletTransaction(data: {
  teamId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'tournament_fee' | 'prize' | 'attack' | 'defense';
  amount: number; // positive for credit, negative for debit (tests use this convention)
  description: string;
  attackerId?: string;
  defenderId?: string;
  transactionHash?: string;
  status: 'pending' | 'completed' | 'failed';
}) {
  try {
    await connectDb();

    const team = await Team.findById(data.teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    if (typeof data.amount !== 'number' || data.amount === 0 || isNaN(data.amount)) {
      return { success: false, error: 'Invalid amount' };
    }

    const mappedType = (typeMap as Record<string, string>)[data.type] || data.type;
    const allowedTypes = ['deposit','withdrawal','transfer','fee','bonus','attack','defense_penalty'];
    if (!allowedTypes.includes(mappedType)) {
      return { success: false, error: 'Invalid transaction type' };
    }

    const balanceBefore = team.wallet.bitcoinBalance;
    const balanceAfter = balanceBefore + data.amount;
    if (balanceAfter < 0) {
      return { success: false, error: 'Insufficient balance' };
    }

    const reference = generateReference();

    const transaction = await WalletTransactionModel.create({
      teamId: team._id,
      walletAddress: team.wallet.walletAddress,
      type: mappedType,
      amount: data.amount,
      description: data.description,
      attackerId: data.attackerId,
      defenderId: data.defenderId,
      reference,
      balanceBefore,
      balanceAfter,
      status: data.status,
      metadata: {},
      tags: []
    });

    if (data.status === 'completed') {
      team.wallet.bitcoinBalance = balanceAfter;
      await team.save();
    }

    return { success: true, transaction: transaction.toObject() };
  } catch (error) {
    logger.error('Error creating wallet transaction:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: 'Failed to create transaction' };
  }
}

export async function getTeamTransactions(teamId: string, limit: number = 50, offset: number = 0) {
  try {
    await connectDb();
    const transactions = await WalletTransactionModel.find({ teamId })
      .populate('attackerId', 'username')
      .populate('defenderId', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return { success: true, transactions };
  } catch (error) {
    logger.error('Error fetching transactions:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to fetch transactions" };
  }
}

export async function getTransactionById(transactionId: string) {
  try {
    await connectDb();

    const transaction = await WalletTransactionModel.findById(transactionId)
      .populate('attackerId', 'username')
      .populate('defenderId', 'username')
      .lean();

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    return { success: true, transaction };
  } catch (error) {
    logger.error('Error fetching transaction:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to fetch transaction" };
  }
}

export async function updateTransactionStatus(transactionId: string, status: 'pending' | 'completed' | 'failed') {
  try {
    await connectDb();

    const transaction = await WalletTransactionModel.findByIdAndUpdate(
      transactionId,
      { status },
      { new: true }
    );

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    return { success: true, transaction: transaction.toObject() };
  } catch (error) {
    logger.error('Error updating transaction status:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to update transaction status" };
  }
}

export async function getTeamBalance(teamId: string) {
  try {
    await connectDb();

    const team = await Team.findById(teamId).select('wallet.bitcoinBalance');
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    return { success: true, balance: team.wallet.bitcoinBalance };
  } catch (error) {
    logger.error('Error fetching team balance:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to fetch team balance" };
  }
}

export async function transferBitcoin(fromTeamId: string, toTeamId: string, amount: number, description: string) {
  try {
    await connectDb();

    if (amount <= 0) return { success: false, error: 'Invalid amount' };

    const [fromTeam, toTeam] = await Promise.all([
      Team.findById(fromTeamId),
      Team.findById(toTeamId)
    ]);

    if (!fromTeam || !toTeam) {
      return { success: false, error: 'One or both teams not found' };
    }

    if (fromTeam.wallet.bitcoinBalance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const refBase = generateReference('TRF');

    const fromBalanceBefore = fromTeam.wallet.bitcoinBalance;
    const fromBalanceAfter = fromBalanceBefore - amount;
    const toBalanceBefore = toTeam.wallet.bitcoinBalance;
    const toBalanceAfter = toBalanceBefore + amount;

    // Prepare transactions
    const withdrawalTx = new WalletTransactionModel({
      teamId: fromTeam._id,
      walletAddress: fromTeam.wallet.walletAddress,
      type: 'transfer',
      amount: -amount,
      description: `Transfer to ${toTeam.name}: ${description}`,
      status: 'completed',
      reference: refBase + '-OUT',
      balanceBefore: fromBalanceBefore,
      balanceAfter: fromBalanceAfter,
      metadata: { direction: 'outbound', counterparty: toTeam._id.toString() },
      tags: ['transfer']
    });

    const depositTx = new WalletTransactionModel({
      teamId: toTeam._id,
      walletAddress: toTeam.wallet.walletAddress,
      type: 'transfer',
      amount,
      description: `Transfer from ${fromTeam.name}: ${description}`,
      status: 'completed',
      reference: refBase + '-IN',
      balanceBefore: toBalanceBefore,
      balanceAfter: toBalanceAfter,
      metadata: { direction: 'inbound', counterparty: fromTeam._id.toString() },
      tags: ['transfer']
    });

    // Persist
    fromTeam.wallet.bitcoinBalance = fromBalanceAfter;
    toTeam.wallet.bitcoinBalance = toBalanceAfter;
    await Promise.all([ fromTeam.save(), toTeam.save(), withdrawalTx.save(), depositTx.save() ]);

    return { success: true, message: 'Transfer completed successfully' };
  } catch (error) {
    logger.error('Error transferring bitcoin:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: 'Failed to transfer bitcoin' };
  }
}
