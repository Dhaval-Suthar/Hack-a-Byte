import { NextApiRequest, NextApiResponse } from "next/types";
import connectDb from "@/db/connectDb";
import Team from "@/models/Team";
import { logger } from "@/lib/logger";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    logger.warn('Invalid method attempted on wallet/intel API', { method: req.method, ip: req.socket.remoteAddress });
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDb();

    // Get all teams with wallet information
    const teams = await Team.find({})
      .select("name wallet.bitcoinBalance wallet.address createdAt updatedAt")
      .lean();

    // Get playspaceId from cookies or headers to identify current user
    const playspaceId = req.cookies?.playspaceId || req.headers['x-playspace-id'] as string;
    
    if (!playspaceId) {
      return res.status(400).json({ error: "No playspace ID found" });
    }

    // Find the current user's team
    const currentTeam = await Team.findOne({ playspaceId });
    if (!currentTeam) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Transform to wallet intel format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallets = teams.map((team: any) => ({
      address: team.wallet?.address || `team-${team._id.toString().slice(-8)}`,
      balance: team.wallet?.bitcoinBalance || 0,
      teamName: team.name,
      lastActivity: team.updatedAt || team.createdAt,
      isOwnTeam: team._id.toString() === currentTeam._id.toString() // Compare team IDs
    }));

    logger.info('Wallet intel retrieved successfully', {
      walletCount: wallets.length,
      totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0)
    });

    res.status(200).json({
      success: true,
      wallets: wallets,
    });
  } catch (error) {
    logger.error("Failed to retrieve wallet intel", {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve wallet intelligence",
    });
  }
}