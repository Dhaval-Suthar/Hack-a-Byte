"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { shouldShowVirusNotification } from '@/lib/virus-notifications-client';

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
  const userRoleRef = useRef<string | null>(null);
  const teamSizeRef = useRef<number>(1);

  // Load device MAC once (client only)
  useEffect(() => {
    try {
      deviceMacRef.current = typeof window !== 'undefined' ? localStorage.getItem('device_mac_address') : null;
    } catch {
      deviceMacRef.current = null;
    }
  }, []);

  // Load user role and team size (client only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        userRoleRef.current = localStorage.getItem('selectedRole');
        const cachedTeamSize = localStorage.getItem('teamSize');
        if (cachedTeamSize) {
          teamSizeRef.current = parseInt(cachedTeamSize, 10);
        }
      } catch {
        userRoleRef.current = null;
        teamSizeRef.current = 1;
      }
    }
  }, []);

  useEffect(() => {
    if (!teamId || !isConnected) return;
    if (lastJoinedTeamRef.current === teamId) return;
    joinTeam(teamId);
    lastJoinedTeamRef.current = teamId;
  }, [teamId, joinTeam, isConnected]);

  // Listen for new email/SMS messages via pure socket events
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handler = (evt: { 
      teamId: string; 
      type: 'sms' | 'email'; 
      id: string; 
      content: string; 
      subject?: string; 
      sender?: string; 
      timestamp: number; 
    }) => {
      if (teamId && evt.teamId !== teamId) return;
      
      const isSms = evt.type === 'sms';
      setNotification({
        id: `${evt.type}-${evt.id}`,
        type: evt.type,
        title: isSms ? `New Message from ${evt.sender ?? 'Unknown'}` : (evt.subject ?? 'New Email'),
        body: isSms 
          ? (evt.content.length > 60 ? evt.content.substring(0, 60) + '...' : evt.content)
          : `From: ${evt.sender ?? 'Unknown'}`,
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
        // Check if this user should see virus notifications
        const shouldShow = shouldShowVirusNotification(
          userRoleRef.current, 
          teamSizeRef.current, 
          vn as unknown as Record<string, unknown>
        );
        
        if (!shouldShow) {
          // User doesn't have permission to see this virus notification
          processedVirusRef.current.add(vn.ts); // Mark as processed to avoid showing again
          continue;
        }
        
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