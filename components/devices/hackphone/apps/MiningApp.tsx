"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppContainer, AppHeader } from "../shared/AppContainer";
import { getPlayspaceId } from "@/lib/playspace-utils";

interface Tile {
  id: number;
  value: number;
  correctIndex: number;
}

// Award per successful round (matches project spec: 25 bitcoins per round of ordering numbers)
const REWARD_PER_ROUND = 25;

const generateRound = (size = 6): Tile[] => {
  const nums = Array.from({ length: size }, () => Math.floor(Math.random() * 99) + 1);
  return nums
    .map((n, idx) => ({ n, idx }))
    .sort(() => Math.random() - 0.5)
    .map((o, i) => ({ id: i, value: o.n, correctIndex: 0 }));
};

const MiningApp: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>(() => generateRound());
  const [selected, setSelected] = useState<number | null>(null);
  const [round, setRound] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("Arrange numbers in ascending order. Tap two tiles to swap.");
  // balanceDelta removed (unused)
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [roundClaimed, setRoundClaimed] = useState(false);
  const sortedValues = useMemo(() => [...tiles.map(t => t.value)].sort((a,b)=>a-b), [tiles]);

  // Check if player arrangement matches ascending order
  const isCorrect = useMemo(() => {
    const vals = tiles.map(t => t.value);
    return vals.every((v,i)=>v===sortedValues[i]);
  }, [tiles, sortedValues]);

  const swap = (i: number) => {
    if (selected === null) {
      setSelected(i);
      return;
    }
    if (selected === i) { setSelected(null); return; }
    setTiles(prev => {
      const cp = [...prev];
      [cp[selected], cp[i]] = [cp[i], cp[selected]];
      return cp;
    });
    setSelected(null);
  };

  const awardBitcoin = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const playspaceId = getPlayspaceId();
      const res = await fetch('/api/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-playspace-id': playspaceId || '' },
        body: JSON.stringify({ amount: REWARD_PER_ROUND, reason: 'mining-round' })
      });
      const data = await res.json();
      if (data.success) {
        setLastReward(REWARD_PER_ROUND);
        setMessage(`✅ Round ${round} complete! Earned ₿${REWARD_PER_ROUND}. New team balance: ₿${data.bitcoinBalance.toFixed(2)}`);
      } else {
        setMessage('⚠️ Reward failed to credit: ' + (data.error || 'unknown error'));
      }
  } catch {
      setMessage('⚠️ Network error crediting reward');
    } finally {
      setIsSubmitting(false);
    }
  }, [round]);

  const submitRound = async () => {
  if (!isCorrect) {
      setMessage('❌ Not sorted yet. Keep arranging.');
      return;
    }
    if (roundClaimed) {
      setMessage('⚠️ Reward already claimed for this round.');
      return;
    }
    setRoundClaimed(true);
    await awardBitcoin();
    // Start next round after short delay
    setTimeout(() => {
      setTiles(generateRound());
      setRound(r => r + 1);
      setMessage('Arrange numbers in ascending order.');
      setLastReward(null);
      setRoundClaimed(false);
    }, 1500);
  };

  useEffect(()=>{
    if (isCorrect) setMessage('✅ Sorted! Submit to claim reward.');
  }, [isCorrect]);

  return (
    <AppContainer backgroundColor="bg-gray-900">
      <AppHeader title="Mining" />
      <div className="flex-1 p-4 flex flex-col space-y-4 text-white overflow-y-auto">
        <div className="text-sm text-gray-300 leading-relaxed min-h-[40px]">{message}</div>
        <div className="grid grid-cols-3 gap-3 max-w-xs">
          {tiles.map((t,i)=> (
            <button key={t.id} onClick={()=>swap(i)} className={`aspect-square rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 border-2 select-none shadow-md
              ${selected===i? 'bg-blue-600 border-blue-300 scale-105' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}
              ${isCorrect? 'ring-2 ring-green-400 animate-pulse' : ''}`}>{t.value}</button>
          ))}
        </div>
        <div className="flex items-center space-x-4 pt-2">
          <button disabled={isSubmitting || !isCorrect || roundClaimed} onClick={submitRound} className="px-4 py-2 rounded-lg bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-500 font-semibold shadow">
            {isSubmitting ? 'Crediting...' : roundClaimed ? 'Claimed!' : `Claim ₿${REWARD_PER_ROUND}`}
          </button>
          <button onClick={()=> { setTiles(generateRound()); setMessage('New numbers generated.'); setSelected(null); setRoundClaimed(false); }} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 font-medium">Shuffle</button>
        </div>
        <div className="text-xs text-gray-500">Round {round}</div>
        {lastReward && <div className="text-sm text-green-400">Last reward: ₿{lastReward}</div>}
        <div className="mt-auto text-[10px] text-gray-500">Complete each round to earn bitcoins for your team wallet.</div>
      </div>
    </AppContainer>
  );
};

export default MiningApp;
