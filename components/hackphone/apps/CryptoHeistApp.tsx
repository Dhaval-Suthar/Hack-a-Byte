"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppContainer, AppHeader } from "../shared/AppContainer";
import { NotificationProvider, useNotifications, BankDeviceAlert } from "../../ui/NotificationSystem";
import { MiniGameStatus } from "../../ui/GameStatus";
import { Leaderboard } from "../../ui/Leaderboard";
import BitcoinBalance from "../../ui/BitcoinBalance";
import RoleBadge from "../../ui/RoleBadge";

// Mock data for demonstration
interface Player {
  id: string;
  name: string;
  role: 'professor' | 'attacker' | 'defender' | 'extractor' | 'bot';
  bitcoin: number;
  isOnline: boolean;
  isBot?: boolean;
}

interface GameState {
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

const mockPlayers: Player[] = [
  { id: '1', name: 'Alice', role: 'professor', bitcoin: 1250, isOnline: true },
  { id: '2', name: 'Bob', role: 'attacker', bitcoin: 980, isOnline: true },
  { id: '3', name: 'Charlie', role: 'defender', bitcoin: 750, isOnline: false },
  { id: '4', name: 'Diana', role: 'extractor', bitcoin: 1100, isOnline: true },
  { id: '5', name: 'Bot-1', role: 'bot', bitcoin: 600, isOnline: true, isBot: true },
  { id: '6', name: 'Bot-2', role: 'bot', bitcoin: 450, isOnline: true, isBot: true },
];

const mockLeaderboard = mockPlayers.map((player, index) => ({
  ...player,
  score: player.bitcoin + Math.floor(Math.random() * 500),
  rank: index + 1,
  achievements: index < 3 ? ['First Blood', 'Bank Buster'] : [],
}));

const CryptoHeistAppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'menu' | 'game' | 'leaderboard'>('menu');
  const [gameState, setGameState] = useState<GameState>({
    matchId: 'match-001',
    status: 'waiting',
    players: mockPlayers,
    totalBitcoin: 4500,
    bankDeviceActive: false,
    matchTimeLeft: 1800, // 30 minutes
    currentRound: 1,
    maxRounds: 5,
  });
  const [showBankAlert, setShowBankAlert] = useState(false);

  const { addNotification } = useNotifications();

  // Simulate game progression
  useEffect(() => {
    if (gameState.status === 'active') {
      const timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          matchTimeLeft: Math.max(0, prev.matchTimeLeft - 1),
          bankDeviceTimeLeft: prev.bankDeviceActive && prev.bankDeviceTimeLeft
            ? Math.max(0, prev.bankDeviceTimeLeft - 1)
            : prev.bankDeviceTimeLeft
        }));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState.status]);

  // Simulate bank device activation
  useEffect(() => {
    if (gameState.status === 'active' && !gameState.bankDeviceActive) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          bankDeviceActive: true,
          bankDeviceTimeLeft: 60
        }));
        setShowBankAlert(true);
        addNotification({
          type: 'bank',
          title: 'BANK DEVICE ONLINE!',
          message: 'High-value bitcoin targets available for 60 seconds!',
        });
      }, 10000); // Activate after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [gameState.status, gameState.bankDeviceActive, addNotification]);

  const startMatch = () => {
    setGameState(prev => ({ ...prev, status: 'active' }));
    addNotification({
      type: 'success',
      title: 'Match Started!',
      message: 'CryptoHeist: Digital Warfare has begun!',
    });
  };

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 p-6 space-y-6"
    >
      {/* Game Title */}
      <div className="text-center space-y-4">
        <motion.h1
          className="text-3xl font-bold text-yellow-400"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🏦 CryptoHeist
        </motion.h1>
        <p className="text-gray-300 text-lg">Digital Warfare</p>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Compete in teams of 1-6 players in this strategic bitcoin heist game.
          Hack systems, defend networks, and extract maximum value!
        </p>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">₹60</div>
          <div className="text-sm text-gray-400">Standard Match</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">₹100</div>
          <div className="text-sm text-gray-400">Extended Match</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startMatch}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-lg transition-colors"
        >
          🚀 Start New Match
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentView('leaderboard')}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          🏆 View Leaderboard
        </motion.button>
      </div>

      {/* Game Features */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Game Features:</h3>
        <div className="grid grid-cols-1 gap-2 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Flexible team sizes (1-6 players)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>AI bot system for incomplete teams</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Bank device high-value targets</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Real-time bitcoin tracking</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="flex-1 flex flex-col">
      {/* Mini Status Bar */}
      <div className="p-4 border-b border-gray-700">
        <MiniGameStatus
          gameStatus={gameState}
          currentPlayer={gameState.players[0]}
        />
      </div>

      {/* Game Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Player Actions */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            ⚔️ Attack
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            🛡️ Defend
          </motion.button>
        </div>

        {/* Current Player Stats */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <RoleBadge role={gameState.players[0].role} size="md" />
            <BitcoinBalance
              balance={gameState.players[0].bitcoin}
              showIcon={true}
              size="lg"
            />
          </div>
          <div className="text-center">
            <p className="text-white font-medium">{gameState.players[0].name}</p>
            <p className="text-gray-400 text-sm">Your Status</p>
          </div>
        </div>

        {/* Team Overview */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Team Status</h3>
          <div className="space-y-2">
            {gameState.players.slice(0, 4).map((player) => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RoleBadge role={player.role} size="sm" />
                  <span className="text-white text-sm">{player.name}</span>
                  {player.isBot && <span className="text-purple-400 text-xs">🤖</span>}
                </div>
                <BitcoinBalance
                  balance={player.bitcoin}
                  showIcon={false}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="flex-1 p-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCurrentView('menu')}
        className="mb-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        ← Back to Menu
      </motion.button>

      <Leaderboard
        entries={mockLeaderboard}
        currentPlayerId="1"
        showAchievements={true}
        maxEntries={10}
      />
    </div>
  );

  return (
    <>
      <AppContainer backgroundColor="bg-gray-900">
        <AppHeader title="CryptoHeist: Digital Warfare" />

        <AnimatePresence mode="wait">
          {currentView === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderMenu()}
            </motion.div>
          )}

          {currentView === 'game' && (
            <motion.div
              key="game"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderGame()}
            </motion.div>
          )}

          {currentView === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderLeaderboard()}
            </motion.div>
          )}
        </AnimatePresence>
      </AppContainer>

      {/* Bank Device Alert */}
      <BankDeviceAlert
        isVisible={showBankAlert}
        onDismiss={() => setShowBankAlert(false)}
      />
    </>
  );
};

const CryptoHeistApp: React.FC = () => {
  return (
    <NotificationProvider>
      <CryptoHeistAppContent />
    </NotificationProvider>
  );
};

export default CryptoHeistApp;
