"use client";
import React, { useState } from "react";
import { Device } from "./shared-types";
import { logger } from '@/lib/logger';

interface DevicesSectionProps {
  devs: Device[];
  q: string;
  setQ: (query: string) => void;
  onCreateDevice?: (deviceType: string) => Promise<void>;
  onUpdateDevice?: (id: string, updates: { deviceType?: string; status?: string; playspaceId?: string }) => Promise<void>;
  onAssignDevice?: (deviceId: string, playspaceId: string) => Promise<void>;
  onUnassignDevice?: (deviceId: string) => Promise<void>;
  onDeleteDevice?: (deviceId: string) => Promise<void>;
  playspaces?: Array<{ _id: string; name: string }>;
}

export default function DevicesSection({
  devs,
  q,
  setQ,
  onCreateDevice,
  onUpdateDevice,
  onAssignDevice,
  onUnassignDevice,
  onDeleteDevice,
  playspaces = []
}: DevicesSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [linkingDevice, setLinkingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    deviceType: "",
    status: "",
    playspaceId: "",
  });

  const filtered = devs.filter((d) =>
    d.name.toLowerCase().includes(q.toLowerCase()) ||
    (d.deviceType && d.deviceType.toLowerCase().includes(q.toLowerCase())) ||
    (d.playspace && d.playspace.name.toLowerCase().includes(q.toLowerCase()))
  );

  const deviceTypes = ["hackbook-w95", "hackbook-l", "hackdroid", "hackphone", "admin-console"];
  const statuses = ["online", "offline", "maintenance"];

  const handleCreate = async () => {
    if (!formData.deviceType || !onCreateDevice) return;

    try {
      await onCreateDevice(formData.deviceType);
      setFormData({ deviceType: "", status: "", playspaceId: "" });
      setShowCreateForm(false);
    } catch (error) {
      logger.error('Failed to create device:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const handleUpdate = async () => {
    if (!editingDevice || !onUpdateDevice) return;

    try {
      const updates: { deviceType?: string; status?: string; playspaceId?: string } = {};
      if (formData.deviceType) updates.deviceType = formData.deviceType;
      if (formData.status) updates.status = formData.status;
      if (formData.playspaceId !== undefined) updates.playspaceId = formData.playspaceId || undefined;

      await onUpdateDevice(editingDevice._id, updates);
      setEditingDevice(null);
      setFormData({ deviceType: "", status: "", playspaceId: "" });
    } catch (error) {
      logger.error('Failed to update device:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const handleLink = async () => {
    if (!linkingDevice || !onAssignDevice) return;

    try {
      if (formData.playspaceId) {
        await onAssignDevice(linkingDevice._id, formData.playspaceId);
      } else if (onUnassignDevice) {
        await onUnassignDevice(linkingDevice._id);
      }
      setLinkingDevice(null);
      setFormData({ deviceType: "", status: "", playspaceId: "" });
    } catch (error) {
      logger.error('Failed to link device:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const startEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      deviceType: device.deviceType || "",
      status: device.status || "",
      playspaceId: device.playspace?._id || "",
    });
  };

  const startLink = (device: Device) => {
    setLinkingDevice(device);
    setFormData({
      deviceType: "",
      status: "",
      playspaceId: device.playspace?._id || "",
    });
  };

  const cancelAction = () => {
    setEditingDevice(null);
    setLinkingDevice(null);
    setFormData({ deviceType: "", status: "", playspaceId: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {onCreateDevice && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1 bg-green-600 text-white rounded text-xs"
          >
            {showCreateForm ? "Cancel" : "New Device"}
          </button>
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search devices"
          className="ml-auto px-2 py-1 bg-neutral-800 rounded text-xs"
        />
      </div>

      {showCreateForm && (
        <div className="p-3 bg-neutral-800 rounded space-y-2">
          <h3 className="text-sm font-semibold">Create New Device</h3>
          <select
            value={formData.deviceType}
            onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          >
            <option value="">Select device type</option>
            {deviceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1 bg-neutral-600 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {(editingDevice || linkingDevice) && (
        <div className="p-3 bg-neutral-800 rounded space-y-2">
          <h3 className="text-sm font-semibold">
            {editingDevice ? "Edit Device" : "Link Device to Playspace"}
          </h3>
          {editingDevice && (
            <>
              <select
                value={formData.deviceType}
                onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              >
                <option value="">Select device type</option>
                {deviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              >
                <option value="">Select status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </>
          )}
          <select
            value={formData.playspaceId}
            onChange={(e) => setFormData({ ...formData, playspaceId: e.target.value })}
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          >
            <option value="">Select playspace (leave empty to unassign)</option>
            {playspaces.map(playspace => (
              <option key={playspace._id} value={playspace._id}>{playspace.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={editingDevice ? handleUpdate : handleLink}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
            >
              {editingDevice ? "Update" : "Link"}
            </button>
            <button
              onClick={cancelAction}
              className="px-3 py-1 bg-neutral-600 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-xs">
        <thead className="bg-neutral-800">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Playspace</th>
            {(onUpdateDevice || onAssignDevice || onDeleteDevice) && <th className="p-2 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((device) => (
            <tr key={device._id} className="border-b border-neutral-700">
              <td className="p-2 font-semibold">{device.name}</td>
              <td className="p-2">{device.deviceType || "Unknown"}</td>
              <td className="p-2">
                <span className={`px-2 py-0.5 rounded capitalize ${
                  device.status === "online" ? "bg-green-600" :
                  device.status === "offline" ? "bg-red-600" :
                  "bg-yellow-600"
                }`}>
                  {device.status}
                </span>
              </td>
              <td className="p-2">{device.playspace?.name || "Unassigned"}</td>
              {(onUpdateDevice || onAssignDevice || onDeleteDevice) && (
                <td className="p-2">
                  <div className="flex gap-1">
                    {onUpdateDevice && (
                      <button
                        onClick={() => startEdit(device)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                      >
                        Edit
                      </button>
                    )}
                    {onAssignDevice && (
                      <button
                        onClick={() => startLink(device)}
                        className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
                      >
                        Link
                      </button>
                    )}
                    {onDeleteDevice && (
                      <button
                        onClick={() => onDeleteDevice(device._id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
