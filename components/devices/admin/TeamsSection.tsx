"use client";
import React, { useState } from "react";
import { Team } from "./shared-types";
import { logger } from '@/lib/logger';

interface TeamsSectionProps {
  teams: Team[];
  q: string;
  setQ: (query: string) => void;
  onCreateTeam: (name: string, description: string, numberOfPlayers: number, playingDevice: "smartphone" | "pc_laptop", leaderId?: string) => Promise<void>;
  onUpdateTeam: (id: string, updates: { name?: string; description?: string; leaderUserId?: string; numberOfPlayers?: number }) => Promise<void>;
  onDeleteTeam: (id: string) => Promise<void>;
  onUpdateTeamMoney?: (id: string, amount: number) => Promise<void>;
  onUpdateTeamTime?: (id: string, totalMinutes: number) => Promise<void>;
  onGetTeamFinancialData?: (id: string) => Promise<{ success?: boolean; data?: TeamFinancialData; error?: string | null }>;
  onResetTeamTimer?: (id: string) => Promise<void>;
}

interface TeamFinancialData {
  teamId: string;
  teamName: string;
  bitcoinBalance: number;
  timer: {
    isActive: boolean;
    startTime?: string;
    elapsedTime: number;
    totalPausedTime: number;
  };
  autoOfflineTimer: {
    isActive: boolean;
    startTime?: string;
    endTime?: string;
    remainingTime: number;
    timeExpired: boolean;
  };
}

