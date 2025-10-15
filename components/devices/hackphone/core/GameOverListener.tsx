'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

interface GameOverListenerProps {
  teamId?: string;
  deviceId?: string;
  enabled?: boolean;
}

const GameOverListener: React.FC<GameOverListenerProps> = ({ 
  teamId, 
  deviceId, 
  enabled = true 
}) => {
  const router = useRouter();
  const { gameOverEvents } = useSocket();

  useEffect(() => {
    if (!enabled || !teamId) return;

    // Check for game over events targeted at this team or global termination
    const relevantGameOver = gameOverEvents.find(event => 
      event.sessionId === teamId || 
      event.winner === teamId ||
      event.sessionId === 'TERMINATED' || // Global game termination
      // Check if it's a recent event (within last 5 seconds)
      (Date.now() - event.ts < 5000)
    );

    if (relevantGameOver) {
      
      // Clear device data
      try {
        localStorage.removeItem('device_mac_address');
        localStorage.removeItem('hackphone_password');
        localStorage.removeItem('device_user');
      } catch {
        // localStorage not available
      }

      // Redirect to game over page for termination or maintenance for device issues
      if (relevantGameOver.sessionId === 'TERMINATED') {
        router.push('/game-over');
      } else if (deviceId) {
        router.push(`/device-maintenance?deviceId=${encodeURIComponent(deviceId)}&reason=maintenance`);
      } else {
        router.push('/device-selection');
      }
    }
  }, [gameOverEvents, teamId, deviceId, router, enabled]);

  return null; // This is a headless component
};

export default GameOverListener;
