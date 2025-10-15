'use client';

import React, { useEffect, useState } from 'react';
import { useSocket, AttackData } from '@/hooks/useSocket';

interface AttackReceiverProps {
  onAttackReceived?: (attack: AttackData) => void;
}

export const AttackReceiver: React.FC<AttackReceiverProps> = ({ onAttackReceived }) => {
  const { incomingAttacks, isConnected } = useSocket();
  const [visibleAttacks, setVisibleAttacks] = useState<AttackData[]>([]);

  useEffect(() => {
    if (incomingAttacks.length > 0) {
      const latestAttack = incomingAttacks[incomingAttacks.length - 1];
      setVisibleAttacks(prev => [...prev, latestAttack]);

      // Notify parent component
      onAttackReceived?.(latestAttack);

      // Auto-remove after 8 seconds
      setTimeout(() => {
        setVisibleAttacks(prev => prev.filter(attack => attack.timestamp !== latestAttack.timestamp));
      }, 8000);
    }
  }, [incomingAttacks, onAttackReceived]);

  if (!isConnected || visibleAttacks.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] space-y-2">
      {visibleAttacks.map((attack) => (
        <div
          key={attack.timestamp}
          className="bg-red-600/95 backdrop-blur-sm rounded-lg p-4 border border-red-500 shadow-2xl animate-pulse"
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl animate-bounce">⚠️</div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-bold">INCOMING ATTACK!</div>
              <div className="text-red-200 text-xs">
                {attack.attackerName} deployed {attack.malwareType.toUpperCase()}
              </div>
              <div className="text-red-300 text-xs truncate">
                Target: {attack.targetInfo}
              </div>
            </div>
            <div className="text-right">
              <div className="text-white text-lg font-mono">🚨</div>
              <div className="text-red-200 text-xs">DEFEND!</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
