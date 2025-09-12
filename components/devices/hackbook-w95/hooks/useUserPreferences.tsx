"use client";

import { useState, useEffect, useCallback } from 'react';
import { userStorage } from './useUserStorage';

export interface UserPreferences {
  // Appearance settings
  theme?: string;
  windowColor?: string;
  fontSize?: number;
  
  // Application settings
  notepadFont?: string;
  notepadWordWrap?: boolean;
  calculatorMode?: 'standard' | 'scientific';
  
  // Common Windows settings
  showHiddenFiles?: boolean;
  desktopIconSize?: 'small' | 'medium' | 'large';
  screensaverDelay?: number; // in minutes
  
  // Sound settings
  soundEnabled?: boolean;
  soundVolume?: number;
  
  // Custom application data
  appData?: Record<string, unknown>;
}

const defaultPreferences: UserPreferences = {
  theme: 'default',
  windowColor: '#c0c0c0',
  fontSize: 12,
  notepadFont: 'monospace',
  notepadWordWrap: false,
  calculatorMode: 'standard',
  showHiddenFiles: false,
  desktopIconSize: 'medium',
  screensaverDelay: 5,
  soundEnabled: true,
  soundVolume: 0.5,
  appData: {},
};

/**
 * Hook for managing user preferences with persistence
 */
export function useUserPreferences(options = { debug: false }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const debug = options.debug || false;
  
  // Initialize preferences from storage
  useEffect(() => {
    try {
      const storedPrefs = userStorage.getItem('userPreferences', defaultPreferences) as UserPreferences;
      setPreferences(storedPrefs);
    } catch (error) {
      console.error('Error loading user preferences:', error);
      setPreferences(defaultPreferences);
    }
  }, [debug]);
  
  // Save updates to storage
  const updatePreferences = useCallback((newPrefs: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      
      // Save to storage
      userStorage.setItem('userPreferences', updated);
      
      return updated;
    });
  }, [debug]);
  
  // Set application-specific data
  const setAppData = useCallback(
    (appName: string, data: unknown) => {
      setPreferences((prev) => {
        const appData = { ...prev.appData, [appName]: data };
        const updated = { ...prev, appData };

        // Save to storage
        userStorage.setItem("userPreferences", updated);

        return updated;
      });
    },
    [debug]
  );
  
  // Get application-specific data
  const getAppData = useCallback(
    (appName: string, defaultValue: unknown = null) => {
      return preferences.appData?.[appName] || defaultValue;
    },
    [preferences.appData]
  );
  
  // Reset preferences to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    userStorage.setItem('userPreferences', defaultPreferences);
  }, [debug]);

  return {
    preferences,
    updatePreferences,
    setAppData,
    getAppData,
    resetPreferences
  };
}

/**
 * Non-hook utility for direct access to user preferences
 */
export const UserPreferences = {
  get: (defaultValue = defaultPreferences): UserPreferences => {
    return userStorage.getItem("userPreferences", defaultValue) as UserPreferences;
  },

  update: (newPrefs: Partial<UserPreferences>) => {
    const currentPrefs = UserPreferences.get();
    const updated = { ...currentPrefs, ...newPrefs };
    return userStorage.setItem("userPreferences", updated);
  },

  setAppData: (appName: string, data: unknown) => {
    const currentPrefs = UserPreferences.get();
    const appData = { ...currentPrefs.appData, [appName]: data };
    const updated = { ...currentPrefs, appData };
    return userStorage.setItem("userPreferences", updated);
  },

  getAppData: (appName: string, defaultValue: unknown = null) => {
    const currentPrefs = UserPreferences.get();
    return currentPrefs.appData?.[appName] || defaultValue;
  },

  reset: () => {
    return userStorage.setItem("userPreferences", defaultPreferences);
  },
};

export default useUserPreferences;
