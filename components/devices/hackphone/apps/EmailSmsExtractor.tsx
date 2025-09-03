"use client";
import React, { useState } from 'react';
import { AppContainer, AppHeader } from '../shared/AppContainer';

interface Outcome { outcome: 'gain'|'loss'|'neutral'; amount: number; detail: string; balance: number }

const color: Record<string, string> = { gain: 'text-green-400', loss: 'text-red-400', neutral: 'text-gray-300' };

const EmailSmsExtractor: React.FC = () => {
  const [teamId, setTeamId] = useState('team-id-placeholder');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const batch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/extract/email-sms', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ teamId }) });
      const data = await res.json();
      if (data.success) {
        setOutcome(data);
        const symbol = data.outcome === 'gain' ? '+' : data.outcome === 'loss' ? '-' : '~';
        setLog(prev => [`${symbol}${data.amount} (${data.outcome}) - ${data.detail}`, ...prev].slice(0,50));
      } else {
        setLog(prev => [`ERR: ${data.error}`, ...prev]);
      }
    } catch {
      setLog(prev => ['Network error', ...prev]);
    } finally { setLoading(false); }
  };

  return (
    <AppContainer backgroundColor="bg-zinc-900">
      <AppHeader title="Email/SMS" />
      <div className="flex-1 p-3 text-white space-y-3 text-xs">
        <div className="flex gap-2 items-center">
          <input value={teamId} onChange={e=>setTeamId(e.target.value)} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] flex-1" placeholder="Team ID" />
          <button disabled={loading} onClick={batch} className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 font-semibold text-[11px]">{loading ? 'Running...' : 'Run Batch'}</button>
        </div>
        {outcome && (
          <div className={`text-sm font-mono ${color[outcome.outcome]}`}>Outcome: {outcome.outcome} {outcome.amount !== 0 && `(${outcome.amount > 0 ? '+' : ''}${outcome.amount})`} – {outcome.detail}. Balance: {outcome.balance}</div>
        )}
        <div className="text-[10px] text-gray-400">Each batch simulates phishing/harvest attempts with probabilistic reward or operational loss. Weighted gain 45%, neutral 35%, loss 20%.</div>
        <div className="h-48 overflow-auto bg-black/30 border border-white/10 rounded p-2 space-y-1 font-mono">
          {log.map((l,i)=>(<div key={i}>{l}</div>))}
          {log.length===0 && <div className="text-gray-500">No batches run.</div>}
        </div>
      </div>
    </AppContainer>
  );
};

export default EmailSmsExtractor;
