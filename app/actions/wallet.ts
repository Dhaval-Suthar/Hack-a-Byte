"use server";

import connectDb from "@/db/connectDb";
import WalletTransactionModel from "@/models/WalletTransaction";
import Team from "@/models/Team";

export async function createWalletTransaction(data: {
  teamId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'tournament_fee' | 'prize' | 'attack' | 'defense';
  amount: number;
  description: string;
  attackerId?: string;
  defenderId?: string;
  transactionHash?: string;
  status: 'pending' | 'completed' | 'failed';
}) {
  try {
    await connectDb();

    const transaction = new WalletTransactionModel({
      teamId: data.teamId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      attackerId: data.attackerId,
      defenderId: data.defenderId,
      transactionHash: data.transactionHash,
      status: data.status,
      timestamp: new Date(),
    });

    await transaction.save();
    return { success: true, transaction: transaction.toObject() };
  } catch (error) {
    console.error("Error creating wallet transaction:", error);
    return { success: false, error: "Failed to create transaction" };
  }
}

export async function getTeamTransactions(teamId: string, limit: number = 50, offset: number = 0) {
  try {
    await connectDb();

    const transactions = await WalletTransactionModel.find({ teamId })
      .populate('attackerId', 'username')
      .populate('defenderId', 'username')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return { success: true, transactions };
  } catch (error) {
    console.error("Error fetching transactions:", error);
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
    console.error("Error fetching transaction:", error);
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
    console.error("Error updating transaction status:", error);
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
    console.error("Error fetching team balance:", error);
    return { success: false, error: "Failed to fetch team balance" };
  }
}

export async function transferBitcoin(fromTeamId: string, toTeamId: string, amount: number, description: string) {
  try {
    await connectDb();

    const [fromTeam, toTeam] = await Promise.all([
      Team.findById(fromTeamId),
      Team.findById(toTeamId)
    ]);

    if (!fromTeam || !toTeam) {
      return { success: false, error: "One or both teams not found" };
    }

    if (fromTeam.wallet.bitcoinBalance < amount) {
      return { success: false, error: "Insufficient balance" };
    }

    // Update balances
    fromTeam.wallet.bitcoinBalance -= amount;
    toTeam.wallet.bitcoinBalance += amount;

    // Create transaction records
    const withdrawalTx = new WalletTransactionModel({
      teamId: fromTeamId,
      type: 'transfer',
      amount: -amount,
      description: `Transfer to ${toTeam.name}: ${description}`,
      status: 'completed',
      timestamp: new Date(),
    });

    const depositTx = new WalletTransactionModel({
      teamId: toTeamId,
      type: 'transfer',
      amount: amount,
      description: `Transfer from ${fromTeam.name}: ${description}`,
      status: 'completed',
      timestamp: new Date(),
    });

    await Promise.all([
      fromTeam.save(),
      toTeam.save(),
      withdrawalTx.save(),
      depositTx.save()
    ]);

    return { success: true, message: "Transfer completed successfully" };
  } catch (error) {
    console.error("Error transferring bitcoin:", error);
    return { success: false, error: "Failed to transfer bitcoin" };
  }
}
