// Shared types for HackPhone components
export interface User {
  _id: string;
  username: string;
  sessionId?: string;
  progress: {
    unlockedApplications: string[];
    skills: Record<string, unknown>;
  };
  gameState: Record<string, unknown>;
}

export interface AppPermission {
  type: 'camera' | 'microphone' | 'location' | 'storage' | 'network' | 'contacts';
  required: boolean;
  description: string;
}

export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  color?: string;
  isLocked?: boolean;
  category?: string;
  permissions?: AppPermission[];
  version?: string;
  description?: string;
  isSystemApp?: boolean;
  requiresAuth?: boolean;
}

export interface BaseAppProps {
  onClose: () => void;
  time: Date;
  user?: User | null;
}

export interface AppRouterProps {
  appId: string;
  onClose: () => void;
  user: User | null;
  time: Date;
  onAppSwitch?: (appId: string) => void;
  onOpenApp?: (appId: string) => void;
  initialPhoneNumber?: string;
}

export interface HomeScreenProps {
  onAppOpen: (appId: string) => void;
}

export interface AppAnalytics {
  appId: string;
  userId?: string;
  action: 'open' | 'close' | 'error' | 'interaction';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
