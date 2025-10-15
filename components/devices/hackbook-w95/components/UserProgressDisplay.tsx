"use client";

import { useState, useEffect } from 'react';
import { getUserProgress } from '@/app/actions/userProgress';
import { UserGameState } from '@/models/DeviceUser';
import { logger } from '@/lib/logger';

interface UserProgressDisplayProps {
  className?: string;
}

export function UserProgressDisplay({ className = "" }: UserProgressDisplayProps) {
  const [gameState, setGameState] = useState<UserGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProgress = async () => {
      const deviceId = localStorage.getItem('selectedDeviceId');
      const deviceType = 'hackbook-w95';

      if (!deviceId) {
        setError('No device ID found');
        setLoading(false);
        return;
      }

      try {
        const result = await getUserProgress(deviceId, deviceType);
        
        if (result.success && result.gameState) {
          setGameState(result.gameState);
        } else {
          setError(result.error || 'Failed to load progress');
        }
      } catch (error) {
        setError('Error loading user progress');
        logger.error('Error loading user progress:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProgress();
  }, []);

  if (loading) {
    return (
      <div className={`p-4 bg-[#c0c0c0] border-2 border-inset ${className}`}>
        <p>Loading user progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-[#c0c0c0] border-2 border-inset ${className}`}>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className={`p-4 bg-[#c0c0c0] border-2 border-inset ${className}`}>
        <p>No progress data available</p>
      </div>
    );
  }

  const completedMissions = Object.values(gameState.missions || {}).filter(mission => mission.completed);
  const totalMissions = Object.keys(gameState.missions || {}).length;

  return (
    <div className={`p-4 bg-[#c0c0c0] border-2 border-inset ${className}`}>
      <div className="mb-4">
        <h3 className="font-bold text-lg mb-2">User Progress Summary</h3>
        
        <div className="mb-3">
          <h4 className="font-semibold">Game Statistics</h4>
          <p>Login Count: {gameState.gameStats?.loginCount || 0}</p>
          <p>Total Play Time: {Math.floor((gameState.gameStats?.totalPlayTime || 0) / 60)} hours</p>
          <p>Last Login: {gameState.gameStats?.lastLoginDate ? new Date(gameState.gameStats.lastLoginDate).toLocaleDateString() : 'Never'}</p>
        </div>

        <div className="mb-3">
          <h4 className="font-semibold">Mission Progress</h4>
          <p>Completed: {completedMissions.length} / {totalMissions}</p>
          <div className="mt-2 space-y-1">
            {Object.entries(gameState.missions || {}).map(([missionId, mission]) => (
              <div key={missionId} className="flex items-center">
                <span className={`inline-block w-3 h-3 mr-2 ${mission.completed ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className={mission.completed ? 'line-through' : ''}>{mission.title || missionId}</span>
                {mission.progress !== undefined && (
                  <span className="ml-auto">({mission.progress}%)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <h4 className="font-semibold">Unlocked Applications</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {gameState.unlockedApplications?.map(app => (
              <span key={app} className="px-2 py-1 bg-blue-200 text-xs rounded">{app}</span>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <h4 className="font-semibold">Achievements</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {gameState.gameStats?.achievementsUnlocked?.map(achievement => (
              <span key={achievement} className="px-2 py-1 bg-yellow-200 text-xs rounded">{achievement}</span>
            )) || <span className="text-gray-500 text-xs">No achievements yet</span>}
          </div>
        </div>

        <div>
          <h4 className="font-semibold">Settings</h4>
          <p>Sound: {gameState.settings?.soundEnabled ? 'Enabled' : 'Disabled'}</p>
          <p>Show Hidden Files: {gameState.settings?.showHiddenFiles ? 'Yes' : 'No'}</p>
          <p>Difficulty: {gameState.settings?.difficulty || 'Medium'}</p>
        </div>
      </div>
    </div>
  );
}

export default UserProgressDisplay;
