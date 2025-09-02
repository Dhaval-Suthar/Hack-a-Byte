'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getPlayspaceId } from '@/lib/playspace-utils';

export interface AttackData {
  attackerPlayspaceId: string;
  targetInfo: string;
  malwareType: string;
  malwareId: string;
  attackerName: string;
  timestamp: number;
}

export interface AttackEffect {
  playspaceId: string;
  effect: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  timestamp: number;
}

export interface TournamentUpdate {
  tournamentId: string;
  type: 'registration' | 'start' | 'match_update' | 'end';
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface ChatMessage {
  teamId: string;
  message: string;
  senderId?: string; // Made optional
  senderName: string;
  type?: string;
  timestamp: number;
}

export interface AchievementNotification {
  userId: string;
  achievementId: string;
  achievementName: string;
  points: number;
  timestamp: number;
}

export interface WalletUpdate {
  teamId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: number;
}

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: string;
  timestamp: number;
}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingAttacks, setIncomingAttacks] = useState<AttackData[]>([]);
  const [globalEffects, setGlobalEffects] = useState<AttackEffect[]>([]);
  const [tournamentUpdates, setTournamentUpdates] = useState<TournamentUpdate[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [achievementNotifications, setAchievementNotifications] = useState<AchievementNotification[]>([]);
  const [walletUpdates, setWalletUpdates] = useState<WalletUpdate[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('useSocket hook initialized');
    // Initialize socket connection
    const initSocket = async () => {
      if (typeof window === 'undefined') {
        console.log('useSocket: Skipping server-side execution');
        return;
      }

      console.log('useSocket: Initializing socket connection');

      try {
        console.log('Initializing Socket.IO client connection to:', process.env.NODE_ENV === 'production' ? '' : window.location.origin);
        const newSocket = io(process.env.NODE_ENV === 'production' ? '' : window.location.origin, {
          path: '/api/socketio',
          transports: ['websocket', 'polling'],
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
          console.log('✅ Connected to Socket.IO server');
          setIsConnected(true);

          // Join playspace room
          const playspaceId = getPlayspaceId();
          console.log('Device playspace ID for room joining:', playspaceId);
          if (playspaceId) {
            newSocket.emit('join-playspace', playspaceId);
            console.log('Joined playspace:', playspaceId);
          } else {
            console.warn('No playspace ID found, cannot join room');
          }
        });

        newSocket.on('disconnect', () => {
          console.log('❌ Disconnected from Socket.IO server');
          setIsConnected(false);
        });

        // Handle incoming attacks
        newSocket.on('incoming-attack', (attackData: AttackData) => {
          console.log('Incoming attack received:', attackData);
          setIncomingAttacks(prev => [...prev, attackData]);

          // Auto-remove after 10 seconds
          setTimeout(() => {
            setIncomingAttacks(prev => prev.filter(attack => attack.timestamp !== attackData.timestamp));
          }, 10000);
        });

        // Handle attack confirmation
        newSocket.on('attack-sent', (attackData: AttackData) => {
          console.log('Attack sent confirmation:', attackData);
        });

        // Handle global effects
        newSocket.on('global-effect', (effectData: AttackEffect) => {
          console.log('Global effect triggered:', effectData);
          setGlobalEffects(prev => [...prev, effectData]);

          // Auto-remove after duration or 30 seconds
          setTimeout(() => {
            setGlobalEffects(prev => prev.filter(effect => effect.timestamp !== effectData.timestamp));
          }, effectData.duration || 30000);
        });

        // Handle tournament updates
        newSocket.on('tournament-notification', (updateData: TournamentUpdate) => {
          console.log('Tournament update received:', updateData);
          setTournamentUpdates(prev => [...prev, updateData]);
        });

        // Handle new chat messages
        newSocket.on('new-message', (messageData: ChatMessage) => {
          console.log('New chat message received:', messageData);
          setChatMessages(prev => [...prev, messageData]);
        });

        // Handle achievement notifications
        newSocket.on('achievement-notification', (achievementData: AchievementNotification) => {
          console.log('Achievement notification received:', achievementData);
          setAchievementNotifications(prev => [...prev, achievementData]);
        });

        // Handle wallet updates
        newSocket.on('wallet-update', (walletData: WalletUpdate) => {
          console.log('Wallet update received:', walletData);
          setWalletUpdates(prev => [...prev, walletData]);
        });

        // Handle notifications
        newSocket.on('new-notification', (notificationData: NotificationData) => {
          console.log('Notification received:', notificationData);
          setNotifications(prev => [...prev, notificationData]);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          setIsConnected(false);
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Function to send malware attack
  const sendMalwareAttack = (attackData: Omit<AttackData, 'timestamp'>) => {
    console.log('sendMalwareAttack called with:', attackData);
    console.log('Socket connected:', isConnected);
    console.log('Socket object:', socket);

    if (socket && isConnected) {
      socket.emit('malware-attack', attackData);
      console.log('Malware attack sent:', attackData);
    } else {
      console.warn('Socket not connected, cannot send attack');
    }
  };

  // Function to trigger attack effect
  const triggerAttackEffect = (effectData: Omit<AttackEffect, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('attack-effect', effectData);
      console.log('Attack effect triggered:', effectData);
    } else {
      console.warn('Socket not connected, cannot trigger effect');
    }
  };

  // Function to join team room
  const joinTeam = (teamId: string) => {
    if (socket && isConnected) {
      socket.emit('join-team', teamId);
      console.log('Joined team room:', teamId);
    } else {
      console.warn('Socket not connected, cannot join team');
    }
  };

  // Function to join user room
  const joinUser = (userId: string) => {
    if (socket && isConnected) {
      socket.emit('join-user', userId);
      console.log('Joined user room:', userId);
    } else {
      console.warn('Socket not connected, cannot join user');
    }
  };

  // Function to join tournament room
  const joinTournament = (tournamentId: string) => {
    if (socket && isConnected) {
      socket.emit('join-tournament', tournamentId);
      console.log('Joined tournament room:', tournamentId);
    } else {
      console.warn('Socket not connected, cannot join tournament');
    }
  };

  // Function to send chat message
  const sendMessage = (messageData: Omit<ChatMessage, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('send-message', messageData);
      console.log('Chat message sent:', messageData);
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  };

  // Function to send tournament update
  const sendTournamentUpdate = (updateData: Omit<TournamentUpdate, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('tournament-update', updateData);
      console.log('Tournament update sent:', updateData);
    } else {
      console.warn('Socket not connected, cannot send tournament update');
    }
  };

  // Function to send achievement notification
  const sendAchievementNotification = (achievementData: Omit<AchievementNotification, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('achievement-unlocked', achievementData);
      console.log('Achievement notification sent:', achievementData);
    } else {
      console.warn('Socket not connected, cannot send achievement notification');
    }
  };

  // Function to send wallet update
  const sendWalletUpdate = (walletData: Omit<WalletUpdate, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('wallet-transaction', walletData);
      console.log('Wallet update sent:', walletData);
    } else {
      console.warn('Socket not connected, cannot send wallet update');
    }
  };

  // Function to send notification
  const sendNotification = (notificationData: Omit<NotificationData, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('send-notification', notificationData);
      console.log('Notification sent:', notificationData);
    } else {
      console.warn('Socket not connected, cannot send notification');
    }
  };

  return {
    socket,
    isConnected,
    incomingAttacks,
    globalEffects,
    tournamentUpdates,
    chatMessages,
    achievementNotifications,
    walletUpdates,
    notifications,
    sendMalwareAttack,
    triggerAttackEffect,
    joinTeam,
    joinUser,
    joinTournament,
    sendMessage,
    sendTournamentUpdate,
    sendAchievementNotification,
    sendWalletUpdate,
    sendNotification,
  };
};
