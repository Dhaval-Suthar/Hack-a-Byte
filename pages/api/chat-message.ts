import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
// Use leo-profanity on the server to sanitize messages before saving
// Use import to avoid TS typing issues in this file
import leo from 'leo-profanity';
import connectDb from "@/db/connectDb";
import ChatMessageModel from "@/models/ChatMessage";
import DeviceUser from "@/models/DeviceUser";
import Team from "@/models/Team";

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
        teamId,
        userId,
        messageType,
        limit = '50',
        offset = '0'
      } = req.query;

      const query: Record<string, unknown> = {};

      // If no specific team is requested, try to find the community team
      if (teamId && typeof teamId === 'string') {
        query.teamId = teamId;
      } else {
        // Try to find community team
        try {
          const communityTeam = await Team.findOne({ name: 'Community' });
          if (communityTeam) {
            query.teamId = communityTeam._id;
          }
        } catch (error) {
          console.error('Error finding community team:', error);
        }
      }

      if (userId && typeof userId === 'string') query.senderId = userId;
      if (messageType && typeof messageType === 'string') query.type = messageType;

      const messages = await ChatMessageModel.find(query)
        .populate('senderId', 'username')
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
        senderId,
        senderName,
        content,
        messageType = 'text',
        replyTo,
        attachments
      } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Ensure server has same multi-language additions as client
      // (keep small set; client-side contains a larger list)
      try {
        leo.add([
          'puto', 'mierda', 'joder', 'merde', 'putain', 'connard', 'scheiße', 'ficken', 'merda', 'cazzo',
          'caralho', 'хуй', 'пизда', 'كس', 'चूत', 'くたばれ', '他妈的'
        ]);
      } catch {
        // ignore if already added or any issue
      }

      // Sanitize message content on server-side before storing
      // Helper: normalize text (remove punctuation/nums and map common leet)
      const normalizeText = (s: string) => {
        return s
          .toLowerCase()
          .replace(/[@$]/g, m => (m === '@' ? 'a' : 's'))
          .replace(/[4305177]/g, ch => ({'4':'a','3':'e','0':'o','5':'s','1':'i','7':'t','2':'z'}[ch] || ch))
          .replace(/[^a-z\u0400-\u04FF\u0600-\u06FF\u00C0-\u017F\u4e00-\u9fff]+/g, '');
      };

      const containsProfanity = leo.check(content) || leo.check(normalizeText(content));
      let sanitizedContent = leo.clean(content);

      // If normalized check detects profanity but leo.clean didn't change much, block more aggressively
      if (leo.check(normalizeText(content)) && sanitizedContent === content) {
        // Replace entire message with a placeholder to prevent bypass via obfuscation
        sanitizedContent = "[message removed due to profanity]";
      }

      if (!senderName) {
        return res.status(400).json({ error: "Sender name is required" });
      }

      // Simplified user handling - just use senderName, senderId is optional
      let userId = null;
      let userName = senderName;

      // If senderId is provided, try to use it, otherwise create/find anonymous user
      if (senderId && senderId !== 'anonymous' && senderId !== 'user') {
        try {
          // Validate that senderId is a valid ObjectId
          if (mongoose.Types.ObjectId.isValid(senderId)) {
            userId = new mongoose.Types.ObjectId(senderId);
          }
        } catch {
          console.error('Invalid senderId provided:', senderId);
        }
      }

      // If no valid senderId, create or find anonymous user
      if (!userId) {
        try {
          let anonymousUser = await DeviceUser.findOne({ username: senderName });
          if (!anonymousUser) {
            anonymousUser = new DeviceUser({
              username: senderName,
              password: 'anonymous-password',
              deviceMacAddress: 'anonymous-device',
              deviceId: 'anonymous',
              loginTime: new Date(),
              lastActiveTime: new Date(),
              isActive: true,
              sessionId: 'anonymous-session',
              gameState: {
                unlockedApplications: [],
                skills: {},
                missions: {},
                gameStats: {
                  totalPlayTime: 0,
                  loginCount: 1,
                  lastLoginDate: new Date(),
                  achievementsUnlocked: []
                },
                settings: {
                  soundEnabled: true,
                  showHiddenFiles: false,
                  difficulty: 'normal'
                }
              }
            });
            await anonymousUser.save();
          }
          userId = anonymousUser._id;
          userName = anonymousUser.username;
        } catch (userError) {
          console.error('Error creating/finding user:', userError);
          return res.status(500).json({ error: "Failed to create user" });
        }
      }

      // Handle team - create or find default community team
      let teamId = null;
      try {
        let communityTeam = await Team.findOne({ name: 'Community' });
        if (!communityTeam) {
          communityTeam = new Team({
            name: 'Community',
            description: 'Default community team for chat',
            numberOfPlayers: 1,
            teamMembers: [],
            timer: {
              isActive: false,
              elapsedTime: 0,
              totalPausedTime: 0
            },
            wallet: {
              walletAddress: 'community-wallet-' + Date.now(),
              privateKey: 'community-private-key-' + Date.now(),
              bitcoinBalance: 0
            },
            stockPortfolio: [],
            purchasedMalware: []
          });
          await communityTeam.save();
        }
        teamId = communityTeam._id;
      } catch (teamError) {
        console.error('Error creating/finding community team:', teamError);
        return res.status(500).json({ error: "Failed to create team" });
      }

      const message = new ChatMessageModel({
        content: sanitizedContent,
        type: messageType,
        senderId: userId,
        senderName: userName,
        teamId: teamId,
        isPrivate: false,
        isSystemMessage: false,
        priority: 'normal',
        readBy: [],
        reactions: [],
        isDeleted: false,
        metadata: { sanitized: containsProfanity },
        replyTo,
        attachments: attachments || [],
      });

      await message.save();

      const populatedMessage = await ChatMessageModel.findById(message._id)
        .populate('senderId', 'username')
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
