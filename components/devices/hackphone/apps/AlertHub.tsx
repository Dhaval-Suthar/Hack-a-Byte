"use client";
import React, { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface AlertItem {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  ts: number;
  meta?: Record<string, unknown>;
}

const severityStyles: Record<string, string> = {
  info: 'bg-blue-600/20 border-blue-400 text-blue-200',
  warn: 'bg-amber-600/20 border-amber-400 text-amber-200',
  error: 'bg-red-600/20 border-red-400 text-red-200',
  critical: 'bg-purple-700/30 border-purple-400 text-purple-200 animate-pulse'
};

interface AlertHubProps {
  onCountChange?: (count: number) => void;
}

export const AlertHub: React.FC<AlertHubProps> = ({ onCountChange }) => {
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const push = (a: Omit<AlertItem, 'id' | 'ts'> & { ts?: number }) => {
    setAlerts(prev => [{ id: Math.random().toString(36).slice(2), ts: a.ts || Date.now(), ...a }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    if (!socket) return;

    interface RansomDemand { amount: number; deadline: number; [k: string]: unknown }
    interface RansomGeneric { [k: string]: unknown }
    interface BankState { online: boolean; reason?: string }
    interface StealthSpawn { targetKey: string; clicksRequired: number }
    interface StealthProgress { targetKey: string; clicks: number; clicksRequired: number }
    interface StealthDefeated { targetKey: string }
    interface FakeBank { domain: string }
    interface GameEnd { winner?: string }
    interface DeviceStatus { deviceId: string; status: string }

  const wrap = <T extends object>(o: T) => ({ ...o } as Record<string, unknown>);
  const ransomwareDemand = (data: RansomDemand) => push({ type: 'ransom-demand', message: `Ransom demand: ${data.amount} BTC due in ${Math.ceil((data.deadline - Date.now())/1000)}s`, severity: 'critical', meta: wrap(data) });
  const ransomwarePaid = (data: RansomGeneric) => push({ type: 'ransom-paid', message: 'Ransom paid – systems restoring', severity: 'info', meta: wrap(data) });
  const ransomwareUnpaid = (data: RansomGeneric) => push({ type: 'ransom-unpaid', message: 'Ransom unpaid – data loss escalating', severity: 'error', meta: wrap(data) });
  const bankState = (data: BankState) => push({ type: 'bank-state', message: data.online ? 'Bank back online' : `Bank offline (${data.reason || 'event'})`, severity: data.online ? 'info' : 'warn', meta: wrap(data) });
  const stealthSpawn = (data: StealthSpawn) => push({ type: 'stealth-viral-spawn', message: `StealthViral active on ${data.targetKey}`, severity: 'warn', meta: wrap(data) });
  const stealthProgress = (data: StealthProgress) => push({ type: 'stealth-viral-progress', message: `StealthViral progress ${data.clicks}/${data.clicksRequired}`, severity: 'info', meta: wrap(data) });
  const stealthDefeated = (data: StealthDefeated) => push({ type: 'stealth-viral-defeated', message: `StealthViral neutralized on ${data.targetKey}`, severity: 'info', meta: wrap(data) });
  const fakeBank = (data: FakeBank) => push({ type: 'fake-bank-warning', message: `FakeBank portal observed at ${data.domain}`, severity: 'warn', meta: wrap(data) });
  const gameEnd = (data: GameEnd) => push({ type: 'game-end', message: `Game ended. Winner: ${data.winner || 'N/A'}`, severity: 'info', meta: wrap(data) });
  const deviceStatus = (data: DeviceStatus) => push({ type: 'device-status', message: `Device ${data.deviceId} is now ${data.status}`, severity: data.status==='online' ? 'info':'warn', meta: wrap(data) });
  // Extractor loop events
  const faucet = (data: { teamId: string; reward: number; attempts: number }) => push({ type: 'faucet-claim', message: `Faucet +${data.reward} (attempt ${data.attempts})`, severity: 'info', meta: wrap(data) });
  const emailSms = (data: { teamId: string; outcome?: string; amount?: number; balance?: number; detail?: string }) => {
    const outcome = data.outcome ?? 'event';
    const amt = typeof data.amount === 'number' ? data.amount : 0;
    const sign = amt > 0 ? '+' : '';
    const suffix = amt !== 0 ? ` (${sign}${amt})` : '';
    push({ type: 'email-sms', message: `Email/SMS ${outcome}${suffix}`, severity: outcome==='loss' ? 'error' : outcome==='gain' ? 'info' : 'warn', meta: wrap(data) });
  };
  const extractorEvent = (data: { teamId: string; event: Record<string, unknown> }) => push({ type: 'extractor-event', message: `Extractor ${String(data.event?.type||'evt')} ${String(data.event?.outcome||'')}`, severity: 'info', meta: wrap(data) });

    socket.on('ransomware-demand', ransomwareDemand);
    socket.on('ransomware-paid', ransomwarePaid);
    socket.on('ransomware-unpaid', ransomwareUnpaid);
    socket.on('bank-state', bankState);
    socket.on('malware-stealth-viral-spawn', stealthSpawn);
    socket.on('malware-stealth-viral-progress', stealthProgress);
    socket.on('malware-stealth-viral-defeated', stealthDefeated);
    socket.on('fake-bank-warning', fakeBank);
    socket.on('game-session-ended', gameEnd);
    socket.on('device-status', deviceStatus);
  socket.on('extractor-faucet', faucet);
  socket.on('extractor-email-sms', emailSms);
  socket.on('extractor-event', extractorEvent);
    return () => {
      socket.off('ransomware-demand', ransomwareDemand);
      socket.off('ransomware-paid', ransomwarePaid);
      socket.off('ransomware-unpaid', ransomwareUnpaid);
      socket.off('bank-state', bankState);
      socket.off('malware-stealth-viral-spawn', stealthSpawn);
      socket.off('malware-stealth-viral-progress', stealthProgress);
      socket.off('malware-stealth-viral-defeated', stealthDefeated);
      socket.off('fake-bank-warning', fakeBank);
      socket.off('game-session-ended', gameEnd);
      socket.off('device-status', deviceStatus);
  socket.off('extractor-faucet', faucet);
  socket.off('extractor-email-sms', emailSms);
  socket.off('extractor-event', extractorEvent);
    };
  }, [socket]);

  // Auto-trim older alerts beyond 5 minutes
  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now() - 5*60*1000;
      setAlerts(prev => prev.filter(a => a.ts >= cutoff));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  // Notify parent of count changes
  useEffect(() => {
    onCountChange?.(alerts.length);
  }, [alerts.length, onCountChange]);

  return (
  <div className="p-2 space-y-2 max-h-80 overflow-auto text-xs">
      {alerts.map(a => (
        <div key={a.id} className={`border rounded px-2 py-1 flex flex-col gap-0.5 ${severityStyles[a.severity] || severityStyles.info}`}> 
          <div className="flex justify-between">
            <span className="font-medium uppercase tracking-wide">{a.type}</span>
            <span className="opacity-60 tabular-nums">{new Date(a.ts).toLocaleTimeString()}</span>
          </div>
          <div>{a.message}</div>
        </div>
      ))}
      {alerts.length===0 && <div className="text-gray-400 text-center py-4">No alerts yet</div>}
    </div>
  );
};

export default AlertHub;