"use server";

import connectDb from "@/db/connectDb";
import ChatMessageModel from "@/models/ChatMessage";
import DeviceUser from "@/models/DeviceUser";

export async function createChatMessage(data: {
  senderId: string;
  content: string;
  type: 'text' | 'system' | 'game_event' | 'achievement' | 'attack_alert' | 'defense_alert';
  teamId: string;
  gameSessionId?: string;
  tournamentId?: string;
  recipientIds?: string[];
  isPrivate: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: Array<{
    type: 'image' | 'file' | 'link';
    url: string;
    filename?: string;
    size?: number;
  }>;
  gameData?: {
    attackType?: string;
    defenseType?: string;
    bitcoinAmount?: number;
    achievementId?: string;
    eventType?: string;
  };
}) {
  try {
    await connectDb();

    const message = new ChatMessageModel({
      senderId: data.senderId,
      content: data.content,
      type: data.type,
      teamId: data.teamId,
      gameSessionId: data.gameSessionId,
      tournamentId: data.tournamentId,
      recipientIds: data.recipientIds,
      isPrivate: data.isPrivate,
      priority: data.priority,
      attachments: data.attachments,
      gameData: data.gameData,
      readBy: [{ userId: data.senderId, readAt: new Date() }],
    });

    await message.save();

    // Populate sender info
    await message.populate('senderId', 'username');
    if (data.recipientIds?.length) {
      await message.populate('recipientIds', 'username');
    }

    return { success: true, message: message.toObject() };
  } catch (error) {
    console.error("Error creating chat message:", error);
    return { success: false, error: "Failed to create chat message" };
  }
}

export async function getTeamMessages(teamId: string, limit: number = 50, offset: number = 0) {
  try {
    await connectDb();

    const messages = await ChatMessageModel.find({
      teamId,
      isDeleted: { $ne: true }
    })
      .populate('senderId', 'username')
      .populate('recipientIds', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return { success: true, messages: messages.reverse() }; // Reverse to get chronological order
  } catch (error) {
    console.error("Error fetching team messages:", error);
    return { success: false, error: "Failed to fetch team messages" };
  }
}

export async function getPrivateMessages(userId: string, otherUserId: string, limit: number = 50) {
  try {
    await connectDb();

    const messages = await ChatMessageModel.find({
      $or: [
        { senderId: userId, recipientIds: otherUserId, isPrivate: true },
        { senderId: otherUserId, recipientIds: userId, isPrivate: true }
      ],
      isDeleted: { $ne: true }
    })
      .populate('senderId', 'username')
      .populate('recipientIds', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return { success: true, messages: messages.reverse() };
  } catch (error) {
    console.error("Error fetching private messages:", error);
    return { success: false, error: "Failed to fetch private messages" };
  }
}

export async function markMessageAsRead(messageId: string, userId: string) {
  try {
    await connectDb();

    const message = await ChatMessageModel.findById(messageId);
    if (!message) {
      return { success: false, error: "Message not found" };
    }

    // Check if user is recipient or sender
    const isRecipient = message.recipientIds?.includes(userId);
    const isSender = message.senderId.toString() === userId;

    if (!isRecipient && !isSender) {
      return { success: false, error: "Access denied" };
    }

    // Check if already read
    const existingRead = message.readBy.find((read: { userId: string }) =>
      read.userId.toString() === userId
    );

    if (existingRead) {
      return { success: true, message: "Already marked as read" };
    }

    // Add to readBy array
    message.readBy.push({ userId, readAt: new Date() });
    await message.save();

    return { success: true, message: message.toObject() };
  } catch (error) {
    console.error("Error marking message as read:", error);
    return { success: false, error: "Failed to mark message as read" };
  }
}

export async function deleteMessage(messageId: string, userId: string) {
  try {
    await connectDb();

    const message = await ChatMessageModel.findById(messageId);
    if (!message) {
      return { success: false, error: "Message not found" };
    }

    // Only sender can delete their own messages
    if (message.senderId.toString() !== userId) {
      return { success: false, error: "Access denied" };
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;

    await message.save();

    return { success: true };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { success: false, error: "Failed to delete message" };
  }
}

export async function addReaction(messageId: string, userId: string, emoji: string) {
  try {
    await connectDb();

    const user = await DeviceUser.findById(userId).select('username');
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const message = await ChatMessageModel.findById(messageId);
    if (!message) {
      return { success: false, error: "Message not found" };
    }

    // Check if reaction already exists
    const existingReaction = message.reactions.find((reaction: { userId: unknown; emoji: string }) =>
      String(reaction.userId) === userId && reaction.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction if it exists
      message.reactions = message.reactions.filter((reaction: { userId: unknown; emoji: string }) =>
        !(String(reaction.userId) === userId && reaction.emoji === emoji)
      );
    } else {
      // Add new reaction
      message.reactions.push({
        emoji,
        userId,
        username: user.username,
        timestamp: new Date()
      });
    }

    await message.save();

    return { success: true, message: message.toObject() };
  } catch (error) {
    console.error("Error adding reaction:", error);
    return { success: false, error: "Failed to add reaction" };
  }
}

export async function getUnreadMessageCount(userId: string, teamId: string) {
  try {
    await connectDb();

    const count = await ChatMessageModel.countDocuments({
      teamId,
      senderId: { $ne: userId },
      readBy: { $not: { $elemMatch: { userId } } },
      isDeleted: { $ne: true }
    });

    return { success: true, count };
  } catch (error) {
    console.error("Error getting unread count:", error);
    return { success: false, error: "Failed to get unread count" };
  }
}
