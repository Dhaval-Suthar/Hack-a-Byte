'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { getAuthStatus } from '@/app/actions/auth';

// App state interface
interface AppState {
  theme: 'light' | 'dark' | 'system';
  isLoading: boolean;
  gameStarted: boolean;
  notifications: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    duration?: number;
  }>;
}

// App context interface
interface AppContextType {
  state: AppState;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLoading: (isLoading: boolean) => void;
  setGameStarted: (gameStarted: boolean) => void;
  addNotification: (
    message: string,
    type?: 'info' | 'success' | 'error' | 'warning',
    duration?: number
  ) => string;
  removeNotification: (id: string) => void;
}

// Create context with default values
const AppContext = createContext<AppContextType>({
  state: {
    theme: 'system',
    isLoading: false,
    gameStarted: false,
    notifications: [],
  },
  setTheme: () => {},
  setLoading: () => {},
  setGameStarted: () => {},
  addNotification: () => '',
  removeNotification: () => {},
});

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  // Initial state
  const [state, setState] = useState<AppState>({
    theme: 'system',
    isLoading: false,
    gameStarted: false,
    notifications: [],
  });

  // NextAuth session
  const { data: session, status } = useSession();

  // Set up theme based on system preference
  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setState(prev => ({ ...prev, theme: savedTheme as 'light' | 'dark' | 'system' }));
    }

    // Apply theme
    applyTheme(state.theme);
  }, []);

  // Apply theme to document
  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'system') {
      // Use system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemPrefersDark);
    } else {
      // Use explicit preference
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  // Theme setter
  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setState(prev => ({ ...prev, theme }));
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  };

  // Loading state setter
  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  // Game started state setter
  const setGameStarted = (gameStarted: boolean) => {
    setState(prev => ({ ...prev, gameStarted }));
  };

  // Add notification
  const addNotification = (
    message: string,
    type: 'info' | 'success' | 'error' | 'warning' = 'info',
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, { id, message, type, duration }],
    }));
    
    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
    
    return id;
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(notification => notification.id !== id),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setTheme,
        setLoading,
        setGameStarted,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the app context
export function useAppContext() {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
}
