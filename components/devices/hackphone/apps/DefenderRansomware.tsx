"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppContainer, AppHeader } from '../shared/AppContainer';
import { getPlayspaceId } from '@/lib/playspace-utils';
import { useSocket } from '@/hooks/useSocket';

interface InitResp { success: boolean; phrase?: string; rewardDemand?: number; timeLimitMs?: number; error?: string; }
interface UpdateResp { success: boolean; completed?: boolean; progress?: number; mismatch?: boolean; error?: string; demand?: number; }

const DefenderRansomware: React.FC = () => {
  const playspaceId = getPlayspaceId();
  const targetKey = playspaceId || 'local-test';
  const [phrase, setPhrase] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [demand, setDemand] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Standby — awaiting ransomware trigger.');
  const [active, setActive] = useState(false);
  const expiresAtRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { ransomSpawns, ransomProgress, ransomNeutralized, ransomExpired } = useSocket();

  const loadOrInit = useCallback(async () => {
    // Attempt to start a challenge (if attacker triggered concurrently they'll POST before defender opens app)
    try {
      const res = await fetch(`/api/attack/ransomware?targetKey=${targetKey}`, { method: 'POST' });
      const data: InitResp = await res.json();
      if (!data.success) {
        setStatusMsg(data.error || 'No active ransomware.');
        setActive(false);
        return;
      }
      setPhrase(data.phrase || '');
      setProgress(0);
      setDemand(data.rewardDemand || 0);
      setStatusMsg('Type the code phrase to neutralize before time elapses.');
      setActive(true);
      expiresAtRef.current = Date.now() + (data.timeLimitMs || 15000);
    } catch {
      setStatusMsg('Network error while initializing.');
    }
  }, [targetKey]);

  useEffect(() => {
    loadOrInit();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!expiresAtRef.current) return;
      const remaining = expiresAtRef.current - Date.now();
      if (remaining <= 0) {
        setExpired(true);
        setActive(false);
        clearInterval(timerRef.current!);
        setStatusMsg('⏰ Challenge expired. Payload executed (team owes ransom).');
      } else {
        // Force re-render by toggling state (progress changes separately)
        setStatusMsg(prev => prev);
      }
    }, 300);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loadOrInit]);

  // Realtime spawn -> refresh state if for this target
  useEffect(() => {
    const latest = ransomSpawns.filter(s => s.targetKey === targetKey).slice(-1)[0];
    if (latest) {
      setPhrase(latest.phrase);
      setDemand(latest.rewardDemand);
      setProgress(0);
      setExpired(false);
      setActive(true);
      expiresAtRef.current = Date.now() + 15000; // keep same timeout
      setStatusMsg('Realtime ransomware detected — begin typing!');
    }
  }, [ransomSpawns, targetKey]);

  // Realtime progress updates
  useEffect(() => {
    const latest = ransomProgress.filter(p => p.targetKey === targetKey).slice(-1)[0];
    if (latest && active && !expired) {
      setProgress(latest.progress);
    }
  }, [ransomProgress, targetKey, active, expired]);

  // Realtime neutralization
  useEffect(() => {
    const latest = ransomNeutralized.filter(n => n.targetKey === targetKey).slice(-1)[0];
    if (latest) {
      setProgress(phrase.length);
      setStatusMsg('✅ Neutralized (remote).');
      setActive(false);
    }
  }, [ransomNeutralized, targetKey, phrase.length]);

  // Realtime expiry
  useEffect(() => {
    const latest = ransomExpired.filter(e => e.targetKey === targetKey).slice(-1)[0];
    if (latest) {
      setExpired(true);
      setActive(false);
      setDemand(latest.demand);
      setStatusMsg('⏰ Expired (remote) — ransom owed.');
    }
  }, [ransomExpired, targetKey]);

  const handleKey = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!active || expired) return;
    const char = e.key.length === 1 ? e.key.toUpperCase() : '';
    if (!char) return;
    e.preventDefault();
    try {
      const res = await fetch(`/api/attack/ransomware?targetKey=${targetKey}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ char }) });
      const data: UpdateResp = await res.json();
      if (!data.success) {
        if (data.error === 'Expired') {
          setExpired(true);
          setActive(false);
          setStatusMsg('⏰ Expired — ransomware succeeded.');
        }
        return;
      }
      if (data.mismatch) {
        setStatusMsg('Mismatch — keep typing.');
        return;
      }
      if (data.completed) {
        setProgress(phrase.length);
        setStatusMsg('✅ Decrypted — ransomware neutralized.');
        setActive(false);
        return;
      }
      if (typeof data.progress === 'number') {
        setProgress(data.progress);
      }
    } catch {
      setStatusMsg('Network error sending key.');
    }
  };

  const remainingMs = expiresAtRef.current ? Math.max(0, expiresAtRef.current - Date.now()) : 0;
  const pct = phrase ? Math.round((progress / phrase.length) * 100) : 0;

  return (
    <AppContainer backgroundColor="bg-zinc-900">
      <AppHeader title="Ransomware Defense" />
      <div className="p-4 space-y-4 text-sm text-gray-200">
        <p className="text-xs text-gray-400 leading-relaxed">Type the displayed phrase exactly. Each correct letter advances. Wrong letters are ignored. Finish before timer hits zero.</p>
        <div className="font-mono text-xl tracking-wide text-center select-none">
          {phrase.split('').map((c,i) => (
            <span key={i} className={`px-1 ${i<progress? 'text-green-400':'text-gray-600'}`}>{c}</span>
          ))}
        </div>
        <div className="w-full h-3 bg-gray-700 rounded overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-200" style={{ width: pct+'%' }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
          <span>Progress: {progress}/{phrase.length}</span>
          <span>Time: {(remainingMs/1000).toFixed(1)}s</span>
        </div>
        <input
          type="text"
          autoFocus
            className="w-full bg-black/40 border border-gray-600 rounded px-3 py-2 outline-none focus:border-indigo-400 font-mono tracking-widest"
          placeholder={active? 'Type here...' : 'Inactive'}
          disabled={!active || expired}
          onKeyDown={handleKey}
        />
        {demand !== null && !active && expired && (
          <div className="text-xs text-red-400">Ransom demand: ₿{demand}. (Payment flow TBD)</div>
        )}
        <div className="text-xs text-gray-400 min-h-[20px]">{statusMsg}</div>
        <button onClick={loadOrInit} className="w-full py-2 rounded bg-gray-700 hover:bg-gray-600 text-xs font-semibold">Force Re-Init</button>
      </div>
    </AppContainer>
  );
};

export default DefenderRansomware;
