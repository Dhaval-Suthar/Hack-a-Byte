"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GameTimerProps {
  duration: number; // in seconds
  onTimeUp?: () => void;
  onWarning?: (remainingTime: number) => void;
  warningThreshold?: number; // in seconds
  paused?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

export default function GameTimer({
  duration,
  onTimeUp,
  onWarning,
  warningThreshold = 60,
  paused = false,
  size = 'md',
  showProgress = true,
  className = "",
  label = "Time Remaining"
}: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [hasWarned, setHasWarned] = useState(false);

  useEffect(() => {
    if (paused || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;

        // Trigger warning
        if (newTime <= warningThreshold && !hasWarned) {
          setHasWarned(true);
          onWarning?.(newTime);
        }

        // Time's up
        if (newTime <= 0) {
          onTimeUp?.();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, paused, hasWarned, warningThreshold, onTimeUp, onWarning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;
  const isWarning = timeLeft <= warningThreshold;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {label && (
        <span className="text-gray-400 text-sm font-medium">{label}</span>
      )}

      <motion.div
        animate={isWarning ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: isWarning ? Infinity : 0 }}
        className={`font-mono font-bold ${sizeClasses[size]} ${
          isWarning ? 'text-red-400' : 'text-cyber-primary'
        }`}
      >
        {formatTime(timeLeft)}
      </motion.div>

      {showProgress && (
        <div className="w-full max-w-32 bg-gray-800 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full transition-colors ${
              isWarning ? 'bg-red-500' : 'bg-cyber-primary'
            }`}
            initial={{ width: '100%' }}
            animate={{ width: `${100 - progress}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
}

// Bank device timer with special effects
export function BankDeviceTimer({
  duration,
  onTimeUp,
  className = ""
}: {
  duration: number;
  onTimeUp?: () => void;
  className?: string;
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 10) {
          setIsUrgent(true);
        }
        return Math.max(0, newTime);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg px-4 py-3 ${className}`}
    >
      <motion.div
        animate={isUrgent ? { rotate: [0, 10, -10, 0] } : { rotate: 0 }}
        transition={{ duration: 0.3, repeat: isUrgent ? Infinity : 0 }}
        className="text-yellow-500 text-2xl"
      >
        🏦
      </motion.div>

      <div className="flex flex-col">
        <span className="text-yellow-400 font-bold text-lg font-mono">
          {timeLeft}s
        </span>
        <span className="text-yellow-300 text-sm">
          Bank Device Available
        </span>
      </div>

      <motion.div
        animate={isUrgent ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
        className="w-3 h-3 bg-yellow-500 rounded-full"
      />
    </motion.div>
  );
}

// Countdown timer for events
export function EventCountdown({
  targetDate,
  label = "Event Starts In",
  className = ""
}: {
  targetDate: Date;
  label?: string;
  className?: string;
}) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className={`text-center ${className}`}>
      <h3 className="text-cyber-primary font-bold mb-4">{label}</h3>
      <div className="flex gap-4 justify-center">
        {[
          { value: timeLeft.days, label: 'Days' },
          { value: timeLeft.hours, label: 'Hours' },
          { value: timeLeft.minutes, label: 'Minutes' },
          { value: timeLeft.seconds, label: 'Seconds' }
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              className="bg-cyber-primary text-black font-bold text-2xl px-3 py-2 rounded-lg font-mono min-w-[60px] text-center"
            >
              {item.value.toString().padStart(2, '0')}
            </motion.div>
            <span className="text-gray-400 text-sm mt-1">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
