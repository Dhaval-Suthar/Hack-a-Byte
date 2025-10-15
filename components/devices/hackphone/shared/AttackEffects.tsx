'use client';

import React, { useEffect, useState } from 'react';
import { useSocket, AttackEffect } from '@/hooks/useSocket';

interface AttackEffectsProps {
  onEffectTriggered?: (effect: AttackEffect) => void;
}

export const AttackEffects: React.FC<AttackEffectsProps> = ({ onEffectTriggered }) => {
  const { globalEffects } = useSocket();
  const [activeEffects, setActiveEffects] = useState<AttackEffect[]>([]);

  useEffect(() => {
    if (globalEffects.length > 0) {
      const latestEffect = globalEffects[globalEffects.length - 1];
      setActiveEffects(prev => [...prev, latestEffect]);

      // Notify parent component
      onEffectTriggered?.(latestEffect);

      // Auto-remove after duration
      setTimeout(() => {
        setActiveEffects(prev => prev.filter(effect => effect.timestamp !== latestEffect.timestamp));
      }, latestEffect.duration || 10000);
    }
  }, [globalEffects, onEffectTriggered]);

  if (activeEffects.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      {activeEffects.map((effect) => (
        <div
          key={effect.timestamp}
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            effect.severity === 'critical' ? 'bg-red-600/30 animate-pulse' :
            effect.severity === 'high' ? 'bg-orange-600/25 animate-pulse' :
            effect.severity === 'medium' ? 'bg-yellow-600/20 animate-pulse' :
            'bg-blue-600/15 animate-pulse'
          }`}
        >
          <div className="text-center">
            <div className={`text-4xl mb-2 ${
              effect.severity === 'critical' ? 'animate-bounce' :
              effect.severity === 'high' ? 'animate-pulse' :
              'animate-pulse'
            }`}>
              {effect.severity === 'critical' ? '🚨' :
               effect.severity === 'high' ? '⚠️' :
               effect.severity === 'medium' ? '🔔' : 'ℹ️'}
            </div>
            <div className={`text-white text-lg font-bold ${
              effect.severity === 'critical' ? 'text-red-200' :
              effect.severity === 'high' ? 'text-orange-200' :
              effect.severity === 'medium' ? 'text-yellow-200' :
              'text-blue-200'
            }`}>
              {effect.effect.toUpperCase()}
            </div>
            <div className="text-white/80 text-sm mt-1">
              {effect.severity === 'critical' ? 'CRITICAL SYSTEM ALERT' :
               effect.severity === 'high' ? 'HIGH PRIORITY ALERT' :
               effect.severity === 'medium' ? 'SYSTEM WARNING' :
               'SYSTEM NOTICE'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
