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

    // Check for game over events targeted at this team
    const relevantGameOver = gameOverEvents.find(event => 
      event.sessionId === teamId || 
      event.winner === teamId ||
      // Check if it's a recent event (within last 5 seconds)
      (Date.now() - event.ts < 5000)
    );

    if (relevantGameOver) {
      console.log('🎮 Game over event detected, redirecting:', relevantGameOver);
      
      // Clear device data
      try {
        localStorage.removeItem('device_mac_address');
        localStorage.removeItem('hackphone_password');
        localStorage.removeItem('device_user');
      } catch {
        // localStorage not available
      }

      // Redirect based on device status or to maintenance page
      if (deviceId) {
        router.push(`/device-maintenance?deviceId=${encodeURIComponent(deviceId)}&reason=maintenance`);
      } else {
        router.push('/device-selection');
      }
    }
  }, [gameOverEvents, teamId, deviceId, router, enabled]);

  return null; // This is a headless component
};

export default GameOverListener;
