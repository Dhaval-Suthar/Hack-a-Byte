"use client";
import React, { useState } from "react";
import { Team } from "./shared-types";
import { logger } from '@/lib/logger';

interface TeamsSectionProps {
  teams: Team[];
  q: string;
  setQ: (query: string) => void;
  onCreateTeam: (name: string, description: string, numberOfPlayers: number, playingDevice: "smartphone" | "pc_laptop", leaderId?: string) => Promise<void>;
  onUpdateTeam: (id: string, updates: { name?: string; description?: string; leaderUserId?: string }) => Promise<void>;
  onDeleteTeam: (id: string) => Promise<void>;
}

export default function TeamsSection({
  teams,
  q,
  setQ,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
}: TeamsSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    numberOfPlayers: 1,
    playingDevice: "pc_laptop" as "smartphone" | "pc_laptop",
    leaderUserId: "",
  });

  const filtered = teams.filter((team) =>
    team.name.toLowerCase().includes(q.toLowerCase()) ||
    team.description.toLowerCase().includes(q.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    try {
      await onCreateTeam(
        formData.name,
        formData.description,
        formData.numberOfPlayers,
        formData.playingDevice,
        formData.leaderUserId || undefined
      );
      setFormData({ name: "", description: "", numberOfPlayers: 1, playingDevice: "pc_laptop", leaderUserId: "" });
      setShowCreateForm(false);
    } catch (error) {
      logger.error('Failed to create team:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const handleUpdate = async () => {
    if (!editingTeam || !formData.name.trim()) return;

    try {
      await onUpdateTeam(editingTeam._id, {
        name: formData.name,
        description: formData.description,
        leaderUserId: formData.leaderUserId || undefined,
      });
      setEditingTeam(null);
      setFormData({ name: "", description: "", numberOfPlayers: 1, playingDevice: "pc_laptop", leaderUserId: "" });
    } catch (error) {
      logger.error('Failed to update team:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const startEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description,
      numberOfPlayers: team.numberOfPlayers || 1,
      playingDevice: "pc_laptop", // Default to pc_laptop for editing (could be enhanced to store device type)
      leaderUserId: team.leaderUserId || "",
    });
  };

  const cancelEdit = () => {
    setEditingTeam(null);
    setFormData({ name: "", description: "", numberOfPlayers: 1, playingDevice: "pc_laptop", leaderUserId: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-3 py-1 bg-green-600 text-white rounded text-xs"
        >
          {showCreateForm ? "Cancel" : "New Team"}
        </button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search teams"
          className="ml-auto px-2 py-1 bg-neutral-800 rounded text-xs"
        />
      </div>

      {showCreateForm && (
        <div className="p-4 bg-neutral-800 rounded space-y-3">
          <h3 className="text-sm font-semibold text-white">Create New Team</h3>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Team Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter team name"
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Description</label>
            <input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter team description"
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Number of Players</label>
            <select
              value={formData.numberOfPlayers}
              onChange={(e) => setFormData({ ...formData, numberOfPlayers: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num} Player{num > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-2">Playing Device</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="smartphone"
                  checked={formData.playingDevice === "smartphone"}
                  onChange={(e) => setFormData({ ...formData, playingDevice: e.target.value as "smartphone" | "pc_laptop" })}
                  className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                />
                <span className="text-white text-xs">📱 Mobile Device</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="pc_laptop"
                  checked={formData.playingDevice === "pc_laptop"}
                  onChange={(e) => setFormData({ ...formData, playingDevice: e.target.value as "smartphone" | "pc_laptop" })}
                  className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                />
                <span className="text-white text-xs">💻 PC/Laptop</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Leader User ID (Optional)</label>
            <input
              value={formData.leaderUserId}
              onChange={(e) => setFormData({ ...formData, leaderUserId: e.target.value })}
              placeholder="Enter leader user ID"
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
            >
              Create Team
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-neutral-600 text-white rounded text-xs hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingTeam && (
        <div className="p-4 bg-neutral-800 rounded space-y-3">
          <h3 className="text-sm font-semibold text-white">Edit Team</h3>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Team Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter team name"
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Description</label>
            <input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter team description"
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Number of Players</label>
            <select
              value={formData.numberOfPlayers}
              onChange={(e) => setFormData({ ...formData, numberOfPlayers: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num} Player{num > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Leader User ID (Optional)</label>
            <input
              value={formData.leaderUserId}
              onChange={(e) => setFormData({ ...formData, leaderUserId: e.target.value })}
              placeholder="Enter leader user ID"
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
            >
              Update Team
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-neutral-600 text-white rounded text-xs hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

            <table className="w-full text-xs">
        <thead className="bg-neutral-800">
          <tr>
            <th className="p-3 text-left text-gray-300">Name</th>
            <th className="p-3 text-left text-gray-300">Description</th>
            <th className="p-3 text-left text-gray-300">Players</th>
            <th className="p-3 text-left text-gray-300">Device</th>
            <th className="p-3 text-left text-gray-300">Leader</th>
            <th className="p-3 text-left text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((team) => (
            <tr key={team._id} className="border-b border-neutral-700 hover:bg-neutral-800/50">
              <td className="p-3 text-white">{team.name}</td>
              <td className="p-3 text-gray-300">{team.description}</td>
              <td className="p-3 text-white">{team.numberOfPlayers || 1}</td>
              <td className="p-3 text-gray-300">
                {team.playingDevice ? (team.playingDevice === "smartphone" ? "📱 Mobile" : "💻 PC/Laptop") : "Not set"}
              </td>
              <td className="p-3 text-gray-300">{team.leaderUserId || "None"}</td>
              <td className="p-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(team)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteTeam(team._id)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
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
  );
}
