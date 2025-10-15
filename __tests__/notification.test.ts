import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import connectDb from '@/db/connectDb';
import NotificationModel from '@/models/Notification';
import { createNotification, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/app/actions/notification';

describe('Notification Actions', () => {
  beforeEach(async () => {
    await connectDb();
    // Clear notification collection before each test
    await NotificationModel.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await NotificationModel.deleteMany({});
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        recipient: '507f1f77bcf86cd799439011',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system_message' as const,
        priority: 'normal' as const,
        data: { testKey: 'testValue' },
      };

      const result = await createNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.notification).toBeDefined();
      expect(result.notification?.title).toBe(notificationData.title);
      expect(result.notification?.message).toBe(notificationData.message);
      expect(result.notification?.type).toBe(notificationData.type);
      expect(result.notification?.isRead).toBe(false);
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        recipient: '',
        title: '',
        message: 'This is a test notification',
        type: 'system_message' as const,
        priority: 'normal' as const,
      };

      const result = await createNotification(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getUserNotifications', () => {
    let userId: string;

    beforeEach(async () => {
      userId = '507f1f77bcf86cd799439011';

      // Create test notifications
      await NotificationModel.create([
        {
          recipient: userId,
          title: 'Notification 1',
          message: 'First notification',
          type: 'system_message',
          priority: 'normal',
          isRead: false,
          createdAt: new Date('2025-01-01'),
        },
        {
          recipient: userId,
          title: 'Notification 2',
          message: 'Second notification',
          type: 'attack_alert',
          priority: 'high',
          isRead: true,
          createdAt: new Date('2025-01-02'),
        },
        {
          recipient: '507f1f77bcf86cd799439012', // Different user
          title: 'Other User Notification',
          message: 'This should not appear',
          type: 'system_message',
          priority: 'normal',
          isRead: false,
          createdAt: new Date('2025-01-03'),
        },
      ]);
    });

    it('should return user notifications', async () => {
      const result = await getUserNotifications(userId);

      expect(result.success).toBe(true);
      expect(result.notifications).toHaveLength(2);
      expect(result.notifications?.[0].title).toBe('Notification 2'); // Most recent first
      expect(result.notifications?.[1].title).toBe('Notification 1');
    });

    it('should limit results', async () => {
      const result = await getUserNotifications(userId, 1);

      expect(result.success).toBe(true);
      expect(result.notifications).toHaveLength(1);
      expect(result.notifications?.[0].title).toBe('Notification 2');
    });
  });

  describe('markNotificationAsRead', () => {
    let notificationId: string;
    let userId: string;

    beforeEach(async () => {
      userId = '507f1f77bcf86cd799439011';
      const notification = await NotificationModel.create({
        recipient: userId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system_message',
        priority: 'normal',
        isRead: false,
      });
      notificationId = notification._id.toString();
    });

    it('should mark notification as read', async () => {
      const result = await markNotificationAsRead(notificationId, userId);

      expect(result.success).toBe(true);
      expect(result.notification?.isRead).toBe(true);

      // Verify in database
      const updatedNotification = await NotificationModel.findById(notificationId);
      expect(updatedNotification?.isRead).toBe(true);
    });

    it('should fail for non-existent notification', async () => {
      const fakeId = '507f1f77bcf86cd799439013';
      const result = await markNotificationAsRead(fakeId, userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Notification not found');
    });
  });

  describe('markAllNotificationsAsRead', () => {
    let userId: string;

    beforeEach(async () => {
      userId = '507f1f77bcf86cd799439011';

      // Create test notifications
      await NotificationModel.create([
        {
          recipient: userId,
          title: 'Notification 1',
          message: 'First notification',
          type: 'system_message',
          priority: 'normal',
          isRead: false,
        },
        {
          recipient: userId,
          title: 'Notification 2',
          message: 'Second notification',
          type: 'attack_alert',
          priority: 'high',
          isRead: false,
        },
      ]);
    });

    it('should mark all user notifications as read', async () => {
      const result = await markAllNotificationsAsRead(userId);

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);

      // Verify in database
      const notifications = await NotificationModel.find({ recipient: userId });
      expect(notifications.every(n => n.isRead)).toBe(true);
    });
  });

  describe('deleteNotification', () => {
    let notificationId: string;
    let userId: string;

    beforeEach(async () => {
      userId = '507f1f77bcf86cd799439011';
      const notification = await NotificationModel.create({
        recipient: userId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system_message',
        priority: 'normal',
        isRead: false,
      });
      notificationId = notification._id.toString();
    });

    it('should delete notification successfully', async () => {
      const result = await deleteNotification(notificationId, userId);

      expect(result.success).toBe(true);

      // Verify deletion
      const deletedNotification = await NotificationModel.findById(notificationId);
      expect(deletedNotification).toBeNull();
    });

    it('should fail for non-existent notification', async () => {
      const fakeId = '507f1f77bcf86cd799439013';
      const result = await deleteNotification(fakeId, userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Notification not found');
    });
  });
});
