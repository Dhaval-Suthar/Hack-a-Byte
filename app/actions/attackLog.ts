"use server";

import connectDb from "@/db/connectDb";
import AttackLogModel from "@/models/AttackLog";

export async function createAttackLog(data: {
  attackerUserId: string;
  defenderUserId: string;
  attackType: 'malware' | 'phishing' | 'ddos' | 'sql_injection' | 'xss' | 'ransomware';
  defenseType?: 'firewall' | 'antivirus' | 'ids' | 'encryption' | 'backup';
  success: boolean;
  damage: number;
  bitcoinAmount?: number;
  description: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country?: string;
    city?: string;
  };
}) {
  try {
    await connectDb();

    const attackLog = new AttackLogModel({
      attackerUserId: data.attackerUserId,
      defenderUserId: data.defenderUserId,
      attackType: data.attackType,
      defenseType: data.defenseType,
      success: data.success,
      damage: data.damage,
      bitcoinAmount: data.bitcoinAmount,
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      location: data.location,
      timestamp: new Date(),
    });

    await attackLog.save();
    return { success: true, attackLog: attackLog.toObject() };
  } catch (error) {
    console.error("Error creating attack log:", error);
    return { success: false, error: "Failed to create attack log" };
  }
}

export async function getUserAttackLogs(userId: string, limit: number = 50, offset: number = 0) {
  try {
    await connectDb();

    const attackLogs = await AttackLogModel.find({
      $or: [{ attackerUserId: userId }, { defenderUserId: userId }]
    })
      .populate('attackerUserId', 'username')
      .populate('defenderUserId', 'username')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return { success: true, attackLogs };
  } catch (error) {
    console.error("Error fetching attack logs:", error);
    return { success: false, error: "Failed to fetch attack logs" };
  }
}

export async function getAttackLogById(logId: string) {
  try {
    await connectDb();

    const attackLog = await AttackLogModel.findById(logId)
      .populate('attackerUserId', 'username')
      .populate('defenderUserId', 'username')
      .lean();

    if (!attackLog) {
      return { success: false, error: "Attack log not found" };
    }

    return { success: true, attackLog };
  } catch (error) {
    console.error("Error fetching attack log:", error);
    return { success: false, error: "Failed to fetch attack log" };
  }
}

export async function getAttackStatistics(userId: string, timeframe: 'day' | 'week' | 'month' = 'week') {
  try {
    await connectDb();

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
    }

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
          },
          totalBitcoinStolen: {
            $sum: { $cond: [{ $and: [{ $eq: ['$attackerUserId', userId] }, '$success'] }, { $ifNull: ['$bitcoinAmount', 0] }, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalAttacks: 0,
      successfulAttacks: 0,
      successfulDefenses: 0,
      totalDamageDealt: 0,
      totalDamageReceived: 0,
      totalBitcoinStolen: 0
    };

    return { success: true, stats: result };
  } catch (error) {
    console.error("Error fetching attack statistics:", error);
    return { success: false, error: "Failed to fetch attack statistics" };
  }
}

export async function getRecentAttacks(limit: number = 20) {
  try {
    await connectDb();

    const attacks = await AttackLogModel.find({})
      .populate('attackerUserId', 'username')
      .populate('defenderUserId', 'username')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return { success: true, attacks };
  } catch (error) {
    console.error("Error fetching recent attacks:", error);
    return { success: false, error: "Failed to fetch recent attacks" };
  }
}
