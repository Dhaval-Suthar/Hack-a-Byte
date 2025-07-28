"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminUser, AdminTeam, AdminAccessCode, AdminPlayspace, AdminEvent, AdminDevice, TabType } from "./types";
import { AdminHeader, TabNavigation, ErrorDisplay, TabContentWrapper } from "./AdminComponents";
import {
  AccessCodeModal,
  EditAccessCodeModal,
  DeviceManagementModal,
  EditPlayspaceModal
} from "./AdminModals";
import UsersTab from "./UsersTab";
import TeamsTab from "./TeamsTab";
import AccessCodesTab from "./AccessCodesTab";
import PlayspacesTab from "./PlayspacesTab";
import DevicesTab from "./DevicesTab";
import EventsTab from "./EventsTab";

// Import server actions
import {
  getUsers,
  updateUser,
  getAccessCodes,
  generateAccessCode,
  toggleAccessCodeStatus,
  updateAccessCode,
  deleteAccessCode,
  assignPlayspaceToAccessCode,
  getTeams,
  getPlayspaces,
  createPlayspace,
  updatePlayspace,
  deletePlayspace,
  getAllDevices,
  createDevice,
  assignDeviceToPlayspace,
  unassignDeviceFromPlayspace,
  deleteDevice,
  updateDeviceStatus,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/app/actions/admin";

interface AdminDashboardProps {
  authKey: string;
  onLogout: () => void;
}

export default function AdminDashboard({ authKey, onLogout }: AdminDashboardProps) {
  // Tab and data state
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [accessCodes, setAccessCodes] = useState<AdminAccessCode[]>([]);
  const [playspaces, setPlayspaces] = useState<AdminPlayspace[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [allDevices, setAllDevices] = useState<AdminDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [showEditAccessCodeModal, setShowEditAccessCodeModal] = useState(false);
  const [showDeviceManagementModal, setShowDeviceManagementModal] = useState(false);
  const [showEditPlayspaceModal, setShowEditPlayspaceModal] = useState(false);
  const [selectedAccessCode, setSelectedAccessCode] = useState<AdminAccessCode | null>(null);
  const [selectedPlayspace, setSelectedPlayspace] = useState<AdminPlayspace | null>(null);

  // Load data based on active tab using server actions
  const loadData = useCallback(
    async (tab: TabType) => {
      setIsLoading(true);
      setError("");

      try {
        // Use the appropriate server action based on the tab
        switch (tab) {
          case "users": {
            const result = await getUsers(authKey);
            if (result.error) {
              throw new Error(result.error);
            }
            setUsers(result.users || []);
            break;
          }
          case "teams": {
            const result = await getTeams(authKey);
            if (result.error) {
              throw new Error(result.error);
            }
            setTeams((result.teams || []) as AdminTeam[]);
            break;
          }
          case "accessCodes": {
            const result = await getAccessCodes(authKey);
            if (result.error) {
              throw new Error(result.error);
            }
            setAccessCodes(result.accessCodes || []);
            break;
          }
          case "playspaces": {
            const result = await getPlayspaces(authKey);
            if (result.error) {
              throw new Error(result.error);
            }
            setPlayspaces(result.playspaces || []);
            break;
          }
          case "devices": {
            const result = await getAllDevices(authKey);
            if (result.error) {
              throw new Error(result.error);
            }
            setAllDevices(result.devices || []);
            break;
          }
          case "events": {
            const result = await getEvents(authKey);
            if (result.error) {
              throw new Error(result.error);
            }
            setEvents(result.events || []);
            break;
          }
          default:
            break;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [authKey]
  );

  // Load data when component mounts and when tab changes
  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, loadData]);

  // Handle user actions (promote/demote/delete) using server action
  const handleUserAction = async (userId: string, action: string) => {
    try {
      const result = await updateUser(userId, action, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh user list
      loadData("users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Transform data for component compatibility
  const transformedUsers = users.map(user => ({
    ...user,
    _id: user._id,
    username: user.username,
    email: user.email,
    isAuthenticated: user.isAuthenticated,
    isMentor: user.isMentor,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt
  }));

  const transformedTeams = teams.map(team => ({
    _id: team._id,
    name: team.name,
    description: team.description || "No description",
    members: team.members || 0
  }));

  const transformedAccessCodes = accessCodes.map(code => ({
    _id: code._id,
    code: code.code,
    type: code.type || "permanent",
    priority: code.priority || 5,
    description: code.description || "",
    isActive: code.isActive,
    usageCount: code.usageCount,
    maxUsages: code.maxUsages,
    assignedPlayspace: code.assignedPlayspace || undefined
  }));

  const transformedPlayspaces = playspaces.map(space => ({
    _id: space._id,
    name: space.name,
    description: space.description,
    isActive: true,
    isOpen: true,
    maxUsers: 50,
    currentUsers: 0
  }));

  const transformedDevices = allDevices.map(device => ({
    _id: device._id,
    name: device.deviceId,
    type: device.deviceType,
    status: device.status,
    ipAddress: "192.168.1.1",
    isAssigned: !!device.playspace,
    assignedPlayspace: device.playspace ? {
      _id: device.playspace._id,
      name: device.playspace.name,
      description: device.playspace.description
    } : undefined
  }));

  const transformedAccessCodesForPlayspaces = accessCodes.map(code => ({
    _id: code._id,
    code: code.code,
    isActive: code.isActive,
    type: code.type || "permanent",
    priority: code.priority || 5,
    description: code.description,
    assignedPlayspace: code.assignedPlayspace ? {
      _id: code.assignedPlayspace._id,
      name: code.assignedPlayspace.name
    } : null
  }));

  const transformedEvents = events.map(event => ({
    _id: event._id,
    title: event.title,
    description: event.description,
    type: event.category,
    startTime: event.startDate,
    endTime: event.endDate,
    isActive: true
  }));

  // Tab change handler
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery("");
    
    // Load devices when switching to playspaces tab (needed for device management modal)
    if (tab === "playspaces" && allDevices.length === 0) {
      loadData("devices");
    }
  };

  // Placeholder handlers for tab-specific actions
  const handleGenerateAccessCode = async (modalData?: {
    type: string;
    priority: number;
    description: string;
    maxUsages?: number;
    expiresAt?: Date;
  }) => {
    if (!modalData) {
      // Open modal
      setShowAccessCodeModal(true);
      return;
    }

    try {
      // Calculate hours from now if expiresAt is provided
      const expiresInHours = modalData.expiresAt 
        ? Math.ceil((modalData.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
        : undefined;

      const result = await generateAccessCode(
        modalData.type,
        modalData.priority,
        modalData.maxUsages,
        expiresInHours,
        modalData.description,
        undefined,
        authKey
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh access codes list
      loadData("accessCodes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate access code");
    }
  };

  const handleToggleAccessCode = async (codeId: string, currentStatus: boolean) => {
    try {
      const result = await toggleAccessCodeStatus(codeId, !currentStatus, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh access codes list
      loadData("accessCodes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle access code");
    }
  };

  const handleEditAccessCode = async (accessCode: AdminAccessCode) => {
    if (!selectedAccessCode) {
      // Open edit modal
      setSelectedAccessCode(accessCode);
      return;
    }

    try {
      const result = await updateAccessCode(accessCode._id, {
        code: accessCode.code,
        type: accessCode.type || "permanent",
        priority: accessCode.priority || 5,
        description: accessCode.description || "",
        maxUsages: accessCode.maxUsages,
        expiresAt: accessCode.expiresAt ? new Date(accessCode.expiresAt) : null
      }, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh access codes list
      loadData("accessCodes");
      setSelectedAccessCode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update access code");
    }
  };

  const handleDeleteAccessCode = async (codeId: string) => {
    try {
      const result = await deleteAccessCode(codeId, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh access codes list
      loadData("accessCodes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete access code");
    }
  };

  const handleAssignPlayspace = async (codeId: string, playspaceId: string | null) => {
    try {
      const result = await assignPlayspaceToAccessCode(codeId, playspaceId, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh access codes list
      loadData("accessCodes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign playspace");
    }
  };

  const handleViewTeamDetails = (teamId: string) => {
    // TODO: Navigate to team details page or open modal
    console.log("View team details", teamId);
    // In the original, this used router.push(`/admin/teams/${teamId}`)
    // For now, we'll just log it since we don't have that route implemented
  };

  const handleCreatePlayspace = async (name: string, description: string) => {
    try {
      const result = await createPlayspace(
        name,
        description,
        false,
        [],
        authKey
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh playspaces list
      loadData("playspaces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create playspace");
    }
  };

  const handleTogglePlayspace = async (playspaceId: string, currentStatus: boolean) => {
    try {
      // Since updatePlayspace doesn't support isPublic toggle, we'll just log for now
      // TODO: Need a proper toggle function or update the server action
      console.log("Toggle playspace status", playspaceId, currentStatus);
      setError("Playspace toggle not yet implemented in server action");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle playspace");
    }
  };

  const handleUpdatePlayspace = async (playspace: unknown) => {
    const ps = playspace as AdminPlayspace;
    if (!selectedPlayspace) {
      // Open edit modal
      setSelectedPlayspace(ps);
      setShowEditPlayspaceModal(true);
      return;
    }

    try {
      const result = await updatePlayspace(
        ps._id,
        ps.name,
        ps.description,
        authKey
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh playspaces list
      loadData("playspaces");
      setSelectedPlayspace(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update playspace");
    }
  };

  const handleDeletePlayspace = async (playspaceId: string) => {
    try {
      const result = await deletePlayspace(playspaceId, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh playspaces list
      loadData("playspaces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete playspace");
    }
  };

  const handleAssignAccessCodeToPlayspace = async (playspaceId: string, accessCodeId: string) => {
    try {
      const result = await assignPlayspaceToAccessCode(accessCodeId, playspaceId, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh both access codes and playspaces lists
      loadData("accessCodes");
      loadData("playspaces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign access code to playspace");
    }
  };

  const handleRemoveAccessCodeFromPlayspace = async (playspaceId: string) => {
    try {
      // Find the access code assigned to this playspace
      const assignedCode = accessCodes.find(code => code.assignedPlayspace?._id === playspaceId);
      if (assignedCode) {
        const result = await assignPlayspaceToAccessCode(assignedCode._id, null, authKey);

        if (result.error) {
          throw new Error(result.error);
        }

        // Refresh both access codes and playspaces lists
        loadData("accessCodes");
        loadData("playspaces");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove access code from playspace");
    }
  };

  const handleGenerateAccessCodeForPlayspace = async (playspaceId: string, playspaceName: string) => {
    try {
      const result = await generateAccessCode(
        "permanent",
        5,
        undefined,
        undefined,
        `Access code for ${playspaceName}`,
        playspaceId,
        authKey
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh both access codes and playspaces lists
      loadData("accessCodes");
      loadData("playspaces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate access code for playspace");
    }
  };

  const handleCreateDevice = async (deviceType: string) => {
    try {
      const result = await createDevice(deviceType, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh devices list
      loadData("devices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create device");
    }
  };

  const handleAssignDevice = async (deviceId: string, playspaceId?: string) => {
    try {
      let result;
      if (playspaceId) {
        result = await assignDeviceToPlayspace(deviceId, playspaceId, authKey);
      } else {
        result = await unassignDeviceFromPlayspace(deviceId, authKey);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh devices list
      loadData("devices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign device");
    }
  };

  const handleUnassignDevice = async (deviceId: string) => {
    try {
      const result = await unassignDeviceFromPlayspace(deviceId, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh devices list
      loadData("devices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unassign device");
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      const result = await deleteDevice(deviceId, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh devices list
      loadData("devices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete device");
    }
  };

  const handleUpdateStatus = async (deviceId: string, newStatus: string) => {
    try {
      const result = await updateDeviceStatus(deviceId, newStatus, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh devices list
      loadData("devices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update device status");
    }
  };

  const handleCreateEvent = async () => {
    try {
      // For now, create a basic event - this could be enhanced with a modal form
      const result = await createEvent(
        "New Event",
        "Event description",
        new Date(),
        new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        "Online",
        "Workshop",
        true,
        50,
        authKey
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh events list
      loadData("events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  const handleToggleEvent = async (eventId: string, currentStatus: boolean) => {
    try {
      const result = await updateEvent(eventId, {
        isPublic: !currentStatus
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh events list
      loadData("events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle event");
    }
  };

  const handleEditEvent = async (event: {_id: string; title?: string; description?: string; startDate?: string; endDate?: string; location?: string; category?: string; isPublic?: boolean; capacity?: number}) => {
    try {
      const result = await updateEvent(event._id, {
        title: event.title,
        description: event.description,
        startDate: event.startDate ? new Date(event.startDate) : undefined,
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        location: event.location,
        category: event.category,
        isPublic: event.isPublic,
        capacity: event.capacity
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh events list
      loadData("events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const result = await deleteEvent(eventId, authKey);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh events list
      loadData("events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  const handleViewParticipants = (event: unknown) => {
    // TODO: Implement view participants - could open a modal with participant list
    console.log("View participants", event);
  };

  const handleToggleRegistration = async (eventId: string, currentStatus: boolean) => {
    try {
      // Toggle registration by updating the event's public status as a proxy
      const result = await updateEvent(eventId, {
        isPublic: !currentStatus
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh events list
      loadData("events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle registration");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <AdminHeader onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <ErrorDisplay error={error} />
        
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        
        <TabContentWrapper>
          {activeTab === "users" && (
            <UsersTab
              users={transformedUsers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              isLoading={isLoading}
              onUserAction={handleUserAction}
            />
          )}
          
          {activeTab === "teams" && (
            <TeamsTab
              teams={transformedTeams}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              isLoading={isLoading}
              onViewTeamDetails={handleViewTeamDetails}
            />
          )}
          
          {activeTab === "accessCodes" && (
            <AccessCodesTab
              accessCodes={transformedAccessCodes}
              playspaces={playspaces}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              isLoading={isLoading}
              onGenerateAccessCode={handleGenerateAccessCode}
              onToggleAccessCode={handleToggleAccessCode}
              setShowEditAccessCodeModal={setShowEditAccessCodeModal}
              onDeleteAccessCode={handleDeleteAccessCode}
              onAssignPlayspace={handleAssignPlayspace}
              setSelectedAccessCode={setSelectedAccessCode}
            />
          )}
          
          {activeTab === "playspaces" && (
            <PlayspacesTab
              playspaces={transformedPlayspaces}
              accessCodes={transformedAccessCodesForPlayspaces}
              devices={transformedDevices}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              isLoading={isLoading}
              onCreatePlayspace={handleCreatePlayspace}
              onTogglePlayspace={handleTogglePlayspace}
              onUpdatePlayspace={handleUpdatePlayspace}
              onDeletePlayspace={handleDeletePlayspace}
              onAssignAccessCode={handleAssignAccessCodeToPlayspace}
              onRemoveAccessCode={handleRemoveAccessCodeFromPlayspace}
              onGenerateAccessCodeForPlayspace={handleGenerateAccessCodeForPlayspace}
              onAssignDevice={(deviceId: string, playspaceId: string) => handleAssignDevice(deviceId, playspaceId)}
              onUnassignDevice={(deviceId: string) => handleAssignDevice(deviceId)}
            />
          )}
          
          {activeTab === "devices" && (
            <DevicesTab
              devices={transformedDevices}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              isLoading={isLoading}
              onCreateDevice={handleCreateDevice}
              onUnassignDevice={handleUnassignDevice}
              onDeleteDevice={handleDeleteDevice}
              onUpdateStatus={handleUpdateStatus}
            />
          )}
          
          {activeTab === "events" && (
            <EventsTab
              events={transformedEvents}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              isLoading={isLoading}
              onCreateEvent={handleCreateEvent}
              onToggleEvent={handleToggleEvent}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onViewParticipants={handleViewParticipants}
              onToggleRegistration={handleToggleRegistration}
            />
          )}
        </TabContentWrapper>
      </main>

      {/* Modals */}
      <AccessCodeModal
        isOpen={showAccessCodeModal}
        onClose={() => setShowAccessCodeModal(false)}
        onSubmit={handleGenerateAccessCode}
      />

      <EditAccessCodeModal
        isOpen={showEditAccessCodeModal}
        onClose={() => {
          setShowEditAccessCodeModal(false);
          setSelectedAccessCode(null);
        }}
        onSubmit={handleEditAccessCode}
        accessCode={selectedAccessCode ? {
          ...selectedAccessCode,
          assignedPlayspace: selectedAccessCode.assignedPlayspace || undefined
        } : null}
      />

      <DeviceManagementModal
        isOpen={showDeviceManagementModal}
        onClose={() => {
          setShowDeviceManagementModal(false);
          setSelectedPlayspace(null);
        }}
        playspace={selectedPlayspace ? {
          _id: selectedPlayspace._id,
          name: selectedPlayspace.name,
          description: selectedPlayspace.description
        } : null}
        devices={transformedDevices}
        onAssignDevice={handleAssignDevice}
        onUnassignDevice={handleUnassignDevice}
      />

      <EditPlayspaceModal
        isOpen={showEditPlayspaceModal}
        onClose={() => {
          setShowEditPlayspaceModal(false);
          setSelectedPlayspace(null);
        }}
        onSubmit={handleUpdatePlayspace}
        playspace={selectedPlayspace ? {
          _id: selectedPlayspace._id,
          name: selectedPlayspace.name,
          description: selectedPlayspace.description
        } : null}
      />
    </div>
  );
}