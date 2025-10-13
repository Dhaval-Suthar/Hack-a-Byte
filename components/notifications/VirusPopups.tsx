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

interface PersistedStealthState {
  popups: Popup[];
  clickCount: number;
  clicksRequired: number | null;
  defeated: boolean;
  targetKey: string;
  lastUpdated: number;
}

// Random helper
function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

const MAX_POPUPS = 40; // coverage threshold approx.

function makeId() {
  // Fallback UUID-ish generator (avoid crypto.randomUUID for older runtimes)
  return 'xxxxxxx-xxxx'.replace(/[x]/g, () => (Math.random()*16|0).toString(16)) + '-' + Date.now().toString(36);
}

// Persistence helpers
function getStorageKey(targetKey: string) {
  return `stealthviral-state-${targetKey}`;
}

function saveStealthState(targetKey: string, state: PersistedStealthState) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getStorageKey(targetKey), JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save StealthViral state:', error);
    }
  }
}

function loadStealthState(targetKey: string): PersistedStealthState | null {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(getStorageKey(targetKey));
      if (saved) {
        const parsed = JSON.parse(saved) as PersistedStealthState;
        // Only return saved state if it's recent (within 5 minutes)
        if (Date.now() - parsed.lastUpdated < 5 * 60 * 1000) {
          return parsed;
        } else {
          // Clean up expired state
          localStorage.removeItem(getStorageKey(targetKey));
        }
      }
    } catch (error) {
      console.warn('Failed to load StealthViral state:', error);
    }
  }
  return null;
}

function clearStealthState(targetKey: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(getStorageKey(targetKey));
    } catch (error) {
      console.warn('Failed to clear StealthViral state:', error);
    }
  }
}

const VirusPopups: React.FC<VirusPopupsProps> = ({ targetKey, targetTeamId, active, onAllCleared }) => {
  const { stealthDefeated, stealthSpawns } = useSocket();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [defeated, setDefeated] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [clicksRequired, setClicksRequired] = useState<number | null>(null);
  const [stateRestored, setStateRestored] = useState(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    if (!stateRestored) {
      const savedState = loadStealthState(targetKey);
      if (savedState && savedState.targetKey === targetKey) {
        setPopups(savedState.popups);
        setClickCount(savedState.clickCount);
        setClicksRequired(savedState.clicksRequired);
        setDefeated(savedState.defeated);
      }
      setStateRestored(true);
    }
  }, [targetKey, stateRestored]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (stateRestored) {
      const state: PersistedStealthState = {
        popups,
        clickCount,
        clicksRequired,
        defeated,
        targetKey,
        lastUpdated: Date.now()
      };
      saveStealthState(targetKey, state);
    }
  }, [popups, clickCount, clicksRequired, defeated, targetKey, stateRestored]);

  // Check server state to verify if attack is still active
  useEffect(() => {
    if (stateRestored && !defeated && (popups.length > 0 || clickCount > 0)) {
      // Verify server state when restoring from localStorage
      const verifyServerState = async () => {
        try {
          const response = await fetch(`/api/attack/stealth-viral?targetKey=${encodeURIComponent(targetKey)}`);
          const data = await response.json();
          if (data.success && data.active === false) {
            // Attack is no longer active on server, clear local state
            setPopups([]);
            setClickCount(0);
            setClicksRequired(null);
            setDefeated(true);
            clearStealthState(targetKey);
          } else if (data.success && data.active && data.clicksRequired && data.clicks !== undefined) {
            // Sync with server state
            setClicksRequired(data.clicksRequired);
            setClickCount(data.clicks);
            if (data.clicks >= data.clicksRequired) {
              setDefeated(true);
              setPopups([]);
              clearStealthState(targetKey);
            }
          }
        } catch (error) {
          console.warn('Failed to verify StealthViral server state:', error);
        }
      };
      verifyServerState();
    }
  }, [stateRestored, targetKey, defeated, popups.length, clickCount]);

  // Determine if there is an active spawn targeting this key
  const hasActiveSpawn = useMemo(() => {
    const spawn = stealthSpawns.find((e: unknown) => {
      const evt = e as { targetKey?: string };
      return evt.targetKey === targetKey;
    });
    
    // Update clicksRequired when spawn is found
    if (spawn) {
      const spawnData = spawn as { clicksRequired?: number };
      if (spawnData.clicksRequired && spawnData.clicksRequired !== clicksRequired) {
        setClicksRequired(spawnData.clicksRequired);
      }
    }
    
    const activeSpawn = !!spawn;
    return activeSpawn;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stealthSpawns, targetKey]);

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
        clearStealthState(targetKey);
        onAllCleared?.();
      }
    }
  }, [stealthDefeated, targetKey, onAllCleared]);

  // Auto-clear when enough clicks reached
  useEffect(() => {
    if (clicksRequired && clickCount >= clicksRequired && !defeated) {
      setPopups([]);
      setDefeated(true);
      clearStealthState(targetKey);
      onAllCleared?.();
    }
  }, [clickCount, clicksRequired, defeated, targetKey, onAllCleared]);

  const handleClick = useCallback((id: string) => {
    setPopups(prev => prev.filter(p => p.id !== id));
    setClickCount(prev => prev + 1);
    
    // Inform server of defender action
    fetch(`/api/attack/stealth-viral?targetKey=${encodeURIComponent(targetKey)}`, {
      method: 'PUT',
      headers: { 'x-target-team-id': targetTeamId }
    }).catch(()=>{});
  }, [targetKey, targetTeamId]);

  if (!active || defeated) return null;
  
  // Show popups if we have an active spawn OR if we have restored state with popups
  if (!hasActiveSpawn && popups.length === 0) return null;

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
