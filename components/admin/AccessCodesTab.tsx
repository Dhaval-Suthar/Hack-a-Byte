"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AccessCode {
  _id: string;
  code: string;
  type: string;
  priority: number;
  description: string;
  isActive: boolean;
  usageCount: number;
  maxUsages?: number;
  expiresAt?: string;
  assignedPlayspace?: {
    _id: string;
    name: string;
    description: string;
  };
}

interface Playspace {
  _id: string;
  name: string;
  description: string;
}

interface GenerateAccessCodeData {
  type: string;
  priority: number;
  maxUsages?: number;
  expiresAt?: Date;
  description: string;
  playspaceId?: string;
}

interface AccessCodesTabProps {
  accessCodes: AccessCode[];
  playspaces?: Playspace[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  isLoading: boolean;
  onGenerateAccessCode: (data?: GenerateAccessCodeData) => void;
  onToggleAccessCode: (codeId: string, currentStatus: boolean) => void;
  setShowEditAccessCodeModal: (open: boolean) => void;
  onDeleteAccessCode: (codeId: string) => void;
  onAssignPlayspace: (codeId: string, playspaceId: string | null) => void;
  setSelectedAccessCode: (accessCode: AccessCode | null) => void;
}

export default function AccessCodesTab({
  accessCodes,
  playspaces = [],
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  isLoading,
  onGenerateAccessCode,
  onToggleAccessCode,
  setShowEditAccessCodeModal,
  onDeleteAccessCode,
  onAssignPlayspace,
  setSelectedAccessCode
}: AccessCodesTabProps) {
  // Modal states
  const [generalAccessCodeModal, setGeneralAccessCodeModal] = useState({
    isOpen: false,
  });

  // Form states
  const [accessCodeForm, setAccessCodeForm] = useState({
    codeType: "permanent",
    priority: 5,
    maxUsages: "",
    expiresInHours: "",
    description: "",
    playspaceId: "",
  });

// (Line removed)

  // Modal handlers
  const openGeneralAccessCodeModal = () => {
    setGeneralAccessCodeModal({ isOpen: true });
  };

  const closeGeneralAccessCodeModal = () => {
    setGeneralAccessCodeModal({ isOpen: false });
    setAccessCodeForm({
      codeType: "permanent",
      priority: 5,
      maxUsages: "",
      expiresInHours: "",
      description: "",
      playspaceId: "",
    });
  };

  

  // Form change handlers
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
  const handleGenerateAccessCodeWithForm = () => {
    const { codeType, priority, maxUsages, expiresInHours, description, playspaceId } = accessCodeForm;
    
    onGenerateAccessCode({
      type: codeType,
      priority,
      maxUsages: maxUsages ? parseInt(maxUsages) : undefined,
      expiresAt: expiresInHours ? new Date(Date.now() + parseInt(expiresInHours) * 60 * 60 * 1000) : undefined,
      description,
      playspaceId: playspaceId || undefined,
    });
    
    closeGeneralAccessCodeModal();
  };

  // Filter and pagination logic
  const filteredCodes = accessCodes.filter(
    (code) =>
      code.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCodes = filteredCodes.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search access codes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-primary"
        />
        <button
          onClick={openGeneralAccessCodeModal}
          className="px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/90 rounded-md text-white transition-colors"
        >
          Generate New Code
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-gray-300">Code</th>
              <th className="px-4 py-3 text-left text-gray-300">Type</th>
              <th className="px-4 py-3 text-left text-gray-300">Status</th>
              <th className="px-4 py-3 text-left text-gray-300">Priority</th>
              <th className="px-4 py-3 text-left text-gray-300">Description</th>
              <th className="px-4 py-3 text-left text-gray-300">Assigned Playspace</th>
              <th className="px-4 py-3 text-left text-gray-300">Usage</th>
              <th className="px-4 py-3 text-left text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedCodes.map((code) => (
              <tr key={code._id} className="hover:bg-gray-700">
                <td className="px-4 py-3">
                  <span className="font-mono bg-gray-700 px-2 py-1 rounded text-sm">
                    {code.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="capitalize text-gray-300">{code.type}</span>
                </td>
                <td className="px-4 py-3">
                  {code.isActive ? (
                    <span className="bg-green-900/50 text-green-200 px-2 py-1 rounded text-xs">Active</span>
                  ) : (
                    <span className="bg-red-900/50 text-red-200 px-2 py-1 rounded text-xs">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300">{code.priority}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300 text-sm">{code.description || "No description"}</span>
                </td>
                <td className="px-4 py-3">
                  {code.assignedPlayspace ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{code.assignedPlayspace.name}</div>
                        <div className="text-xs text-gray-400">{code.assignedPlayspace.description}</div>
                      </div>
                      <button
                        onClick={() => onAssignPlayspace(code._id, null)}
                        className="bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded text-xs ml-2 transition-colors"
                        title="Unassign playspace"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      onChange={(e) => onAssignPlayspace(code._id, e.target.value || null)}
                      className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-cyber-primary text-white"
                      defaultValue=""
                    >
                      <option value="">Select playspace...</option>
                      {playspaces.map((playspace) => (
                        <option key={playspace._id} value={playspace._id}>
                          {playspace.name}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300 text-sm">
                    {code.usageCount || 0}
                    {code.maxUsages && ` / ${code.maxUsages}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onToggleAccessCode(code._id, code.isActive)}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        code.isActive
                          ? "bg-red-800 hover:bg-red-700 text-white"
                          : "bg-green-800 hover:bg-green-700 text-white"
                      }`}
                    >
                      {code.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAccessCode(code);
                        setShowEditAccessCodeModal(true);
                      }}
                      className="bg-blue-800 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                      title="Edit access code"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this access code? This action cannot be undone.")) {
                          onDeleteAccessCode(code._id);
                        }
                      }}
                      className="bg-red-900 hover:bg-red-800 text-white px-3 py-1 rounded text-xs transition-colors"
                      title="Delete access code"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedCodes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  {isLoading ? "Loading access codes..." : "No access codes found"}
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

      {/* Access Code Generation Modal */}
      <AnimatePresence>
        {generalAccessCodeModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeGeneralAccessCodeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Generate Access Code</h2>
                <button
                  onClick={closeGeneralAccessCodeModal}
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

                <div>
                  <label className="block text-gray-300 mb-2">Assign to Playspace (Optional)</label>
                  <select
                    name="playspaceId"
                    value={accessCodeForm.playspaceId}
                    onChange={handleAccessCodeFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
                  >
                    <option value="">No specific playspace</option>
                    {playspaces.map((playspace) => (
                      <option key={playspace._id} value={playspace._id}>
                        {playspace.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={closeGeneralAccessCodeModal}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateAccessCodeWithForm}
                  className="flex-1 px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/90 text-white rounded transition-colors"
                >
                  Generate Code
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}