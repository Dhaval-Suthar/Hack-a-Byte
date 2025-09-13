'use client';

import React, { useState, useEffect } from 'react';
import { AppContainer, AppHeader } from '../shared/AppContainer';
import { useSocket } from '@/hooks/useSocket';
import { getPlayspaceId } from '@/lib/playspace-utils';
import DefenderStealthViral from './DefenderStealthViral';

interface VirusThreat {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  active: boolean;
}

const VirusDefenseCenter: React.FC = () => {
  const { virusNotifications, stealthDefeated } = useSocket();
  const [activeThreats, setActiveThreats] = useState<VirusThreat[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<VirusThreat | null>(null);
  const playspaceId = getPlayspaceId();
  const [teamId, setTeamId] = useState<string | undefined>();
  const [deviceMac, setDeviceMac] = useState<string | undefined>();

  // Resolve teamId (used for team-scoped virus notifications whose targetKey may be teamId or device MAC)
  useEffect(() => {
    if (!playspaceId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/team/get-team-id?playspaceId=${playspaceId}`, { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json();
        if (j?.success && j?.teamId && !cancelled) setTeamId(j.teamId);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [playspaceId]);

  // Load device MAC from localStorage (client-only)
  useEffect(() => {
    try {
      const mac = typeof window !== 'undefined' ? localStorage.getItem('device_mac_address') : null;
      if (mac) setDeviceMac(mac);
    } catch {}
  }, []);

  // Track active virus threats
  useEffect(() => {
    
    // Add new virus notifications
    virusNotifications.forEach(notification => {
      // Extended shape for defensive narrowing
      type ExtendedNotif = typeof notification & { targetTeamId?: string };
      const n = notification as ExtendedNotif;
      // Match by playspaceId (legacy) or resolved teamId (current) or embedded targetTeamId
      const matches = n.targetKey === playspaceId || n.targetKey === teamId || (teamId && n.targetTeamId === teamId) || (deviceMac && n.targetKey === deviceMac);
      if (matches) {
        const threat: VirusThreat = {
          id: `${notification.virusType}-${notification.ts}`,
          type: notification.virusType,
          message: notification.message,
          severity: notification.severity,
          timestamp: notification.ts,
          active: true
        };
        
        setActiveThreats(prev => {
          // Avoid duplicates
          if (prev.find(t => t.id === threat.id)) {
            return prev;
          }
          return [...prev, threat];
        });
      }
    });
  }, [virusNotifications, playspaceId, teamId, deviceMac]);

  // Handle StealthViral defeats
  useEffect(() => {
    stealthDefeated.forEach(defeat => {
      if (defeat.targetKey === playspaceId) {
        setActiveThreats(prev => 
          prev.map(threat => 
            threat.type === 'StealthViral' ? { ...threat, active: false } : threat
          )
        );
        
        // Clear selected threat if it was StealthViral
        if (selectedThreat?.type === 'StealthViral') {
          setSelectedThreat(null);
        }
      }
    });
  }, [stealthDefeated, playspaceId, selectedThreat]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-500';
      case 'warning': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500';
      case 'info': return 'text-blue-400 bg-blue-900/30 border-blue-500';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔍';
    }
  };

  const clearInactiveThreats = () => {
    setActiveThreats(prev => prev.filter(threat => threat.active));
  };

  // If StealthViral is selected and active, show the defense component
  if (selectedThreat?.type === 'StealthViral' && selectedThreat.active) {
    return <DefenderStealthViral />;
  }

  return (
    <AppContainer backgroundColor="bg-red-950">
      <AppHeader title="Virus Defense Center" />
      <div className="flex-1 p-4 space-y-4 text-white overflow-y-auto">
        <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700">
          <div className="text-sm text-gray-300 mb-2">
            Monitor and respond to active virus threats targeting your device.
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-400">
              Active Threats: <span className="text-red-400 font-bold">
                {activeThreats.filter(t => t.active).length}
              </span>
            </div>
            <button
              onClick={clearInactiveThreats}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
            >
              Clear Resolved
            </button>
          </div>
        </div>

        {activeThreats.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-4xl mb-4">🛡️</div>
            <div className="text-sm text-gray-300 mb-2">System Secure</div>
            <div className="text-xs text-gray-400">No active virus threats detected.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeThreats.map(threat => (
              <div
                key={threat.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                  getSeverityColor(threat.severity)
                } ${!threat.active ? 'opacity-50' : ''}`}
                onClick={() => threat.active && setSelectedThreat(threat)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getSeverityIcon(threat.severity)}</span>
                      <span className="font-semibold text-sm">{threat.type}</span>
                      {!threat.active && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                          RESOLVED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-300 mb-2">
                      {threat.message}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(threat.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {threat.active && (
                    <div className="text-xs bg-white/10 px-2 py-1 rounded">
                      Click to Respond
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
          <div className="mb-2 font-semibold">Threat Response Guide:</div>
          <div className="space-y-1">
            <div>• <span className="text-yellow-400">StealthViral</span>: Click rapidly to neutralize before system takeover</div>
            <div>• <span className="text-red-400">DataMiner X</span>: Cannot be stopped, change wallet credentials immediately</div>
            <div>• <span className="text-red-400">SysTrojan Pro</span>: Device destruction imminent, evacuate immediately</div>
          </div>
        </div>
      </div>
    </AppContainer>
  );
};

export default VirusDefenseCenter;
