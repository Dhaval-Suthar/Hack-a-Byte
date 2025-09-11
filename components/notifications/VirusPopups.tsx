"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface Popup {
  id: string;
  x: number;
  y: number;
  size: number;
  created: number;
}

interface VirusPopupsProps {
  targetKey: string; // identifier used in API
  targetTeamId: string; // team to send PUT header
  active?: boolean;
  onAllCleared?: () => void;
}

// Random helper
function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

const MAX_POPUPS = 40; // coverage threshold approx.

function makeId() {
  // Fallback UUID-ish generator (avoid crypto.randomUUID for older runtimes)
  return 'xxxxxxx-xxxx'.replace(/[x]/g, () => (Math.random()*16|0).toString(16)) + '-' + Date.now().toString(36);
}

const VirusPopups: React.FC<VirusPopupsProps> = ({ targetKey, targetTeamId, active, onAllCleared }) => {
  const { stealthDefeated, stealthSpawns } = useSocket();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [defeated, setDefeated] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [clicksRequired, setClicksRequired] = useState<number | null>(null);

  // Determine if there is an active spawn targeting this key
  const hasActiveSpawn = useMemo(() => {
    const spawn = stealthSpawns.find((e: unknown) => {
      const evt = e as { targetKey?: string };
      return evt.targetKey === targetKey;
    });
    
    // Update clicksRequired when spawn is found
    if (spawn && !clicksRequired) {
      const spawnData = spawn as { clicksRequired?: number };
      if (spawnData.clicksRequired) {
        setClicksRequired(spawnData.clicksRequired);
      }
    }
    
    const activeSpawn = !!spawn;
    console.log('🔍 VirusPopups Debug:', { 
      targetKey, 
      targetTeamId, 
      stealthSpawns: stealthSpawns.map(s => (s as { targetKey?: string }).targetKey), 
      hasActiveSpawn: activeSpawn,
      clickCount,
      clicksRequired,
      message: activeSpawn ? 'MATCH FOUND!' : 'No matching spawn events'
    });
    return activeSpawn;
  }, [stealthSpawns, targetKey, targetTeamId, clicksRequired, clickCount]);

  // Spawn new popup periodically while active
  useEffect(() => {
    if (!active || defeated) return;
    if (!hasActiveSpawn) return; // only spawn when server announced infection
    if (clicksRequired && clickCount >= clicksRequired) return; // stop spawning if enough clicks
    
    const interval = setInterval(() => {
      setPopups(prev => {
        if (prev.length >= MAX_POPUPS) return prev; // stop accumulating beyond threshold
        const size = rand(40, 110);
        return [...prev, {
          id: makeId(),
          x: rand(0, Math.max(0, window.innerWidth - size)),
          y: rand(30, Math.max(30, window.innerHeight - size - 80)),
          size,
          created: Date.now()
        }];
      });
    }, 900); // spawn roughly every 0.9s
    return () => clearInterval(interval);
  }, [active, defeated, hasActiveSpawn, clickCount, clicksRequired]);

  // Clear on stealth defeat event
  useEffect(() => {
    if (stealthDefeated.length) {
      type DefeatEvt = { targetKey?: string } | Record<string, unknown>;
      const match = stealthDefeated.find((e: unknown) => (e as DefeatEvt).targetKey === targetKey);
      if (match) {
        setDefeated(true);
        setPopups([]);
        setClickCount(0);
        setClicksRequired(null);
        onAllCleared?.();
      }
    }
  }, [stealthDefeated, targetKey, onAllCleared]);

  // Auto-clear when enough clicks reached
  useEffect(() => {
    if (clicksRequired && clickCount >= clicksRequired && !defeated) {
      console.log('🎉 StealthViral neutralized by clicks!', { clickCount, clicksRequired });
      setPopups([]);
      onAllCleared?.();
    }
  }, [clickCount, clicksRequired, defeated, onAllCleared]);

  const handleClick = useCallback((id: string) => {
    setPopups(prev => prev.filter(p => p.id !== id));
    setClickCount(prev => prev + 1);
    
    // Inform server of defender action
    fetch(`/api/attack/stealth-viral?targetKey=${encodeURIComponent(targetKey)}`, {
      method: 'PUT',
      headers: { 'x-target-team-id': targetTeamId }
    }).catch(()=>{});
  }, [targetKey, targetTeamId]);

  if (!active || defeated || !hasActiveSpawn) return null;

  const progressPercent = clicksRequired ? Math.min(100, (clickCount / clicksRequired) * 100) : 0;
  const remaining = clicksRequired ? Math.max(0, clicksRequired - clickCount) : 0;

  return (
    <div className="fixed inset-0 pointer-events-none z-[120] select-none">
      {/* Progress indicator */}
      {clicksRequired && remaining > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-white px-4 py-2 rounded-lg border border-red-500 pointer-events-auto z-[130]">
          <div className="text-xs font-bold text-center">StealthViral Active</div>
          <div className="text-xs text-center mt-1">Clicks remaining: {remaining}</div>
          <div className="w-32 h-2 bg-red-800 rounded-full mt-2">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
      
      {popups.map(p => (
        <button
          key={p.id}
          onClick={() => handleClick(p.id)}
          className="absolute bg-red-600/80 hover:bg-red-700 text-white font-bold rounded-full shadow-lg pointer-events-auto transition active:scale-90"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          aria-label="Neutralize StealthViral node"
        >
          ✖
        </button>
      ))}
      {/* Overlay intensity based on number of popups */}
      <div
        className="absolute inset-0 transition bg-red-900/0"
        style={{ backgroundColor: `rgba(120,0,0,${Math.min(0.55, popups.length / MAX_POPUPS)})` }}
      />
    </div>
  );
};

export default VirusPopups;
