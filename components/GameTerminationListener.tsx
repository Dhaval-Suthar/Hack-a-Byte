'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

export default function GameTerminationListener() {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleGameTermination = (data: unknown) => {
      
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
