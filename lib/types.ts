// Common types used throughout the application

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isMentor: boolean;
  createdAt: Date | string;
  teams?: string[];
  gameState?: Record<string, any>;
}

export interface UserProfile extends User {
  bio?: string;
  skills?: string[];
  avatarUrl?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  owner: string;
  members: string[];
  isPublic: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TeamWithMembers extends Team {
  members: UserProfile[];
}

// Game types
export interface PVPMatch {
  id: string;
  type: string;
  startTime: Date | string;
  endTime?: Date | string;
  status: 'waiting' | 'in-progress' | 'completed';
  participants: string[];
  teams?: {
    attackers: string[];
    defenders: string[];
  };
  scores: {
    attackers: number;
    defenders: number;
  };
  playspaceId: string;
  spectators: string[];
  events?: GameEvent[];
}

export interface GameEvent {
  id: string;
  timestamp: Date | string;
  type: string;
  description: string;
  data?: any;
  userId?: string;
}

// Playspace types
export interface Playspace {
  id: string;
  name: string;
  description: string;
  devices: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date | string;
}

export interface DeviceUser {
  id: string;
  username: string;
  deviceId: string;
  deviceType: string;
  progress: {
    unlockedApplications: string[];
    skills: Record<string, number>;
  };
}

// Challenge types
export interface Challenge {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  points: number;
  category: string;
  tags: string[];
  prerequisites?: string[];
  isActive: boolean;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface LoginFormData {
  username: string;
  password: string;
}

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Page metadata interfaces
export interface PageMetadata {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  canonical?: string;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Game-specific types
export interface CTFGameState {
  flags: {
    found: string[];
    total: number;
  };
  hintsUsed: number;
  score: number;
  startTime: string;
  endTime?: string;
}

export interface EmailFraudGameState {
  detectedEmails: string[];
  score: number;
  incorrectAttempts: number;
  level: number;
}

export interface RansomwareGameState {
  encryptedFiles: string[];
  decryptedFiles: string[];
  keysFound: string[];
  score: number;
  timeRemaining: number;
}
