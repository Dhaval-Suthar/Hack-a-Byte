"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppContainer, AppHeader } from '../shared/AppContainer';
import { getPlayspaceId } from '@/lib/playspace-utils';
import { useSocket } from '@/hooks/useSocket';

interface StatusResp { success: boolean; clicks?: number; clicksRequired?: number; remainingMs?: number; defeated?: boolean; error?: string; }

const POLL_INTERVAL = 650; // ms

const DefenderStealthViral: React.FC = () => {
  const playspaceId = getPlayspaceId();
  const targetKey = playspaceId || 'local-test';
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const { stealthSpawns, stealthProgress, stealthDefeated } = useSocket();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/attack/stealth-viral?targetKey=${targetKey}`);
      const data: StatusResp = await res.json();
      if (!data.success) {
        setError(data.error || 'Unknown error');
        setStatus(null);
        return;
      }
      setError(null);
      setStatus(data);
    } catch {
      setError('Network error');
    }
  }, [targetKey]);

  // Kick off slow polling as fallback (realtime reduces need for aggressive polling)
  useEffect(() => {
    fetchStatus();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchStatus, POLL_INTERVAL * 4);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchStatus]);

  // React to realtime spawn
  useEffect(() => {
    const latest = stealthSpawns.filter(s => s.targetKey === targetKey).slice(-1)[0];
    if (latest) fetchStatus();
  }, [stealthSpawns, targetKey, fetchStatus]);

  // Realtime progress
  useEffect(() => {
    const latest = stealthProgress.filter(p => p.targetKey === targetKey).slice(-1)[0];
    if (latest && status) {
      setStatus(prev => prev ? { ...prev, clicks: latest.clicks, clicksRequired: latest.clicksRequired } : prev);
    }
  }, [stealthProgress, targetKey, status]);

  // Realtime defeat
  useEffect(() => {
    const latest = stealthDefeated.filter(d => d.targetKey === targetKey).slice(-1)[0];
    if (latest && status) {
      setStatus(prev => prev ? { ...prev, defeated: true } : prev);
    }
  }, [stealthDefeated, targetKey, status]);

  const sendClick = async () => {
    if (!targetKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/attack/stealth-viral?targetKey=${targetKey}`, { method: 'PUT' });
      const data: StatusResp = await res.json();
      if (!data.success) {
        setError(data.error || 'Action failed');
      } else {
        setStatus(prev => ({ ...(prev||{}), ...data }));
        if (data.defeated) {
          setTimeout(() => fetchStatus(), 500);
        }
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const progressPct = status && status.clicksRequired ? Math.min(100, Math.round(((status.clicks||0)/status.clicksRequired)*100)) : 0;
  const remainingSec = status?.remainingMs ? (status.remainingMs/1000).toFixed(1) : '—';

  return (
    <AppContainer backgroundColor="bg-black">
      <AppHeader title="StealthViral Defense" />
      <div className="p-4 text-gray-100 space-y-4 text-sm">
        <p className="text-xs text-gray-400">Tap neutralize rapidly before the virus completes its payload. Instance bound to your playspace key.</p>
        {error && <div className="bg-red-800/40 border border-red-600 text-red-200 px-3 py-2 rounded-md text-xs">{error}</div>}
        {status ? (
          <>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono"><span>Clicks</span><span>{status.clicks}/{status.clicksRequired}</span></div>
              <div className="w-full h-3 bg-gray-700 rounded overflow-hidden">
                <div className={`h-full transition-all duration-200 ${progressPct>70? 'bg-green-500':'bg-yellow-400'}`} style={{ width: progressPct+'%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>Time Left</span><span>{remainingSec}s</span></div>
            </div>
            <button disabled={loading || !!status.defeated} onClick={sendClick} className="w-full py-3 rounded-lg font-semibold bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600">
              {status.defeated? '✅ Neutralized' : loading? 'Processing...' : 'NEUTRALIZE'}
            </button>
          </>
        ) : (
          <div className="text-xs text-gray-400">No active stealth viral infection detected. Await alert.</div>
        )}
        <div className="pt-4 text-[10px] text-gray-500">Defense module auto-polls every {Math.round(POLL_INTERVAL/100)/10}s.</div>
      </div>
    </AppContainer>
  );
};

export default DefenderStealthViral;
