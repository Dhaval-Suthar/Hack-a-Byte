// Custom hooks for admin dashboard functionality

import { useState, useEffect, useCallback } from "react";
import {
  TabType,
  AdminUser,
  AdminTeam,
  AdminAccessCode,
  AdminPlayspace,
  AdminEvent,
  AdminDevice,
  GeneralAccessCodeModal,
  EditAccessCodeModal,
} from "@/components/devices/admin/types";
import { getStoredAuthState, setStoredAuthState, clearStoredAuthState } from "@/lib/admin-utils";
import {
  getUsers,
  updateUser,
  getAccessCodes,
  toggleAccessCodeStatus,
  getTeams,
  getPlayspaces,
  getAllDevices,
  createDevice,
  assignDeviceToPlayspace,
  unassignDeviceFromPlayspace,
  deleteDevice,
  getEvents,
  deleteEvent,
  updateDeviceStatus,
  deletePlayspace,
  assignPlayspaceToAccessCode,
  deleteAccessCode,
} from "@/app/actions/admin";

// Hook for authentication state
export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authKey, setAuthKey] = useState("");

  // Initialize from localStorage after mount
  useEffect(() => {
    const { isAuthenticated: storedAuth, authKey: storedAuthKey } = getStoredAuthState();
    setIsAuthenticated(storedAuth);
    setAuthKey(storedAuthKey);
  }, []);

  const handleAuthSuccess = useCallback((authKey: string) => {
    setIsAuthenticated(true);
    setAuthKey(authKey);
    setStoredAuthState(true, authKey);
  }, []);

  const handleAuthFailed = useCallback((error: string) => {
    setIsAuthenticated(false);
    setAuthKey("");
    clearStoredAuthState();
    console.error("Authentication failed:", error);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setAuthKey("");
    clearStoredAuthState();
  }, []);

  return {
    isAuthenticated,
    authKey,
    handleAuthSuccess,
    handleAuthFailed,
    logout,
  };
};

// Hook for managing admin data
export const useAdminData = (authKey: string) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [accessCodes, setAccessCodes] = useState<AdminAccessCode[]>([]);
  const [playspaces, setPlayspaces] = useState<AdminPlayspace[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [allDevices, setAllDevices] = useState<AdminDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load data based on active tab
  const loadData = useCallback(
    async (tab: TabType) => {
      if (!authKey) return;
      
      setIsLoading(true);
      setError("");

      try {
        switch (tab) {
          case "users": {
            const result = await getUsers(authKey);
            if (result.error) throw new Error(result.error);
            setUsers(result.users || []);
            break;
          }
          case "teams": {
            const result = await getTeams(authKey);
            if (result.error) throw new Error(result.error);
            setTeams((result.teams || []) as AdminTeam[]);
            break;
          }
          case "accessCodes": {
            const result = await getAccessCodes(authKey);
            if (result.error) throw new Error(result.error);
            setAccessCodes(result.accessCodes || []);
            break;
          }
          case "playspaces": {
            const result = await getPlayspaces(authKey);
            if (result.error) throw new Error(result.error);
            setPlayspaces(result.playspaces || []);
            break;
          }
          case "events": {
            const result = await getEvents(authKey);
            if (result.error) throw new Error(result.error);
            setEvents(result.events || []);
            break;
          }
          case "devices": {
            const result = await getAllDevices(authKey);
            if (result.error) throw new Error(result.error);
            setAllDevices(result.devices || []);
            break;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [authKey]
  );

  return {
    users,
    teams,
    accessCodes,
    playspaces,
    events,
    allDevices,
    isLoading,
    error,
    loadData,
    setError,
  };
};

// Hook for user actions
export const useUserActions = (authKey: string, loadData: (tab: TabType) => Promise<void>) => {
  const handleUserAction = useCallback(
    async (userId: string, action: string) => {
      try {
        const result = await updateUser(userId, action, authKey);
        if (result.error) throw new Error(result.error);
        await loadData("users");
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "An error occurred");
      }
    },
    [authKey, loadData]
  );

  return { handleUserAction };
};

// Hook for access code actions
export const useAccessCodeActions = (authKey: string, loadData: (tab: TabType) => Promise<void>) => {
  const handleToggleAccessCode = useCallback(
    async (codeId: string, currentStatus: boolean) => {
      try {
        const result = await toggleAccessCodeStatus(codeId, !currentStatus, authKey);
        if (result.error) throw new Error(result.error);
        await loadData("accessCodes");
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "An error occurred");
      }
    },
    [authKey, loadData]
  );

  const handleDeleteAccessCode = useCallback(
    async (codeId: string) => {
      if (!confirm("Are you sure you want to delete this access code? This action cannot be undone.")) {
        return;
      }

      try {
        const result = await deleteAccessCode(codeId, authKey);
        if (result.error) throw new Error(result.error);
        await loadData("accessCodes");
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "An error occurred");
      }
    },
    [authKey, loadData]
  );

  const handleAssignPlayspaceToAccessCode = useCallback(
    async (codeId: string, playspaceId: string | null) => {
      try {
        const result = await assignPlayspaceToAccessCode(codeId, playspaceId, authKey);
        if (result.error) throw new Error(result.error);
        await loadData("accessCodes");
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "An error occurred");
      }
    },
    [authKey, loadData]
  );

  return {
    handleToggleAccessCode,
    handleDeleteAccessCode,
    handleAssignPlayspaceToAccessCode,
  };
};

