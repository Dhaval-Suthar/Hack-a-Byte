"use client";

import { userStorage } from './useUserStorage';
import { logger } from '@/lib/logger';

export interface LoginLog {
  timestamp: string;
  username: string;
  ip?: string;
  success: boolean;
  device: string;
}

export interface SystemLog {
  timestamp: string;
  type: 'system' | 'security' | 'application';
  message: string;
  details?: string;
}

// Class for managing login and system logs
export class UserLogManager {
  // Track login attempts
  static addLoginLog(log: Omit<LoginLog, 'timestamp'>): void {
    try {
      const timestamp = new Date().toISOString();
      const newLog: LoginLog = {
        ...log,
        timestamp
      };
      
      // Get existing logs and add the new one
      const logs = userStorage.getItem('win95LoginLogs', []) as LoginLog[];
      logs.push(newLog);
      
      // Cap logs at 100 entries to avoid storage issues
      if (logs.length > 100) {
        logs.shift(); // Remove oldest log
      }
      
      userStorage.setItem('win95LoginLogs', logs);
    } catch (error) {
      logger.error('Error adding login log:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  }
  
  // Get login history
  static getLoginLogs(): LoginLog[] {
    return userStorage.getItem('win95LoginLogs', []) as LoginLog[];
  }
  
  // Add a system log entry
  static addSystemLog(type: 'system' | 'security' | 'application', message: string, details?: string): void {
    try {
      const timestamp = new Date().toISOString();
      const newLog: SystemLog = {
        timestamp,
        type,
        message,
        details
      };
      
      // Get existing logs and add the new one
      const logs = userStorage.getItem('win95SystemLogs', []) as SystemLog[];
      logs.push(newLog);
      
      // Cap logs at 200 entries for system logs
      if (logs.length > 200) {
        logs.shift(); // Remove oldest log
      }
      
      userStorage.setItem('win95SystemLogs', logs);
    } catch (error) {
      logger.error('Error adding system log:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  }
  
  // Get system logs with optional filtering
  static getSystemLogs(options?: {
    type?: 'system' | 'security' | 'application';
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): SystemLog[] {
    try {
      let logs = userStorage.getItem('win95SystemLogs', []) as SystemLog[];
      
      // Apply filters if provided
      if (options) {
        if (options.type) {
          logs = logs.filter(log => log.type === options.type);
        }
        
        if (options.startDate) {
          logs = logs.filter(log => new Date(log.timestamp) >= options.startDate!);
        }
        
        if (options.endDate) {
          logs = logs.filter(log => new Date(log.timestamp) <= options.endDate!);
        }
        
        if (options.limit && options.limit > 0) {
          logs = logs.slice(-options.limit);
        }
      }
      
      return logs;
    } catch (error) {
      logger.error('Error retrieving system logs:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      return [];
    }
  }
  
  // Clear all logs (for testing or privacy reasons)
  static clearAllLogs(): void {
    userStorage.setItem('win95LoginLogs', []);
    userStorage.setItem('win95SystemLogs', []);
  }
}

export default UserLogManager;
