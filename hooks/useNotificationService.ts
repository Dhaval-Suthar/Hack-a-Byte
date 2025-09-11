"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface NotificationData {
  id: string;
  type: 'sms' | 'email';
  title: string;
  body: string;
  timestamp: Date;
  appIcon: string;
}

export function useNotificationService(teamId: string | undefined) {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const { joinTeam, socket, isConnected, virusNotifications } = useSocket();
  const lastJoinedTeamRef = useRef<string | undefined>(undefined);
  const processedVirusRef = useRef<Set<number>>(new Set());
  const deviceMacRef = useRef<string | null>(null);

  // Load device MAC once (client only)
  useEffect(() => {
    try {
      deviceMacRef.current = typeof window !== 'undefined' ? localStorage.getItem('device_mac_address') : null;
    } catch {
      deviceMacRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!teamId || !isConnected) return;
    if (lastJoinedTeamRef.current === teamId) return; // avoid duplicate join attempts
    // Join the team room to receive scoped events
    console.log('🏠 NotificationService: Joining team room:', teamId);
    joinTeam(teamId);
    lastJoinedTeamRef.current = teamId;
  }, [teamId, joinTeam, isConnected]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handler = (evt: { teamId: string; type: 'sms'|'email'; id: string; content: string; subject?: string; sender?: string; timestamp: number; }) => {
      console.log('🔔 Notification received:', evt);
      if (teamId && evt.teamId !== teamId) return; // extra guard
      const isSms = evt.type === 'sms';
      setNotification({
        id: `${evt.type}-${evt.id}`,
        type: evt.type,
        title: isSms ? `Text Message from ${evt.sender ?? 'Unknown'}` : (evt.subject ?? 'New Mail'),
        body: isSms ? (evt.content.length > 60 ? evt.content.substring(0, 60) + '...' : evt.content) : `From: ${evt.sender ?? 'Unknown'}`,
        timestamp: new Date(evt.timestamp),
        appIcon: isSms ? 'sms' : 'email',
      });
    };
    socket.on('message-created', handler);
    return () => {
      socket.off('message-created', handler);
    };
  }, [socket, isConnected, teamId]);

  // Surface virus notifications as home-banner alerts
  useEffect(() => {
    if (!virusNotifications.length) return;
    const mac = deviceMacRef.current;
    for (const vn of virusNotifications) {
      // Avoid duplicates by timestamp
      if (!vn || typeof vn.ts !== 'number') continue;
      if (processedVirusRef.current.has(vn.ts)) continue;
      const matchesTeam = teamId && (vn as { targetTeamId?: string }).targetTeamId === teamId;
      const matchesKey = vn.targetKey === teamId || (mac && vn.targetKey === mac);
      if (matchesTeam || matchesKey) {
        processedVirusRef.current.add(vn.ts);
        const title = vn.virusType === 'DataMiner X' ? 'Security Alert: DataMiner X' : `Security Alert: ${vn.virusType}`;
        const body = vn.message ?? 'Threat detected on your device.';
        setNotification({
          id: `virus-${vn.virusType}-${vn.ts}`,
          type: 'sms',
          title,
          body,
          timestamp: new Date(vn.ts),
          appIcon: 'sms',
        });
      }
    }
  }, [virusNotifications, teamId]);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    dismissNotification
  };
}
