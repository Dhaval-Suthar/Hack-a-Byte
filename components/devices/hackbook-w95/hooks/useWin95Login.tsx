"use client";

import { useEffect } from 'react';
import { userStorage } from './useUserStorage';
import { UserLogManager } from './useUserLogs';

interface Win95LoginEvent {
  timestamp: string;
  username: string;
  success: boolean;
  failureReason?: string;
}

export const useWin95Login = () => {
  // Initialize system on first load
  useEffect(() => {
    // Check if login events exist, create them if not
    const loginEvents = userStorage.getItem('win95LoginEvents', null);
    if (loginEvents === null) {
      // Set up initial login events
      const initialEvents: Win95LoginEvent[] = [
        {
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
          username: 'Administrator',
          success: true
        },
        {
          timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
          username: 'System',
          success: true
        }
      ];
      
      userStorage.setItem('win95LoginEvents', initialEvents);
      
      // Also set up initial system logs
      UserLogManager.addSystemLog(
        'system',
        'System initialized',
        'Initial setup complete'
      );
    }
  }, []);
  
  // Function to log a new login
  const recordLogin = (username: string, success: boolean, failureReason?: string) => {
    try {
      // Get existing login events
      const events = userStorage.getItem('win95LoginEvents', []) as Win95LoginEvent[];
      
      // Add new event
      const newEvent: Win95LoginEvent = {
        timestamp: new Date().toISOString(),
        username,
        success,
        failureReason
      };
      
      events.push(newEvent);
      
      // Limit to last 20 events
      const trimmedEvents = events.length > 20 ? events.slice(-20) : events;
      
      // Save events back to storage
      userStorage.setItem('win95LoginEvents', trimmedEvents);
      
      // Also log to UserLogManager for central tracking
      UserLogManager.addLoginLog({
        username,
        success, 
        device: 'Windows 95'
      });
      
      // Add to system logs too
      if (success) {
        UserLogManager.addSystemLog(
          'security',
          `User ${username} logged in successfully`,
          'Windows 95 login'
        );
      } else {
        UserLogManager.addSystemLog(
          'security',
          `Failed login attempt for user ${username}`,
          failureReason || 'Unknown failure reason'
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error recording Windows 95 login:', error);
      return false;
    }
  };
  
  // Get login history
  const getLoginHistory = (): Win95LoginEvent[] => {
    return userStorage.getItem('win95LoginEvents', []) as Win95LoginEvent[];
  };

  return {
    recordLogin,
    getLoginHistory
  };
};

export default useWin95Login;
