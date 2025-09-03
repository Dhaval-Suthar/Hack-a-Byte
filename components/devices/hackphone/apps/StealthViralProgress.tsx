"use client";
import React, { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface ProgressState { targetKey: string; clicks: number; clicksRequired: number; startedAt: number; }

interface StealthViralProgressPanelProps {
  onCountChange?: (count: number) => void;
}

export const StealthViralProgressPanel: React.FC<StealthViralProgressPanelProps> = ({ onCountChange }) => {
  const { socket } = useSocket();
  const [active, setActive] = useState<Record<string, ProgressState>>({});

  useEffect(() => {
    if (!socket) return;
    const spawn = (d: { targetKey: string; clicksRequired: number }) => {
      setActive(prev => ({ ...prev, [d.targetKey]: { targetKey: d.targetKey, clicks: 0, clicksRequired: d.clicksRequired, startedAt: Date.now() } }));
    };
    const progress = (d: { targetKey: string; clicks: number; clicksRequired: number }) => {
      setActive(prev => prev[d.targetKey] ? { ...prev, [d.targetKey]: { ...prev[d.targetKey], clicks: d.clicks, clicksRequired: d.clicksRequired } } : prev);
    };
    const defeated = (d: { targetKey: string }) => {
      setActive(prev => { const copy = { ...prev }; delete copy[d.targetKey]; return copy; });
    };
    socket.on('malware-stealth-viral-spawn', spawn);
    socket.on('malware-stealth-viral-progress', progress);
    socket.on('malware-stealth-viral-defeated', defeated);
    return () => {
      socket.off('malware-stealth-viral-spawn', spawn);
      socket.off('malware-stealth-viral-progress', progress);
      socket.off('malware-stealth-viral-defeated', defeated);
    };
  }, [socket]);

  const entries = Object.values(active);

  useEffect(() => {
    onCountChange?.(entries.length);
  }, [entries.length, onCountChange]);
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wide text-purple-300">StealthViral Operations</h3>
      {entries.length === 0 && <div className="text-xs text-gray-500">No active infections</div>}
      {entries.map(op => {
        const pct = Math.min(100, (op.clicks / op.clicksRequired) * 100);
        return (
          <div key={op.targetKey} className="border border-purple-500/40 rounded p-2 bg-purple-900/20">
            <div className="flex justify-between text-[11px] mb-1">
              <span>{op.targetKey}</span>
              <span>{op.clicks}/{op.clicksRequired}</span>
            </div>
            <div className="h-1.5 bg-purple-950/50 rounded overflow-hidden">
              <div style={{ width: pct + '%' }} className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400"></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StealthViralProgressPanel;