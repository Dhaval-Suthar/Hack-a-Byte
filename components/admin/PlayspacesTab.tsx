"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Playspace {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  isOpen: boolean;
  maxUsers: number;
  currentUsers: number;
}

interface AccessCode {
  _id: string;
  code: string;
  isActive: boolean;
  type: string;
  priority: number;
  description?: string;
  assignedPlayspace?: {_id: string; name: string} | null;
}

interface Device {
  _id: string;
  name: string;
  type: string;
  status: string;
  macAddress: string;
  ipAddress: string;
  isAssigned: boolean;
  assignedPlayspace?: {
    _id: string;
    name: string;
    description: string;
  };
}

interface PlayspacesTabProps {
  playspaces: Playspace[];
  accessCodes?: AccessCode[];
  devices?: Device[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  isLoading: boolean;
  onCreatePlayspace: (name: string, description: string) => void;
  onTogglePlayspace: (playspaceId: string, currentStatus: boolean) => void;
  onUpdatePlayspace: (playspace: Playspace) => void;
  onDeletePlayspace: (playspaceId: string) => void;
  onAssignAccessCode?: (playspaceId: string, accessCodeId: string) => void;
  onRemoveAccessCode?: (playspaceId: string) => void;
  onGenerateAccessCodeForPlayspace?: (playspaceId: string, playspaceName: string) => void;
  onAssignDevice?: (deviceId: string, playspaceId: string) => void;
  onUnassignDevice?: (deviceId: string) => void;
}

export default function PlayspacesTab({
  playspaces,
  accessCodes = [],
  devices = [],
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  isLoading,
  onCreatePlayspace,
  onUpdatePlayspace,
  onDeletePlayspace,
  onAssignAccessCode,
  onRemoveAccessCode,
  onGenerateAccessCodeForPlayspace,
  onAssignDevice,
  onUnassignDevice
}: PlayspacesTabProps) {
  const [newPlayspace, setNewPlayspace] = useState({
    name: "",
    description: ""
  });

  // Modal states
  const [editPlayspaceModal, setEditPlayspaceModal] = useState({
    isOpen: false,
    playspace: null as Playspace | null,
  });

  const [accessCodeModal, setAccessCodeModal] = useState({
    isOpen: false,
    playspace: null as {id: string; name: string} | null,
  });

  const [deviceModal, setDeviceModal] = useState({
    isOpen: false,
    playspace: null as Playspace | null,
  });

  // Form states
  const [editPlayspaceForm, setEditPlayspaceForm] = useState({
    name: "",
    description: "",
  });

  const [accessCodeForm, setAccessCodeForm] = useState({
    codeType: "permanent",
    priority: 5,
    maxUsages: "",
    expiresInHours: "",
    description: "",
  });

  // Modal handlers
  const openEditPlayspaceModal = (playspace: Playspace) => {
    setEditPlayspaceModal({
      isOpen: true,
      playspace,
    });
    setEditPlayspaceForm({
      name: playspace.name,
      description: playspace.description,
    });
  };

  const closeEditPlayspaceModal = () => {
    setEditPlayspaceModal({
      isOpen: false,
      playspace: null,
    });
    setEditPlayspaceForm({
      name: "",
      description: "",
    });
  };

  const openAccessCodeModal = (playspaceId: string, playspaceName: string) => {
    setAccessCodeModal({
      isOpen: true,
      playspace: { id: playspaceId, name: playspaceName },
    });
  };

  const closeAccessCodeModal = () => {
    setAccessCodeModal({
      isOpen: false,
      playspace: null,
    });
    setAccessCodeForm({
      codeType: "permanent",
      priority: 5,
      maxUsages: "",
      expiresInHours: "",
      description: "",
    });
  };

  const openDeviceModal = (playspace: Playspace) => {
    setDeviceModal({
      isOpen: true,
      playspace,
    });
  };

  const closeDeviceModal = () => {
    setDeviceModal({
      isOpen: false,
      playspace: null,
    });
  };

  // Form change handlers
  const handleEditPlayspaceFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditPlayspaceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccessCodeFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setAccessCodeForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  // Submit handlers
  const handleUpdatePlayspace = () => {
    if (!editPlayspaceModal.playspace) return;

    const updatedPlayspace = {
      ...editPlayspaceModal.playspace,
      name: editPlayspaceForm.name,
      description: editPlayspaceForm.description,
    };

    onUpdatePlayspace(updatedPlayspace);
    closeEditPlayspaceModal();
  };

  const handleGeneratePlayspaceAccessCode = () => {
    if (!accessCodeModal.playspace || !onGenerateAccessCodeForPlayspace) return;

    onGenerateAccessCodeForPlayspace(accessCodeModal.playspace.id, accessCodeModal.playspace.name);
    closeAccessCodeModal();
  };

  const handleCreatePlayspace = () => {
    if (newPlayspace.name.trim()) {
      onCreatePlayspace(newPlayspace.name.trim(), newPlayspace.description.trim());
      setNewPlayspace({ name: "", description: "" });
    }
  };

  // Filter and pagination logic
  const filteredPlayspaces = playspaces.filter(
    (playspace) =>
      playspace.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playspace.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPlayspaces = filteredPlayspaces.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredPlayspaces.length / itemsPerPage);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search playspaces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-primary"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-300 mb-2">Create New Playspace</h3>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Name"
            value={newPlayspace.name}
            onChange={(e) => setNewPlayspace({ ...newPlayspace, name: e.target.value })}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-primary"
          />
          <input
            type="text"
            placeholder="Description"
            value={newPlayspace.description}
            onChange={(e) => setNewPlayspace({ ...newPlayspace, description: e.target.value })}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-primary"
          />
          <button
            onClick={handleCreatePlayspace}
            className="px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/90 rounded-md text-white transition-colors"
          >
            Create
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-gray-300">Name</th>
              <th className="px-4 py-3 text-left text-gray-300">Description</th>
              <th className="px-4 py-3 text-left text-gray-300">Status</th>
              <th className="px-4 py-3 text-left text-gray-300">Access Code Management</th>
              <th className="px-4 py-3 text-left text-gray-300">Devices</th>
              <th className="px-4 py-3 text-left text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedPlayspaces.map((playspace) => {
              const hasAccessCode = accessCodes.some((code) => code.assignedPlayspace?._id === playspace._id);
              const assignedCode = accessCodes.find((code) => code.assignedPlayspace?._id === playspace._id);
              const unassignedAccessCodes = accessCodes.filter((code) => !code.assignedPlayspace);

              return (
                <tr key={playspace._id} className="hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{playspace.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-300">{playspace.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        playspace.isActive
                          ? "bg-green-900/50 text-green-200"
                          : "bg-red-900/50 text-red-200"
                      }`}>
                        {playspace.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        playspace.isOpen
                          ? "bg-blue-900/50 text-blue-200"
                          : "bg-gray-900/50 text-gray-400"
                      }`}>
                        {playspace.isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {hasAccessCode ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              if (assignedCode) {
                                alert(
                                  `Access Code: ${assignedCode.code}\nDescription: ${
                                    assignedCode.description || "No description"
                                  }\nType: ${assignedCode.type}\nStatus: ${
                                    assignedCode.isActive ? "Active" : "Inactive"
                                  }`
                                );
                              }
                            }}
                            className={`${
                              assignedCode?.isActive
                                ? "bg-green-900/50 hover:bg-green-800/50 text-green-200"
                                : "bg-red-900/50 hover:bg-red-800/50 text-red-200"
                            } px-2 py-1 rounded text-xs cursor-pointer transition-colors`}
                          >
                            Code: {assignedCode?.code} ({assignedCode?.isActive ? "Active" : "Inactive"})
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveAccessCode && onRemoveAccessCode(playspace._id)}
                          className="bg-orange-900/50 hover:bg-orange-800/50 text-orange-200 px-2 py-1 rounded text-xs transition-colors"
                        >
                          Remove Access Code
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-gray-900/50 text-gray-400 px-2 py-1 rounded text-xs mb-2">
                          No Access Code Assigned
                        </div>
                        {unassignedAccessCodes.length > 0 ? (
                          <select
                            onChange={(e) => {
                              if (e.target.value && onAssignAccessCode) {
                                onAssignAccessCode(playspace._id, e.target.value);
                                e.target.value = ""; // Reset selector
                              }
                            }}
                            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyber-primary mb-2"
                            defaultValue=""
                          >
                            <option value="">Assign Access Code...</option>
                            {unassignedAccessCodes.map((code) => (
                              <option key={code._id} value={code._id}>
                                {code.code} - {code.type} (Priority: {code.priority})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs text-gray-500 mb-2">No unassigned access codes available</div>
                        )}
                        <button
                          onClick={() => openAccessCodeModal(playspace._id, playspace.name)}
                          className="bg-cyber-primary/70 hover:bg-cyber-primary text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          Generate New Code
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openDeviceModal(playspace)}
                        className="bg-blue-900/50 hover:bg-blue-800/50 text-blue-200 px-3 py-1 rounded text-xs transition-colors"
                      >
                        Manage Devices
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditPlayspaceModal(playspace)}
                        className="bg-yellow-900/50 hover:bg-yellow-800/50 text-yellow-200 px-2 py-1 rounded text-xs transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this playspace? This action cannot be undone.")) {
                            onDeletePlayspace(playspace._id);
                          }
                        }}
                        className="bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginatedPlayspaces.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  {isLoading ? "Loading playspaces..." : "No playspaces found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 rounded-md disabled:opacity-50 hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-800 rounded-md disabled:opacity-50 hover:bg-gray-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Playspace Modal */}
      <AnimatePresence>
        {editPlayspaceModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeEditPlayspaceModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Edit Playspace</h2>
                <button
                  onClick={closeEditPlayspaceModal}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editPlayspaceForm.name}
                    onChange={handleEditPlayspaceFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={editPlayspaceForm.description}
                    onChange={handleEditPlayspaceFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={closeEditPlayspaceModal}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePlayspace}
                  className="flex-1 px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/90 text-white rounded transition-colors"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Access Code Modal */}
      <AnimatePresence>
        {accessCodeModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeAccessCodeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">
                  Generate Access Code for {accessCodeModal.playspace?.name}
                </h2>
                <button
                  onClick={closeAccessCodeModal}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Code Type</label>
                  <select
                    name="codeType"
                    value={accessCodeForm.codeType}
                    onChange={handleAccessCodeFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="time-limited">Time Limited</option>
                    <option value="usage-limited">Usage Limited</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Priority (1-9)</label>
                  <input
                    type="number"
                    name="priority"
                    min="1"
                    max="9"
                    value={accessCodeForm.priority}
                    onChange={handleAccessCodeFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
                  />
                </div>

                {accessCodeForm.codeType === "usage-limited" && (
                  <div>
                    <label className="block text-gray-300 mb-2">Max Usages</label>
                    <input
                      type="number"
                      name="maxUsages"
                      min="1"
                      value={accessCodeForm.maxUsages}
                      onChange={handleAccessCodeFormChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
                      placeholder="Enter maximum usage count"
                    />
                  </div>
                )}

                {accessCodeForm.codeType === "time-limited" && (
                  <div>
                    <label className="block text-gray-300 mb-2">Expires In (Hours)</label>
                    <input
                      type="number"
                      name="expiresInHours"
                      min="1"
                      value={accessCodeForm.expiresInHours}
                      onChange={handleAccessCodeFormChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
                      placeholder="Enter hours until expiration"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={accessCodeForm.description}
                    onChange={handleAccessCodeFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
                    rows={3}
                    placeholder="Optional description for the access code"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={closeAccessCodeModal}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGeneratePlayspaceAccessCode}
                  className="flex-1 px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/90 text-white rounded transition-colors"
                >
                  Generate Code
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device Management Modal */}
      <AnimatePresence>
        {deviceModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-100">Manage Devices - {deviceModal.playspace?.name}</h2>
                <button onClick={closeDeviceModal} className="text-gray-400 hover:text-gray-200">
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Current Devices */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-3">Current Devices</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {(() => {
                      const assignedDevices = devices.filter(device => device.assignedPlayspace?._id === deviceModal.playspace?._id);
                      return assignedDevices.length > 0 ? (
                        assignedDevices.map((device) => (
                          <div
                            key={device.macAddress}
                            className="flex items-center justify-between bg-gray-800 p-3 rounded-md"
                          >
                            <div>
                              <div className="font-medium text-gray-200">{device.name}</div>
                              <div className="text-sm text-gray-400">{device.type}</div>
                              <div className="text-xs text-gray-500">
                                Status: {device.status} | IP: {device.ipAddress}
                              </div>
                            </div>
                            <button
                              onClick={() => onUnassignDevice && onUnassignDevice(device.macAddress)}
                              className="bg-red-900/50 hover:bg-red-800/50 text-red-200 px-3 py-1 rounded text-sm"
                            >
                              Unassign
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-center py-4">No devices assigned to this playspace</div>
                      );
                    })()}
                  </div>
                </div>

                {/* Available Devices to Assign */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-3">Available Devices</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {(() => {
                      const availableDevices = devices.filter(device => !device.isAssigned);
                      return availableDevices.length > 0 ? (
                        availableDevices.map((device) => (
                          <div
                            key={device.macAddress}
                            className="flex items-center justify-between bg-gray-800 p-3 rounded-md"
                          >
                            <div>
                              <div className="font-medium text-gray-200">{device.name}</div>
                              <div className="text-sm text-gray-400">{device.type}</div>
                              <div className="text-xs text-gray-500">
                                Status: {device.status} | IP: {device.ipAddress}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                onAssignDevice &&
                                deviceModal.playspace &&
                                onAssignDevice(device._id, deviceModal.playspace._id)
                              }
                              className="bg-green-900/50 hover:bg-green-800/50 text-green-200 px-3 py-1 rounded text-sm"
                            >
                              Assign
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-center py-4">No unassigned devices available</div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button onClick={closeDeviceModal} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}