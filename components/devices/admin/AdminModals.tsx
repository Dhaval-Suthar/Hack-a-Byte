"use client";

import { useState } from "react";

interface AccessCode {
  _id: string;
  code: string;
  type?: string;
  priority?: number;
  description?: string;
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

interface Device {
  _id: string;
  name: string;
  type: string;
  status: string;
  ipAddress: string;
  isAssigned: boolean;
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

// Access Code Generation Modal
interface AccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: string;
    priority: number;
    description: string;
    maxUsages?: number;
    expiresAt?: Date;
  }) => void;
}

export function AccessCodeModal({ isOpen, onClose, onSubmit }: AccessCodeModalProps) {
  const [formData, setFormData] = useState({
    type: "permanent",
    priority: 5,
    description: "",
    maxUsages: "",
    expiresAt: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: formData.type,
      priority: formData.priority,
      description: formData.description,
      maxUsages: formData.maxUsages ? parseInt(formData.maxUsages) : undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined
    });
    setFormData({
      type: "permanent",
      priority: 5,
      description: "",
      maxUsages: "",
      expiresAt: ""
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4">Generate Access Code</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
              min="1"
              max="9"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          {formData.type === "usage-limited" && (
            <div>
              <label className="block text-gray-300 mb-2">Max Usages</label>
              <input
                type="number"
                min="1"
                value={formData.maxUsages}
                onChange={(e) => setFormData({ ...formData, maxUsages: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
                placeholder="Enter max usage count"
              />
            </div>
          )}

          {formData.type === "time-limited" && (
            <div>
              <label className="block text-gray-300 mb-2">Expires At</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
              />
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/90 text-white rounded transition-colors"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Access Code Edit Modal
interface EditAccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accessCode: AccessCode) => void;
  accessCode: AccessCode | null;
}

export function EditAccessCodeModal({ isOpen, onClose, onSubmit, accessCode }: EditAccessCodeModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    type: "permanent",
    priority: 5,
    description: "",
    maxUsages: "",
    expiresAt: ""
  });

  // Update form data when accessCode changes
  useState(() => {
    if (accessCode) {
      setFormData({
        code: accessCode.code,
        type: accessCode.type || "permanent",
        priority: accessCode.priority || 5,
        description: accessCode.description || "",
        maxUsages: accessCode.maxUsages?.toString() || "",
        expiresAt: accessCode.expiresAt ? new Date(accessCode.expiresAt).toISOString().slice(0, 16) : ""
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode) {
      onSubmit({
        ...accessCode,
        code: formData.code,
        type: formData.type,
        priority: formData.priority,
        description: formData.description,
        maxUsages: formData.maxUsages ? parseInt(formData.maxUsages) : undefined,
        expiresAt: formData.expiresAt
      });
    }
    onClose();
  };

  if (!isOpen || !accessCode) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4">Edit Access Code</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white font-mono"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
              min="1"
              max="9"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
              rows={3}
            />
          </div>

          {formData.type === "usage-limited" && (
            <div>
              <label className="block text-gray-300 mb-2">Max Usages</label>
              <input
                type="number"
                min="1"
                value={formData.maxUsages}
                onChange={(e) => setFormData({ ...formData, maxUsages: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
              />
            </div>
          )}

          {formData.type === "time-limited" && (
            <div>
              <label className="block text-gray-300 mb-2">Expires At</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
              />
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/90 text-white rounded transition-colors"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Device Management Modal
interface DeviceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  playspace: Playspace | null;
  devices: Device[];
  onAssignDevice: (deviceId: string, playspaceId: string) => void;
  onUnassignDevice: (deviceId: string) => void;
}

export function DeviceManagementModal({
  isOpen,
  onClose,
  playspace,
  devices,
  onAssignDevice,
  onUnassignDevice
}: DeviceManagementModalProps) {
  if (!isOpen || !playspace) return null;

  const assignedDevices = devices.filter(device => device.assignedPlayspace?._id === playspace._id);
  const availableDevices = devices.filter(device => !device.isAssigned);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Manage Devices - {playspace.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assigned Devices */}
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Assigned Devices</h3>
            <div className="space-y-2">
              {assignedDevices.length === 0 ? (
                <p className="text-gray-400">No devices assigned to this playspace</p>
              ) : (
                assignedDevices.map(device => (
                  <div key={device._id} className="bg-gray-700 p-3 rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-white">{device.name}</div>
                        <div className="text-sm text-gray-300">{device.type}</div>
                        <div className="text-xs text-gray-400">{device.status}</div>
                      </div>
                      <button
                        onClick={() => onUnassignDevice(device._id)}
                        className="bg-red-800 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Unassign
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Devices */}
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Available Devices</h3>
            <div className="space-y-2">
              {availableDevices.length === 0 ? (
                <p className="text-gray-400">No available devices</p>
              ) : (
                availableDevices.map(device => (
                  <div key={device._id} className="bg-gray-700 p-3 rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-white">{device.name}</div>
                        <div className="text-sm text-gray-300">{device.type}</div>
                        <div className="text-xs text-gray-400">{device.status}</div>
                      </div>
                      <button
                        onClick={() => onAssignDevice(device._id, playspace._id)}
                        className="bg-green-800 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Playspace Edit Modal
interface EditPlayspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playspace: Playspace) => void;
  playspace: Playspace | null;
}

export function EditPlayspaceModal({ isOpen, onClose, onSubmit, playspace }: EditPlayspaceModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  // Update form data when playspace changes
  useState(() => {
    if (playspace) {
      setFormData({
        name: playspace.name,
        description: playspace.description
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playspace) {
      onSubmit({
        ...playspace,
        name: formData.name,
        description: formData.description
      });
    }
    onClose();
  };

  if (!isOpen || !playspace) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4">Edit Playspace</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-cyber-primary text-white"
              rows={3}
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/90 text-white rounded transition-colors"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
