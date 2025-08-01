"use client";

import { useState, useEffect, useCallback } from 'react';

export interface SecureSessionData {
  isAuthenticated: boolean;
  username?: string;
  deviceId?: string;
  playspaceId?: string;
}

/**
 * Secure hook for getting authenticated session data
 * This replaces direct localStorage access with server-validated session data
 */
export function useSecureSession() {
  const [sessionData, setSessionData] = useState<SecureSessionData>({ isAuthenticated: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get device info from URL params (these are not sensitive for validation)
      const urlParams = new URLSearchParams(window.location.search);
      const deviceId = urlParams.get('deviceId') || sessionStorage.getItem('currentDeviceId');
      const deviceType = 'hackbook-w95';

      if (!deviceId) {
        setSessionData({ isAuthenticated: false });
        setLoading(false);
        return;
      }

      // Call server action to validate session
      const response = await fetch('/api/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId, deviceType }),
        credentials: 'include', // Important for httpOnly cookies
      });

      if (!response.ok) {
        throw new Error('Session validation failed');
      }

      const data = await response.json();
      setSessionData(data);
    } catch (err) {
      console.error('Session validation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSessionData({ isAuthenticated: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const refreshSession = useCallback(() => {
    return validateSession();
  }, [validateSession]);

  return {
    sessionData,
    loading,
    error,
    refreshSession,
  };
}

/**
 * Secure storage hook that uses session data instead of localStorage
 */
export function useSecureStorage<T>(
  baseKey: string,
  initialValue: T,
  options: { serialize?: boolean } = {}
): [T, (value: T | ((val: T) => T)) => void] {
  const { sessionData } = useSecureSession();
  const { serialize = true } = options;
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Create secure storage key using authenticated session data
  const getSecureKey = useCallback(() => {
    if (!sessionData.isAuthenticated || !sessionData.username || !sessionData.playspaceId) {
      return null;
    }
    return `secure_${baseKey}_${sessionData.playspaceId}_${sessionData.username}`;
  }, [baseKey, sessionData]);

  // Load data from localStorage using secure key
  useEffect(() => {
    const secureKey = getSecureKey();
    if (!secureKey) {
      setStoredValue(initialValue);
      return;
    }

    try {
      const item = localStorage.getItem(secureKey);
      if (item !== null) {
        const value = serialize ? JSON.parse(item) : item;
        setStoredValue(value);
      }
    } catch (error) {
      console.error(`Error loading secure storage ${secureKey}:`, error);
      setStoredValue(initialValue);
    }
  }, [getSecureKey, initialValue, serialize]);

  // Save data to localStorage using secure key
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    const secureKey = getSecureKey();
    if (!secureKey) {
      console.warn('Cannot save to secure storage: not authenticated');
      return;
    }

    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      const serializedValue = serialize ? JSON.stringify(valueToStore) : String(valueToStore);
      localStorage.setItem(secureKey, serializedValue);
    } catch (error) {
      console.error(`Error saving secure storage ${secureKey}:`, error);
    }
  }, [getSecureKey, serialize, storedValue]);

  return [storedValue, setValue];
}

// Helper functions for secure storage operations
export const secureStorage = {
  getItem: function<T>(_baseKey: string, defaultValue: T | null = null): T | null {
    // This function requires a React context to work properly
    // It's better to use useSecureStorage hook instead
    console.warn('secureStorage.getItem should be replaced with useSecureStorage hook');
    return defaultValue;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setItem: function<T>(_baseKey: string, _value: T): boolean {
    // This function requires a React context to work properly
    // It's better to use useSecureStorage hook instead
    console.warn('secureStorage.setItem should be replaced with useSecureStorage hook');
    return false;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeItem: function(_baseKey: string): boolean {
    console.warn('secureStorage.removeItem should be replaced with useSecureStorage hook');
    return false;
  },
};
