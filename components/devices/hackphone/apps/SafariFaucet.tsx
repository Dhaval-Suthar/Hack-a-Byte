"use client";
import React, { useState } from 'react';
import { AppContainer, AppHeader } from '../shared/AppContainer';

interface FaucetResult { reward: number; attempts: number; windowExpires: number; balance: number }

const SafariFaucet: React.FC = () => {
  const [state, setState] = useState<Partial<FaucetResult>>({});
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState('team-id-placeholder');

  const claim = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/extract/faucet', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ teamId }) });
      const data = await res.json();
      if (data.success) {
        setState(data);
        setLog(prev => [`+₿${data.reward} (attempt ${data.attempts})`, ...prev].slice(0, 40));
      } else {
        setLog(prev => [`ERR: ${data.error}`, ...prev]);
      }
    } catch {
      setLog(prev => ['Network error', ...prev]);
    } finally { setLoading(false); }
  };

  const remaining = state.windowExpires ? Math.max(0, Math.floor((state.windowExpires - Date.now())/1000)) : 0;

  return (
    <AppContainer backgroundColor="bg-slate-900">
      <AppHeader title="Safari Faucet" />
      <div className="flex-1 p-3 text-white space-y-3 text-xs">
        <div className="flex gap-2 items-center">
          <input value={teamId} onChange={e=>setTeamId(e.target.value)} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] flex-1" placeholder="Team ID" />
          <button disabled={loading} onClick={claim} className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 font-semibold text-[11px]">{loading ? 'Claiming...' : 'Claim'}</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded p-2">Reward<br/><span className="text-emerald-300 font-mono">{state.reward ?? '-'}</span></div>
          <div className="bg-white/5 rounded p-2">Attempts<br/><span className="text-amber-300 font-mono">{state.attempts ?? '-'}</span></div>
          <div className="bg-white/5 rounded p-2">Window (s)<br/><span className="text-cyan-300 font-mono">{remaining}</span></div>
          <div className="bg-white/5 rounded p-2">Balance<br/><span className="text-fuchsia-300 font-mono">{state.balance ?? '-'}</span></div>
        </div>
        <div className="text-[10px] text-gray-400">Reward decays 25% each attempt within 5m window (floor {15}). Base 120 BTC. Resets after window expires.</div>
        <div className="h-40 overflow-auto bg-black/30 border border-white/10 rounded p-2 space-y-1 font-mono">
          {log.map((l,i)=>(<div key={i}>{l}</div>))}
          {log.length===0 && <div className="text-gray-500">No claims yet.</div>}
        </div>
      </div>
    </AppContainer>
  );
};

export default SafariFaucet;
