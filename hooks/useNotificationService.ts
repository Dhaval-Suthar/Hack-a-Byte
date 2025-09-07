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
  const { joinTeam, socket, isConnected } = useSocket();
  const lastJoinedTeamRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!teamId || !isConnected) return;
    if (lastJoinedTeamRef.current === teamId) return; // avoid duplicate join attempts
    // Join the team room to receive scoped events
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

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    dismissNotification
  };
}
