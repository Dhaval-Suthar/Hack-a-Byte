"use server";

import { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@/db/connectDb";
import Team from "@/models/Team";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDb();

    // Get playspaceId from cookies or headers
    const playspaceId = req.cookies?.playspaceId || req.headers['x-playspace-id'] as string;
    
    console.log('Team API request:', {
      playspaceId,
      cookies: req.cookies,
      headers: req.headers,
      method: req.method,
      url: req.url
    });
    
    if (!playspaceId) {
      return res.status(400).json({ error: "No playspace ID found" });
    }

    const team = await Team.findOne({ playspaceId });
    if (!team) {
      console.log('Team not found for playspaceId:', playspaceId);
      return res.status(404).json({ error: "Team not found" });
    }

    console.log('Found team:', {
      teamId: team._id,
      teamName: team.name,
      bitcoinBalance: team.wallet.bitcoinBalance,
      purchasedMalware: team.purchasedMalware || []
    });

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
        console.log('Processing malware purchase:', {
          malwareId,
          currentPurchasedMalware: team.purchasedMalware || []
        });
        
        if (!team.purchasedMalware) {
          team.purchasedMalware = [];
        }
        
        if (!team.purchasedMalware.includes(malwareId)) {
          team.purchasedMalware.push(malwareId);
          await team.save();
          console.log('Malware purchased and saved:', {
            malwareId,
            updatedPurchasedMalware: team.purchasedMalware
          });
        } else {
          console.log('Malware already purchased:', malwareId);
        }
        
        return res.status(200).json({
          success: true,
          purchasedMalware: team.purchasedMalware,
          bitcoinBalance: team.wallet.bitcoinBalance
        });
      }

      // Handle malware deployment (removal after use)
      if (operation === "deployMalware" && malwareId) {
        console.log('Processing malware deployment:', {
          malwareId,
          currentPurchasedMalware: team.purchasedMalware || []
        });
        
        if (!team.purchasedMalware) {
          team.purchasedMalware = [];
        }
        
        const malwareIndex = team.purchasedMalware.indexOf(malwareId);
        if (malwareIndex !== -1) {
          team.purchasedMalware.splice(malwareIndex, 1);
          await team.save();
          console.log('Malware deployed and removed:', {
            malwareId,
            updatedPurchasedMalware: team.purchasedMalware
          });
        } else {
          console.log('Malware not found in purchased list:', malwareId);
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

      console.log('Team API operation:', {
        operation,
        amount,
        currentBalance: currentBalance,
        currentBalanceType: typeof currentBalance,
        amountType: typeof amount,
        willHaveEnough: currentBalance >= amount
      });

      if (operation === "add") {
        newBalance = currentBalance + amount;
      } else if (operation === "subtract") {
        if (currentBalance < amount) {
          console.log('Insufficient balance detected:', {
            currentBalance,
            amount,
            difference: currentBalance - amount
          });
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
    console.error("Team API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
