"use client";

import React, { useEffect, useState } from "react";
import { AppContainer, AppHeader } from "../shared/AppContainer";
import { useSocket, AttackData } from "@/hooks/useSocket";

interface Toggle {
  id: string;
  name: string;
  desc: string;
  impact: number; // security score delta
}

const TOGGLES: Toggle[] = [
  { id: 'vpn', name: 'VPN', desc: 'Encrypt outbound traffic', impact: 8 },
  { id: 'enc', name: 'Encryption', desc: 'Device storage encryption', impact: 10 },
  { id: 'fw', name: 'Firewall', desc: 'Block unsolicited ports', impact: 7 },
  { id: 'ids', name: 'IDS', desc: 'Intrusion detection sensor', impact: 5 },
];

const SecurityCenterApp: React.FC = () => {
  const [states, setStates] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const { incomingAttacks } = useSocket();
  const [activeDefense, setActiveDefense] = useState<AttackData | null>(null);
  const [defenseProgress, setDefenseProgress] = useState(0);

  useEffect(() => {
    // compute security score
    const s = TOGGLES.reduce((acc,t)=> acc + (states[t.id]? t.impact:0),0);
    setScore(s);
  }, [states]);

  useEffect(()=>{
    if (incomingAttacks.length>0) {
      const latest = incomingAttacks[incomingAttacks.length-1];
      // Only defender cares about virus/ransomware immediate reaction
      setActiveDefense(latest);
      setDefenseProgress(0);
      const interval = setInterval(()=>{
        setDefenseProgress(p=>{
          if (p>=100) { clearInterval(interval); return 100; }
          return p + 5;
        });
      }, 200);
      return ()=> clearInterval(interval);
    }
  }, [incomingAttacks]);

  const toggle = (id: string) => setStates(prev=> ({ ...prev, [id]: !prev[id] }));

  const successChance = () => {
    // crude formula: base 30 + score * 2 capped 95
    return Math.min(95, 30 + score * 2);
  };

  return (
    <AppContainer backgroundColor="bg-gray-950">
      <AppHeader title="Security Center" />
      <div className="flex-1 p-4 space-y-4 text-white overflow-y-auto">
        <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-300">Configure defenses to improve resistance against attacks. Higher security score increases automatic mitigation chance.</div>
          <div className="mt-3 text-xs text-gray-400">Security Score: <span className="text-green-400 font-semibold">{score}</span> (Mitigation Chance: {successChance()}%)</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TOGGLES.map(t => (
            <button key={t.id} onClick={()=>toggle(t.id)} className={`p-3 rounded-xl border text-left transition-all duration-200 shadow bg-gray-800/60 hover:bg-gray-700/60 ${states[t.id]? 'border-green-500 ring-1 ring-green-400':'border-gray-600'}`}> 
              <div className="font-semibold flex items-center justify-between">{t.name} {states[t.id] && <span className="text-green-400 text-xs">ON</span>}</div>
              <div className="text-[10px] text-gray-400 mt-1 leading-snug">{t.desc}</div>
              <div className="mt-2 text-[10px] text-gray-500">+{t.impact} score</div>
            </button>
          ))}
        </div>
        {activeDefense && (
          <div className="mt-4 bg-red-900/30 border border-red-600 rounded-lg p-4 animate-pulse">
            <div className="text-sm font-semibold text-red-300 mb-2">Incoming {activeDefense.malwareType.toUpperCase()} detected – active mitigation</div>
            <div className="w-full h-3 bg-red-950 rounded overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-red-500 to-orange-400" style={{ width: `${defenseProgress}%` }} />
            </div>
            <div className="text-xs text-red-200">{defenseProgress < 100 ? 'Neutralizing payload...' : 'Analysis complete. Outcome determined.'}</div>
          </div>
        )}
        <div className="text-[10px] text-gray-500 pt-6">Future: interactive mini-games for specific malware (click virus, typing challenge, etc.).</div>
      </div>
    </AppContainer>
  );
};

export default SecurityCenterApp;
