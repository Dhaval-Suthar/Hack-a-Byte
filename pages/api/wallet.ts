import { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@/db/connectDb";
import WalletTransactionModel from "@/models/WalletTransaction";
import Team from "@/models/Team";
import { createSuccessResponse, createErrorResponse, validateMethod, handleApiError } from "@/lib/api-response";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateMethod(res, req.method || '', ['GET', 'POST'])) {
    return;
  }

  try {
    await connectDb();

    if (req.method === "GET") {
      // Get team transactions
      const { teamId, limit = '50', offset = '0' } = req.query;

      if (!teamId || typeof teamId !== 'string') {
        createErrorResponse(res, "Team ID is required", 400);
        return;
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

      createSuccessResponse(res, {
        transactions,
        balance
      });
      return;
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
        createErrorResponse(res, "Missing required fields: teamId, type, and amount are required", 400);
        return;
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

      createSuccessResponse(res, {
        transaction: transaction.toObject()
      }, 201);
      return;
    }
  } catch (error) {
    handleApiError(res, error);
  }
}
