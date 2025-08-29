"use client";

import React from 'react';
import { motion } from 'framer-motion';
import BitcoinBalance from './BitcoinBalance';
import RoleBadge from './RoleBadge';
import GameTimer from './GameTimer';

// Status configuration
const statusColors = {
  waiting: 'bg-yellow-500',
  active: 'bg-green-500',
  paused: 'bg-orange-500',
  finished: 'bg-blue-500'
};

const statusText = {
  waiting: 'Waiting for Players',
  active: 'Match Active',
  paused: 'Match Paused',
  finished: 'Match Complete'
};

interface Player {
  id: string;
  name: string;
  role: 'professor' | 'attacker' | 'defender' | 'extractor' | 'bot';
  bitcoin: number;
  isOnline: boolean;
  isBot?: boolean;
}

interface GameStatus {
  matchId: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  players: Player[];
  totalBitcoin: number;
  bankDeviceActive: boolean;
  bankDeviceTimeLeft?: number;
  matchTimeLeft: number;
  currentRound: number;
  maxRounds: number;
}

interface GameStatusDisplayProps {
  gameStatus: GameStatus;
  currentPlayerId?: string;
  onLeaveMatch?: () => void;
  onPauseMatch?: () => void;
}

export function GameStatusDisplay({
  gameStatus,
  currentPlayerId,
  onLeaveMatch,
  onPauseMatch
}: GameStatusDisplayProps) {
  const currentPlayer = gameStatus.players.find(p => p.id === currentPlayerId);
  const humanPlayers = gameStatus.players.filter(p => !p.isBot);
  const botPlayers = gameStatus.players.filter(p => p.isBot);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 space-y-4"
    >
      {/* Header with Match Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-3 h-3 rounded-full ${statusColors[gameStatus.status]}`}
          />
          <h2 className="text-white font-bold text-lg">
            {statusText[gameStatus.status]}
          </h2>
          <span className="text-gray-400 text-sm">
            Round {gameStatus.currentRound}/{gameStatus.maxRounds}
          </span>
        </div>

        <div className="flex gap-2">
          {onPauseMatch && gameStatus.status === 'active' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPauseMatch}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded transition-colors"
            >
              Pause
            </motion.button>
          )}
          {onLeaveMatch && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLeaveMatch}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
            >
              Leave
            </motion.button>
          )}
        </div>
      </div>

      {/* Timers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GameTimer
          duration={gameStatus.matchTimeLeft}
          label="Match Time"
          size="md"
        />
        {gameStatus.bankDeviceActive && gameStatus.bankDeviceTimeLeft && (
          <GameTimer
            duration={gameStatus.bankDeviceTimeLeft}
            label="Bank Device"
            size="md"
          />
        )}
      </div>

      {/* Current Player Info */}
      {currentPlayer && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RoleBadge role={currentPlayer.role} size="sm" />
              <div>
                <p className="text-white font-medium">{currentPlayer.name}</p>
                <p className="text-gray-400 text-sm">You</p>
              </div>
            </div>
            <BitcoinBalance
              balance={currentPlayer.bitcoin}
              showIcon={false}
              size="sm"
            />
          </div>
        </div>
      )}

      {/* Team Composition */}
      <div className="space-y-3">
        <h3 className="text-white font-semibold">Team Composition</h3>

        {/* Human Players */}
        {humanPlayers.length > 0 && (
          <div>
            <p className="text-gray-400 text-sm mb-2">Human Players ({humanPlayers.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {humanPlayers.map((player) => (
                <motion.div
                  key={player.id}
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center justify-between p-2 rounded ${
                    player.id === currentPlayerId
                      ? 'bg-blue-900/50 border border-blue-500'
                      : 'bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: player.isOnline ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-2 h-2 rounded-full ${
                        player.isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                    <RoleBadge role={player.role} size="sm" />
                    <span className="text-white text-sm">{player.name}</span>
                  </div>
                  <BitcoinBalance
                    balance={player.bitcoin}
                    showIcon={false}
                    size="sm"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Bot Players */}
        {botPlayers.length > 0 && (
          <div>
            <p className="text-gray-400 text-sm mb-2">AI Bots ({botPlayers.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {botPlayers.map((player) => (
                <motion.div
                  key={player.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-2 rounded bg-purple-900/20 border border-purple-500/30"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4"
                    >
                      🤖
                    </motion.div>
                    <RoleBadge role={player.role} size="sm" />
                    <span className="text-purple-200 text-sm">{player.name}</span>
                  </div>
                  <BitcoinBalance
                    balance={player.bitcoin}
                    showIcon={false}
                    size="sm"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Total Bitcoin Pool */}
      <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 rounded-lg p-3 border border-yellow-500/30">
        <div className="flex items-center justify-between">
          <span className="text-yellow-200 font-medium">Total Bitcoin Pool</span>
          <BitcoinBalance
            balance={gameStatus.totalBitcoin}
            showIcon={false}
            size="md"
          />
        </div>
      </div>

      {/* Bank Device Status */}
      {gameStatus.bankDeviceActive && (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="bg-yellow-900/50 border-2 border-yellow-500 rounded-lg p-3 text-center"
        >
          <div className="text-2xl mb-2">🏦</div>
          <p className="text-yellow-200 font-bold">BANK DEVICE ACTIVE!</p>
          <p className="text-yellow-300 text-sm">High-value targets available</p>
        </motion.div>
      )}
    </motion.div>
  );
}

// Mini status bar for compact displays
export function MiniGameStatus({
  gameStatus,
  currentPlayer
}: {
  gameStatus: GameStatus;
  currentPlayer?: Player;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-2 h-2 rounded-full ${statusColors[gameStatus.status]}`}
          />
          <span className="text-white text-sm font-medium">
            Round {gameStatus.currentRound}/{gameStatus.maxRounds}
          </span>
        </div>

        {currentPlayer && (
          <div className="flex items-center gap-2">
            <RoleBadge role={currentPlayer.role} size="sm" />
            <BitcoinBalance
              balance={currentPlayer.bitcoin}
              showIcon={false}
              size="sm"
            />
          </div>
        )}

        <GameTimer
          duration={gameStatus.matchTimeLeft}
          label=""
          size="sm"
        />
      </div>
    </motion.div>
  );
}
