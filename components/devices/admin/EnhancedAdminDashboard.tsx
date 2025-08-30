"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminHeader, LoadingSpinner, ErrorDisplay, TabContentWrapper } from "./AdminComponents";
import { BulkOperationModal, Notification, AdvancedSearch } from "./EnhancedAdminComponents";
import { TournamentModal, GameSessionModal } from "./GameManagementComponents";

// Import server actions
// Import server actions
import {
  getUsers,
  updateUser,
  getAccessCodes,
  generateAccessCode,
  toggleAccessCodeStatus,
  deleteAccessCode,
  getPlayspaces,
  createPlayspace, // eslint-disable-line @typescript-eslint/no-unused-vars
  updatePlayspace,
  deletePlayspace,
  getAllDevices,
  createDevice, // eslint-disable-line @typescript-eslint/no-unused-vars
  assignDeviceToPlayspace, // eslint-disable-line @typescript-eslint/no-unused-vars
  unassignDeviceFromPlayspace, // eslint-disable-line @typescript-eslint/no-unused-vars
  updateDeviceStatus,
  deleteDevice, // eslint-disable-line @typescript-eslint/no-unused-vars
  getEvents,
  createEvent, // eslint-disable-line @typescript-eslint/no-unused-vars
  updateEvent,
  deleteEvent,
  getTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  getGameSessions,
  createGameSession, // eslint-disable-line @typescript-eslint/no-unused-vars
  updateGameSessionScore,
  endGameSession,
  getTournamentTeams, // eslint-disable-line @typescript-eslint/no-unused-vars
  getLeaderboards, // eslint-disable-line @typescript-eslint/no-unused-vars
  getWalletStats // eslint-disable-line @typescript-eslint/no-unused-vars
} from "@/app/actions/admin";

interface User {
  _id: string;
  username: string;
  email: string;
  isAuthenticated: boolean;
  isMentor: boolean;
  isAdmin: boolean;
  createdAt: string;
}

interface AccessCode {
  _id: string;
  code: string;
  priority: string;
  type: string;
  isActive: boolean;
  usageCount: number;
  maxUsages: number;
  expiresAt?: string;
  description: string;
  assignedPlayspace: { _id: string; name: string; description: string } | null;
  createdAt: string;
}

interface Playspace {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  devices: string[];
  createdAt: string;
  updatedAt: string;
}

