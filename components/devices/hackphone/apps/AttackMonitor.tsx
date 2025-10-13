'use client';

import React, { useState, useEffect } from 'react';
import { AppContainer, AppHeader } from '../shared/AppContainer';
import { useSocket } from '@/hooks/useSocket';

interface AttackProgress {
  id: string;
  virusType: string;
  targetKey: string;
  status: 'deploying' | 'active' | 'success' | 'failed';
  progress: number;
  message: string;
  timestamp: number;
}

const AttackMonitor: React.FC = () => {
  const { 
    stealthSpawns, 
    stealthProgress, 
    stealthDefeated,
    sysTrojanSuccesses,
    sysTrojanFailures,
    dataMinerExfils
  } = useSocket();
  
  const [activeAttacks, setActiveAttacks] = useState<AttackProgress[]>([]);

  // Track StealthViral attacks
  useEffect(() => {
    stealthSpawns.forEach(spawn => {
      const attack: AttackProgress = {
        id: `stealth-${spawn.targetKey}-${spawn.ts}`,
        virusType: 'StealthViral',
        targetKey: spawn.targetKey,
        status: 'active',
        progress: 0,
        message: `Deployed on ${spawn.targetKey} - Awaiting defender response`,
        timestamp: spawn.ts
      };
      
      setActiveAttacks(prev => {
        if (prev.find(a => a.id === attack.id)) return prev;
        return [...prev, attack];
      });
    });
  }, [stealthSpawns]);

  // Update StealthViral progress
  useEffect(() => {
    stealthProgress.forEach(progress => {
      setActiveAttacks(prev => 
        prev.map(attack => 
          attack.virusType === 'StealthViral' && attack.targetKey === progress.targetKey
            ? {
                ...attack,
                progress: progress.coveragePercent,
                message: `${progress.clicks}/${progress.clicksRequired} clicks by defender - ${progress.message}`
              }
            : attack
        )
      );
    });
  }, [stealthProgress]);

  // Handle StealthViral defeat
  useEffect(() => {
    stealthDefeated.forEach(defeat => {
      setActiveAttacks(prev => 
        prev.map(attack => 
          attack.virusType === 'StealthViral' && attack.targetKey === defeat.targetKey
            ? {
                ...attack,
                status: 'failed',
                progress: 0,
                message: 'Neutralized by defender - Attack failed'
              }
            : attack
        )
      );
    });
  }, [stealthDefeated]);

  // Handle SysTrojan results
  useEffect(() => {
    sysTrojanSuccesses.forEach(result => {
      const attack: AttackProgress = {
        id: `systrojan-${result.targetDeviceId}-${result.ts || Date.now()}`,
        virusType: 'SysTrojan Pro',
        targetKey: result.targetDeviceId,
        status: 'success',
        progress: 100,
        message: `Device destroyed! Siphoned ${result.siphon || 0} BTC`,
        timestamp: result.ts || Date.now()
      };
      
      setActiveAttacks(prev => {
        if (prev.find(a => a.id === attack.id)) return prev;
        return [...prev, attack];
      });
    });

    sysTrojanFailures.forEach(result => {
      const attack: AttackProgress = {
        id: `systrojan-${result.targetDeviceId}-${result.ts || Date.now()}`,
        virusType: 'SysTrojan Pro',
        targetKey: result.targetDeviceId,
        status: 'failed',
        progress: 0,
        message: 'Attack failed - Target security too strong',
        timestamp: result.ts || Date.now()
      };
      
      setActiveAttacks(prev => {
        if (prev.find(a => a.id === attack.id)) return prev;
        return [...prev, attack];
      });
    });
  }, [sysTrojanSuccesses, sysTrojanFailures]);

  // Handle DataMiner results
  useEffect(() => {
    dataMinerExfils.forEach(exfil => {
      const attack: AttackProgress = {
        id: `dataminer-${exfil.targetTeamId}-${exfil.ts}`,
        virusType: 'DataMiner X',
        targetKey: exfil.targetTeamId,
        status: 'success',
        progress: 100,
        message: `Private key successfully extracted from target`,
        timestamp: exfil.ts
      };
      
      setActiveAttacks(prev => {
        if (prev.find(a => a.id === attack.id)) return prev;
        return [...prev, attack];
      });
    });
  }, [dataMinerExfils]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deploying': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500';
      case 'active': return 'text-blue-400 bg-blue-900/30 border-blue-500';
      case 'success': return 'text-green-400 bg-green-900/30 border-green-500';
      case 'failed': return 'text-red-400 bg-red-900/30 border-red-500';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deploying': return '🚀';
      case 'active': return '⚡';
      case 'success': return '✅';
      case 'failed': return '❌';
      default: return '🔍';
    }
  };

  const getVirusIcon = (virusType: string) => {
    switch (virusType) {
      case 'StealthViral': return '🔍';
      case 'SysTrojan Pro': return '💥';
      case 'DataMiner X': return '⛏️';
      default: return '🦠';
    }
  };

  return (
    <AppContainer backgroundColor="bg-purple-950">
      <AppHeader title="Attack Monitor" />
      <div className="flex-1 p-4 space-y-4 text-white overflow-y-auto">
        <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700">
          <div className="text-sm text-gray-300 mb-2">
            Real-time monitoring of active virus attacks.
          </div>
          <div className="text-xs text-gray-400">
            Active Attacks: <span className="text-purple-400 font-bold">
              {activeAttacks.filter(a => a.status === 'active' || a.status === 'deploying').length}
            </span>
          </div>
        </div>

        {activeAttacks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-4xl mb-4">📡</div>
            <div className="text-sm text-gray-300 mb-2">No Active Attacks</div>
            <div className="text-xs text-gray-400">Deploy viruses to see real-time attack progress.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAttacks
              .sort((a, b) => b.timestamp - a.timestamp)
              .map(attack => (
                <div
                  key={attack.id}
                  className={`p-3 rounded-lg border transition-all ${getStatusColor(attack.status)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getVirusIcon(attack.virusType)}</span>
                      <div>
                        <div className="font-semibold text-sm">{attack.virusType}</div>
                        <div className="text-xs text-gray-400">Target: {attack.targetKey}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(attack.status)}</span>
                      <span className="text-xs font-semibold uppercase">{attack.status}</span>
                    </div>
                  </div>

                  {/* Progress bar for active attacks */}
                  {(attack.status === 'active' || attack.status === 'deploying') && (
                    <div className="mb-2">
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            attack.virusType === 'StealthViral' 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                              : 'bg-gradient-to-r from-yellow-500 to-red-500'
                          }`}
                          style={{ width: `${attack.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Progress: {Math.round(attack.progress)}%
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-300 mb-2">
                    {attack.message}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(attack.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
          <div className="mb-2 font-semibold">Attack Status Guide:</div>
          <div className="space-y-1">
            <div>• <span className="text-blue-400">StealthViral</span>: Progress shows defender&apos;s neutralization attempts</div>
            <div>• <span className="text-red-400">SysTrojan Pro</span>: Instant result - success destroys target device</div>
            <div>• <span className="text-green-400">DataMiner X</span>: Silent extraction - defender cannot prevent</div>
          </div>
        </div>
      </div>
    </AppContainer>
  );
};

export default AttackMonitor;
