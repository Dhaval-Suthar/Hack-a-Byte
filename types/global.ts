// Global type definitions
export interface Device {
  id: string;
  deviceMacAddress: string;
  deviceType: string;
  status: 'online' | 'offline' | 'maintenance';
  ipAddress: string;
  securityLevel: 'low' | 'medium' | 'high';
  vulnerabilities: string[];
  lastSeen: string;
}

export interface GameSession {
  id: string;
  userId: string;
  deviceId: string;
  gameType: string;
  score: number;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'abandoned';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  pagination?: PaginationParams;
}

// Common utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
