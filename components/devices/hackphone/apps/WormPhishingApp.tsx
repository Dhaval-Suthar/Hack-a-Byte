"use client";
import React, { useState } from 'react';
import { AppContainer, AppHeader } from '../shared/AppContainer';
import { getPlayspaceId } from '@/lib/playspace-utils';

const WormPhishingApp: React.FC = () => {
  const [attempts, setAttempts] = useState(0);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('Launch worm phishing exploit to siphon bitcoins. Diminishing returns within 5 min window.');
  const [loading, setLoading] = useState(false);

  const trigger = async () => {
    setLoading(true);
    try {
      const playspaceId = getPlayspaceId();
      const res = await fetch('/api/attack/worm-phishing', { method:'POST', headers:{ 'Content-Type':'application/json', 'x-playspace-id': playspaceId || '' }, body: JSON.stringify({ attackerTeamId: 'team-id-placeholder' }) });
      const data = await res.json();
      if (data.success) {
        setAttempts(data.attempts);
        setLastReward(data.reward);
        setStatus(`Success: Earned ₿${data.reward} (attempt ${data.attempts}, balance ₿${data.newBalance})`);
      } else {
        setStatus('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      setStatus('Network error calling endpoint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer backgroundColor="bg-gray-900">
      <AppHeader title="Worm Phish" />
      <div className="flex-1 p-4 text-white space-y-4">
        <div className="text-sm text-gray-300 min-h-[40px]">{status}</div>
        <button disabled={loading} onClick={trigger} className="px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 font-semibold shadow disabled:cursor-not-allowed">{loading? 'Executing...' : 'Execute Exploit'}</button>
  {lastReward !== null && <div className="text-xs text-green-400">Last reward: ₿{lastReward} (attempt {attempts})</div>}
        <div className="text-[10px] text-gray-500 mt-auto">Rewards reduce 20% each attempt within 5 minute window (min 10 BTC).</div>
      </div>
    </AppContainer>
  );
};

export default WormPhishingApp;
