import { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@/db/connectDb";
import DeviceUser from "@/models/DeviceUser";
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDb();

    // Get users who have been active in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const activeUsers = await DeviceUser.find({
      lastActiveTime: { $gte: twentyFourHoursAgo },
      isActive: true
    })
      .select('username lastActiveTime')
      .sort({ lastActiveTime: -1 })
      .limit(20)
      .lean();

    // Transform to match the expected format
    const onlineMembers = activeUsers.map((user, index) => ({
      id: index + 1,
      name: user.username,
      status: user.lastActiveTime > new Date(Date.now() - 5 * 60 * 1000) ? 'online' : 'away', // Active in last 5 minutes = online
      avatar: (index % 5) + 1 // Simple avatar assignment
    }));

    // If no active users, return some default online members
    if (onlineMembers.length === 0) {
      return res.status(200).json({
        success: true,
        members: [
          { id: 1, name: "CyberNinja", status: "online", avatar: 1 },
          { id: 2, name: "QuantumHacker", status: "online", avatar: 2 },
          { id: 3, name: "NeonPhantom", status: "away", avatar: 3 },
          { id: 4, name: "ByteRebel", status: "offline", avatar: 4 },
          { id: 5, name: "DataSpectre", status: "online", avatar: 2 },
        ]
      });
    }

    return res.status(200).json({
      success: true,
      members: onlineMembers
    });
  } catch (error) {
    logger.error('Failed to fetch online members', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
