"use client";

import { useState, useEffect } from 'react';
import { userStorage } from './useUserStorage';

export interface Mission {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  startedAt?: string;
  completedAt?: string;
  progress?: number;
  objectives?: {
    id: string;
    description: string;
    completed: boolean;
  }[];
}

// Custom hook for tracking user mission progress
export function useMissionTracker() {
  const [missions, setMissions] = useState<Record<string, Mission>>({});
  const [loaded, setLoaded] = useState(false);
  
  // Load missions from storage
  useEffect(() => {
    try {
      const savedMissions = userStorage.getItem('win95Missions', {});
      setMissions(savedMissions);
      setLoaded(true);
    } catch (error) {
      console.error('Error loading missions:', error);
      setLoaded(true);
    }
  }, []);
  
  // Save missions to storage when they change
  useEffect(() => {
    if (!loaded) return;
    
    try {
      userStorage.setItem('win95Missions', missions);
    } catch (error) {
      console.error('Error saving missions:', error);
    }
  }, [missions, loaded]);
  
  // Start a new mission
  const startMission = (mission: Omit<Mission, 'startedAt' | 'completedAt' | 'completed'>) => {
    setMissions(prev => ({
      ...prev,
      [mission.id]: {
        ...mission,
        completed: false,
        startedAt: new Date().toISOString(),
        progress: 0,
        objectives: mission.objectives?.map(obj => ({
          ...obj,
          completed: false
        }))
      }
    }));
    
    // Also update the specific mission flag for backward compatibility
    userStorage.setItem(`${mission.id}Started`, true);
  };
  
  // Complete an objective within a mission
  const completeObjective = (missionId: string, objectiveId: string) => {
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
      
      return {
        ...prev,
        [missionId]: {
          ...mission,
          objectives,
          progress
        }
      };
    });
  };
  
  // Complete an entire mission
  const completeMission = (missionId: string) => {
    setMissions(prev => {
      const mission = prev[missionId];
      if (!mission) return prev;
      
      const updatedMission = {
        ...mission,
        completed: true,
        completedAt: new Date().toISOString(),
        progress: 100,
        objectives: mission.objectives?.map(obj => ({ ...obj, completed: true }))
      };
      
      // Dispatch event for other components to react to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('missionComplete', { 
          detail: { missionId, mission: updatedMission } 
        }));
      }
      
      // Also set specific mission flags for backward compatibility
      userStorage.setItem(`${missionId}Completed`, true);
      
      return {
        ...prev,
        [missionId]: updatedMission
      };
    });
  };
  
  // Check if a mission is completed
  const isMissionCompleted = (missionId: string) => {
    // First check the new format
    if (missions[missionId]?.completed) return true;
    
    // Fall back to legacy format if not found
    return userStorage.getItem(`${missionId}Completed`, false);
  };
  
  return {
    missions,
    loaded,
    startMission,
    completeObjective,
    completeMission,
    isMissionCompleted
  };
}

// Static helper for direct mission status checks without React
export const MissionTracker = {
  isMissionCompleted: (missionId: string): boolean => {
    // First check new format
    const missions = userStorage.getItem('win95Missions', {}) as Record<string, Mission>;
    if (missions[missionId]?.completed) return true;
    
    // Fall back to legacy format
    return userStorage.getItem(`${missionId}Completed`, false);
  },
  
  completeMission: (missionId: string): void => {
    // Update in both formats for compatibility
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
    
    // Dispatch event for other components to react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('missionComplete', { 
        detail: { missionId } 
      }));
    }
  }
};

export default useMissionTracker;
