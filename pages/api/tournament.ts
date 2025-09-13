import { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@/db/connectDb";
import TournamentModel from "@/models/Tournament";
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDb();

    if (req.method === "GET") {
      // Get all tournaments
      const { status } = req.query;

      const query: Record<string, unknown> = {};
      if (status && typeof status === 'string') {
        query.status = status;
      }

      const tournaments = await TournamentModel.find(query)
        .populate('registeredTeams', 'name leaderUserId')
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        tournaments: tournaments.map(tournament => ({
          ...tournament,
          registeredTeams: tournament.registeredTeams || []
        }))
      });
    }

    if (req.method === "POST") {
      // Create new tournament
      const {
        name,
        description,
        maxTeams,
        entryFee,
        prizePool,
        startDate,
        endDate,
        rules,
        adminKey
      } = req.body;

      // Basic validation
      if (!name || !description || !maxTeams || typeof entryFee !== 'number') {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify admin key if provided
      if (adminKey) {
        // Add admin verification logic here
      }

      const tournament = new TournamentModel({
        name: String(name),
        description: String(description),
        maxTeams: Number(maxTeams),
        entryFee: Number(entryFee),
        prizePool: Number(prizePool) || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rules: Array.isArray(rules) ? rules : [],
        status: 'registration_open',
        registeredTeams: [],
        brackets: [],
        currentRound: 0,
        totalRounds: Math.ceil(Math.log2(Number(maxTeams))),
      });

      await tournament.save();

      return res.status(201).json({
        success: true,
        tournament: tournament.toObject()
      });
    }
  } catch (error) {
    logger.error('Tournament API error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
