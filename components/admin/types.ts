// Admin-specific type definitions

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  isAuthenticated: boolean;
  isMentor: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export interface AdminTeam {
  _id: string;
  name: string;
  description: string;
  leaderUserId?: string;
  members: number;
}

export interface AdminAccessCode {
  _id: string;
  code: string;
  isActive: boolean;
  usageCount: number;
  type?: string;
  priority?: number;
  maxUsages?: number;
  expiresAt?: string;
  description?: string;
  username?: string;
  assignedPlayspace?: {
    _id: string;
    name: string;
    description: string;
  } | null;
}

export interface AdminPlayspace {
  _id: string;
  name: string;
  description: string;
  isPublic?: boolean;
  devices: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminDevice {
  _id: string;
  deviceId: string;
  deviceType: string;
  status: "online" | "offline" | "maintenance";
  playspace: {
    _id: string;
    name: string;
    description: string;
  } | null;
  createdAt: string;
}

export interface AdminEvent {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  category: string;
  isPublic: boolean;
  capacity: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type TabType = "users" | "teams" | "accessCodes" | "playspaces" | "devices" | "events";

// Transformed types for components
export interface TransformedTeam extends AdminTeam {
  isActive: boolean;
  maxMembers: number;
  currentMembers: number;
  createdAt: string;
}

export interface TransformedAccessCode extends AdminAccessCode {
  type: string;
  priority: number;
  description: string;
  assignedPlayspace?: {
    _id: string;
    name: string;
    description: string;
  };
}

export interface TransformedPlayspace extends AdminPlayspace {
  isActive: boolean;
  isOpen: boolean;
  maxUsers: number;
  currentUsers: number;
  devices: string[];
  accessCodes: string[];
}

export interface TransformedEvent extends AdminEvent {
  type: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  participants: string[];
  registrationOpen: boolean;
}

export interface TransformedDevice extends AdminDevice {
  name: string;
  type: string;
  ipAddress: string;
  isAssigned: boolean;
  assignedPlayspace?: {
    _id: string;
    name: string;
    description: string;
  };
}

// Modal states
export interface GeneralAccessCodeModal {
  isOpen: boolean;
}

export interface EditAccessCodeModal {
  isOpen: boolean;
  accessCode: AdminAccessCode | null;
}

// Admin dashboard state
export interface AdminDashboardState {
  isAuthenticated: boolean;
  authKey: string;
  activeTab: TabType;
  users: AdminUser[];
  teams: AdminTeam[];
  accessCodes: AdminAccessCode[];
  playspaces: AdminPlayspace[];
  events: AdminEvent[];
  allDevices: AdminDevice[];
  isLoading: boolean;
  error: string;
  searchQuery: string;
  currentPage: number;
  generalAccessCodeModal: GeneralAccessCodeModal;
  editAccessCodeModal: EditAccessCodeModal;
}