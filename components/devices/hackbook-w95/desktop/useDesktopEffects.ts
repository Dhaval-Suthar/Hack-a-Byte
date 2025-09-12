"use client";

import { useEffect } from "react";
import audioManager from "../hooks/useAudioManager";

export const useDesktopEffects = (
  isClient: boolean,
  setIsClient: (value: boolean) => void,
  networkToolInstalled: boolean,
  setNetworkToolInstalled: (value: boolean) => void,
  neuralNetworkUnlocked: boolean,
  setNeuralNetworkUnlocked: (value: boolean) => void,
  deviceId: string | null,
  setUnlockedApplications: (value: string[]) => void,
  setVaultUnlocked: (value: boolean) => void,
  setDevToolsUnlocked: (value: boolean) => void
) => {
  // Set client state after hydration to prevent SSR mismatch
  useEffect(() => {
    setIsClient(true);

    // Preload common sounds after component mounts
    const commonSounds = [
      "/hackbook-W95/sounds/ding.mp3",
      "/hackbook-W95/sounds/click.mp3",
      "/hackbook-W95/sounds/open.mp3",
      "/hackbook-W95/sounds/close.mp3",
      "/hackbook-W95/sounds/minimize.mp3",
      "/hackbook-W95/sounds/error.mp3"
    ];

    // Preload after a brief delay to not block initial render
    setTimeout(() => {
      audioManager.preloadSounds(commonSounds);
    }, 1000);
  }, [setIsClient]);

  // Check if Mission 1 is completed to show Network Neighborhood
  useEffect(() => {
    let isMounted = true;

    const checkMission1Status = async () => {
      if (!isMounted) return;

      try {
        const { MissionTracker } = await import('../hooks/useMissionTracker');

        if (!isMounted) return;

        const mission1Complete = MissionTracker.isMissionCompleted('mission1');
        if (isMounted) {
          setNetworkToolInstalled(mission1Complete);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error checking mission status:', error);
        }
      }
    };

    checkMission1Status();

    return () => {
      isMounted = false;
    };
  }, [setNetworkToolInstalled]);

  // Load game state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Only load from localStorage if the state isn't already set from database
      // Check if network tool is installed
      if (localStorage.getItem("networkToolInstalled") === "true") {
        setNetworkToolInstalled(true);
      }

      // Check if neural network has been unlocked
      if (localStorage.getItem("neuralNetworkUnlocked") === "true") {
        setNeuralNetworkUnlocked(true);
      }

      // Check if secure vault has been completed
      if (localStorage.getItem("secureVaultCompleted") === "true") {
        setVaultUnlocked(true);
      }

      // Check if dev tools have been unlocked
      if (localStorage.getItem("devToolsUnlocked") === "true") {
        setDevToolsUnlocked(true);
      }
    }
  }, [setNetworkToolInstalled, setNeuralNetworkUnlocked, setVaultUnlocked, setDevToolsUnlocked]);

  // Check if Neural Network data is discovered to show Neural Network Analyzer
  useEffect(() => {
    let isMounted = true;

    const checkNeuralNetworkUnlock = async () => {
      if (!isMounted) return;

      try {
        const { MissionTracker } = await import('../hooks/useMissionTracker');

        if (!isMounted) return;

        // Unlock Neural Network Analyzer when network tool is installed and user has progressed
        const mission1Complete = MissionTracker.isMissionCompleted('mission1');
        const neuralDataDiscovered = MissionTracker.isMissionCompleted('neural_data_discovered');

        if (isMounted && ((mission1Complete && networkToolInstalled) || neuralDataDiscovered)) {
          setNeuralNetworkUnlocked(true);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error checking neural network unlock status:', error);
        }
      }
    };

    // Only run if networkToolInstalled changes to true
    if (networkToolInstalled) {
      checkNeuralNetworkUnlock();
    }

    return () => {
      isMounted = false;
    };
  }, [networkToolInstalled, setNeuralNetworkUnlocked]);

  // Check if Mission 2 is already completed on load
  useEffect(() => {
    let isMounted = true;

    const checkMission2Status = async () => {
      if (!isMounted) return;

      try {
        const { MissionTracker } = await import('../hooks/useMissionTracker');

        if (!isMounted) return;

        const mission2Complete = MissionTracker.isMissionCompleted('mission2');
        if (isMounted && mission2Complete) {
          // Mission 2 was completed previously, don't show the notification again
          // but make the firewall bypass available if needed
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error checking mission 2 status:', error);
        }
      }
    };

    checkMission2Status();

    return () => {
      isMounted = false;
    };
  }, []);

  // Enhanced mission checking with database support
  useEffect(() => {
    let isMounted = true;

    const checkMissionsFromDatabase = async () => {
      if (!deviceId || !isMounted) return;

      try {
        // Check Mission 1 status from database
        const { getMissionStatus } = await import('@/app/actions/userProgress');

        if (!isMounted) return;

        const mission1Result = await getMissionStatus(deviceId, 'hackbook-w95', 'mission1');
        if (isMounted && mission1Result.success && mission1Result.mission) {
          setNetworkToolInstalled(mission1Result.mission.completed);
        }

        if (!isMounted) return;

        // Check neural data discovered status
        const neuralResult = await getMissionStatus(deviceId, 'hackbook-w95', 'neural_data_discovered');
        if (isMounted && neuralResult.success && neuralResult.mission?.completed) {
          setNeuralNetworkUnlocked(true);
        }

        if (!isMounted) return;

        // Check Mission 2 status
        const mission2Result = await getMissionStatus(deviceId, 'hackbook-w95', 'mission2');
        if (isMounted && mission2Result.success && mission2Result.mission?.completed) {
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error checking mission statuses from database:', error);
          // Fall back to local storage checks if database fails
        }
      }
    };

    // Add a debounce delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      checkMissionsFromDatabase();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [deviceId, setNetworkToolInstalled, setNeuralNetworkUnlocked]);

  // Load unlocked applications from database
  useEffect(() => {
    let isMounted = true;

    const loadUnlockedApplications = async () => {
      if (!deviceId || !isMounted) return;

      try {
        const { getUnlockedApplications } = await import('@/app/actions/userProgress');
        const result = await getUnlockedApplications(deviceId, 'hackbook-w95');

        if (!isMounted) return;

        if (result.success && result.unlockedApplications) {
          setUnlockedApplications(result.unlockedApplications);

          // Update individual app states based on database data
          setNetworkToolInstalled(result.unlockedApplications.includes('Network Neighborhood'));
          setNeuralNetworkUnlocked(result.unlockedApplications.includes('Neural Network Analyzer'));
          setVaultUnlocked(result.unlockedApplications.includes('Secure Vault'));
          setDevToolsUnlocked(result.unlockedApplications.includes('Dev Tools'));
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading unlocked applications:', error);
        }
      }
    };

    loadUnlockedApplications();

    return () => {
      isMounted = false;
    };
  }, [deviceId, setUnlockedApplications, setNetworkToolInstalled, setNeuralNetworkUnlocked, setVaultUnlocked, setDevToolsUnlocked]);
};
