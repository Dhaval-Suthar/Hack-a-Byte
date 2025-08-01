"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSecureSession, SecureSessionData } from './useSecureStorage';

/**
 * Secure replacement for the original userStorage system
 * This hook uses server-validated session data instead of localStorage for authentication
 */
export function useSecureUserStorage<T>(
  baseKey: string, 
  initialValue: T, 
  options: { debug?: boolean; serialize?: boolean } = {}
): [T, (value: T | ((val: T) => T)) => void] {
  const { debug = false, serialize = true } = options;
  const { sessionData, loading } = useSecureSession();
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Create a secure storage key using validated session data
  const getSecureKey = useCallback(() => {
    if (!sessionData.isAuthenticated || !sessionData.username || !sessionData.playspaceId) {
      return null;
    }
    return `secure_${baseKey}_${sessionData.playspaceId}_${sessionData.username}`;
  }, [baseKey, sessionData]);

  // Initialize from localStorage when session is loaded
  useEffect(() => {
    if (loading) return;

    const secureKey = getSecureKey();
    if (!secureKey) {
      setStoredValue(initialValue);
      return;
    }

    try {
      const item = localStorage.getItem(secureKey);
      const value = item ? (serialize ? JSON.parse(item) : item) : initialValue;
      setStoredValue(value);
      if (debug) console.log(`Loaded ${secureKey} from secure storage:`, value);
    } catch (error) {
      console.error(`Error loading ${secureKey} from secure storage:`, error);
      setStoredValue(initialValue);
    }
  }, [getSecureKey, initialValue, serialize, debug, loading]);

  // Return a wrapped version of useState's setter function
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (loading) return;

    const secureKey = getSecureKey();
    if (!secureKey) {
      console.warn('Cannot save to secure storage: not authenticated');
      return;
    }

    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Save to localStorage with secure key
      localStorage.setItem(
        secureKey, 
        serialize ? JSON.stringify(valueToStore) : String(valueToStore)
      );
      if (debug) console.log(`Saved ${secureKey} to secure storage:`, valueToStore);
    } catch (error) {
      console.error(`Error in setValue for ${secureKey}:`, error);
    }
  }, [storedValue, getSecureKey, serialize, debug, loading]);

  return [storedValue, setValue];
}

// Helper functions for secure storage operations
function getSecureStorageItem<T>(
  baseKey: string, 
  defaultValue: T | null = null, 
  sessionData: SecureSessionData,
  options: { serialize?: boolean } = {}
): T | null {
  try {
    const { serialize = true } = options;
    
    if (!sessionData?.isAuthenticated || !sessionData?.username || !sessionData?.playspaceId) {
      return defaultValue;
    }

    const secureKey = `secure_${baseKey}_${sessionData.playspaceId}_${sessionData.username}`;

    if (typeof window !== "undefined") {
      const item = localStorage.getItem(secureKey);
      if (item === null) return defaultValue;
      return serialize ? JSON.parse(item) : (item as T);
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error getting ${baseKey} from secure storage:`, error);
    return defaultValue;
  }
}

function setSecureStorageItem<T>(
  baseKey: string, 
  value: T, 
  sessionData: SecureSessionData,
  options: { debug?: boolean; serialize?: boolean } = {}
): boolean {
  try {
    const { debug = false, serialize = true } = options;
    
    if (!sessionData?.isAuthenticated || !sessionData?.username || !sessionData?.playspaceId) {
      console.warn('Cannot save to secure storage: not authenticated');
      return false;
    }

    const secureKey = `secure_${baseKey}_${sessionData.playspaceId}_${sessionData.username}`;

    if (typeof window !== "undefined") {
      localStorage.setItem(secureKey, serialize ? JSON.stringify(value) : String(value));
      if (debug) console.log(`Saved ${secureKey} to secure storage:`, value);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error setting ${baseKey} in secure storage:`, error);
    return false;
  }
}

function removeSecureStorageItem(
  baseKey: string, 
  sessionData: SecureSessionData,
  options: { debug?: boolean } = {}
): boolean {
  try {
    const { debug = false } = options;
    
    if (!sessionData?.isAuthenticated || !sessionData?.username || !sessionData?.playspaceId) {
      return false;
    }

    const secureKey = `secure_${baseKey}_${sessionData.playspaceId}_${sessionData.username}`;

    if (typeof window !== "undefined") {
      localStorage.removeItem(secureKey);
      if (debug) console.log(`Removed ${secureKey} from secure storage`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error removing ${baseKey} from secure storage:`, error);
    return false;
  }
}

// Context-aware secure storage utilities
export const secureUserStorage = {
  // These require session context and should be used within components
  useStorage: useSecureUserStorage,
  
  // Legacy support - these will show warnings and require session data to be passed
  getItem: <T,>(baseKey: string, defaultValue: T | null = null, sessionData?: SecureSessionData, options = {}) => {
    if (!sessionData) {
      console.warn('secureUserStorage.getItem: sessionData required for secure access');
      return defaultValue;
    }
    return getSecureStorageItem(baseKey, defaultValue, sessionData, options);
  },
  
  setItem: <T,>(baseKey: string, value: T, sessionData?: SecureSessionData, options = {}) => {
    if (!sessionData) {
      console.warn('secureUserStorage.setItem: sessionData required for secure access');
      return false;
    }
    return setSecureStorageItem(baseKey, value, sessionData, options);
  },
  
  removeItem: (baseKey: string, sessionData?: SecureSessionData, options = {}) => {
    if (!sessionData) {
      console.warn('secureUserStorage.removeItem: sessionData required for secure access');
      return false;
    }
    return removeSecureStorageItem(baseKey, sessionData, options);
  },
};

export default useSecureUserStorage;
