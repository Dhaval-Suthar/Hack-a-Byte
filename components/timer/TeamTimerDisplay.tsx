'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface TeamTimerDisplayProps {
  teamId: string;
  className?: string;
}

export default function TeamTimerDisplay({ teamId, className = '' }: TeamTimerDisplayProps) {
  const { teamTimerStarted, teamTimerExpired, teamTimerStopped } = useSocket();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial timer state on mount
  useEffect(() => {
    const fetchTimerState = async () => {
      try {
        const response = await fetch(`/api/team/timer?teamId=${teamId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.autoOfflineTimer) {
            const timer = data.autoOfflineTimer;
            if (timer.isActive && timer.endTime) {
              setIsActive(true);
              setTimerEndTime(new Date(timer.endTime).getTime());
              setLastMessage('Timer restored from previous session');
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch timer state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (teamId) {
      fetchTimerState();
    }
  }, [teamId]);

  // Handle timer started events
  useEffect(() => {
    const latestStartEvent = teamTimerStarted
      .filter(event => event.teamId === teamId)
      .sort((a, b) => b.startTime - a.startTime)[0];

    if (latestStartEvent) {
      setTimerEndTime(latestStartEvent.endTime);
      setIsActive(true);
      setLastMessage(latestStartEvent.message);
      setShowNotification(true);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => setShowNotification(false), 5000);
    }
  }, [teamTimerStarted, teamId]);

  // Handle timer expired events
  useEffect(() => {
    const latestExpiredEvent = teamTimerExpired
      .filter(event => event.teamId === teamId)[0];

    if (latestExpiredEvent) {
      setIsActive(false);
      setTimeRemaining(0);
      setTimerEndTime(null);
      setLastMessage(latestExpiredEvent.message);
      setShowNotification(true);
      
      // Auto-hide notification after 10 seconds
      setTimeout(() => setShowNotification(false), 10000);
    }
  }, [teamTimerExpired, teamId]);

  // Handle timer stopped events
  useEffect(() => {
    const latestStoppedEvent = teamTimerStopped
      .filter(event => event.teamId === teamId)[0];

    if (latestStoppedEvent) {
      setIsActive(false);
      setTimeRemaining(null);
      setTimerEndTime(null);
      setLastMessage(latestStoppedEvent.message);
      setShowNotification(true);
      
      // Auto-hide notification after 8 seconds
      setTimeout(() => setShowNotification(false), 8000);
    }
  }, [teamTimerStopped, teamId]);

  // Update countdown timer
  useEffect(() => {
    if (!isActive || !timerEndTime) {
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, timerEndTime - now);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setIsActive(false);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isActive, timerEndTime]);

  // Format time remaining
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get warning level based on time remaining
  const getWarningLevel = (ms: number): 'normal' | 'warning' | 'critical' => {
    const minutes = ms / (1000 * 60);
    // For 1-hour timer: critical at ≤5 minutes, warning at ≤15 minutes
    if (minutes <= 5) return 'critical';  // ≤5 minutes
    if (minutes <= 15) return 'warning';  // ≤15 minutes
    return 'normal';
  };

  // Get timer color class based on warning level
  const getTimerColorClass = (ms: number): string => {
    const level = getWarningLevel(ms);
    switch (level) {
      case 'critical': return 'text-red-500 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-500 bg-orange-50 border-orange-200';
      default: return 'text-blue-500 bg-blue-50 border-blue-200';
    }
  };

  // Notification component
  const Notification = () => {
    if (!showNotification || !lastMessage) return null;

    const isExpired = teamTimerExpired.some(event => event.teamId === teamId);
    const isStopped = teamTimerStopped.some(event => event.teamId === teamId);

    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <div className={`p-4 rounded-lg border shadow-lg ${
          isExpired ? 'bg-red-50 border-red-200 text-red-700' :
          isStopped ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
          'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-lg">
              {isExpired ? '⏰' : isStopped ? '⚠️' : '✅'}
            </span>
            <div>
              <h4 className="font-medium text-sm">
                {isExpired ? 'Time Expired!' : 
                 isStopped ? 'Timer Stopped' : 
                 'Timer Started'}
              </h4>
              <p className="text-sm mt-1">{lastMessage}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <span>🔄</span>
        <span className="text-sm">Loading timer status...</span>
      </div>
    );
  }

  if (!isActive && timeRemaining === null) {
    return (
      <>
        <Notification />
        <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
          <span>🕒</span>
          <span className="text-sm">No active timer</span>
        </div>
      </>
    );
  }

  return (
    <>
      <Notification />
      <div className={`flex items-center gap-2 ${className}`}>
        {isActive && timeRemaining !== null ? (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getTimerColorClass(timeRemaining)}`}>
            <span>⏱️</span>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wide">Time Remaining</span>
              <span className="text-lg font-mono font-bold">
                {formatTime(timeRemaining)}
              </span>
            </div>
            {getWarningLevel(timeRemaining) === 'critical' && (
              <span className="animate-pulse">⚠️</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
            <span>❌</span>
            <span className="text-sm font-medium">Timer Expired</span>
          </div>
        )}
      </div>
    </>
  );
}