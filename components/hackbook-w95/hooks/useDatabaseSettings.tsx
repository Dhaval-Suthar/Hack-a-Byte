"use client";

import { useState, useEffect } from 'react';
import { updateUserSettings, getUserProgress } from '@/app/actions/userProgress';
import { userStorage } from '../hooks/useUserStorage';

interface UserSettings {
  soundEnabled: boolean;
  showHiddenFiles: boolean;
  difficulty: string;
}

interface DatabaseSettingsManagerProps {
  children: (settings: UserSettings, updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>, loaded: boolean) => React.ReactNode;
}

export function DatabaseSettingsManager({ children }: DatabaseSettingsManagerProps) {
  const [settings, setSettings] = useState<UserSettings>({
    soundEnabled: true,
    showHiddenFiles: false,
    difficulty: 'medium'
  });
  const [loaded, setLoaded] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<string | null>(null);

  // Get device info from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('selectedDeviceId');
      const type = 'hackbook-w95';
      setDeviceId(id);
      setDeviceType(type);
    }
  }, []);

  // Load settings from database and localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load from localStorage first for immediate availability
        const localSettings = {
          soundEnabled: userStorage.getItem('soundEnabled', true) as boolean,
          showHiddenFiles: userStorage.getItem('showHiddenFiles', false) as boolean,
          difficulty: userStorage.getItem('difficulty', 'medium') as string
        };
        setSettings(localSettings);

        // If we have device info, try to load from database
        if (deviceId && deviceType) {
          const result = await getUserProgress(deviceId, deviceType);
          
          if (result.success && result.gameState?.settings) {
            const dbSettings = result.gameState.settings;
            
            // Merge database settings with local settings
            // Database takes precedence
            const mergedSettings = {
              ...localSettings,
              ...dbSettings
            };

            setSettings(mergedSettings);
            
            // Update localStorage with merged settings
            userStorage.setItem('soundEnabled', mergedSettings.soundEnabled);
            userStorage.setItem('showHiddenFiles', mergedSettings.showHiddenFiles);
            userStorage.setItem('difficulty', mergedSettings.difficulty);
          }
        }
        
        setLoaded(true);
      } catch (error) {
        console.error('Error loading settings:', error);
        setLoaded(true);
      }
    };

    loadSettings();
  }, [deviceId, deviceType]);

  // Update settings function
  const updateSettingsFunction = async (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    
    // Update local state immediately
    setSettings(updatedSettings);
    
    // Update localStorage immediately
    if (newSettings.soundEnabled !== undefined) {
      userStorage.setItem('soundEnabled', newSettings.soundEnabled);
    }
    if (newSettings.showHiddenFiles !== undefined) {
      userStorage.setItem('showHiddenFiles', newSettings.showHiddenFiles);
    }
    if (newSettings.difficulty !== undefined) {
      userStorage.setItem('difficulty', newSettings.difficulty);
    }

    // Update database if device info is available
    if (deviceId && deviceType) {
      try {
        await updateUserSettings(deviceId, deviceType, newSettings);
      } catch (error) {
        console.error('Error updating settings in database:', error);
        // Even if database update fails, we still have localStorage
      }
    }
  };

  return <>{children(settings, updateSettingsFunction, loaded)}</>;
}

// Hook version for easier use
export function useDatabaseSettings() {
  const [settings, setSettings] = useState<UserSettings>({
    soundEnabled: true,
    showHiddenFiles: false,
    difficulty: 'medium'
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const deviceId = localStorage.getItem('selectedDeviceId');
      const deviceType = 'hackbook-w95';

      try {
        // Load from localStorage first
        const localSettings = {
          soundEnabled: userStorage.getItem('soundEnabled', true) as boolean,
          showHiddenFiles: userStorage.getItem('showHiddenFiles', false) as boolean,
          difficulty: userStorage.getItem('difficulty', 'medium') as string
        };
        setSettings(localSettings);

        // Load from database if possible
        if (deviceId && deviceType) {
          const result = await getUserProgress(deviceId, deviceType);
          
          if (result.success && result.gameState?.settings) {
            const mergedSettings = {
              ...localSettings,
              ...result.gameState.settings
            };

            setSettings(mergedSettings);
            
            // Sync localStorage
            userStorage.setItem('soundEnabled', mergedSettings.soundEnabled);
            userStorage.setItem('showHiddenFiles', mergedSettings.showHiddenFiles);
            userStorage.setItem('difficulty', mergedSettings.difficulty);
          }
        }
        
        setLoaded(true);
      } catch (error) {
        console.error('Error loading settings:', error);
        setLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const deviceId = localStorage.getItem('selectedDeviceId');
    const deviceType = 'hackbook-w95';
    
    const updatedSettings = { ...settings, ...newSettings };
    
    // Update local state and localStorage immediately
    setSettings(updatedSettings);
    
    if (newSettings.soundEnabled !== undefined) {
      userStorage.setItem('soundEnabled', newSettings.soundEnabled);
    }
    if (newSettings.showHiddenFiles !== undefined) {
      userStorage.setItem('showHiddenFiles', newSettings.showHiddenFiles);
    }
    if (newSettings.difficulty !== undefined) {
      userStorage.setItem('difficulty', newSettings.difficulty);
    }

    // Update database
    if (deviceId && deviceType) {
      try {
        await updateUserSettings(deviceId, deviceType, newSettings);
      } catch (error) {
        console.error('Error updating settings in database:', error);
      }
    }
  };

  return { settings, updateSettings, loaded };
}
