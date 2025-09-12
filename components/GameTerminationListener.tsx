'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface GameTerminationData {
  message: string;
  timestamp: string;
  devicesOfflined: number;
}

export default function GameTerminationListener() {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleGameTermination = (data: GameTerminationData) => {
      console.log('Game terminated:', data);
      
      // Show notification to user
      if (typeof window !== 'undefined') {
        // Redirect to game over page after a short delay
        setTimeout(() => {
          window.location.href = '/game-over';
        }, 1000);
      }
    };

    socket.on('game-terminated', handleGameTermination);

    return () => {
      socket.off('game-terminated', handleGameTermination);
    };
  }, [socket]);

  return null; // This component doesn't render anything
}