// Hook for device actions
export const useDeviceActions = (authKey: string, loadData: (tab: TabType) => Promise<void>) => {
  const handleCreateDevice = useCallback(
    async (deviceType: string) => {
      try {
        const result = await createDevice(deviceType, authKey);
        if (result.error) throw new Error(result.error);
        await loadData("devices");
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Failed to create device");
      }
    },
    [authKey, loadData]
  );

  const handleAssignDevice = useCallback(
    async (deviceId: string, playspaceId?: string) => {
      if (!playspaceId) return;

      try {
        const result = await assignDeviceToPlayspace(deviceId, playspaceId, authKey);
        if (result.error) throw new Error(result.error);
        await loadData("devices");
        await loadData("playspaces");
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Failed to assign device");
      }
    },
    [authKey, loadData]
  );

  const handleUnassignDevice = useCallback(
    async (deviceId: string) => {
      try {
        const result = await unassignDeviceFromPlayspace(deviceId, authKey);
        if (result.error) throw new Error(result.error);
        await loadData("devices");
        await loadData("playspaces");
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Failed to unassign device");
      }
    },
    [authKey, loadData]
  );

  const handleDeleteDevice = useCallback(
    async (deviceId: string) => {
      try {
        const result = await deleteDevice(deviceId, authKey);
        if (result.error) throw new Error(result.error);
        await loadData("devices");
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Failed to delete device");
      }
    },
    [authKey, loadData]
  );

  const handleUpdateDeviceStatus = useCallback(
    async (deviceId: string, newStatus: string) => {
      try {
        const result = await updateDeviceStatus(deviceId, newStatus, authKey);
        if (result.error) throw new Error(result.error);
        await loadData("devices");
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Failed to update device status");
      }
    },
    [authKey, loadData]
  );

  return {
    handleCreateDevice,
    handleAssignDevice,
    handleUnassignDevice,
    handleDeleteDevice,
    handleUpdateDeviceStatus,
  };
};

// Hook for other entity actions
export const useEntityActions = (authKey: string, loadData: (tab: TabType) => Promise<void>) => {
  const handleDeletePlayspace = useCallback(
    async (playspaceId: string) => {
      try {
        const result = await deletePlayspace(playspaceId, authKey);
        if (result.error) throw new Error(result.error);
        await loadData("playspaces");
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Failed to delete playspace");
      }
    },
    [authKey, loadData]
  );

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      try {
        const result = await deleteEvent(eventId, authKey);
        if (result.error) throw new Error(result.error);
        await loadData("events");
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "An error occurred");
      }
    },
    [authKey, loadData]
  );

  return {
    handleDeletePlayspace,
    handleDeleteEvent,
  };
};

// Hook for modal states
export const useAdminModals = () => {
  const [generalAccessCodeModal, setGeneralAccessCodeModal] = useState<GeneralAccessCodeModal>({
    isOpen: false,
  });
  const [editAccessCodeModal, setEditAccessCodeModal] = useState<EditAccessCodeModal>({
    isOpen: false,
    accessCode: null,
  });

  return {
    generalAccessCodeModal,
    setGeneralAccessCodeModal,
    editAccessCodeModal,
    setEditAccessCodeModal,
  };
};

// Hook for tab and pagination state
export const useAdminNavigation = () => {
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery("");
  }, []);

  return {
    activeTab,
    searchQuery,
    currentPage,
    setSearchQuery,
    setCurrentPage,
    handleTabChange,
  };
};
