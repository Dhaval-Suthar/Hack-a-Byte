'use client';

import React, { useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { getPlayspaceId } from '@/lib/playspace-utils';

import { User } from '@/types/devices';

interface AttackSimulatorProps {
  user?: User | null;
}

export const AttackSimulator: React.FC<AttackSimulatorProps> = ({ user }) => {
  const { sendMalwareAttack, triggerAttackEffect, isConnected } = useSocket();
  const [targetInfo, setTargetInfo] = useState('192.168.1.100');
  const [malwareType, setMalwareType] = useState<'virus' | 'worm' | 'ransomware'>('virus');

  const simulateAttack = () => {
    const playspaceId = getPlayspaceId();
    if (!playspaceId || !isConnected) {
      alert('Not connected to attack network');
      return;
    }

    // Send malware attack
    sendMalwareAttack({
      attackerPlayspaceId: playspaceId,
      targetInfo,
      malwareType,
      malwareId: `${malwareType}-test-${Date.now()}`,
      attackerName: user?.username || 'Test Attacker',
    });

    // Trigger attack effect
    const effectSeverity = malwareType === 'ransomware' ? 'critical' :
                         malwareType === 'worm' ? 'high' :
                         malwareType === 'virus' ? 'medium' : 'low';

    const effectMessage = malwareType === 'ransomware' ? 'RANSOMWARE DETECTED - SYSTEM LOCKED' :
                         malwareType === 'worm' ? 'NETWORK INTRUSION DETECTED' :
                         malwareType === 'virus' ? 'MALWARE INFECTION DETECTED' : 'SECURITY ALERT';

    triggerAttackEffect({
      playspaceId,
      effect: effectMessage,
      severity: effectSeverity,
      duration: malwareType === 'ransomware' ? 15000 : 10000,
    });

    alert(`Attack simulated: ${malwareType.toUpperCase()} deployed to ${targetInfo}`);
  };

  if (!isConnected) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded">
        <p className="text-red-700">⚠️ Not connected to attack network</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded">
      <h3 className="text-lg font-bold mb-4">🧪 Attack Simulator</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Target:</label>
          <input
            type="text"
            value={targetInfo}
            onChange={(e) => setTargetInfo(e.target.value)}
            placeholder="192.168.1.100 or target-mac"
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Malware Type:</label>
          <select
            value={malwareType}
            onChange={(e) => setMalwareType(e.target.value as 'virus' | 'worm' | 'ransomware')}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="virus">🦠 Virus</option>
            <option value="worm">🕷️ Worm</option>
            <option value="ransomware">🔒 Ransomware</option>
          </select>
        </div>

        <button
          onClick={simulateAttack}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
        >
          🚀 Launch Attack
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-600">
        <p>Status: 🟢 Connected to attack network</p>
        <p>This will broadcast attacks to all devices in your playspace</p>
      </div>
    </div>
  );
};
