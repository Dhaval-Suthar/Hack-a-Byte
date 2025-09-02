import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import connectDb from '@/db/connectDb';
import ChatMessageModel from '@/models/ChatMessage';
import DeviceUser from '@/models/DeviceUser';
import { createChatMessage, getTeamMessages, getPrivateMessages, markMessageAsRead, deleteMessage, addReaction, getUnreadMessageCount } from '@/app/actions/chatMessage';

describe('Chat Message Actions', () => {
  beforeEach(async () => {
    await connectDb();
    // Clear collections before each test
    await ChatMessageModel.deleteMany({});
    await DeviceUser.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await ChatMessageModel.deleteMany({});
    await DeviceUser.deleteMany({});
  });

  describe('createChatMessage', () => {
    it('should create a chat message successfully', async () => {
      const messageData = {
        senderId: '507f1f77bcf86cd799439011',
        content: 'Hello team!',
        type: 'text' as const,
        teamId: '507f1f77bcf86cd799439012',
        isPrivate: false,
        priority: 'normal' as const,
      };

      const result = await createChatMessage(messageData);

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message?.content).toBe(messageData.content);
      expect(result.message?.type).toBe(messageData.type);
      expect(result.message?.isPrivate).toBe(false);
      expect(result.message?.readBy).toHaveLength(1);
    });

    it('should create a private message', async () => {
      const messageData = {
        senderId: '507f1f77bcf86cd799439011',
        content: 'Private message',
        type: 'text' as const,
        teamId: '507f1f77bcf86cd799439012',
        recipientIds: ['507f1f77bcf86cd799439013'],
        isPrivate: true,
        priority: 'normal' as const,
      };

      const result = await createChatMessage(messageData);

      expect(result.success).toBe(true);
      expect(result.message?.isPrivate).toBe(true);
      expect(result.message?.recipientIds).toEqual(['507f1f77bcf86cd799439013']);
    });

    it('should create system message with game data', async () => {
      const messageData = {
        senderId: '507f1f77bcf86cd799439011',
        content: 'Achievement unlocked!',
        type: 'achievement' as const,
        teamId: '507f1f77bcf86cd799439012',
        isPrivate: false,
        priority: 'high' as const,
        gameData: {
          achievementId: '507f1f77bcf86cd799439014',
          eventType: 'achievement_unlocked',
        },
      };

      const result = await createChatMessage(messageData);

      expect(result.success).toBe(true);
      expect(result.message?.type).toBe('achievement');
      expect(result.message?.gameData?.achievementId).toBe('507f1f77bcf86cd799439014');
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        senderId: '',
        content: '',
        type: 'text' as const,
        teamId: '507f1f77bcf86cd799439012',
        isPrivate: false,
        priority: 'normal' as const,
      };

      const result = await createChatMessage(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getTeamMessages', () => {
    let teamId: string;

    beforeEach(async () => {
      teamId = '507f1f77bcf86cd799439012';

      // Create test messages
      await ChatMessageModel.create([
        {
          senderId: '507f1f77bcf86cd799439011',
          content: 'First message',
          type: 'text',
          teamId,
          isPrivate: false,
          priority: 'normal',
          readBy: [],
          createdAt: new Date('2025-01-01'),
        },
        {
          senderId: '507f1f77bcf86cd799439013',
          content: 'Second message',
          type: 'text',
          teamId,
          isPrivate: false,
          priority: 'normal',
          readBy: [],
          createdAt: new Date('2025-01-02'),
        },
        {
          senderId: '507f1f77bcf86cd799439011',
          content: 'Private message',
          type: 'text',
          teamId,
          isPrivate: true,
          priority: 'normal',
          readBy: [],
          createdAt: new Date('2025-01-03'),
        },
      ]);
    });

    it('should return team messages in chronological order', async () => {
      const result = await getTeamMessages(teamId);

      expect(result.success).toBe(true);
      expect(result.messages).toHaveLength(3);
      expect(result.messages?.[0].content).toBe('First message'); // Chronological order
      expect(result.messages?.[1].content).toBe('Second message');
      expect(result.messages?.[2].content).toBe('Private message');
    });

    it('should limit results', async () => {
      const result = await getTeamMessages(teamId, 2);

      expect(result.success).toBe(true);
      expect(result.messages).toHaveLength(2);
    });
  });

  describe('getPrivateMessages', () => {
    let userId1: string;
    let userId2: string;
    let teamId: string;

    beforeEach(async () => {
      userId1 = '507f1f77bcf86cd799439011';
      userId2 = '507f1f77bcf86cd799439013';
      teamId = '507f1f77bcf86cd799439012';

      // Create private messages between two users
      await ChatMessageModel.create([
        {
          senderId: userId1,
          content: 'Hello from user 1',
          type: 'text',
          teamId,
          recipientIds: [userId2],
          isPrivate: true,
          priority: 'normal',
          readBy: [],
          createdAt: new Date('2025-01-01'),
        },
        {
          senderId: userId2,
          content: 'Hello from user 2',
          type: 'text',
          teamId,
          recipientIds: [userId1],
          isPrivate: true,
          priority: 'normal',
          readBy: [],
          createdAt: new Date('2025-01-02'),
        },
        {
          senderId: userId1,
          content: 'Public message',
          type: 'text',
          teamId,
          isPrivate: false,
          priority: 'normal',
          readBy: [],
          createdAt: new Date('2025-01-03'),
        },
      ]);
    });

    it('should return private messages between two users', async () => {
      const result = await getPrivateMessages(userId1, userId2);

      expect(result.success).toBe(true);
      expect(result.messages).toHaveLength(2);
      expect(result.messages?.[0].content).toBe('Hello from user 1');
      expect(result.messages?.[1].content).toBe('Hello from user 2');
    });
  });

  describe('markMessageAsRead', () => {
    let messageId: string;
    let userId: string;
    let senderId: string;

    beforeEach(async () => {
      senderId = '507f1f77bcf86cd799439011';
      userId = '507f1f77bcf86cd799439013';

      const message = await ChatMessageModel.create({
        senderId,
        content: 'Test message',
        type: 'text',
        teamId: '507f1f77bcf86cd799439012',
        recipientIds: [userId],
        isPrivate: true,
        priority: 'normal',
        readBy: [{ userId: senderId, readAt: new Date() }],
      });
      messageId = message._id.toString();
    });

    it('should mark message as read by recipient', async () => {
      const result = await markMessageAsRead(messageId, userId);

      expect(result.success).toBe(true);
      expect(result.message?.readBy).toHaveLength(2);

      const userReadEntry = result.message?.readBy.find((read: { userId: string }) =>
        read.userId === userId
      );
      expect(userReadEntry).toBeDefined();
    });

    it('should not mark as read if already read', async () => {
      // First mark as read
      await markMessageAsRead(messageId, userId);

      // Try to mark as read again
      const result = await markMessageAsRead(messageId, userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Already marked as read');
    });

    it('should fail for non-existent message', async () => {
      const fakeId = '507f1f77bcf86cd799439014';
      const result = await markMessageAsRead(fakeId, userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Message not found');
    });

    it('should fail for unauthorized user', async () => {
      const unauthorizedUserId = '507f1f77bcf86cd799439015';
      const result = await markMessageAsRead(messageId, unauthorizedUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });
  });

  describe('deleteMessage', () => {
    let messageId: string;
    let senderId: string;

    beforeEach(async () => {
      senderId = '507f1f77bcf86cd799439011';

      const message = await ChatMessageModel.create({
        senderId,
        content: 'Test message to delete',
        type: 'text',
        teamId: '507f1f77bcf86cd799439012',
        isPrivate: false,
        priority: 'normal',
        readBy: [],
      });
      messageId = message._id.toString();
    });

    it('should delete message by sender', async () => {
      const result = await deleteMessage(messageId, senderId);

      expect(result.success).toBe(true);

      // Verify message is marked as deleted
      const deletedMessage = await ChatMessageModel.findById(messageId);
      expect(deletedMessage?.isDeleted).toBe(true);
      expect(deletedMessage?.deletedBy).toBe(senderId);
    });

    it('should fail for non-sender user', async () => {
      const otherUserId = '507f1f77bcf86cd799439013';
      const result = await deleteMessage(messageId, otherUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });
  });

  describe('addReaction', () => {
    let messageId: string;
    let userId: string;

    beforeEach(async () => {
      userId = '507f1f77bcf86cd799439011';

      const message = await ChatMessageModel.create({
        senderId: userId,
        content: 'Test message for reaction',
        type: 'text',
        teamId: '507f1f77bcf86cd799439012',
        isPrivate: false,
        priority: 'normal',
        readBy: [],
        reactions: [],
      });
      messageId = message._id.toString();
    });

    it('should add reaction to message', async () => {
      const result = await addReaction(messageId, userId, '👍');

      expect(result.success).toBe(true);
      expect(result.message?.reactions).toHaveLength(1);
      expect(result.message?.reactions[0].emoji).toBe('👍');
      expect(result.message?.reactions[0].userId).toBe(userId);
    });

    it('should remove reaction if it already exists', async () => {
      // Add reaction
      await addReaction(messageId, userId, '👍');

      // Add same reaction again (should remove it)
      const result = await addReaction(messageId, userId, '👍');

      expect(result.success).toBe(true);
      expect(result.message?.reactions).toHaveLength(0);
    });

    it('should fail for non-existent user', async () => {
      const fakeUserId = '507f1f77bcf86cd799439014';
      const result = await addReaction(messageId, fakeUserId, '👍');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('getUnreadMessageCount', () => {
    let userId: string;
    let teamId: string;

    beforeEach(async () => {
      userId = '507f1f77bcf86cd799439011';
      teamId = '507f1f77bcf86cd799439012';

      // Create messages
      await ChatMessageModel.create([
        {
          senderId: '507f1f77bcf86cd799439013', // Other user
          content: 'Unread message 1',
          type: 'text',
          teamId,
          isPrivate: false,
          priority: 'normal',
          readBy: [],
        },
        {
          senderId: '507f1f77bcf86cd799439014', // Other user
          content: 'Unread message 2',
          type: 'text',
          teamId,
          isPrivate: false,
          priority: 'normal',
          readBy: [],
        },
        {
          senderId: userId, // Own message
          content: 'My own message',
          type: 'text',
          teamId,
          isPrivate: false,
          priority: 'normal',
          readBy: [],
        },
        {
          senderId: '507f1f77bcf86cd799439013', // Other user
          content: 'Already read message',
          type: 'text',
          teamId,
          isPrivate: false,
          priority: 'normal',
          readBy: [{ userId, readAt: new Date() }],
        },
      ]);
    });

    it('should return count of unread messages', async () => {
      const result = await getUnreadMessageCount(userId, teamId);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2); // Two unread messages from other users
    });
  });
});
