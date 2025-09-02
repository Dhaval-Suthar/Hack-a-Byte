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

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingAttacks, setIncomingAttacks] = useState<AttackData[]>([]);
  const [globalEffects, setGlobalEffects] = useState<AttackEffect[]>([]);
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
          console.log('Connected to Socket.IO server');
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
          console.log('Disconnected from Socket.IO server');
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

  return {
    socket,
    isConnected,
    incomingAttacks,
    globalEffects,
    sendMalwareAttack,
    triggerAttackEffect,
  };
};
