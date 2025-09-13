"use client";
import React, { useState } from "react";
import { AccessCode } from "./shared-types";
import { logger } from '@/lib/logger';

interface AccessCodesSectionProps {
  codes: AccessCode[];
  q: string;
  setQ: (query: string) => void;
  setBulk: (ids: string[] | null) => void;
  onGenerate: () => Promise<void>;
  onToggle: (id: string, status: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateCode?: (id: string, updates: { code?: string; type?: string; priority?: number; description?: string; maxUsages?: number; isActive?: boolean }) => Promise<void>;
  onLinkCode?: (codeId: string, playspaceId: string | null) => Promise<void>;
  playspaces?: Array<{ _id: string; name: string }>;
}

export default function AccessCodesSection({
  codes,
  q,
  setQ,
  setBulk,
  onGenerate,
  onToggle,
  onDelete,
  onUpdateCode,
  onLinkCode,
  playspaces = []
}: AccessCodesSectionProps) {
  const [editingCode, setEditingCode] = useState<AccessCode | null>(null);
  const [linkingCode, setLinkingCode] = useState<AccessCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    type: "",
    priority: "",
    description: "",
    maxUsages: "",
    playspaceId: "",
  });

  const filtered = codes.filter((c) => c.code.toLowerCase().includes(q.toLowerCase()));

  const handleUpdate = async () => {
    if (!editingCode || !onUpdateCode) return;

    try {
      const updates: { code?: string; type?: string; priority?: number; description?: string; maxUsages?: number; isActive?: boolean } = {};
      if (formData.code) updates.code = formData.code;
      if (formData.type) updates.type = formData.type;
      if (formData.priority) updates.priority = parseInt(formData.priority);
      if (formData.description !== undefined) updates.description = formData.description;
      if (formData.maxUsages) updates.maxUsages = parseInt(formData.maxUsages);

      await onUpdateCode(editingCode._id, updates);
      setEditingCode(null);
      setFormData({ code: "", type: "", priority: "", description: "", maxUsages: "", playspaceId: "" });
    } catch (error) {
      logger.error('Failed to update access code:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const handleLink = async () => {
    if (!linkingCode || !onLinkCode) return;

    try {
      await onLinkCode(linkingCode._id, formData.playspaceId || null);
      setLinkingCode(null);
      setFormData({ code: "", type: "", priority: "", description: "", maxUsages: "", playspaceId: "" });
    } catch (error) {
      logger.error('Failed to link access code:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const startEdit = (code: AccessCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      type: "",
      priority: "",
      description: "",
      maxUsages: "",
      playspaceId: "",
    });
  };

  const startLink = (code: AccessCode) => {
    setLinkingCode(code);
    setFormData({
      code: "",
      type: "",
      priority: "",
      description: "",
      maxUsages: "",
      playspaceId: "",
    });
  };

  const cancelAction = () => {
    setEditingCode(null);
    setLinkingCode(null);
    setFormData({ code: "", type: "", priority: "", description: "", maxUsages: "", playspaceId: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={onGenerate}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
        >
          New
        </button>
        <button
          onClick={() => setBulk(filtered.map((c) => c._id))}
          className="px-3 py-1 bg-neutral-700 rounded text-xs"
        >
          Bulk
        </button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search codes"
          className="ml-auto px-2 py-1 bg-neutral-800 rounded text-xs"
        />
      </div>

      {(editingCode || linkingCode) && (
        <div className="p-3 bg-neutral-800 rounded space-y-2">
          <h3 className="text-sm font-semibold">
            {editingCode ? "Edit Access Code" : "Link Access Code to Playspace"}
          </h3>
          {editingCode && (
            <>
              <input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Code"
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              >
                <option value="">Select type</option>
                <option value="temporary">Temporary</option>
                <option value="permanent">Permanent</option>
              </select>
              <input
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                placeholder="Priority (1-9)"
                type="number"
                min="1"
                max="9"
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description"
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
              <input
                value={formData.maxUsages}
                onChange={(e) => setFormData({ ...formData, maxUsages: e.target.value })}
                placeholder="Max usages"
                type="number"
                className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
              />
            </>
          )}
          {linkingCode && (
            <select
              value={formData.playspaceId}
              onChange={(e) => setFormData({ ...formData, playspaceId: e.target.value })}
              className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
            >
              <option value="">Select playspace (leave empty to unlink)</option>
              {playspaces.map(playspace => (
                <option key={playspace._id} value={playspace._id}>{playspace.name}</option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button
              onClick={editingCode ? handleUpdate : handleLink}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
            >
              {editingCode ? "Update" : "Link"}
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
            <th className="p-2 text-left">Code</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Playspace</th>
            {(onUpdateCode || onLinkCode) && <th className="p-2 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c._id} className="odd:bg-neutral-900/40">
              <td className="p-2 font-mono">{c.code}</td>
              <td className="p-2 capitalize">{c.status}</td>
              <td className="p-2">{/* We'll need to get playspace info from the full access code data */}</td>
              {(onUpdateCode || onLinkCode) && (
                <td className="p-2 text-right space-x-1">
                  <button
                    onClick={() => onToggle(c._id, c.status !== "active")}
                    className="px-2 py-0.5 bg-neutral-700 rounded"
                  >
                    {c.status === "active" ? "Off" : "On"}
                  </button>
                  {onUpdateCode && (
                    <button
                      onClick={() => startEdit(c)}
                      className="px-2 py-0.5 bg-blue-600 rounded"
                    >
                      Edit
                    </button>
                  )}
                  {onLinkCode && (
                    <button
                      onClick={() => startLink(c)}
                      className="px-2 py-0.5 bg-purple-600 rounded"
                    >
                      Link
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!confirm("Delete?")) return;
                      onDelete(c._id);
                    }}
                    className="px-2 py-0.5 bg-red-600/80 rounded"
                  >
                    Del
                  </button>
                </td>
              )}
            </tr>
          ))}
          {!filtered.length && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-neutral-500">
                No codes
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
