import { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@/db/connectDb";
import NotificationModel from "@/models/Notification";
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method || '')) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDb();

    if (req.method === "GET") {
      // Get user notifications
      const { userId, limit = '50', offset = '0' } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: "User ID is required" });
      }

      const notifications = await NotificationModel.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .lean();

      return res.status(200).json({
        success: true,
        notifications
      });
    }

    if (req.method === "POST") {
      // Create new notification
      const {
        recipient,
        type,
        title,
        message,
        priority,
        data,
        expiresAt
      } = req.body;

      if (!recipient || !type || !title || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const notification = new NotificationModel({
        recipient,
        type,
        title,
        message,
        priority: priority || 'normal',
        data: data || {},
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isRead: false,
      });

      await notification.save();

      return res.status(201).json({
        success: true,
        notification: notification.toObject()
      });
    }

    if (req.method === "PUT") {
      // Mark notification as read
      const { notificationId, userId } = req.body;

      if (!notificationId || !userId) {
        return res.status(400).json({ error: "Notification ID and User ID are required" });
      }

      const notification = await NotificationModel.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      return res.status(200).json({
        success: true,
        notification: notification.toObject()
      });
    }

    if (req.method === "DELETE") {
      // Delete notification
      const { notificationId, userId } = req.query;

      if (!notificationId || !userId) {
        return res.status(400).json({ error: "Notification ID and User ID are required" });
      }

      const result = await NotificationModel.deleteOne({
        _id: notificationId,
        recipient: userId
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Notification not found" });
      }

      return res.status(200).json({
        success: true
      });
    }
  } catch (error) {
    logger.error('Notification API error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
