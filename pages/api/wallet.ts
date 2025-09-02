import { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@/db/connectDb";
import WalletTransactionModel from "@/models/WalletTransaction";
import Team from "@/models/Team";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDb();

    if (req.method === "GET") {
      // Get team transactions
      const { teamId, limit = '50', offset = '0' } = req.query;

      if (!teamId || typeof teamId !== 'string') {
        return res.status(400).json({ error: "Team ID is required" });
      }

      const transactions = await WalletTransactionModel.find({ teamId })
        .populate('attackerId', 'username')
        .populate('defenderId', 'username')
        .sort({ timestamp: -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .lean();

      // Get current balance
      const team = await Team.findById(teamId).select('wallet.bitcoinBalance');
      const balance = team?.wallet.bitcoinBalance || 0;

      return res.status(200).json({
        success: true,
        transactions,
        balance
      });
    }

    if (req.method === "POST") {
      // Create new transaction
      const {
        teamId,
        type,
        amount,
        description,
        attackerId,
        defenderId,
        transactionHash,
        status
      } = req.body;

      if (!teamId || !type || typeof amount !== 'number') {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const transaction = new WalletTransactionModel({
        teamId,
        type,
        amount,
        description: description || '',
        attackerId,
        defenderId,
        transactionHash,
        status: status || 'completed',
        timestamp: new Date(),
      });

      await transaction.save();

      return res.status(201).json({
        success: true,
        transaction: transaction.toObject()
      });
    }
  } catch (error) {
    console.error("Wallet API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
