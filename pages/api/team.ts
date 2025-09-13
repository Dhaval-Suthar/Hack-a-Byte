"use server";

import { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@/db/connectDb";
import Team from "@/models/Team";
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDb();

    // Get playspaceId from cookies or headers
    const playspaceId = req.cookies?.playspaceId || req.headers['x-playspace-id'] as string;
    
    if (!playspaceId) {
      return res.status(400).json({ error: "No playspace ID found" });
    }

    const team = await Team.findOne({ playspaceId });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    if (req.method === "GET") {
      // Get team bitcoin balance, portfolio, and purchased malware
      return res.status(200).json({
        success: true,
        bitcoinBalance: team.wallet.bitcoinBalance,
        stockPortfolio: team.stockPortfolio || [],
        purchasedMalware: team.purchasedMalware || [],
        teamName: team.name,
        teamId: team._id.toString()
      });
    }

    if (req.method === "POST") {
      // Handle different types of operations
      const { operation, amount, portfolioUpdate, malwareId } = req.body;

      // Handle portfolio updates
      if (operation === "updatePortfolio" && portfolioUpdate) {
        team.stockPortfolio = portfolioUpdate;
        await team.save();
        
        return res.status(200).json({
          success: true,
          stockPortfolio: team.stockPortfolio,
          bitcoinBalance: team.wallet.bitcoinBalance
        });
      }

      // Handle malware purchases
      if (operation === "purchaseMalware" && malwareId) {
        
        if (!team.purchasedMalware) {
          team.purchasedMalware = [];
        }
        
        if (!team.purchasedMalware.includes(malwareId)) {
          team.purchasedMalware.push(malwareId);
          await team.save();
        }
        
        return res.status(200).json({
          success: true,
          purchasedMalware: team.purchasedMalware,
          bitcoinBalance: team.wallet.bitcoinBalance
        });
      }

      // Handle malware deployment (removal after use)
      if (operation === "deployMalware" && malwareId) {
        
        if (!team.purchasedMalware) {
          team.purchasedMalware = [];
        }
        
        const malwareIndex = team.purchasedMalware.indexOf(malwareId);
        if (malwareIndex !== -1) {
          team.purchasedMalware.splice(malwareIndex, 1);
          await team.save();
        }
        
        return res.status(200).json({
          success: true,
          purchasedMalware: team.purchasedMalware,
          bitcoinBalance: team.wallet.bitcoinBalance
        });
      }

      // Handle balance updates
      if (typeof amount !== "number" || amount < 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      if (!["add", "subtract"].includes(operation)) {
        return res.status(400).json({ error: "Invalid operation" });
      }

      const currentBalance = team.wallet.bitcoinBalance;
      let newBalance = currentBalance;

      if (operation === "add") {
        newBalance = currentBalance + amount;
      } else if (operation === "subtract") {
        if (currentBalance < amount) {
          return res.status(400).json({ error: "Insufficient bitcoin balance" });
        }
        newBalance = currentBalance - amount;
      }

      team.wallet.bitcoinBalance = newBalance;
      await team.save();

      return res.status(200).json({
        success: true,
        bitcoinBalance: newBalance,
        previousBalance: currentBalance
      });
    }
  } catch (error) {
    logger.error('Team API error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
