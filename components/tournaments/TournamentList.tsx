"use client";

import React, { useEffect, useState } from "react";
import { getTournaments, registerTeamForTournament, createTournament } from "@/app/actions/tournament";
import { logger } from '@/lib/logger';

interface TournamentResponse {
  _id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  maxTeams: number;
  entryFee: number;
  startDate: string;
  registeredTeams: string[];
  stats?: {
    totalPrizePool: number;
  };
}

interface TournamentCardProps {
  tournament: TournamentResponse;
  onJoin: (tournamentId: string) => void;
}

function TournamentCard({ tournament, onJoin }: TournamentCardProps) {
  const isActive = tournament.status === 'registration_open' || tournament.status === 'active';
  const isFull = tournament.registeredTeams.length >= tournament.maxTeams;
  const canJoin = isActive && !isFull;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{tournament.name}</h3>
          <p className="text-gray-600 mt-1">{tournament.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          tournament.status === 'registration_open' ? 'bg-green-100 text-green-800' :
          tournament.status === 'active' ? 'bg-blue-100 text-blue-800' :
          tournament.status === 'completed' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {tournament.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Prize Pool</p>
          <p className="text-lg font-semibold text-green-600">{tournament.stats?.totalPrizePool || 0} BTC</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Teams</p>
          <p className="text-lg font-semibold">{tournament.registeredTeams.length}/{tournament.maxTeams}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Start Date</p>
          <p className="text-sm font-medium">{new Date(tournament.startDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Type</p>
          <p className="text-sm font-medium capitalize">{tournament.type.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Entry Fee: {tournament.entryFee} BTC
        </div>
        <button
          onClick={() => onJoin(tournament._id)}
          disabled={!canJoin}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            canJoin
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isFull ? 'Tournament Full' : isActive ? 'Join Tournament' : 'Not Available'}
        </button>
      </div>
    </div>
  );
}

export function TournamentList() {
  const [tournaments, setTournaments] = useState<TournamentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const result = await getTournaments();
      if (result.success && result.tournaments) {
        setTournaments(result.tournaments as unknown as TournamentResponse[]);
      } else {
        setError(result.error || 'Failed to load tournaments');
      }
    } catch (err) {
      logger.error('Failed to load tournaments:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      setError('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async (tournamentId: string) => {
    // For now, we'll need a teamId - this should come from user context
    const teamId = 'placeholder-team-id'; // TODO: Get from user context
    try {
      const result = await registerTeamForTournament(tournamentId, teamId);
      if (result.success) {
        loadTournaments();
        alert('Successfully joined tournament!');
      } else {
        alert(result.error || 'Failed to join tournament');
      }
    } catch (err) {
      logger.error('Failed to join tournament:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      alert('Failed to join tournament');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadTournaments}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
        >
          Create Tournament
        </button>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tournaments available</p>
          <p className="text-gray-400 mt-2">Check back later for upcoming tournaments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament._id || Math.random().toString()}
              tournament={tournament}
              onJoin={handleJoinTournament}
            />
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateTournamentForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadTournaments();
          }}
        />
      )}
    </div>
  );
}

interface CreateTournamentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateTournamentForm({ onClose, onSuccess }: CreateTournamentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxTeams: 16,
    entryFee: 0.001,
    prizePool: 0.01,
    startDate: '',
    endDate: '',
    rules: [''],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await createTournament({
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        rules: formData.rules.filter(rule => rule.trim() !== ''),
      });
      if (result.success) {
        onSuccess();
        alert('Tournament created successfully!');
      } else {
        alert(result.error || 'Failed to create tournament');
      }
    } catch (err) {
      logger.error('Failed to create tournament:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      alert('Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setFormData({ ...formData, rules: [...formData.rules, ''] });
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...formData.rules];
    newRules[index] = value;
    setFormData({ ...formData, rules: newRules });
  };

  const removeRule = (index: number) => {
    setFormData({ ...formData, rules: formData.rules.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Create Tournament</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tournament Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Teams
              </label>
              <input
                type="number"
                required
                min="2"
                max="128"
                value={formData.maxTeams}
                onChange={(e) => setFormData({ ...formData, maxTeams: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Fee (BTC)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.0001"
                value={formData.entryFee}
                onChange={(e) => setFormData({ ...formData, entryFee: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prize Pool (BTC)
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.0001"
              value={formData.prizePool}
              onChange={(e) => setFormData({ ...formData, prizePool: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rules
            </label>
            {formData.rules.map((rule, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => updateRule(index, e.target.value)}
                  placeholder={`Rule ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRule}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Rule
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
