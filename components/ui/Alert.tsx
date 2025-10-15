"use client";

import { useState, useEffect } from 'react';

interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export default function Alert({
  message,
  type = 'info',
  isVisible,
  onDismiss,
  duration = 3000
}: AlertProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss, duration]);

  if (!isVisible || !show) return null;

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] max-w-sm w-full mx-4">
      <div className={`border rounded-lg p-4 shadow-lg ${getAlertStyles()}`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{message}</p>
          <button
            onClick={() => {
              setShow(false);
              onDismiss();
            }}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}