export default function TeamsSection({
  teams,
  q,
  setQ,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  onUpdateTeamMoney,
  onUpdateTeamTime,
  onGetTeamFinancialData,
  onResetTeamTimer,
}: TeamsSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [managingTeam, setManagingTeam] = useState<Team | null>(null);
  const [teamFinancialData, setTeamFinancialData] = useState<TeamFinancialData | null>(null);
  const [moneyAmount, setMoneyAmount] = useState<string>("");
  const [timeAmount, setTimeAmount] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    numberOfPlayers: 1,
    playingDevice: "smartphone" as "smartphone" | "pc_laptop",
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
      setFormData({ name: "", description: "", numberOfPlayers: 1, playingDevice: "smartphone", leaderUserId: "" });
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
        numberOfPlayers: formData.numberOfPlayers,
      });
      setEditingTeam(null);
      setFormData({ name: "", description: "", numberOfPlayers: 1, playingDevice: "smartphone", leaderUserId: "" });
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
      playingDevice: "smartphone", // Default to smartphone for editing (could be enhanced to store device type)
      leaderUserId: team.leaderUserId || "",
    });
  };

  const cancelEdit = () => {
    setEditingTeam(null);
    setFormData({ name: "", description: "", numberOfPlayers: 1, playingDevice: "smartphone", leaderUserId: "" });
  };

  const startManage = async (team: Team) => {
    setManagingTeam(team);
    setMoneyAmount("");
    setTimeAmount("");
    
    // Fetch current financial data
    if (onGetTeamFinancialData) {
      try {
        const result = await onGetTeamFinancialData(team._id);
        if (result.success && result.data) {
          setTeamFinancialData(result.data);
        }
      } catch (error) {
        logger.error('Failed to fetch team financial data:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      }
    }
  };

  const cancelManage = () => {
    setManagingTeam(null);
    setTeamFinancialData(null);
    setMoneyAmount("");
    setTimeAmount("");
  };

  const handleUpdateMoney = async () => {
    if (!managingTeam || !onUpdateTeamMoney || !moneyAmount.trim()) return;
    
    const amount = parseFloat(moneyAmount);
    if (isNaN(amount) || amount < 0) return;

    try {
      await onUpdateTeamMoney(managingTeam._id, amount);
      setMoneyAmount("");
      // Refresh financial data
      if (onGetTeamFinancialData) {
        const result = await onGetTeamFinancialData(managingTeam._id);
        if (result.success && result.data) {
          setTeamFinancialData(result.data);
        }
      }
    } catch (error) {
      logger.error('Failed to update team money:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const handleUpdateTime = async () => {
    if (!managingTeam || !onUpdateTeamTime || !timeAmount.trim()) return;
    
    const minutes = parseInt(timeAmount);
    if (isNaN(minutes) || minutes < 0) return;

    try {
      await onUpdateTeamTime(managingTeam._id, minutes);
      setTimeAmount("");
      // Refresh financial data
      if (onGetTeamFinancialData) {
        const result = await onGetTeamFinancialData(managingTeam._id);
        if (result.success && result.data) {
          setTeamFinancialData(result.data);
        }
      }
    } catch (error) {
      logger.error('Failed to update team time:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const handleResetTimer = async () => {
    if (!managingTeam || !onResetTeamTimer) return;

    try {
      await onResetTeamTimer(managingTeam._id);
      // Refresh financial data
      if (onGetTeamFinancialData) {
        const result = await onGetTeamFinancialData(managingTeam._id);
        if (result.success && result.data) {
          setTeamFinancialData(result.data);
        }
      }
    } catch (error) {
      logger.error('Failed to reset team timer:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
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

      {managingTeam && (
        <div className="p-4 bg-neutral-800 rounded space-y-4">
          <h3 className="text-sm font-semibold text-white">Manage Team: {managingTeam.name}</h3>
          
          {teamFinancialData && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-700 rounded">
              <div>
                <h4 className="text-xs font-semibold text-gray-300 mb-2">Current Status</h4>
                <div className="space-y-1 text-xs">
                  <div>Bitcoin Balance: <span className="text-yellow-400">{teamFinancialData.bitcoinBalance}</span></div>
                  <div>Timer Active: <span className={teamFinancialData.timer.isActive ? "text-green-400" : "text-red-400"}>
                    {teamFinancialData.timer.isActive ? "Yes" : "No"}
                  </span></div>
                  <div>Elapsed Time: <span className="text-blue-400">{formatTime(teamFinancialData.timer.elapsedTime)}</span></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-300 mb-2">Auto-Offline Timer</h4>
                <div className="space-y-1 text-xs">
                  <div>Status: <span className={teamFinancialData.autoOfflineTimer.isActive ? "text-green-400" : "text-red-400"}>
                    {teamFinancialData.autoOfflineTimer.isActive ? "Active" : "Inactive"}
                  </span></div>
                  {teamFinancialData.autoOfflineTimer.isActive && (
                    <div>Remaining: <span className={teamFinancialData.autoOfflineTimer.timeExpired ? "text-red-400" : "text-yellow-400"}>
                      {teamFinancialData.autoOfflineTimer.timeExpired ? "EXPIRED" : formatTime(teamFinancialData.autoOfflineTimer.remainingTime)}
                    </span></div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Update Money (Bitcoin)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={moneyAmount}
                  onChange={(e) => setMoneyAmount(e.target.value)}
                  placeholder="New balance"
                  min="0"
                  step="0.1"
                  className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-xs text-white focus:border-yellow-500 focus:outline-none"
                />
                <button
                  onClick={handleUpdateMoney}
                  disabled={!moneyAmount.trim()}
                  className="px-3 py-2 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
                >
                  Set
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-300 mb-1">Set Available Time (Minutes)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={timeAmount}
                  onChange={(e) => setTimeAmount(e.target.value)}
                  placeholder="Total minutes (e.g., 30, 20, 1)"
                  min="0"
                  className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleUpdateTime}
                  disabled={!timeAmount.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
                >
                  Set
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Quick set: 
                <button onClick={() => setTimeAmount("30")} className="ml-1 px-1 bg-neutral-600 rounded hover:bg-neutral-500">30m</button>
                <button onClick={() => setTimeAmount("20")} className="ml-1 px-1 bg-neutral-600 rounded hover:bg-neutral-500">20m</button>
                <button onClick={() => setTimeAmount("10")} className="ml-1 px-1 bg-neutral-600 rounded hover:bg-neutral-500">10m</button>
                <button onClick={() => setTimeAmount("5")} className="ml-1 px-1 bg-neutral-600 rounded hover:bg-neutral-500">5m</button>
                <button onClick={() => setTimeAmount("1")} className="ml-1 px-1 bg-neutral-600 rounded hover:bg-neutral-500">1m</button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleResetTimer}
              className="px-4 py-2 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors"
            >
              Reset Timer
            </button>
            <button
              onClick={cancelManage}
              className="px-4 py-2 bg-neutral-600 text-white rounded text-xs hover:bg-neutral-700 transition-colors"
            >
              Close
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
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => startEdit(team)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => startManage(team)}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                  >
                    Manage
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
