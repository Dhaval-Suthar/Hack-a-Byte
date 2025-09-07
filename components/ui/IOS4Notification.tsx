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
        className={`
          relative overflow-hidden cursor-pointer min-w-[320px] max-w-[400px]
          transition-all duration-300 ease-in-out
          ${isExiting ? 'transform -translate-y-10 opacity-0' : 'transform translate-y-0 opacity-100'}
        `}
        onClick={handleTap}
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.95) 100%)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Top highlight */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)'
          }}
        />
        
        {/* Content */}
        <div className="px-4 py-3">
          <div className="flex items-start space-x-3">
            {/* App icon with iOS 4 style */}
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-lg
              border border-gray-600 shadow-inner
              ${type === 'sms' 
                ? 'bg-gradient-to-b from-green-400 to-green-600' 
                : 'bg-gradient-to-b from-blue-400 to-blue-600'
              }
            `}>
              {type === 'sms' ? '💬' : '📧'}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* App name */}
              <div className="text-sm font-medium text-white/90 mb-0.5">
                {type === 'sms' ? 'Messages' : 'Mail'}
              </div>
              
              {/* Message preview */}
              <div className="text-sm text-white/80 leading-relaxed">
                <div className="line-clamp-2">
                  {message}
                </div>
              </div>
              
              {/* Time indicator */}
              <div className="text-xs text-white/60 mt-1">
                now
              </div>
            </div>
            
            {/* Close button */}
            <button 
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 text-xs transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Bottom subtle glow */}
        <div 
          className="absolute bottom-0 left-4 right-4 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
          }}
        />
      </div>
    </div>
  );
}

export default IOS4Notification;
