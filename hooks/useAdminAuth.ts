import { useState, useEffect, useCallback } from 'react';
import { getStoredAuthState, setStoredAuthState, clearStoredAuthState } from '@/lib/admin-utils';

// Session expiration time (1 hour)
const SESSION_DURATION = 60 * 60 * 1000;

interface AuthError {
  message: string;
  type: 'auth' | 'session' | 'storage';
}

interface UseAdminAuthReturn {
  isAuthenticated: boolean;
  authKey: string;
  isLoading: boolean;
  authError: AuthError | null;
  handleAuthSuccess: (authKey: string) => void;
  handleAuthFailed: (error: string) => void;
  handleLogout: () => void;
  clearError: () => void;
}

export const useAdminAuth = (): UseAdminAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authKey, setAuthKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  // Session validation function
  const validateSession = useCallback(() => {
    try {
      if (typeof window === 'undefined') return false;
      
      const sessionTimestamp = localStorage.getItem("admin-session-timestamp");
      if (sessionTimestamp) {
        const sessionAge = Date.now() - parseInt(sessionTimestamp);
        if (sessionAge > SESSION_DURATION) {
          clearStoredAuthState();
          localStorage.removeItem("admin-session-timestamp");
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  // Initialize from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    try {
      setIsLoading(true);
      setAuthError(null);

      // Check if session is still valid
      const isValidSession = validateSession();
      
      if (isValidSession) {
        const { isAuthenticated: storedAuth, authKey: storedAuthKey } = getStoredAuthState();
        setIsAuthenticated(storedAuth);
        setAuthKey(storedAuthKey);
      } else {
        setIsAuthenticated(false);
        setAuthKey("");
      }
    } catch {
      setAuthError({
        message: "Failed to initialize admin authentication. Please refresh and try again.",
        type: 'storage'
      });
      setIsAuthenticated(false);
      setAuthKey("");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed validateSession dependency to prevent infinite loop

  // Session refresh interval
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (!validateSession()) {
        setIsAuthenticated(false);
        setAuthKey("");
        setAuthError({
          message: "Your session has expired. Please authenticate again.",
          type: 'session'
        });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Removed validateSession dependency to prevent infinite loop

  // Authentication handlers
  const handleAuthSuccess = useCallback((authKey: string) => {
    try {
      setIsAuthenticated(true);
      setAuthKey(authKey);
      setAuthError(null);
      
      // Persist authentication state with timestamp
      setStoredAuthState(true, authKey);
      if (typeof window !== "undefined") {
        localStorage.setItem("admin-session-timestamp", Date.now().toString());
      }
    } catch {
      setAuthError({
        message: "Authentication succeeded but failed to save session. Please try again.",
        type: 'storage'
      });
    }
  }, []);

  const handleAuthFailed = useCallback((error: string) => {
    setIsAuthenticated(false);
    setAuthKey("");
    
    // Clear authentication state
    clearStoredAuthState();
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin-session-timestamp");
    }
    
    setAuthError({
      message: error || "Authentication failed. Please check your credentials.",
      type: 'auth'
    });
  }, []);

  const handleLogout = useCallback(() => {
    try {
      setIsAuthenticated(false);
      setAuthKey("");
      setAuthError(null);
      
      // Clear authentication state
      clearStoredAuthState();
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin-session-timestamp");
      }
    } catch {
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  return {
    isAuthenticated,
    authKey,
    isLoading,
    authError,
    handleAuthSuccess,
    handleAuthFailed,
    handleLogout,
    clearError,
  };
};
