"use client";

import React, { useState } from "react";
import UntangleNeuralNetwork from "@/components/hackbook-w95/apps/UntangleNeuralNetwork";
import GameDifficultyManager from "../hooks/useGameDifficulty";

interface Mission4DevAppProps {
  onClose: () => void;
}

const Mission4DevApp: React.FC<Mission4DevAppProps> = ({ onClose }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [completedGames, setCompletedGames] = useState<Array<{
    difficulty: string;
    moves: number;
    time: number;
    data: string;
  }>>([]);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleGameSuccess = (data: string) => {
    // Record the completion
    const completion = {
      difficulty: GameDifficultyManager.getGlobalDifficulty(),
      moves: 0, // Could be passed from the game
      time: 0, // Could be passed from the game
      data: data
    };
    
    setCompletedGames(prev => [...prev, completion]);
    setGameStarted(false);
    
    console.log("Mission 4 Completed:", completion);
  };

  const handleGameClose = () => {
    setGameStarted(false);
  };

  if (gameStarted) {
    return (
      <UntangleNeuralNetwork
        onSuccess={handleGameSuccess}
        onClose={handleGameClose}
      />
    );
  }

  return (
    <div className="w-full h-full bg-gray-300 text-black font-mono flex flex-col">
      {/* Windows 95 Title Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-1 flex justify-between items-center border-b-2 border-gray-600">
        <div className="flex items-center gap-2 px-2">
          <div className="w-4 h-4 bg-yellow-400 border border-gray-800"></div>
          <span className="font-bold text-sm">Neural Network Restoration - Mission 4</span>
        </div>
        <button 
          onClick={onClose}
          className="bg-gray-300 text-black border border-gray-600 px-2 hover:bg-gray-400 text-sm font-bold"
        >
          ✕
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 bg-gray-300">
        {/* Mission Window */}
        <div className="bg-gray-300 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 p-4 mb-4">
          <div className="bg-gray-200 border border-gray-600 p-3 mb-3">
            <h2 className="text-lg font-bold text-black mb-2">🧠 Restore Fragmented Intelligence</h2>
            <p className="text-sm text-black">
              Untangle the neural network by dragging nodes. Make all connections green to succeed.
            </p>
          </div>

          {/* Game Controls */}
          <div className="bg-gray-200 border border-gray-600 p-3 mb-3">
            <div className="text-sm font-bold mb-2">Controls:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>• <span className="bg-red-500 text-white px-1">Red</span> = Tangled</div>
              <div>• <span className="bg-green-500 text-white px-1">Green</span> = Clear</div>
              <div>• <span className="bg-yellow-500 text-black px-1">Yellow</span> = Fixed</div>
              <div>• <span className="bg-cyan-500 text-black px-1">Blue</span> = Moveable</div>
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="bg-gray-200 border border-gray-600 p-3 mb-3">
            <div className="text-sm font-bold mb-2">Difficulty:</div>
            <div className="flex gap-2">
              {["easy", "normal", "hard", "nightmare"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => GameDifficultyManager.setGlobalDifficulty(diff)}
                  className={`px-2 py-1 text-xs border border-gray-600 ${
                    GameDifficultyManager.getGlobalDifficulty() === diff 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-black hover:bg-gray-400'
                  }`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button 
              onClick={handleStartGame}
              className="bg-gray-300 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 
                       px-6 py-2 text-black font-bold hover:bg-gray-400 active:border-t-gray-600 active:border-l-gray-600 active:border-r-white active:border-b-white"
            >
              Start Mission
            </button>
          </div>
        </div>

        {/* Completion History - Only show if exists */}
        {completedGames.length > 0 && (
          <div className="bg-gray-300 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 p-4">
            <div className="bg-gray-200 border border-gray-600 p-3">
              <div className="text-sm font-bold mb-2">Completed: {completedGames.length} time(s)</div>
              <div className="bg-white border border-gray-600 p-2 max-h-24 overflow-y-auto text-xs">
                {completedGames.map((game, index) => (
                  <div key={index} className="mb-1">
                    Session {index + 1}: ✓ Neural Integrity Restored
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-300 border-t-2 border-gray-600 p-1 text-xs">
        <div className="flex justify-between">
          <span>Difficulty: Beginner (6 nodes)</span>
          <span>Development Mode</span>
        </div>
      </div>
    </div>
  );
};

export default Mission4DevApp;
