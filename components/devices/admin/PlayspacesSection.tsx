"use client";
import React, { useState } from "react";
import { Playspace } from "./shared-types";
import { logger } from '@/lib/logger';

interface PlayspacesSectionProps {
  plays: Playspace[];
  q: string;
  setQ: (query: string) => void;
  onCreatePlayspace?: (name: string, description: string) => Promise<void>;
  onUpdatePlayspace?: (id: string, name: string, description: string) => Promise<void>;
  onDeletePlayspace?: (id: string) => Promise<void>;
}

export default function PlayspacesSection({
  plays,
  q,
  setQ,
  onCreatePlayspace,
  onUpdatePlayspace,
  onDeletePlayspace
}: PlayspacesSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlayspace, setEditingPlayspace] = useState<Playspace | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const filtered = plays.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(q.toLowerCase()))
  );

  const handleCreate = async () => {
    if (!formData.name.trim() || !onCreatePlayspace) return;

    try {
      await onCreatePlayspace(formData.name, formData.description);
      setFormData({ name: "", description: "" });
      setShowCreateForm(false);
    } catch (error) {
      logger.error('Failed to create playspace:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const handleUpdate = async () => {
    if (!editingPlayspace || !formData.name.trim() || !onUpdatePlayspace) return;

    try {
      await onUpdatePlayspace(editingPlayspace._id, formData.name, formData.description);
      setEditingPlayspace(null);
      setFormData({ name: "", description: "" });
    } catch (error) {
      logger.error('Failed to update playspace:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const startEdit = (playspace: Playspace) => {
    setEditingPlayspace(playspace);
    setFormData({
      name: playspace.name,
      description: playspace.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingPlayspace(null);
    setFormData({ name: "", description: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {onCreatePlayspace && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1 bg-green-600 text-white rounded text-xs"
          >
            {showCreateForm ? "Cancel" : "New Playspace"}
          </button>
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search playspaces"
          className="ml-auto px-2 py-1 bg-neutral-800 rounded text-xs"
        />
      </div>

      {showCreateForm && (
        <div className="p-3 bg-neutral-800 rounded space-y-2">
          <h3 className="text-sm font-semibold">Create New Playspace</h3>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Playspace name"
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />
          <input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />
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

      {editingPlayspace && (
        <div className="p-3 bg-neutral-800 rounded space-y-2">
          <h3 className="text-sm font-semibold">Edit Playspace</h3>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Playspace name"
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />
          <input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
            >
              Update
            </button>
            <button
              onClick={cancelEdit}
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
            <th className="p-2 text-left">Description</th>
            {(onUpdatePlayspace || onDeletePlayspace) && <th className="p-2 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((playspace) => (
            <tr key={playspace._id} className="border-b border-neutral-700">
              <td className="p-2 font-semibold">{playspace.name}</td>
              <td className="p-2">{playspace.description || "No description"}</td>
              {(onUpdatePlayspace || onDeletePlayspace) && (
                <td className="p-2">
                  <div className="flex gap-1">
                    {onUpdatePlayspace && (
                      <button
                        onClick={() => startEdit(playspace)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                      >
                        Edit
                      </button>
                    )}
                    {onDeletePlayspace && (
                      <button
                        onClick={() => onDeletePlayspace(playspace._id)}
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
