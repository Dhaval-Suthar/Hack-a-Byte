import { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@/db/connectDb";
import ChatMessageModel from "@/models/ChatMessage";

interface Reaction {
  emoji: string;
  userId: string;
  username: string;
  timestamp: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method || '')) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDb();

    if (req.method === "GET") {
      // Get chat messages
      const {
        roomId,
        userId,
        messageType,
        limit = '50',
        offset = '0'
      } = req.query;

      const query: Record<string, unknown> = {};

      if (roomId && typeof roomId === 'string') query.roomId = roomId;
      if (userId && typeof userId === 'string') query.senderId = userId;
      if (messageType && typeof messageType === 'string') query.messageType = messageType;

      const messages = await ChatMessageModel.find(query)
        .populate('senderId', 'username avatar')
        .populate('replyTo', 'content senderId')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .lean();

      return res.status(200).json({
        success: true,
        messages: messages.reverse() // Return in chronological order
      });
    }

    if (req.method === "POST") {
      // Send new message
      const {
        roomId,
        senderId,
        content,
        messageType = 'text',
        replyTo,
        attachments
      } = req.body;

      if (!roomId || !senderId || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const message = new ChatMessageModel({
        roomId,
        senderId,
        content,
        messageType,
        replyTo,
        attachments: attachments || [],
      });

      await message.save();

      const populatedMessage = await ChatMessageModel.findById(message._id)
        .populate('senderId', 'username avatar')
        .populate('replyTo', 'content senderId')
        .lean();

      return res.status(201).json({
        success: true,
        message: populatedMessage
      });
    }

    if (req.method === "PUT") {
      // Update message (add reaction or edit content)
      const { messageId, action, reaction, newContent } = req.body;

      if (!messageId || !action) {
        return res.status(400).json({ error: "Message ID and action are required" });
      }

      const message = await ChatMessageModel.findById(messageId);

      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      if (action === 'addReaction' && reaction) {
        // Add reaction
        const existingReaction = message.reactions.find((r: Reaction) =>
          r.userId.toString() === reaction.userId && r.emoji === reaction.emoji
        );

        if (!existingReaction) {
          message.reactions.push(reaction);
        }
      } else if (action === 'removeReaction' && reaction) {
        // Remove reaction
        message.reactions = message.reactions.filter((r: Reaction) =>
          !(r.userId.toString() === reaction.userId && r.emoji === reaction.emoji)
        );
      } else if (action === 'edit' && newContent) {
        // Edit message content
        message.content = newContent;
        message.edited = true;
        message.editedAt = new Date();
      } else if (action === 'markRead') {
        // Mark as read
        message.readBy.push(req.body.userId);
      }

      await message.save();

      const updatedMessage = await ChatMessageModel.findById(messageId)
        .populate('senderId', 'username avatar')
        .populate('replyTo', 'content senderId')
        .lean();

      return res.status(200).json({
        success: true,
        message: updatedMessage
      });
    }

    if (req.method === "DELETE") {
      // Delete message
      const { messageId } = req.query;

      if (!messageId || typeof messageId !== 'string') {
        return res.status(400).json({ error: "Message ID is required" });
      }

      const message = await ChatMessageModel.findByIdAndDelete(messageId);

      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Message deleted successfully"
      });
    }
  } catch (error) {
    console.error("Chat Message API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
