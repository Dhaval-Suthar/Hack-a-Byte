"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { AppContainer, AppHeader } from '../shared/AppContainer';
import { useSocket, BankStateEvent, SystemLockSuccess } from '@/hooks/useSocket';

interface TimelineItem { ts: number; label: string; }

const BankStatusApp: React.FC = () => {
  const { bankEvents, systemLockEvents } = useSocket() as { bankEvents: BankStateEvent[]; systemLockEvents: SystemLockSuccess[] };
  const [initialState, setInitialState] = useState<{ online: boolean; offlineUntil?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/attack/systemlock')
      .then(r=>r.json())
      .then(d=> { if(mounted) { setInitialState(d); setLoading(false); }})
      .catch(()=> setLoading(false));
    return ()=> { mounted=false; };
  }, []);

  const merged = useMemo(() => {
    const events: TimelineItem[] = [];
    bankEvents?.forEach((e:BankStateEvent)=> events.push({ ts: e.ts, label: e.online? 'Bank ONLINE' : 'Bank OFFLINE'}));
    systemLockEvents?.forEach((e:SystemLockSuccess)=> events.push({ ts: e.ts, label: `SystemLock +${e.amount} BTC (offline)` }));
    return events.sort((a,b)=> b.ts - a.ts).slice(0,25);
  }, [bankEvents, systemLockEvents]);

  const current = bankEvents?.slice(-1)[0] || (initialState && { online: initialState.online, offlineUntil: initialState.offlineUntil, ts: Date.now() });
  const now = Date.now();
  const remainingMs = current && !current.online && current.offlineUntil ? Math.max(0, current.offlineUntil - now) : 0;
  const remainingMin = Math.ceil(remainingMs / 60000);

  return (
    <AppContainer backgroundColor="bg-gray-950">
      <AppHeader title="Bank Status" />
      <div className="flex-1 p-4 text-white space-y-4 overflow-y-auto">
        {loading && <div className="text-sm text-gray-400">Loading initial status...</div>}
        {current && (
          <div className={`p-4 rounded-lg border ${current.online ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}>
            <div className="text-lg font-semibold mb-1 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${current.online? 'bg-green-400 animate-pulse':'bg-red-400 animate-pulse'}`}></span>
              Bank is {current.online? 'ONLINE':'OFFLINE'}
            </div>
            {!current.online && current.offlineUntil && (
              <div className="text-xs text-red-300">Expected return in ~{remainingMin} min</div>
            )}
            {current.online && <div className="text-xs text-green-300">SystemLock may be attempted.</div>}
          </div>
        )}
        <div>
          <div className="text-xs font-semibold text-gray-300 mb-2 tracking-wide">EVENT TIMELINE</div>
          <div className="space-y-2">
            {merged.length === 0 && <div className="text-xs text-gray-500">No events yet.</div>}
            {merged.map(item => (
              <div key={item.ts} className="text-xs bg-gray-800/50 border border-gray-700 rounded px-3 py-2 flex justify-between">
                <span>{item.label}</span>
                <span className="text-gray-400">{new Date(item.ts).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[10px] text-gray-500 pt-4">Events update in real-time via Socket.IO bank-state and systemlock-success messages.</div>
      </div>
    </AppContainer>
  );
};

export default BankStatusApp;
