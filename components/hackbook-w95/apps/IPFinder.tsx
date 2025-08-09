"use client";

import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { useGameFailureHandler } from "../hooks/useGameFailureHandler";
import Win95Alert from "../Win95Alert";

interface IPFinderProps {
  onSuccess: (targetIP: string) => void;
  onClose: () => void;
}

const IPFinder: React.FC<IPFinderProps> = ({ onSuccess, onClose }) => {
  const { handleFailure, alertMessage, showAlert, closeAlert } = useGameFailureHandler();
  const [gameStarted, setGameStarted] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameFailed, setGameFailed] = useState(false);
  const [targetIP, setTargetIP] = useState("");
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentIP, setCurrentIP] = useState("");
  const [showConnectionRefused, setShowConnectionRefused] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [numberGrid, setNumberGrid] = useState<string[]>([]);
  
  const MAX_ATTEMPTS = 3;

  // Generate number grid with target IP hidden
  const generateNumberGrid = (): { grid: string[], target: string } => {
    // Dynamic target scenarios
    const scenarios = [
      { targetIP: "192.168.1.142", description: "ShadowByte's Lair" },
      { targetIP: "10.0.0.187", description: "CyberPhantom's Den" },
      { targetIP: "172.16.5.221", description: "DarkNet Operative" },
      { targetIP: "192.168.2.156", description: "Ghost Protocol" },
      { targetIP: "10.1.1.199", description: "Binary Assassin" }
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const targetOctets = scenario.targetIP.split('.');
    
    // Create 10x8 grid (80 numbers)
    const grid: string[] = [];
    const targetPositions = new Set<number>();
    
    // Randomly place target IP octets
    while (targetPositions.size < 4) {
      const pos = Math.floor(Math.random() * 80);
      if (!targetPositions.has(pos)) {
        targetPositions.add(pos);
      }
    }
    
    // Fill grid
    const targetArray = Array.from(targetPositions);
    for (let i = 0; i < 80; i++) {
      if (targetPositions.has(i)) {
        const octetIndex = targetArray.indexOf(i);
        grid[i] = targetOctets[octetIndex];
      } else {
        // Generate random numbers
        grid[i] = Math.floor(Math.random() * 256).toString().padStart(2, '0');
      }
    }
    
    return { grid, target: scenario.targetIP };
  };

  // Initialize game
  useEffect(() => {
    const { grid, target } = generateNumberGrid();
    setNumberGrid(grid);
    setTargetIP(target);
    setGameStarted(true);
    
    // Reset game state to ensure clean start
    setWrongAttempts(0);
    setGameFailed(false);
    setGameComplete(false);
    setShowGameOver(false);
    
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameFailed(true);
          setShowGameOver(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []); // Empty dependency array to run only once

  // Handle game failure - delete account
  useEffect(() => {
    if (gameFailed && wrongAttempts >= MAX_ATTEMPTS) {
      console.log('Game failed after reaching max attempts, handling failure');
      setTimeout(() => {
        handleFailure();
      }, 3000); // 3 second delay to show failure message
    } else if (gameFailed && timeLeft <= 0) {
      console.log('Game failed due to timeout, handling failure');
      setTimeout(() => {
        handleFailure();
      }, 3000); // 3 second delay to show failure message
    }
  }, [gameFailed, handleFailure, wrongAttempts, timeLeft]);

  // Handle number click
  const handleNumberClick = (index: number, value: string) => {
    if (gameComplete || gameFailed || selectedNumbers.length >= 4 || selectedIndices.includes(index)) return;
    
    const newSelected = [...selectedNumbers, value];
    const newIndices = [...selectedIndices, index];
    setSelectedNumbers(newSelected);
    setSelectedIndices(newIndices);
    setCurrentIP(newSelected.join('.'));
    
    // Check if complete IP
    if (newSelected.length === 4) {
      const attemptedIP = newSelected.join('.');
      
      setTimeout(() => {
        if (attemptedIP === targetIP) {
          setGameComplete(true);
          setShowSuccessAnimation(true);
          setTimeout(() => onSuccess(attemptedIP), 2000);
        } else {
          // Update wrong attempts counter
          const newWrongAttempts = wrongAttempts + 1;
          setWrongAttempts(newWrongAttempts);
          
          console.log(`Wrong attempt ${newWrongAttempts} of ${MAX_ATTEMPTS}`);
          
          // Only fail if we've reached MAX_ATTEMPTS (3)
          if (newWrongAttempts >= MAX_ATTEMPTS) {
            console.log('Max attempts reached, game over');
            setGameFailed(true);
            setShowGameOver(true);
          } else {
            // Otherwise, show connection refused and reset for next attempt
            console.log(`You have ${MAX_ATTEMPTS - newWrongAttempts} attempts remaining`);
            setShowConnectionRefused(true);
            setSelectedNumbers([]);
            setSelectedIndices([]);
            setCurrentIP("");
            setTimeout(() => setShowConnectionRefused(false), 2500);
          }
        }
      }, 1000);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const milliseconds = Math.floor(Math.random() * 999);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
  };

  // Check if number is part of target
  const isTargetNumber = (value: string) => {
    return targetIP.split('.').includes(value);
  };

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      {/* Matrix background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-black to-black"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 border-b-2 border-cyan-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center">
              <span className="text-black font-bold">🔒</span>
            </div>
            <div>
              <h2 className="font-mono font-bold text-xl">CONNECTING TO THE HOST</h2>
              <p className="text-sm text-cyan-200 font-mono">COMPROMISING GLOBAL SECURITY ONE SLIP AT A TIME</p>
            </div>
          </div>
          
          {/* Signal strength */}
          <div className="flex space-x-1">
            {[4, 5, 6, 3, 4].map((height, i) => (
              <div key={i} className={`w-2 bg-cyan-400`} style={{ height: `${height * 4}px` }}></div>
            ))}
          </div>
        </div>
      </div>

      {!gameStarted ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-cyan-400">
            <div className="text-2xl font-mono mb-4 animate-pulse">INITIALIZING BREACH PROTOCOL...</div>
            <div className="w-64 h-2 bg-gray-800 border border-cyan-600">
              <div className="w-full h-full bg-cyan-400 animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 p-8 text-white h-full flex flex-col items-center">
          {/* Target IP Display */}
          <div className="text-center mb-8">
            <div className="text-7xl font-mono text-red-500 mb-4 tracking-wider animate-pulse">
              {currentIP || targetIP}
            </div>
            <div className="text-2xl font-mono text-cyan-400">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Number Matrix Grid */}
          <div className="mb-6">
            <div className="grid grid-cols-10 gap-2 p-6 bg-black/70 border-2 border-cyan-600 rounded-lg backdrop-blur-sm">
              {numberGrid.map((number, index) => {
                const isSelected = selectedIndices.includes(index);
                const isTarget = isTargetNumber(number) && (wrongAttempts > 0 || gameComplete);
                
                return (
                  <div
                    key={index}
                    className={clsx(
                      "w-14 h-10 flex items-center justify-center text-lg font-mono cursor-pointer transition-all duration-300 border",
                      "hover:scale-110 hover:shadow-lg",
                      {
                        "text-white bg-gray-900 border-cyan-800 hover:border-cyan-400 hover:bg-cyan-900": !isSelected && !isTarget,
                        "text-red-400 bg-red-900/50 border-red-500 animate-pulse": isTarget && !isSelected,
                        "text-black bg-cyan-400 border-cyan-300": isSelected,
                        "opacity-50 cursor-not-allowed": selectedNumbers.length >= 4 && !isSelected
                      }
                    )}
                    onClick={() => selectedNumbers.length < 4 && !isSelected && handleNumberClick(index, number)}
                  >
                    {number}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div className="text-center">
            <div className="text-cyan-400 font-mono text-lg mb-2">
              Hack the <span className="text-green-400 animate-pulse">laptop</span>.
            </div>
            {selectedNumbers.length > 0 && (
              <div className="text-yellow-400 font-mono text-xl">
                {selectedNumbers.join('.')}
                {selectedNumbers.length < 4 && '...'}
              </div>
            )}
            <div className="text-gray-400 text-sm mt-2">
              Attempts: {wrongAttempts}/{MAX_ATTEMPTS} | Time: {timeLeft}s
            </div>
          </div>
        </div>
      )}

      {/* Connection Refused Dialog */}
      {showConnectionRefused && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-red-900 border-2 border-red-500 p-6 rounded text-white text-center">
            <h3 className="font-mono text-xl mb-4">CONNECTION REFUSED</h3>
            <p className="font-mono">Invalid IP sequence: {currentIP}</p>
            <p className="text-red-400 mt-2">Attempts remaining: {MAX_ATTEMPTS - wrongAttempts}</p>
          </div>
        </div>
      )}

      {/* Game Over Dialog */}
      {showGameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-red-900 border-2 border-red-500 p-6 rounded text-white text-center max-w-md">
            <h3 className="font-mono text-2xl mb-4">BREACH FAILED</h3>
            <p className="font-mono mb-2">Security protocols activated</p>
            <p className="text-red-400 mb-4">Target IP was: {targetIP}</p>
            <div className="border-t border-red-500 pt-4 mt-4">
              <p className="font-mono text-yellow-400 mb-2">ACCOUNT TERMINATION IN PROGRESS...</p>
              <p className="text-sm text-gray-300">Redirecting to login...</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {showSuccessAnimation && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-green-900 border-2 border-green-500 p-6 rounded text-white text-center">
            <h3 className="font-mono text-2xl mb-4">BREACH SUCCESSFUL</h3>
            <p className="font-mono text-green-400 text-xl">{targetIP}</p>
            <p className="font-mono mt-2">Establishing connection...</p>
            <div className="w-full h-2 bg-gray-800 border border-green-500 mt-4">
              <div className="h-full bg-green-400 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-white hover:text-red-400 z-20"
        onClick={onClose}
      >
        ✕
      </button>

      {/* Win95Alert for game failure */}
      {showAlert && alertMessage && (
        <Win95Alert message={alertMessage} onClose={closeAlert} />
      )}
    </div>
  );
};

export default IPFinder;
