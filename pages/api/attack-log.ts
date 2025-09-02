import { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@/db/connectDb";
import AttackLogModel from "@/models/AttackLog";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDb();

    if (req.method === "GET") {
      // Get attack logs
      const {
        userId,
        limit = '50',
        offset = '0',
        timeframe = 'week'
      } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Calculate date range
      const now = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      const attackLogs = await AttackLogModel.find({
        $or: [{ attackerUserId: userId }, { defenderUserId: userId }],
        timestamp: { $gte: startDate }
      })
        .populate('attackerUserId', 'username')
        .populate('defenderUserId', 'username')
        .sort({ timestamp: -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .lean();

      // Get statistics
      const stats = await AttackLogModel.aggregate([
        {
          $match: {
            $or: [{ attackerUserId: userId }, { defenderUserId: userId }],
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalAttacks: { $sum: 1 },
            successfulAttacks: {
              $sum: { $cond: [{ $and: [{ $eq: ['$attackerUserId', userId] }, '$success'] }, 1, 0] }
            },
            successfulDefenses: {
              $sum: { $cond: [{ $and: [{ $eq: ['$defenderUserId', userId] }, { $not: '$success' }] }, 1, 0] }
            },
            totalDamageDealt: {
              $sum: { $cond: [{ $eq: ['$attackerUserId', userId] }, '$damage', 0] }
            },
            totalDamageReceived: {
              $sum: { $cond: [{ $eq: ['$defenderUserId', userId] }, '$damage', 0] }
            }
          }
        }
      ]);

      const statistics = stats[0] || {
        totalAttacks: 0,
        successfulAttacks: 0,
        successfulDefenses: 0,
        totalDamageDealt: 0,
        totalDamageReceived: 0
      };

      return res.status(200).json({
        success: true,
        attackLogs,
        statistics
      });
    }

    if (req.method === "POST") {
      // Create new attack log
      const {
        attackerUserId,
        defenderUserId,
        attackType,
        defenseType,
        success,
        damage,
        bitcoinAmount,
        description,
        ipAddress,
        userAgent,
        location
      } = req.body;

      if (!attackerUserId || !defenderUserId || !attackType || typeof success !== 'boolean') {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const attackLog = new AttackLogModel({
        attackerUserId,
        defenderUserId,
        attackType,
        defenseType,
        success,
        damage: Number(damage) || 0,
        bitcoinAmount: bitcoinAmount ? Number(bitcoinAmount) : undefined,
        description: description || '',
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        location,
        timestamp: new Date(),
      });

      await attackLog.save();

      return res.status(201).json({
        success: true,
        attackLog: attackLog.toObject()
      });
    }
  } catch (error) {
    console.error("Attack Log API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