interface Device {
  _id: string;
  deviceMacAddress: string;
  deviceType: string;
  status: string;
  playspace: { _id: string; name: string; description: string } | null;
  createdAt: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  category: string;
  isPublic: boolean;
  capacity: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface Tournament {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  maxTeams: number;
  registeredTeams: number;
  prizePool: number;
  gameMode: string;
  createdAt: string;
}

interface GameSession {
  _id: string;
  tournamentId: string;
  team1Id: string;
  team2Id: string;
  team1Name: string;
  team2Name: string;
  status: 'waiting' | 'active' | 'completed' | 'paused';
  startTime: string;
  team1Score: number;
  team2Score: number;
  duration: number;
}

interface Team {
  _id: string;
  name: string;
  captain: string;
  members: string[];
  tournamentId: string;
  status: 'active' | 'eliminated' | 'waiting';
  walletAddress: string;
  currentBalance: number;
  createdAt: string;
}

export default function EnhancedAdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'warning' | 'info'}>>([]);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [playspaces, setPlayspaces] = useState<Playspace[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Selection states for bulk operations
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedAccessCodes, setSelectedAccessCodes] = useState<string[]>([]);
  const [selectedPlayspaces, setSelectedPlayspaces] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Modal states
  const [bulkModal, setBulkModal] = useState<{
    isOpen: boolean;
    operation: 'delete' | 'activate' | 'deactivate' | 'export';
    items: (User | AccessCode | Playspace | Device | Event)[];
    type: string;
  }>({ isOpen: false, operation: 'delete', items: [], type: '' });

  // Tournament modal states
  const [tournamentModal, setTournamentModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    tournament?: Tournament;
  }>({ isOpen: false, mode: 'create' });

  // Game session modal states
  const [gameSessionModal, setGameSessionModal] = useState<{
    isOpen: boolean;
  }>({ isOpen: false });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const adminAuthKey = typeof window !== 'undefined' ? localStorage.getItem('admin-auth-key') : null;

      const [usersData, accessCodesData, playspacesData, devicesData, eventsData, tournamentsData, gameSessionsData] =
        await Promise.all([
          getUsers(adminAuthKey as string),
          getAccessCodes(adminAuthKey as string),
          getPlayspaces(adminAuthKey as string),
          getAllDevices(adminAuthKey as string),
          getEvents(adminAuthKey as string),
          getTournaments(adminAuthKey as string),
          getGameSessions(adminAuthKey as string),
        ]);

      if (usersData.users) setUsers(usersData.users);
      if (usersData.error) setError(usersData.error);

      if (accessCodesData.accessCodes) setAccessCodes(accessCodesData.accessCodes);
      if (accessCodesData.error) setError(accessCodesData.error);

      if (playspacesData.playspaces) setPlayspaces(playspacesData.playspaces);
      if (playspacesData.error) setError(playspacesData.error);

      if (devicesData.devices) setDevices(devicesData.devices);
      if (devicesData.error) setError(devicesData.error);

      if (eventsData.events) setEvents(eventsData.events);
      if (eventsData.error) setError(eventsData.error);

      if (tournamentsData.tournaments) setTournaments(tournamentsData.tournaments);
      if (tournamentsData.error) setError(tournamentsData.error);

      if (gameSessionsData.sessions) setGameSessions(gameSessionsData.sessions);
      if (gameSessionsData.error) setError(gameSessionsData.error);

    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBulkOperation = async (operation: 'delete' | 'activate' | 'deactivate' | 'export', type: string) => {
    let selectedItems: (User | AccessCode | Playspace | Device | Event)[] = [];

    switch (type) {
      case 'users':
        selectedItems = users.filter(u => selectedUsers.includes(u._id));
        break;
      case 'accessCodes':
        selectedItems = accessCodes.filter(c => selectedAccessCodes.includes(c._id));
        break;
      case 'playspaces':
        selectedItems = playspaces.filter(p => selectedPlayspaces.includes(p._id));
        break;
      case 'devices':
        selectedItems = devices.filter(d => selectedDevices.includes(d._id));
        break;
      case 'events':
        selectedItems = events.filter(e => selectedEvents.includes(e._id));
        break;
    }

    if (operation === 'export') {
      // Handle export
      const dataStr = JSON.stringify(selectedItems, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `${type}-export-${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      addNotification(`${selectedItems.length} ${type} exported successfully`, 'success');
      return;
    }

    setBulkModal({
      isOpen: true,
      operation,
      items: selectedItems,
      type
    });
  };

  const confirmBulkOperation = async () => {
    try {
      const { operation, items, type } = bulkModal;

      for (const item of items) {
        switch (type) {
          case 'users':
            if (operation === 'delete') {
              // Note: We don't have a deleteUser function, so we'll skip this
              continue;
            } else {
              await updateUser(item._id, operation === 'activate' ? 'activate' : 'deactivate');
            }
            break;
          case 'accessCodes':
            if (operation === 'delete') {
              await deleteAccessCode(item._id);
            } else {
              await toggleAccessCodeStatus(item._id, operation === 'activate');
            }
            break;
          case 'playspaces':
            if (operation === 'delete') {
              await deletePlayspace(item._id);
            } else {
              const playspaceItem = item as Playspace;
              await updatePlayspace(item._id, playspaceItem.name, playspaceItem.description);
            }
            break;
          case 'devices':
            await updateDeviceStatus(item._id, operation === 'activate' ? 'active' : 'inactive');
            break;
          case 'events':
            if (operation === 'delete') {
              await deleteEvent(item._id);
            } else {
              await updateEvent(item._id, { isPublic: operation === 'activate' });
            }
            break;
        }
      }

      addNotification(`Bulk ${operation} completed successfully`, 'success');
      setBulkModal({ isOpen: false, operation: 'delete', items: [], type: '' });

      // Clear selections
      setSelectedUsers([]);
      setSelectedAccessCodes([]);
      setSelectedPlayspaces([]);
      setSelectedDevices([]);
      setSelectedEvents([]);

      // Refresh data
      fetchData();

    } catch (err) {
      console.error('Bulk operation error:', err);
      addNotification(`Bulk ${bulkModal.operation} failed`, 'error');
    }
  };

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setSearchQuery(query);
    setActiveFilters(filters);
  };

  const getFilteredData = (data: (User | AccessCode | Playspace | Device | Event)[], searchFields: string[]) => {
    return data.filter(item => {
      // Search query filter
      if (searchQuery) {
        const matchesSearch = searchFields.some(field => {
          const value = (item as unknown as Record<string, unknown>)[field];
          return value && value.toString().toLowerCase().includes(searchQuery.toLowerCase());
        });
        if (!matchesSearch) return false;
      }

      // Active filters
      for (const [key, value] of Object.entries(activeFilters)) {
        if (value && (item as unknown as Record<string, unknown>)[key] !== value) {
          return false;
        }
      }

      return true;
    });
  };

  const tabs = [
    { id: 'users', label: 'Users', count: users.length },
    { id: 'accessCodes', label: 'Access Codes', count: accessCodes.length },
    { id: 'playspaces', label: 'Playspaces', count: playspaces.length },
    { id: 'devices', label: 'Devices', count: devices.length },
    { id: 'events', label: 'Events', count: events.length },
    { id: 'tournaments', label: 'Tournaments', count: tournaments.length },
    { id: 'analytics', label: 'Analytics', count: 0 },
  ];

  const renderUsersTab = () => {
    const filteredUsers = getFilteredData(users, ['username', 'email']) as User[];
    const hasSelections = selectedUsers.length > 0;

    return (
      <TabContentWrapper>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Users Management</h2>
            {hasSelections && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkOperation('activate', 'users')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Activate ({selectedUsers.length})
                </button>
                <button
                  onClick={() => handleBulkOperation('deactivate', 'users')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  Deactivate ({selectedUsers.length})
                </button>
                <button
                  onClick={() => handleBulkOperation('export', 'users')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Export ({selectedUsers.length})
                </button>
              </div>
            )}
          </div>

          <AdvancedSearch
            onSearch={handleSearch}
            placeholder="Search users by username or email..."
            filters={[
              {
                key: 'role',
                label: 'Role',
                type: 'select',
                options: [
                  { value: 'user', label: 'User' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'moderator', label: 'Moderator' }
                ]
              },
              {
                key: 'isActive',
                label: 'Status',
                type: 'select',
                options: [
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' }
                ]
              }
            ]}
          />

          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(u => u._id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-white font-medium">Username</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Role</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Created</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user._id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user._id));
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-white">{user.username}</td>
                    <td className="px-4 py-3 text-gray-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.isAdmin ? 'bg-red-500/20 text-red-400' :
                        user.isMentor ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.isAdmin ? 'Admin' : user.isMentor ? 'Mentor' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.isAuthenticated ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.isAuthenticated ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async () => {
                          try {
                            await updateUser(user._id, user.isAuthenticated ? 'deactivate' : 'activate');
                            addNotification(`User ${user.username} ${user.isAuthenticated ? 'deactivated' : 'activated'}`, 'success');
                            fetchData();
                          } catch {
                            console.error('Error updating user');
                            addNotification('Failed to update user', 'error');
                          }
                        }}
                        className="px-3 py-1 bg-cyber-primary hover:bg-cyber-primary/80 text-white rounded text-sm transition-colors"
                      >
                        {user.isAuthenticated ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TabContentWrapper>
    );
  };

  const renderAccessCodesTab = () => {
    const filteredCodes = getFilteredData(accessCodes, ['code', 'usedBy']) as AccessCode[];
    const hasSelections = selectedAccessCodes.length > 0;

    return (
      <TabContentWrapper>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Access Codes Management</h2>
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  try {
                    const result = await generateAccessCode();
                    if (result.success) {
                      addNotification('Access code generated successfully', 'success');
                      fetchData();
                    } else {
                      addNotification('Failed to generate access code', 'error');
                    }
                  } catch {
                    addNotification('Failed to generate access code', 'error');
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Generate Code
              </button>
              {hasSelections && (
                <>
                  <button
                    onClick={() => handleBulkOperation('activate', 'accessCodes')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Activate ({selectedAccessCodes.length})
                  </button>
                  <button
                    onClick={() => handleBulkOperation('deactivate', 'accessCodes')}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    Deactivate ({selectedAccessCodes.length})
                  </button>
                  <button
                    onClick={() => handleBulkOperation('delete', 'accessCodes')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Delete ({selectedAccessCodes.length})
                  </button>
                  <button
                    onClick={() => handleBulkOperation('export', 'accessCodes')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Export ({selectedAccessCodes.length})
                  </button>
                </>
              )}
            </div>
          </div>

          <AdvancedSearch
            onSearch={handleSearch}
            placeholder="Search access codes..."
            filters={[
              {
                key: 'isActive',
                label: 'Status',
                type: 'select',
                options: [
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' }
                ]
              }
            ]}
          />

          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAccessCodes.length === filteredCodes.length && filteredCodes.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAccessCodes(filteredCodes.map(c => c._id));
                        } else {
                          setSelectedAccessCodes([]);
                        }
                      }}
                      className="rounded border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-white font-medium">Code</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Usage</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Created</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Expires</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((code) => (
                  <tr key={code._id} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedAccessCodes.includes(code._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAccessCodes(prev => [...prev, code._id]);
                          } else {
                            setSelectedAccessCodes(prev => prev.filter(id => id !== code._id));
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-white font-mono">{code.code}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        code.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {code.usageCount}/{code.maxUsages}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(code.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              await toggleAccessCodeStatus(code._id, !code.isActive);
                              addNotification(`Access code ${code.isActive ? 'deactivated' : 'activated'}`, 'success');
                              fetchData();
                            } catch {
                              addNotification('Failed to update access code', 'error');
                            }
                          }}
                          className="px-3 py-1 bg-cyber-primary hover:bg-cyber-primary/80 text-white rounded text-sm transition-colors"
                        >
                          {code.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deleteAccessCode(code._id);
                              addNotification('Access code deleted', 'success');
                              fetchData();
                            } catch {
                              addNotification('Failed to delete access code', 'error');
                            }
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TabContentWrapper>
    );
  };

  const renderTournamentsTab = () => {
    // Filter tournaments based on search query and active filters
    const filteredTournaments = tournaments.filter(tournament => {
      // Search query filter
      if (searchQuery) {
        const matchesSearch = ['name', 'description'].some(field => {
          const value = (tournament as unknown as Record<string, unknown>)[field];
          return value && value.toString().toLowerCase().includes(searchQuery.toLowerCase());
        });
        if (!matchesSearch) return false;
      }

      // Active filters
      for (const [key, value] of Object.entries(activeFilters)) {
        if (value && (tournament as unknown as Record<string, unknown>)[key] !== value) {
          return false;
        }
      }

      return true;
    });

    return (
      <TabContentWrapper>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Tournament Management</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setTournamentModal({ isOpen: true, mode: 'create' })}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Create Tournament
              </button>
              <button
                onClick={() => setGameSessionModal({ isOpen: true })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                View Game Sessions
              </button>
            </div>
          </div>

          <AdvancedSearch
            onSearch={handleSearch}
            placeholder="Search tournaments by name or description..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: [
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]
              },
              {
                key: 'gameMode',
                label: 'Game Mode',
                type: 'select',
                options: [
                  { value: 'tournament', label: 'Tournament' },
                  { value: 'quick', label: 'Quick Match' },
                  { value: 'standard', label: 'Standard' }
                ]
              }
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <div key={tournament._id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{tournament.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    tournament.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    tournament.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                    tournament.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {tournament.status}
                  </span>
                </div>

                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{tournament.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Teams:</span>
                    <span className="text-white">{tournament.registeredTeams}/{tournament.maxTeams}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prize Pool:</span>
                    <span className="text-yellow-400">${tournament.prizePool.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Start:</span>
                    <span className="text-white">{new Date(tournament.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mode:</span>
                    <span className="text-white capitalize">{tournament.gameMode}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => setTournamentModal({ isOpen: true, mode: 'edit', tournament })}
                    className="flex-1 px-3 py-2 bg-cyber-primary hover:bg-cyber-primary/80 text-white rounded text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this tournament?')) {
                        try {
                          const result = await deleteTournament(tournament._id);
                          if (result.success) {
                            addNotification('Tournament deleted successfully', 'success');
                            fetchData();
                          } else {
                            addNotification(result.error || 'Failed to delete tournament', 'error');
                          }
                        } catch {
                          addNotification('Failed to delete tournament', 'error');
                        }
                      }
                    }}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTournaments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No tournaments found. Create your first tournament to get started!</p>
            </div>
          )}
        </div>
      </TabContentWrapper>
    );
  };

  const renderAnalyticsTab = () => {
    // Mock analytics data - in a real implementation, this would come from server actions
    const analyticsData = {
      totalUsers: users.length,
      totalTournaments: tournaments.length,
      totalGameSessions: gameSessions.length,
      activeUsers: users.filter(u => u.isAuthenticated).length,
      completedTournaments: tournaments.filter(t => t.status === 'completed').length,
      activeTournaments: tournaments.filter(t => t.status === 'active').length,
      totalPrizePool: tournaments.reduce((sum, t) => sum + t.prizePool, 0),
      systemHealth: {
        status: 'healthy' as const,
        uptime: '99.9%',
        responseTime: '120ms'
      }
    };

    const StatCard = ({ title, value, change, icon, color }: {
      title: string;
      value: string | number;
      change?: string;
      icon: string;
      color: string;
    }) => (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {change && (
              <p className="text-sm text-green-400 mt-1">{change}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </div>
    );

    return (
      <TabContentWrapper>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/80 text-white rounded-lg transition-colors">
                Export Report
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                Refresh Data
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={analyticsData.totalUsers}
              change="+12% from last month"
              icon="👥"
              color="bg-blue-500/20"
            />
            <StatCard
              title="Active Tournaments"
              value={analyticsData.activeTournaments}
              change={`${analyticsData.totalTournaments} total`}
              icon="🏆"
              color="bg-green-500/20"
            />
            <StatCard
              title="Total Prize Pool"
              value={`$${analyticsData.totalPrizePool.toLocaleString()}`}
              change="Across all tournaments"
              icon="💰"
              color="bg-yellow-500/20"
            />
            <StatCard
              title="System Health"
              value={analyticsData.systemHealth.status}
              change={analyticsData.systemHealth.uptime}
              icon="⚡"
              color="bg-purple-500/20"
            />
          </div>

          {/* Charts and Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📈</span>
                  </div>
                  <p className="text-gray-400">Growth chart visualization</p>
                  <p className="text-sm text-gray-500 mt-2">Interactive chart coming soon</p>
                </div>
              </div>
            </div>

            {/* Tournament Performance */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Tournament Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Completed Tournaments</span>
                  <span className="text-white font-medium">{analyticsData.completedTournaments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Sessions</span>
                  <span className="text-white font-medium">{analyticsData.totalGameSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg. Tournament Size</span>
                  <span className="text-white font-medium">
                    {analyticsData.totalTournaments > 0
                      ? Math.round(tournaments.reduce((sum, t) => sum + t.maxTeams, 0) / analyticsData.totalTournaments)
                      : 0} teams
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg. Prize Pool</span>
                  <span className="text-white font-medium">
                    ${analyticsData.totalTournaments > 0
                      ? Math.round(analyticsData.totalPrizePool / analyticsData.totalTournaments).toLocaleString()
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { type: 'Tournament Created', description: 'New tournament "CryptoHeist Championship" created', time: '2 hours ago' },
                { type: 'User Registered', description: 'New user joined the platform', time: '4 hours ago' },
                { type: 'Game Session', description: 'Tournament match completed', time: '6 hours ago' },
                { type: 'Prize Distributed', description: 'Tournament winner received $5,000', time: '1 day ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-cyber-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{activity.type}</p>
                    <p className="text-gray-400 text-sm">{activity.description}</p>
                  </div>
                  <span className="text-gray-500 text-xs">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-400 text-xl">✓</span>
                </div>
                <p className="text-white font-medium">Database</p>
                <p className="text-gray-400 text-sm">Healthy</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-400 text-xl">✓</span>
                </div>
                <p className="text-white font-medium">API</p>
                <p className="text-gray-400 text-sm">{analyticsData.systemHealth.responseTime}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-400 text-xl">✓</span>
                </div>
                <p className="text-white font-medium">Uptime</p>
                <p className="text-gray-400 text-sm">{analyticsData.systemHealth.uptime}</p>
              </div>
            </div>
          </div>
        </div>
      </TabContentWrapper>
    );
  };

  const renderPlayspacesTab = () => {
    const filteredPlayspaces = getFilteredData(playspaces, ['name', 'description']) as Playspace[];
    const hasSelections = selectedPlayspaces.length > 0;

    return (
      <TabContentWrapper>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Playspaces Management</h2>
            {hasSelections && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkOperation('activate', 'playspaces')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Activate ({selectedPlayspaces.length})
                </button>
                <button
                  onClick={() => handleBulkOperation('deactivate', 'playspaces')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  Deactivate ({selectedPlayspaces.length})
                </button>
                <button
                  onClick={() => handleBulkOperation('delete', 'playspaces')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete ({selectedPlayspaces.length})
                </button>
                <button
                  onClick={() => handleBulkOperation('export', 'playspaces')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Export ({selectedPlayspaces.length})
                </button>
              </div>
            )}
          </div>

          <AdvancedSearch
            onSearch={handleSearch}
            placeholder="Search playspaces by name or description..."
            filters={[
              {
                key: 'isPublic',
                label: 'Visibility',
                type: 'select',
                options: [
                  { value: 'true', label: 'Public' },
                  { value: 'false', label: 'Private' }
                ]
              }
            ]}
          />

          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPlayspaces.length === filteredPlayspaces.length && filteredPlayspaces.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlayspaces(filteredPlayspaces.map(p => p._id));
                        } else {
                          setSelectedPlayspaces([]);
                        }
                      }}
                      className="rounded border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-white font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Description</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Devices</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Visibility</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Created</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayspaces.map((playspace) => (
                  <tr key={playspace._id} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPlayspaces.includes(playspace._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlayspaces(prev => [...prev, playspace._id]);
                          } else {
                            setSelectedPlayspaces(prev => prev.filter(id => id !== playspace._id));
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{playspace.name}</td>
                    <td className="px-4 py-3 text-gray-300">{playspace.description}</td>
                    <td className="px-4 py-3 text-gray-300">{playspace.devices.length}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        playspace.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {playspace.isPublic ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(playspace.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              await updatePlayspace(playspace._id, playspace.name, playspace.description);
                              addNotification(`Playspace ${playspace.name} updated`, 'success');
                              fetchData();
                            } catch {
                              addNotification('Failed to update playspace', 'error');
                            }
                          }}
                          className="px-3 py-1 bg-cyber-primary hover:bg-cyber-primary/80 text-white rounded text-sm transition-colors"
                        >
                          Update
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deletePlayspace(playspace._id);
                              addNotification('Playspace deleted', 'success');
                              fetchData();
                            } catch {
                              addNotification('Failed to delete playspace', 'error');
                            }
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TabContentWrapper>
    );
  };

  const renderDevicesTab = () => {
    const filteredDevices = getFilteredData(devices, ['deviceMacAddress', 'deviceType']) as Device[];
    const hasSelections = selectedDevices.length > 0;

    return (
      <TabContentWrapper>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Devices Management</h2>
            {hasSelections && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkOperation('activate', 'devices')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Activate ({selectedDevices.length})
                </button>
                <button
                  onClick={() => handleBulkOperation('deactivate', 'devices')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  Deactivate ({selectedDevices.length})
                </button>
                <button
                  onClick={() => handleBulkOperation('export', 'devices')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Export ({selectedDevices.length})
                </button>
              </div>
            )}
          </div>

          <AdvancedSearch
            onSearch={handleSearch}
            placeholder="Search devices by MAC address or type..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'maintenance', label: 'Maintenance' }
                ]
              },
              {
                key: 'deviceType',
                label: 'Device Type',
                type: 'select',
                options: [
                  { value: 'hackbook-e95', label: 'HackBook E95' },
                  { value: 'hackbook-w95', label: 'HackBook W95' },
                  { value: 'hackdroid', label: 'HackDroid' },
                  { value: 'hackphone', label: 'HackPhone' }
                ]
              }
            ]}
          />

          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDevices(filteredDevices.map(d => d._id));
                        } else {
                          setSelectedDevices([]);
                        }
                      }}
                      className="rounded border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-white font-medium">MAC Address</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Device Type</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Playspace</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Created</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr key={device._id} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedDevices.includes(device._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDevices(prev => [...prev, device._id]);
                          } else {
                            setSelectedDevices(prev => prev.filter(id => id !== device._id));
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-white font-mono text-sm">{device.deviceMacAddress}</td>
                    <td className="px-4 py-3 text-gray-300 capitalize">{device.deviceType.replace('-', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        device.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        device.status === 'inactive' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {device.playspace?.name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(device.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async () => {
                          try {
                            await updateDeviceStatus(device._id, device.status === 'active' ? 'inactive' : 'active');
                            addNotification(`Device ${device.status === 'active' ? 'deactivated' : 'activated'}`, 'success');
                            fetchData();
                          } catch {
                            addNotification('Failed to update device', 'error');
                          }
                        }}
                        className="px-3 py-1 bg-cyber-primary hover:bg-cyber-primary/80 text-white rounded text-sm transition-colors"
                      >
                        {device.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TabContentWrapper>
    );
  };

  const renderEventsTab = () => {
    const filteredEvents = getFilteredData(events, ['title', 'description']) as Event[];
    const hasSelections = selectedEvents.length > 0;

    return (
      <TabContentWrapper>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Events Management</h2>
            {hasSelections && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkOperation('activate', 'events')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Make Public ({selectedEvents.length})
                </button>
                <button
                  onClick={() => handleBulkOperation('deactivate', 'events')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  Make Private ({selectedEvents.length})
                </button>
                <button
                  onClick={() => handleBulkOperation('delete', 'events')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete ({selectedEvents.length})
                </button>
                <button
                  onClick={() => handleBulkOperation('export', 'events')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Export ({selectedEvents.length})
                </button>
              </div>
            )}
          </div>

          <AdvancedSearch
            onSearch={handleSearch}
            placeholder="Search events by title or description..."
            filters={[
              {
                key: 'category',
                label: 'Category',
                type: 'select',
                options: [
                  { value: 'conference', label: 'Conference' },
                  { value: 'workshop', label: 'Workshop' },
                  { value: 'hackathon', label: 'Hackathon' },
                  { value: 'meetup', label: 'Meetup' }
                ]
              },
              {
                key: 'isPublic',
                label: 'Visibility',
                type: 'select',
                options: [
                  { value: 'true', label: 'Public' },
                  { value: 'false', label: 'Private' }
                ]
              }
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event._id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    event.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {event.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>

                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white capitalize">{event.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="text-white">{event.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Start:</span>
                    <span className="text-white">{new Date(event.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white">{event.location}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={async () => {
                      try {
                        await updateEvent(event._id, { isPublic: !event.isPublic });
                        addNotification(`Event ${event.isPublic ? 'made private' : 'made public'}`, 'success');
                        fetchData();
                      } catch {
                        addNotification('Failed to update event', 'error');
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-cyber-primary hover:bg-cyber-primary/80 text-white rounded text-sm transition-colors"
                  >
                    {event.isPublic ? 'Make Private' : 'Make Public'}
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this event?')) {
                        try {
                          await deleteEvent(event._id);
                          addNotification('Event deleted successfully', 'success');
                          fetchData();
                        } catch {
                          addNotification('Failed to delete event', 'error');
                        }
                      }
                    }}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No events found. Events will appear here when created.</p>
            </div>
          )}
        </div>
      </TabContentWrapper>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <ErrorDisplay error={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <AdminHeader onLogout={() => window.location.href = '/'} />

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyber-primary text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'accessCodes' && renderAccessCodesTab()}
            {activeTab === 'playspaces' && renderPlayspacesTab()}
            {activeTab === 'devices' && renderDevicesTab()}
            {activeTab === 'events' && renderEventsTab()}
            {activeTab === 'tournaments' && renderTournamentsTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bulk Operation Modal */}
      <BulkOperationModal
        isOpen={bulkModal.isOpen}
        onClose={() => setBulkModal({ isOpen: false, operation: 'delete', items: [], type: '' })}
        operation={bulkModal.operation}
        items={bulkModal.items}
        onConfirm={confirmBulkOperation}
      />

      {/* Tournament Modal */}
      <TournamentModal
        isOpen={tournamentModal.isOpen}
        tournament={tournamentModal.tournament}
        onClose={() => setTournamentModal({ isOpen: false, mode: 'create' })}
        onSave={async (data) => {
          try {
            let result;
            if (tournamentModal.mode === 'create') {
              result = await createTournament(
                data.name!,
                data.description!,
                data.startDate!,
                data.endDate!,
                data.maxTeams!,
                data.prizePool!,
                data.gameMode!
              );
            } else if (tournamentModal.tournament) {
              result = await updateTournament(tournamentModal.tournament._id, {
                name: data.name,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                maxTeams: data.maxTeams,
                prizePool: data.prizePool,
                gameMode: data.gameMode
              });
            }

            if (result?.success) {
              addNotification(`Tournament ${tournamentModal.mode === 'create' ? 'created' : 'updated'} successfully`, 'success');
              setTournamentModal({ isOpen: false, mode: 'create' });
              fetchData();
            } else {
              addNotification(result?.error || 'Failed to save tournament', 'error');
            }
          } catch {
            addNotification('Failed to save tournament', 'error');
          }
        }}
      />

      {/* Game Session Modal */}
      <GameSessionModal
        isOpen={gameSessionModal.isOpen}
        sessions={gameSessions}
        onClose={() => setGameSessionModal({ isOpen: false })}
        onUpdateScore={async (sessionId, team1Score, team2Score) => {
          try {
            const result = await updateGameSessionScore(sessionId, team1Score, team2Score);
            if (result.success) {
              addNotification('Game session scores updated', 'success');
              fetchData();
            } else {
              addNotification(result.error || 'Failed to update scores', 'error');
            }
          } catch {
            addNotification('Failed to update scores', 'error');
          }
        }}
        onEndSession={async (sessionId, winnerId) => {
          try {
            const result = await endGameSession(sessionId, winnerId);
            if (result.success) {
              addNotification('Game session ended successfully', 'success');
              fetchData();
            } else {
              addNotification(result.error || 'Failed to end session', 'error');
            }
          } catch {
            addNotification('Failed to end session', 'error');
          }
        }}
      />
    </div>
  );
}
