'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppContainer, AppHeader } from '../shared/AppContainer';
import { useSocket } from '@/hooks/useSocket';
import { getPlayspaceId } from '@/lib/playspace-utils';

const POLL_INTERVAL = 500; // Faster polling for better responsiveness

interface StealthViralStatus {
  active: boolean;
  clicks: number;
  clicksRequired: number;
  coveragePercent: number;
  progressPercent: number;
  defeated: boolean;
  message: string;
}

const DefenderStealthViral: React.FC = () => {
  const playspaceId = getPlayspaceId();
  const targetKey = playspaceId || 'local-test';
  const [status, setStatus] = useState<StealthViralStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [virusSpread, setVirusSpread] = useState(0);
  const [gameMessage, setGameMessage] = useState('');
  
  const { stealthSpawns, stealthProgress, stealthDefeated } = useSocket();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/attack/stealth-viral?targetKey=${targetKey}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Unknown error');
        setStatus(null);
        if (data.virusWon) {
          setGameMessage('💀 SYSTEM COMPROMISED - StealthViral has fully infected the device!');
          setVirusSpread(100);
        }
        return;
      }
      setError(null);
      setStatus(data);
      setVirusSpread(data.coveragePercent || 0);
      if (data.message) {
        setGameMessage(data.message);
      }
    } catch {
      setError('Network error');
    }
  }, [targetKey]);

  // Kick off faster polling for real-time experience
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Listen for real-time stealth spawn events
  useEffect(() => {
    if (stealthSpawns.length > 0) {
      const latest = stealthSpawns.filter(s => s.targetKey === targetKey).slice(-1)[0];
      if (latest) {
        fetchStatus();
        setGameMessage('🦠 StealthViral detected! Click quickly to neutralize!');
        setVirusSpread(0);
      }
    }
  }, [stealthSpawns, targetKey, fetchStatus]);

  // Enhanced realtime progress with visual updates
  useEffect(() => {
    if (stealthProgress.length > 0) {
      const latest = stealthProgress.filter(p => p.targetKey === targetKey).slice(-1)[0];
      if (latest && status) {
        setStatus(prev => prev ? {
          ...prev,
          clicks: latest.clicks,
          clicksRequired: latest.clicksRequired,
          coveragePercent: latest.coveragePercent,
          progressPercent: latest.progressPercent,
          message: latest.message
        } : prev);
        setVirusSpread(latest.coveragePercent || 0);
        if (latest.message) {
          setGameMessage(latest.message);
        }
      }
    }
  }, [stealthProgress, targetKey, status]);

  // Realtime defeat with celebration
  useEffect(() => {
    if (stealthDefeated.length > 0) {
      const latest = stealthDefeated.filter(d => d.targetKey === targetKey).slice(-1)[0];
      if (latest && status) {
        setStatus(prev => prev ? {
          ...prev,
          defeated: true
        } : prev);
        setGameMessage('🛡️ SUCCESS! StealthViral has been neutralized!');
        setVirusSpread(0);
        // Clear after a few seconds
        setTimeout(() => {
          setGameMessage('');
          setStatus(null);
        }, 3000);
      }
    }
  }, [stealthDefeated, targetKey, status]);

  const sendClick = async () => {
    if (!status || status.defeated) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/attack/stealth-viral?targetKey=${targetKey}`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Action failed');
        if (data.virusWon) {
          setGameMessage('💀 TOO LATE! StealthViral has taken control!');
          setVirusSpread(100);
        }
      } else {
        setStatus(prev => ({ ...prev || {}, ...data }));
        setVirusSpread(data.coveragePercent || 0);
        if (data.message) {
          setGameMessage(data.message);
        }
        if (data.defeated) {
          setGameMessage('🛡️ StealthViral neutralized successfully!');
          setTimeout(() => fetchStatus(), 500);
        }
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const progressPct = status && status.clicksRequired ? 
    Math.min(100, Math.round((status.clicks || 0) / status.clicksRequired * 100)) : 0;

  const isActive = status?.active && !status.defeated;

  return (
    <AppContainer backgroundColor="bg-purple-950">
      <AppHeader title="StealthViral Defense" />
      <div className="flex-1 p-4 space-y-4 text-white overflow-y-auto">
        <div className="text-xs text-gray-400">
          Click rapidly to neutralize the virus before it spreads across your system!
        </div>

        {gameMessage && (
          <div className={`p-3 rounded-lg border text-center font-bold animate-pulse ${
            gameMessage.includes('💀') || gameMessage.includes('TOO LATE') ? 
            'bg-red-900/30 border-red-500 text-red-300' :
            gameMessage.includes('🛡️') || gameMessage.includes('SUCCESS') ?
            'bg-green-900/30 border-green-500 text-green-300' :
            'bg-yellow-900/30 border-yellow-500 text-yellow-300'
          }`}>
            {gameMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
            Error: {error}
          </div>
        )}

        {isActive && (
          <div className="space-y-4">
            {/* Virus Spread Visualization */}
            <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">Virus Coverage</span>
                <span className="text-lg font-bold text-red-400">{Math.round(virusSpread)}%</span>
              </div>
              <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    virusSpread > 70 ? 'bg-red-500 animate-pulse' : 
                    virusSpread > 40 ? 'bg-orange-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${virusSpread}%` }}
                />
              </div>
            </div>

            {/* Click Progress */}
            <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">Neutralization Progress</span>
                <span className="text-sm text-gray-300">{status.clicks}/{status.clicksRequired}</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Attack Button */}
            <button
              disabled={loading || !!status.defeated}
              onClick={sendClick}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                status.defeated ? 'bg-green-600 text-white' : 
                isActive ? 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white shadow-lg transform active:scale-95' : 
                'bg-gray-600 text-gray-300'
              } disabled:opacity-50`}
            >
              {status.defeated ? '✅ Neutralized' : loading ? 'Processing...' : 'NEUTRALIZE VIRUS'}
            </button>

            {/* Status Indicator */}
            <div className="text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                virusSpread > 70 ? 'bg-red-600 text-white animate-pulse' : 
                virusSpread > 40 ? 'bg-orange-500 text-white' : 
                'bg-yellow-500 text-black'
              }`}>
                {virusSpread > 70 ? '🚨 CRITICAL' : 
                 virusSpread > 40 ? '⚠️ HIGH RISK' : 
                 '🔍 DETECTING'}
              </span>
            </div>
          </div>
        )}

        {!isActive && !error && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-4xl mb-4">🛡️</div>
            <div className="text-sm text-gray-300 mb-2">System Protected</div>
            <div className="text-xs text-gray-400">No active StealthViral infection detected.</div>
          </div>
        )}
      </div>
    </AppContainer>
  );
};

export default DefenderStealthViral;
