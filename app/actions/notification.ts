"use server";

import connectDb from "@/db/connectDb";
import NotificationModel from "@/models/Notification";

export async function createNotification(data: {
  recipient: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  data?: Record<string, unknown>;
  expiresAt?: Date;
}) {
  try {
    await connectDb();

    if (!data.recipient || !data.title?.trim() || !data.message?.trim()) return { success: false, error: 'Missing required fields' };
    const notification = new NotificationModel({
      recipient: data.recipient,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority,
      metadata: data.data || {},
      expiresAt: data.expiresAt,
      isRead: false,
    });

    await notification.save();
    return { success: true, notification: notification.toObject() };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

export async function getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
  try {
    await connectDb();

  const notifications = await NotificationModel.find({ recipient: userId }).sort({ createdAt: -1 }).limit(limit).skip(offset).lean();

    return { success: true, notifications };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    await connectDb();

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    return { success: true, notification: notification.toObject() };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await connectDb();

    const result = await NotificationModel.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return { success: true, updatedCount: result.modifiedCount };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Failed to mark notifications as read" };
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    await connectDb();

    const count = await NotificationModel.countDocuments({
      recipient: userId,
      isRead: false
    });

    return { success: true, count };
  } catch (error) {
    console.error("Error getting unread count:", error);
    return { success: false, error: "Failed to get unread count" };
  }
}

export async function deleteNotification(notificationId: string, userId: string) {
  try {
    await connectDb();

    const result = await NotificationModel.deleteOne({
      _id: notificationId,
      recipient: userId
    });

    if (result.deletedCount === 0) {
      return { success: false, error: "Notification not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}
