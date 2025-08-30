// Admin utility functions for data transformation and common operations

import {
  AdminTeam,
  AdminAccessCode,
  AdminPlayspace,
  AdminEvent,
  AdminDevice,
  TransformedTeam,
  TransformedAccessCode,
  TransformedPlayspace,
  TransformedEvent,
  TransformedDevice,
} from "@/components/devices/admin/types";

// Data transformation functions
export const transformTeamForComponent = (team: AdminTeam): TransformedTeam => ({
  ...team,
  isActive: true,
  maxMembers: 10,
  currentMembers: team.members,
  createdAt: new Date().toISOString(),
});

export const transformAccessCodeForComponent = (accessCode: AdminAccessCode): TransformedAccessCode => ({
  ...accessCode,
  type: accessCode.type || "temporary",
  priority: accessCode.priority || 5,
  description: accessCode.description || "",
  assignedPlayspace: accessCode.assignedPlayspace || undefined,
});

export const transformPlayspaceForComponent = (playspace: AdminPlayspace): TransformedPlayspace => ({
  ...playspace,
  isActive: true,
  isOpen: true,
  maxUsers: 50,
  currentUsers: 0,
  devices: [], // Will be populated from device data
  accessCodes: [],
});

export const transformEventForComponent = (event: AdminEvent): TransformedEvent => ({
  ...event,
  type: event.category,
  startTime: event.startDate,
  endTime: event.endDate,
  isActive: true,
  participants: [],
  registrationOpen: true,
});

export const transformDeviceForComponent = (device: AdminDevice): TransformedDevice => ({
  ...device,
  name: device.deviceMacAddress,
  type: device.deviceType,
  status: device.status,
  ipAddress: "",
  isAssigned: !!device.playspace,
  assignedPlayspace: device.playspace || undefined,
});

// Local storage utilities
export const getStoredAuthState = () => {
  if (typeof window === "undefined") return { isAuthenticated: false, authKey: "" };
  
  return {
    isAuthenticated: localStorage.getItem("admin-authenticated") === "true",
    authKey: localStorage.getItem("admin-auth-key") || "",
  };
};

export const setStoredAuthState = (isAuthenticated: boolean, authKey?: string) => {
  if (typeof window === "undefined") return;
  
  if (isAuthenticated && authKey) {
    localStorage.setItem("admin-authenticated", "true");
    localStorage.setItem("admin-auth-key", authKey);
  } else {
    localStorage.removeItem("admin-authenticated");
    localStorage.removeItem("admin-auth-key");
  }
};

export const clearStoredAuthState = () => {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem("admin-authenticated");
  localStorage.removeItem("admin-auth-key");
};

// Constants
export const ITEMS_PER_PAGE = 10;

export const TAB_LABELS: Record<string, string> = {
  analytics: "Analytics",
  users: "Users",
  teams: "Teams",
  accessCodes: "Access Codes",
  playspaces: "Playspaces",
  devices: "Devices",
  events: "Events",
  sponsors: "Sponsor Contacts",
};
