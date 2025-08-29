"use client";

import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'bank' | 'attack' | 'defense';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

const notificationStyles = {
  success: {
    bg: 'bg-green-900/90',
    border: 'border-green-500',
    icon: '✅',
    text: 'text-green-100'
  },
  error: {
    bg: 'bg-red-900/90',
    border: 'border-red-500',
    icon: '❌',
    text: 'text-red-100'
  },
  warning: {
    bg: 'bg-yellow-900/90',
    border: 'border-yellow-500',
    icon: '⚠️',
    text: 'text-yellow-100'
  },
  info: {
    bg: 'bg-blue-900/90',
    border: 'border-blue-500',
    icon: 'ℹ️',
    text: 'text-blue-100'
  },
  bank: {
    bg: 'bg-yellow-900/90',
    border: 'border-yellow-500',
    icon: '🏦',
    text: 'text-yellow-100'
  },
  attack: {
    bg: 'bg-red-900/90',
    border: 'border-red-500',
    icon: '⚔️',
    text: 'text-red-100'
  },
  defense: {
    bg: 'bg-blue-900/90',
    border: 'border-blue-500',
    icon: '🛡️',
    text: 'text-blue-100'
  }
};

function NotificationItem({ notification, onRemove }: {
  notification: Notification;
  onRemove: (id: string) => void;
}) {
  const style = notificationStyles[notification.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className={`relative ${style.bg} border-l-4 ${style.border} p-4 rounded-lg shadow-lg max-w-sm`}
    >
      <div className="flex items-start gap-3">
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-2xl flex-shrink-0"
        >
          {style.icon}
        </motion.span>

        <div className="flex-1 min-w-0">
          <h4 className={`font-bold ${style.text} text-sm`}>
            {notification.title}
          </h4>
          {notification.message && (
            <p className={`text-sm mt-1 ${style.text} opacity-90`}>
              {notification.message}
            </p>
          )}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
            >
              {notification.action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => onRemove(notification.id)}
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Quick notification helpers
export function useNotificationHelpers() {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message?: string) =>
      addNotification({ type: 'success', title, message }),

    error: (title: string, message?: string) =>
      addNotification({ type: 'error', title, message }),

    warning: (title: string, message?: string) =>
      addNotification({ type: 'warning', title, message }),

    info: (title: string, message?: string) =>
      addNotification({ type: 'info', title, message }),

    bank: (title: string, message?: string) =>
      addNotification({ type: 'bank', title, message, duration: 10000 }),

    attack: (title: string, message?: string) =>
      addNotification({ type: 'attack', title, message, duration: 7000 }),

    defense: (title: string, message?: string) =>
      addNotification({ type: 'defense', title, message, duration: 7000 })
  };
}

// Bank device alert component
export function BankDeviceAlert({
  isVisible,
  onDismiss
}: {
  isVisible: boolean;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="bg-yellow-900/95 border-2 border-yellow-500 rounded-lg p-6 max-w-md mx-4"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🏦
              </motion.div>
              <h2 className="text-yellow-400 font-bold text-xl mb-2">
                BANK DEVICE ONLINE!
              </h2>
              <p className="text-yellow-200 mb-4">
                A high-value bank device has appeared! Massive bitcoin rewards available for the next 60 seconds.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDismiss}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-6 py-2 rounded-lg transition-colors"
              >
                START HACKING!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
