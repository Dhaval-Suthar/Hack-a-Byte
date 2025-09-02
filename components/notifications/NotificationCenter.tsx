"use client";

import React, { useEffect, useState } from "react";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notification";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'attack_alert' | 'defense_success' | 'achievement_unlocked' | 'tournament_update' | 'system_message';
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkAsRead: (id: string) => void;
}

function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-500 text-green-800';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'error': return 'bg-red-100 border-red-500 text-red-800';
      case 'achievement': return 'bg-purple-100 border-purple-500 text-purple-800';
      case 'tournament': return 'bg-blue-100 border-blue-500 text-blue-800';
      case 'system': return 'bg-gray-100 border-gray-500 text-gray-800';
      default: return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      case 'achievement': return '🏆';
      case 'tournament': return '🏅';
      case 'system': return 'ℹ';
      default: return '📢';
    }
  };

  return (
    <div className={`p-4 border-l-4 rounded-r-lg mb-3 transition-all ${
      notification.isRead ? 'bg-gray-50 opacity-75' : 'bg-white shadow-sm'
    } ${getTypeColor(notification.type)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-lg">{getTypeIcon(notification.type)}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{notification.title}</h4>
            <p className="text-gray-700 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        {!notification.isRead && (
          <button
            onClick={() => onMarkAsRead(notification._id)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // TODO: Get userId from authentication context
      const userId = 'placeholder-user-id';
      const result = await getUserNotifications(userId);
      if (result.success && result.notifications) {
        setNotifications(result.notifications as unknown as NotificationItem[]);
      } else {
        setError(result.error || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // TODO: Get userId from authentication context
      const userId = 'placeholder-user-id';
      const result = await markNotificationAsRead(notificationId, userId);
      if (result.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      } else {
        alert(result.error || 'Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      alert('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // TODO: Get userId from authentication context
      const userId = 'placeholder-user-id';
      const result = await markAllNotificationsAsRead(userId);
      if (result.success) {
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      } else {
        alert(result.error || 'Failed to mark all notifications as read');
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      alert('Failed to mark all notifications as read');
    }
  };

  const filteredNotifications = notifications.filter(notif =>
    filter === 'all' || !notif.isRead
  );

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadNotifications}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-gray-600 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
          </select>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 text-lg">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-gray-400 mt-2">
            {filter === 'unread'
              ? 'You\'ve read all your notifications!'
              : 'Notifications about tournaments, achievements, and system updates will appear here'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}
