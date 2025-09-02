// Shared types for admin components
export interface AccessCode {
  _id: string;
  code: string;
  status: "active" | "inactive";
}

export interface Playspace {
  _id: string;
  name: string;
  description?: string;
}

export interface Device {
  _id: string;
  name: string;
  status: string;
  deviceType?: string;
  playspace?: {
    _id: string;
    name: string;
    description?: string;
  } | null;
}

export interface Team {
  _id: string;
  name: string;
  description: string;
  leaderUserId?: string;
  members: number;
  numberOfPlayers?: number;
  playingDevice?: "smartphone" | "pc_laptop";
}

export interface EventItem {
  _id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  category?: string;
  isPublic?: boolean;
  capacity?: number;
  requiredDeviceTypes?: {
    mobile: boolean;
    desktop: boolean;
  };
  requiredDevices?: {
    mobile: string[];
    desktop: string[];
  };
  minTeamMembers?: number;
  maxTeamMembers?: number;
  pricing?: {
    normal: number;
    extended?: number;
  };
}

export interface GameSession {
  _id: string;
  tournamentId: string;
  team1Id: string;
  team2Id: string;
  team1Name: string;
  team2Name: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  team1Score: number;
  team2Score: number;
  duration: number;
  winner?: string;
  deviceId?: string;
}

export interface Sponsor {
  _id: string;
  name: string;
  tier: 'quantum-guardians' | 'cyber-sentinels' | 'binary-titans' | 'firewall-champions';
  logo: string;
  description: string;
  benefits?: string[];
  websiteUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  msg: string;
  kind: "ok" | "err" | "info";
}

export type Tab = "dashboard" | "teams" | "codes" | "playspaces" | "devices" | "events" | "sessions" | "sponsors";
