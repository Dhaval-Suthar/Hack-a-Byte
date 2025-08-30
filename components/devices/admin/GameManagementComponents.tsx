"use client";

import { useState, useEffect } from "react";
import { Modal } from "./AdminComponents";

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
  endTime?: string;
  winner?: string;
  team1Score: number;
  team2Score: number;
  duration: number;
}

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament?: Tournament;
  onSave: (tournament: Partial<Tournament>) => void;
}

function TournamentModal({ isOpen, onClose, tournament, onSave }: TournamentModalProps) {
  const [formData, setFormData] = useState<Partial<Tournament>>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxTeams: 16,
    prizePool: 0,
    gameMode: 'standard',
    ...tournament
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tournament ? 'Edit Tournament' : 'Create Tournament'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tournament Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyber-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyber-primary"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyber-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyber-primary"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Teams</label>
            <input
              type="number"
              value={formData.maxTeams}
              onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyber-primary"
              min="2"
              max="64"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Prize Pool (₹)</label>
            <input
              type="number"
              value={formData.prizePool}
              onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyber-primary"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Game Mode</label>
          <select
            value={formData.gameMode}
            onChange={(e) => setFormData({ ...formData, gameMode: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyber-primary"
          >
            <option value="standard">Standard</option>
            <option value="quick">Quick Match</option>
            <option value="tournament">Tournament</option>
            <option value="league">League</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/80 text-white rounded-lg transition-colors"
          >
            {tournament ? 'Update' : 'Create'} Tournament
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface GameSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: GameSession[];
  onUpdateScore: (sessionId: string, team1Score: number, team2Score: number) => void;
  onEndSession: (sessionId: string, winner: string) => void;
}

function GameSessionModal({ isOpen, onClose, sessions, onUpdateScore, onEndSession }: GameSessionModalProps) {
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);

  useEffect(() => {
    if (selectedSession) {
      setTeam1Score(selectedSession.team1Score);
      setTeam2Score(selectedSession.team2Score);
    }
  }, [selectedSession]);

  const handleSessionSelect = (session: GameSession) => {
    setSelectedSession(session);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Game Session Management">
      <div className="space-y-6">
        {!selectedSession ? (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Active Game Sessions</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No active game sessions</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session._id}
                    className="bg-gray-800/50 rounded-lg p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleSessionSelect(session)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-white font-medium">{session.team1Name} vs {session.team2Name}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        session.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        session.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                        session.status === 'paused' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">
                      Score: {session.team1Score} - {session.team2Score} | Duration: {Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                ← Back to Sessions
              </button>
              <h3 className="text-lg font-semibold text-white">Manage Session</h3>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-medium">{selectedSession.team1Name} vs {selectedSession.team2Name}</h4>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  selectedSession.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  selectedSession.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                  selectedSession.status === 'paused' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {selectedSession.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Duration</p>
                  <p className="text-white">{Math.floor(selectedSession.duration / 60)}:{(selectedSession.duration % 60).toString().padStart(2, '0')}</p>
                </div>
                <div>
                  <p className="text-gray-400">Start Time</p>
                  <p className="text-white">{new Date(selectedSession.startTime).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {selectedSession.status === 'active' && (
              <div className="space-y-4">
                <h4 className="text-white font-medium">Update Scores</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {selectedSession.team1Name} Score
                    </label>
                    <input
                      type="number"
                      value={team1Score}
                      onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyber-primary"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {selectedSession.team2Name} Score
                    </label>
                    <input
                      type="number"
                      value={team2Score}
                      onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyber-primary"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => onUpdateScore(selectedSession._id, team1Score, team2Score)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Update Scores
                  </button>

                  <button
                    onClick={() => onEndSession(selectedSession._id, team1Score > team2Score ? selectedSession.team1Id : selectedSession.team2Id)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    End Session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export { TournamentModal, GameSessionModal };
