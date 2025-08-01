"use client";

import { useState, useEffect, useCallback } from 'react';
import { userStorage } from './useUserStorage';
import { 
  getUserProgress, 
  updateMissionProgress, 
  getMissionStatus,
  bulkUpdateMissions 
} from '@/app/actions/userProgress';
import { MissionProgress } from '@/models/DeviceUser';

export interface Mission {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  startedAt?: Date | string;
  completedAt?: Date | string;
  progress?: number;
  objectives?: {
    id: string;
    description: string;
    completed: boolean;
  }[];
}

// Helper function to convert Mission to MissionProgress
function missionToMissionProgress(mission: Mission): MissionProgress {
  return {
    ...mission,
    startedAt: mission.startedAt ? (typeof mission.startedAt === 'string' ? new Date(mission.startedAt) : mission.startedAt) : undefined,
    completedAt: mission.completedAt ? (typeof mission.completedAt === 'string' ? new Date(mission.completedAt) : mission.completedAt) : undefined
  };
}

// Helper function to convert MissionProgress to Mission
function missionProgressToMission(missionProgress: MissionProgress): Mission {
  return {
    ...missionProgress,
    startedAt: missionProgress.startedAt ? missionProgress.startedAt.toISOString() : undefined,
    completedAt: missionProgress.completedAt ? missionProgress.completedAt.toISOString() : undefined
  };
}

// Helper function to convert Record<string, Mission> to Record<string, MissionProgress>
function missionsToMissionProgress(missions: Record<string, Mission>): Record<string, MissionProgress> {
  const result: Record<string, MissionProgress> = {};
  for (const [key, mission] of Object.entries(missions)) {
    result[key] = missionToMissionProgress(mission);
  }
  return result;
}

