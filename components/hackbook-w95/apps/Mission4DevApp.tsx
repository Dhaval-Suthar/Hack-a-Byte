"use client";

import React, { useState } from "react";
import UntangleNeuralNetwork from "@/components/hackbook-w95/apps/UntangleNeuralNetwork";

interface Mission4DevAppProps {
  onClose: () => void;
}

const Mission4DevApp: React.FC<Mission4DevAppProps> = ({ onClose }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
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
      difficulty: selectedDifficulty,
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
        difficulty={selectedDifficulty}
      />
    );
  }

  return (
    <div className="w-full h-full bg-black text-green-500 font-mono">
      {/* Header */}
      <div className="bg-[#000080] text-white p-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="font-bold">MISSION 4 DEVELOPMENT TESTER</span>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:bg-red-600 px-2 py-1 text-sm"
        >
          [X]
        </button>
      </div>

      <div className="p-6">
        {/* Mission Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-cyan-400 mb-4">🧠 MISSION 4: UNTANGLE NEURAL NETWORK</h1>
          <div className="bg-gray-900 p-4 border border-green-500 mb-4">
            <h3 className="text-yellow-400 font-bold mb-2">OBJECTIVE: RESTORE FRAGMENTED INTELLIGENCE</h3>
            <p className="text-sm mb-2">
              Within the newly accessed remote drive, you&apos;ve discovered fragmented &quot;neural net data&quot; - 
              a representation of ShadowByte&apos;s collected intelligence, broken and jumbled.
            </p>
            <p className="text-sm text-gray-400">
              Drag nodes to untangle the neural network. All connections must be GREEN (untangled) to complete restoration.
            </p>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-6">
          <h3 className="text-yellow-400 font-bold mb-3">SELECT DIFFICULTY LEVEL:</h3>
          <div className="grid grid-cols-1 gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="difficulty" 
                value="beginner"
                checked={selectedDifficulty === 'beginner'}
                onChange={(e) => setSelectedDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <span className="text-green-400 font-bold">BEGINNER</span>
                <div className="text-sm text-gray-400 ml-4">
                  • 6 nodes with minimal overlap<br/>
                  • 500x400 canvas size<br/>
                  • Basic intelligence data revealed
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="difficulty" 
                value="intermediate"
                checked={selectedDifficulty === 'intermediate'}
                onChange={(e) => setSelectedDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <span className="text-cyan-400 font-bold">INTERMEDIATE</span>
                <div className="text-sm text-gray-400 ml-4">
                  • 10 nodes with moderate complexity<br/>
                  • 600x450 canvas size<br/>
                  • Enhanced intelligence + bonus data
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="difficulty" 
                value="advanced"
                checked={selectedDifficulty === 'advanced'}
                onChange={(e) => setSelectedDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <span className="text-red-400 font-bold">ADVANCED</span>
                <div className="text-sm text-gray-400 ml-4">
                  • 15 nodes with high complexity<br/>
                  • 700x500 canvas size<br/>
                  • Full intelligence + vault password hint
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Start Button */}
        <div className="mb-6">
          <button 
            onClick={handleStartGame}
            className="bg-green-700 hover:bg-green-600 text-white font-bold py-3 px-6 border-2 border-green-500 w-full"
          >
            🚀 START NEURAL NETWORK RESTORATION
          </button>
        </div>

        {/* Completion History */}
        {completedGames.length > 0 && (
          <div className="mb-6">
            <h3 className="text-yellow-400 font-bold mb-3">COMPLETION HISTORY:</h3>
            <div className="bg-gray-900 border border-green-500 p-4 max-h-40 overflow-y-auto">
              {completedGames.map((game, index) => (
                <div key={index} className="mb-3 pb-3 border-b border-gray-700 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-cyan-400 font-bold">{game.difficulty.toUpperCase()}</span>
                    <span className="text-green-400">✓ COMPLETED</span>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-pre-line">
                    {game.data.split('\n').slice(0, 2).join('\n')}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-900 border border-yellow-500 p-4">
          <h3 className="text-yellow-400 font-bold mb-2">GAME CONTROLS:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <span className="text-white">Click and Drag</span> - Move nodes to new positions</li>
            <li>• <span className="text-red-400">Red Lines</span> - Tangled connections (intersecting)</li>
            <li>• <span className="text-green-400">Green Lines</span> - Clear connections (untangled)</li>
            <li>• <span className="text-yellow-400">Gold Nodes</span> - Fixed anchor points (cannot move)</li>
            <li>• <span className="text-cyan-400">Blue Nodes</span> - Moveable data points</li>
            <li>• <span className="text-white">White Nodes</span> - Currently being dragged</li>
          </ul>
          <div className="mt-3 text-xs text-yellow-300">
            <strong>GOAL:</strong> Achieve 100% Neural Integrity by eliminating all line intersections
          </div>
        </div>

        {/* Development Info */}
        <div className="mt-6 text-xs text-gray-500 border-t border-gray-700 pt-4">
          <p><strong>Development Mode:</strong> This app allows direct testing of Mission 4 without prerequisite missions.</p>
          <p><strong>Integration:</strong> Game data and mission completion are logged to console for debugging.</p>
        </div>
      </div>
    </div>
  );
};

export default Mission4DevApp;
