'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface SystemLockAttackData {
  attackerTeam: string;
  stolenAmount: number;
  targetDeviceId: string;
}

export default function SystemLockProVictim() {
  const [victimEvent, setVictimEvent] = useState<SystemLockAttackData | null>(null);
  const [active, setActive] = useState(false);
  const { socket } = useSocket();

  const handleDismiss = useCallback(() => {
    setActive(false);
    setVictimEvent(null);
  }, []);

  const handleSystemLockAttack = useCallback((data: SystemLockAttackData) => {
    setVictimEvent(data);
    setActive(true);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('systemlock-pro-victim', handleSystemLockAttack);

    return () => {
      socket.off('systemlock-pro-victim', handleSystemLockAttack);
    };
  }, [socket, handleSystemLockAttack]);

  useEffect(() => {
    if (!victimEvent) {
      return;
    }

    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      setActive(false);
      setVictimEvent(null);
    }, 10000);

    return () => clearTimeout(timer);
  }, [victimEvent]);

  if (!active || !victimEvent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-red-900 border-2 border-red-500 rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="text-red-400 text-6xl mb-4">🔒</div>
        
        <h2 className="text-red-400 text-2xl font-bold mb-4">
          SYSTEM LOCKED
        </h2>
        
        <div className="text-red-300 mb-6">
          <p className="text-lg mb-2">Your device has been compromised!</p>
          <p className="text-sm mb-4">
            Attacker: <span className="text-red-400 font-mono">{victimEvent.attackerTeam}</span>
          </p>
          <p className="text-sm mb-2">
            Your device PIN has been cracked and all bitcoins have been stolen.
          </p>
          <p className="text-sm text-yellow-300">
            The game continues - secure your remaining devices!
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
