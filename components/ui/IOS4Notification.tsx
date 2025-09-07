"use client";

import { useState, useEffect, useCallback } from 'react';

interface IOS4NotificationProps {
  message: string;
  type: 'email' | 'sms';
  isVisible: boolean;
  onDismiss: () => void;
  onOpen?: () => void;
}

function IOS4Notification({
  message,
  type,
  isVisible: visible,
  onDismiss,
  onOpen
}: IOS4NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  }, [onDismiss]);

  const handleTap = useCallback(() => {
    onOpen?.();
    handleDismiss();
  }, [onOpen, handleDismiss]);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      setIsExiting(false);
      const timer = setTimeout(handleDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, handleDismiss]);

  if (!visible || !isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[70]">
      <div
        className={`bg-black bg-opacity-90 text-white rounded-lg shadow-lg px-4 py-3 min-w-[300px] max-w-[400px] cursor-pointer transition-all duration-300 ease-in-out ${isExiting ? 'transform -translate-y-10 opacity-0' : 'transform translate-y-0 opacity-100'}`}
        onClick={handleTap}
      >
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{type === 'sms' ? '💬' : '📧'}</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-200">{type === 'sms' ? 'New Message' : 'New Mail'}</div>
            <div className="text-sm text-white mt-1">{message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IOS4Notification;
