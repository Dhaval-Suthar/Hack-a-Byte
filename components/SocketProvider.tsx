'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getPlayspaceId } from '@/lib/playspace-utils';
import { logger } from '@/lib/logger';

// Global socket state - use window object to ensure truly global state across all React instances
declare global {
  interface Window {
    __GLOBAL_SOCKET__?: Socket;
    __SOCKET_CONNECTING__?: boolean;
    __SOCKET_CREATION_COUNT__?: number;
  }
}

const getGlobalSocket = () => {
  if (typeof window === 'undefined') return null;
  return window.__GLOBAL_SOCKET__ || null;
};

const setGlobalSocket = (socket: Socket | null) => {
  if (typeof window === 'undefined') return;
  if (socket) {
    window.__GLOBAL_SOCKET__ = socket;
  } else {
    delete window.__GLOBAL_SOCKET__;
  }
};

const isConnectingGlobally = () => {
  if (typeof window === 'undefined') return false;
  return window.__SOCKET_CONNECTING__ || false;
};

const setConnectingGlobally = (connecting: boolean) => {
  if (typeof window === 'undefined') return;
  window.__SOCKET_CONNECTING__ = connecting;
};

const incrementSocketCount = () => {
  if (typeof window === 'undefined') return 0;
  window.__SOCKET_CREATION_COUNT__ = (window.__SOCKET_CREATION_COUNT__ || 0) + 1;
  return window.__SOCKET_CREATION_COUNT__;
};

// Socket context
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
});

export const useGlobalSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useGlobalSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const existingSocket = getGlobalSocket();
    
    // If we already have a valid connection, reuse it
    if (existingSocket && existingSocket.connected) {
      console.log('🔌 Reusing existing connected socket');
      setSocket(existingSocket);
      setIsConnected(true);
      return;
    }

    // If we're already connecting, wait for it
    if (isConnectingGlobally()) {
      console.log('🔌 Socket connection already in progress, waiting...');
      return;
    }

    setConnectingGlobally(true);
    const count = incrementSocketCount();
    console.log('🔌 Creating NEW socket connection #', count);

    try {
      const base = (process.env.NEXT_PUBLIC_SOCKET_URL || '').trim() || window.location.origin;
      
      // Disconnect any existing socket first
      const oldSocket = getGlobalSocket();
      if (oldSocket) {
        oldSocket.disconnect();
        setGlobalSocket(null);
      }
      
      const newSocket = io(base, {
        path: '/api/socketio',
        transports: ['websocket'],
        timeout: 30000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        randomizationFactor: 0.5,
      });

      // Store the socket globally
      setGlobalSocket(newSocket);

      // Connection event handlers
      newSocket.on('connect', () => {
        logger.info('🔌 Global socket connected');
        setIsConnected(true);

        // Auto-join playspace for everyone who visits the site
        const playspaceId = getPlayspaceId();
        if (playspaceId) {
          newSocket.emit('join-playspace', playspaceId);
          logger.info('🎮 Auto-joined playspace:', { playspaceId });
        } else {
          logger.warn('No playspace ID found, cannot join playspace room');
        }

        // Emit a custom event to notify other parts of the app about reconnection
        newSocket.emit('client-reconnected');
      });

      newSocket.on('disconnect', (reason: string) => {
        logger.info('🔌 Global socket disconnected:', { reason });
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error: Error) => {
        logger.error('❌ Global socket connection error:', { error: error.message });
        setIsConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber: number) => {
        logger.info('🔄 Global socket reconnected', { attemptNumber });
        setIsConnected(true);
      });

      newSocket.on('reconnect_error', (error: Error) => {
        logger.warn('❌ Global socket reconnection error:', { error: error.message });
      });

      setSocket(newSocket);
    } catch (error) {
      logger.error('Failed to initialize global socket:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    } finally {
      setConnectingGlobally(false);
    }
  }, []);

  const disconnect = () => {
    const existingSocket = getGlobalSocket();
    if (existingSocket) {
      existingSocket.disconnect();
      setGlobalSocket(null);
      setSocket(null);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    // Auto-connect when the provider mounts
    connect();

    // Cleanup on unmount
    return () => {
      // Don't disconnect here to maintain the connection throughout the session
      // Only disconnect if the user explicitly navigates away or closes the tab
    };
  }, [connect]);

  // Listen for page unload to clean up the connection
  useEffect(() => {
    const handleBeforeUnload = () => {
      const existingSocket = getGlobalSocket();
      if (existingSocket) {
        existingSocket.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}