// Enhanced mission tracker that syncs with database
export function useDatabaseMissionTracker() {
  const [missions, setMissions] = useState<Record<string, Mission>>({});
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<string | null>(null);

  // Get device info from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('selectedDeviceId');
      const type = 'hackbook-w95'; // Could be dynamic based on current device
      setDeviceId(id);
      setDeviceType(type);
    }
  }, []);

  // Load missions from database and merge with localStorage
  useEffect(() => {
    const loadMissions = async () => {
      if (!deviceId || !deviceType) return;

      try {
        setSyncing(true);

        // First load from localStorage for immediate availability
        const localMissions = userStorage.getItem('win95Missions', {}) as Record<string, Mission>;
        setMissions(localMissions);

        // Then load from database
        const result = await getUserProgress(deviceId, deviceType);
        
        if (result.success && result.gameState) {
          const dbMissions = result.gameState.missions || {};
          
          // Convert database missions to Mission format
          const dbMissionsConverted: Record<string, Mission> = {};
          for (const [missionId, dbMission] of Object.entries(dbMissions)) {
            dbMissionsConverted[missionId] = missionProgressToMission(dbMission);
          }
          
          // Merge localStorage and database missions
          // Database takes precedence for conflicts
          const mergedMissions = { ...localMissions };
          
          // Add/update missions from database
          for (const [missionId, dbMission] of Object.entries(dbMissionsConverted)) {
            const localMission = localMissions[missionId];
            
            // If database mission is more recent or local doesn't exist, use database version
            if (!localMission || 
                (dbMission.completedAt && (!localMission.completedAt || new Date(dbMission.completedAt) > new Date(localMission.completedAt)))) {
              mergedMissions[missionId] = dbMission;
            }
          }

          // Check if we need to sync localStorage missions to database
          const missionsToSync: Record<string, Mission> = {};
          for (const [missionId, localMission] of Object.entries(localMissions)) {
            const dbMission = dbMissionsConverted[missionId];
            
            if (!dbMission || 
                (localMission.completedAt && (!dbMission.completedAt || new Date(localMission.completedAt) > new Date(dbMission.completedAt)))) {
              missionsToSync[missionId] = localMission;
            }
          }

          // Sync local missions to database if needed
          if (Object.keys(missionsToSync).length > 0) {
            await bulkUpdateMissions(deviceId, deviceType, missionsToMissionProgress(missionsToSync));
          }

          setMissions(mergedMissions);
          
          // Update localStorage with merged missions
          userStorage.setItem('win95Missions', mergedMissions);
        }
        
        setLoaded(true);
      } catch (error) {
        console.error('Error loading missions from database:', error);
        // Fall back to localStorage only
        const localMissions = userStorage.getItem('win95Missions', {}) as Record<string, Mission>;
        setMissions(localMissions);
        setLoaded(true);
      } finally {
        setSyncing(false);
      }
    };

    loadMissions();
  }, [deviceId, deviceType]);

  // Save to both localStorage and database when missions change
  const syncMissions = useCallback(async (updatedMissions: Record<string, Mission>) => {
    if (!loaded || !deviceId || !deviceType) return;

    try {
      // Save to localStorage immediately
      userStorage.setItem('win95Missions', updatedMissions);
      
      // Save to database (async)
      await bulkUpdateMissions(deviceId, deviceType, missionsToMissionProgress(updatedMissions));
    } catch (error) {
      console.error('Error syncing missions to database:', error);
      // Even if database sync fails, we still have localStorage
    }
  }, [loaded, deviceId, deviceType]);

  // Start a new mission
  const startMission = useCallback((mission: Omit<Mission, 'startedAt' | 'completedAt' | 'completed'>) => {
    const newMission: Mission = {
      ...mission,
      completed: false,
      startedAt: new Date().toISOString(),
      progress: 0,
      objectives: mission.objectives?.map(obj => ({
        ...obj,
        completed: false
      }))
    };

    const updatedMissions = {
      ...missions,
      [mission.id]: newMission
    };

    setMissions(updatedMissions);
    syncMissions(updatedMissions);

    // Also update the specific mission flag for backward compatibility
    userStorage.setItem(`${mission.id}Started`, true);
  }, [missions, syncMissions]);

  // Complete an objective within a mission
  const completeObjective = useCallback((missionId: string, objectiveId: string) => {
    setMissions(prev => {
      const mission = prev[missionId];
      if (!mission || !mission.objectives) return prev;
      
      const objectives = mission.objectives.map(obj => 
        obj.id === objectiveId ? { ...obj, completed: true } : obj
      );
      
      // Calculate overall mission progress
      const totalObjectives = objectives.length;
      const completedObjectives = objectives.filter(obj => obj.completed).length;
      const progress = Math.floor((completedObjectives / totalObjectives) * 100);

      const updatedMissions = {
        ...prev,
        [missionId]: {
          ...mission,
          objectives,
          progress
        }
      };

      // Sync to database
      syncMissions(updatedMissions);

      return updatedMissions;
    });
  }, [syncMissions]);

  // Complete an entire mission
  const completeMission = useCallback(async (missionId: string) => {
    const mission = missions[missionId];
    if (!mission) return;
    
    const updatedMission: Mission = {
      ...mission,
      completed: true,
      completedAt: new Date().toISOString(),
      progress: 100,
      objectives: mission.objectives?.map(obj => ({ ...obj, completed: true }))
    };

    const updatedMissions = {
      ...missions,
      [missionId]: updatedMission
    };

    setMissions(updatedMissions);

    // Sync to database
    if (deviceId && deviceType) {
      try {
        await updateMissionProgress(deviceId, deviceType, missionId, missionToMissionProgress(updatedMission));
      } catch (error) {
        console.error('Error updating mission in database:', error);
      }
    }

    // Update localStorage
    userStorage.setItem('win95Missions', updatedMissions);
    
    // Dispatch event for other components to react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('missionComplete', { 
        detail: { missionId, mission: updatedMission } 
      }));
    }
    
    // Also set specific mission flags for backward compatibility
    userStorage.setItem(`${missionId}Completed`, true);
  }, [missions, deviceId, deviceType]);

  // Check if a mission is completed
  const isMissionCompleted = useCallback((missionId: string) => {
    // First check the new format
    if (missions[missionId]?.completed) return true;
    
    // Fall back to legacy format if not found
    return userStorage.getItem(`${missionId}Completed`, false);
  }, [missions]);

  // Get mission status from database
  const getMissionFromDatabase = useCallback(async (missionId: string) => {
    if (!deviceId || !deviceType) return null;

    try {
      const result = await getMissionStatus(deviceId, deviceType, missionId);
      return result.success && result.mission ? missionProgressToMission(result.mission) : null;
    } catch (error) {
      console.error('Error getting mission from database:', error);
      return null;
    }
  }, [deviceId, deviceType]);

  return {
    missions,
    loaded,
    syncing,
    startMission,
    completeObjective,
    completeMission,
    isMissionCompleted,
    getMissionFromDatabase
  };
}

// Static helper for direct mission status checks without React (enhanced with database support)
export const DatabaseMissionTracker = {
  isMissionCompleted: (missionId: string): boolean => {
    // First check new format in localStorage
    const missions = userStorage.getItem('win95Missions', {}) as Record<string, Mission>;
    if (missions[missionId]?.completed) return true;
    
    // Fall back to legacy format
    return userStorage.getItem(`${missionId}Completed`, false) as boolean;
  },
  
  completeMission: async (missionId: string, deviceId?: string, deviceType?: string): Promise<void> => {
    // Update in localStorage for immediate effect
    userStorage.setItem(`${missionId}Completed`, true);
    
    // Also update in the new format if it exists
    const missions = userStorage.getItem('win95Missions', {}) as Record<string, Mission>;
    if (missions[missionId]) {
      missions[missionId] = {
        ...missions[missionId],
        completed: true,
        completedAt: new Date().toISOString(),
        progress: 100
      };
      userStorage.setItem('win95Missions', missions);
    }

    // Update database if device info is provided
    if (deviceId && deviceType) {
      try {
        await updateMissionProgress(deviceId, deviceType, missionId, {
          completed: true,
          completedAt: new Date(),
          progress: 100
        });
      } catch (error) {
        console.error('Error updating mission in database:', error);
      }
    }
  }
};

// Export the original hook for backward compatibility
export { useMissionTracker } from './useMissionTracker';

export default useDatabaseMissionTracker;
