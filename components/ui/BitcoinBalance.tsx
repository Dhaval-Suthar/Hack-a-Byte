"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface BitcoinBalanceProps {
  balance: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

export default function BitcoinBalance({
  balance,
  showIcon = true,
  size = 'md',
  animated = true,
  className = ""
}: BitcoinBalanceProps) {
  const formatBalance = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(2);
  };

  const balanceComponent = (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <motion.div
          animate={animated ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-yellow-500"
        >
          ₿
        </motion.div>
      )}
      <span className={`font-mono font-bold text-yellow-400 ${sizeClasses[size]}`}>
        {formatBalance(balance)}
      </span>
      <span className="text-gray-400 text-xs">BTC</span>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {balanceComponent}
      </motion.div>
    );
  }

  return balanceComponent;
}

// Bitcoin transaction animation
export function BitcoinTransaction({
  amount,
  type = 'received',
  onComplete
}: {
  amount: number;
  type?: 'received' | 'sent';
  onComplete?: () => void;
}) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={onComplete}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
        type === 'received'
          ? 'bg-green-900/20 border-green-500/30 text-green-400'
          : 'bg-red-900/20 border-red-500/30 text-red-400'
      }`}
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5 }}
        className="text-yellow-500"
      >
        ₿
      </motion.div>
      <span className="font-mono font-bold">
        {type === 'received' ? '+' : '-'}{amount.toFixed(2)} BTC
      </span>
    </motion.div>
  );
}
