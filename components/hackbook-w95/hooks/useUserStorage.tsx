"use client";

import { useState, useEffect, useCallback } from 'react';

// Function to get a unique storage key based on playspace and user
export const getUserStorageKey = (baseKey: string, debug = false) => {
  // Get playspace ID and user ID from localStorage or cookie
  let playspaceId = null;
  let username = null;
  const deviceType = "hackbook-w95";

  if (typeof window !== 'undefined') {
    // Try to get playspace ID from localStorage first
    playspaceId = localStorage.getItem("playspaceId");

    // If playspace ID exists, get user data from cookies
    if (playspaceId) {
      const cookieName = `playspace_${playspaceId}_${deviceType}`;
      const cookieStr = document.cookie.split('; ').find(c => c.startsWith(`${cookieName}=`));
      
      if (cookieStr) {
        try {
          const cookieValue = decodeURIComponent(cookieStr.split('=')[1]);
          const cookieData = JSON.parse(cookieValue);
          
          if (cookieData && cookieData.username) {
            username = cookieData.username;
            if (debug) console.log(`Found user ${username} for playspace ${playspaceId}`);
          }
        } catch (e) {
          console.error('Error parsing user cookie:', e);
        }
      }
    }
  }
  
  // Create a unique key that combines the base key with playspace ID and username
  return `${baseKey}_${playspaceId || 'default'}_${username || 'guest'}`;
};

/**
 * Custom hook for user-specific localStorage data
 * 
 * @param baseKey - Base key for the storage item
 * @param initialValue - Default value if no stored value exists
 * @param options - Additional options
 * @returns [storedValue, setValue] - Tuple with current value and setter function
 */
export function useUserStorage<T>(
  baseKey: string, 
  initialValue: T, 
  options: { debug?: boolean; serialize?: boolean } = {}
): [T, (value: T | ((val: T) => T)) => void] {
  const { debug = false, serialize = true } = options;
  
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  // Get the full storage key with user context
  const fullKey = getUserStorageKey(baseKey, debug);
  
  // Initialize from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(fullKey);
        const value = item ? (serialize ? JSON.parse(item) : item) : initialValue;
        setStoredValue(value);
        if (debug) console.log(`Loaded ${fullKey} from localStorage:`, value);
      }
    } catch (error) {
      console.error(`Error loading ${fullKey} from localStorage:`, error);
      setStoredValue(initialValue);
    }
  }, [fullKey, initialValue, serialize, debug]);
  
  // Return a wrapped version of useState's setter function
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        const saveToStorage = () => {
          try {
            localStorage.setItem(
              fullKey, 
              serialize ? JSON.stringify(valueToStore) : String(valueToStore)
            );
            if (debug) console.log(`Saved ${fullKey} to localStorage:`, valueToStore);
          } catch (error) {
            console.error(`Error saving ${fullKey} to localStorage:`, error);
          }
        };
        
        // Use a small timeout to debounce frequent saves
        const timeout = setTimeout(saveToStorage, 100);
        return () => clearTimeout(timeout);
      }
    } catch (error) {
      console.error(`Error in setValue for ${fullKey}:`, error);
    }
  }, [storedValue, fullKey, serialize, debug]);
  
  return [storedValue, setValue];
}

// Helper for simple get/set operations without React state
export const userStorage = {
  getItem: (baseKey: string, defaultValue: any = null, options: { debug?: boolean; serialize?: boolean } = {}) => {
    try {
      const { debug = false, serialize = true } = options;
      const fullKey = getUserStorageKey(baseKey, debug);
      
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(fullKey);
        if (item === null) return defaultValue;
        return serialize ? JSON.parse(item) : item;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Error getting ${baseKey} from localStorage:`, error);
      return defaultValue;
    }
  },
  
  setItem: (baseKey: string, value: any, options: { debug?: boolean; serialize?: boolean } = {}) => {
    try {
      const { debug = false, serialize = true } = options;
      const fullKey = getUserStorageKey(baseKey, debug);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          fullKey,
          serialize ? JSON.stringify(value) : String(value)
        );
        if (debug) console.log(`Saved ${fullKey} to localStorage:`, value);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error setting ${baseKey} in localStorage:`, error);
      return false;
    }
  },
  
  removeItem: (baseKey: string, options: { debug?: boolean } = {}) => {
    try {
      const { debug = false } = options;
      const fullKey = getUserStorageKey(baseKey, debug);
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem(fullKey);
        if (debug) console.log(`Removed ${fullKey} from localStorage`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error removing ${baseKey} from localStorage:`, error);
      return false;
    }
  }
};

export default useUserStorage;
