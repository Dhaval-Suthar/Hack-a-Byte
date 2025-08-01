"use client";

import React, { useState, useEffect, useCallback } from "react";
import audioManager from "../hooks/useAudioManager";
import GameDifficultyManager from "../hooks/useGameDifficulty";
import gameScoring, { GameScoringManager } from "../hooks/useGameScoring";

interface NumberJumpingGameProps {
  onClose: () => void;
}

type GameState = "intro" | "playing" | "success" | "failed" | "breach-detected";
type Pattern = "prime" | "ascending" | "descending" | "multiples" | "diagonal" | "l-shape";

interface GridCell {
  value: number;
  row: number;
  col: number;
  isSelected: boolean;
  isCorrect: boolean;
  isTrap: boolean;
}

const NumberJumpingGame: React.FC<NumberJumpingGameProps> = ({ onClose }) => {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [currentPattern, setCurrentPattern] = useState<Pattern>("prime");
  const [selectedCells, setSelectedCells] = useState<GridCell[]>([]);
  const [targetSequence, setTargetSequence] = useState<number[]>([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPipeline, setShowPipeline] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  // Store the multiplier for the multiples pattern
  const [currentMultiplier, setCurrentMultiplier] = useState<number | null>(null);

  // Start game tracking on component mount
  useEffect(() => {
    const currentDifficulty = GameDifficultyManager.getGlobalDifficulty();
    gameScoring.startGame(GameScoringManager.NUMBER_JUMPING_GAME, currentDifficulty);
  }, []);

  // Get difficulty configuration
  const getDifficultyConfig = useCallback(() => {
    const difficulty = GameDifficultyManager.getGlobalDifficulty();
    
    switch (difficulty) {
      case "easy":
        return { gridSize: 6, maxLevels: 3, livesCount: 5, sequenceLength: 4 };
      case "normal":
        return { gridSize: 8, maxLevels: 5, livesCount: 3, sequenceLength: 5 };
      case "hard":
        return { gridSize: 10, maxLevels: 7, livesCount: 2, sequenceLength: 6 };
      case "nightmare":
        return { gridSize: 12, maxLevels: 10, livesCount: 1, sequenceLength: 8 };
      default:
        return { gridSize: 8, maxLevels: 5, livesCount: 3, sequenceLength: 5 };
    }
  }, []);

  // Start game tracking on component mount
  useEffect(() => {
    const currentDifficulty = GameDifficultyManager.getGlobalDifficulty();
    gameScoring.startGame(GameScoringManager.NUMBER_JUMPING_GAME, currentDifficulty);
    
    // Set initial lives based on difficulty
    const config = getDifficultyConfig();
    setLives(config.livesCount);
  }, [getDifficultyConfig]);

  // Sound effects
  const playSound = useCallback((sound: string) => {
    try {
      audioManager.playSound(`/hackbook-w95/sounds/${sound}.mp3`, 0.5);
    } catch (error) {
      console.error("Sound error:", error);
    }
  }, []);

  // Generate prime numbers up to a limit
  const generatePrimes = (limit: number): number[] => {
    const primes = [];
    for (let i = 2; i <= limit; i++) {
      let isPrime = true;
      for (let j = 2; j <= Math.sqrt(i); j++) {
        if (i % j === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primes.push(i);
    }
    return primes;
  };

  // Generate a random grid with numbers
  const generateGrid = useCallback((size: number): GridCell[][] => {
    const newGrid: GridCell[][] = [];
    const usedNumbers = new Set<number>();
    
    // Generate numbers for the grid (1-99 range)
    for (let row = 0; row < size; row++) {
      newGrid[row] = [];
      for (let col = 0; col < size; col++) {
        let value;
        do {
          value = Math.floor(Math.random() * 99) + 1;
        } while (usedNumbers.has(value));
        
        usedNumbers.add(value);
        
        // Add some trap numbers (randomly, but not too many)
        const isTrap = Math.random() < 0.08; // 8% chance of trap
        
        newGrid[row][col] = {
          value,
          row,
          col,
          isSelected: false,
          isCorrect: false,
          isTrap
        };
      }
    }
    
    return newGrid;
  }, []);

  // Validate that a sequence matches the expected pattern
  const validateSequence = useCallback((sequence: number[], pattern: Pattern, multiplierOverride?: number): boolean => {
    if (!sequence || sequence.length === 0) return false;
    switch (pattern) {
      case "multiples": {
        const multiplier = multiplierOverride ?? currentMultiplier ?? 5;
        return sequence.every(num => num % multiplier === 0);
      }
      case "ascending":
        return sequence.every((num, index) => index === 0 || num > sequence[index - 1]);
      case "descending":
        return sequence.every((num, index) => index === 0 || num < sequence[index - 1]);
      case "prime":
        const primes = generatePrimes(99);
        return sequence.every(num => primes.includes(num));
      default:
        return true; // For diagonal and l-shape, assume valid
    }
  }, [currentMultiplier]);

  // Generate target sequence based on pattern
  const generateTargetSequence = useCallback((grid: GridCell[][], pattern: Pattern, multiplierOverride?: number): number[] => {
    const flatGrid = grid.flat();
    switch (pattern) {
      case "prime": {
        const primes = generatePrimes(99);
        return flatGrid
          .filter(cell => primes.includes(cell.value) && !cell.isTrap)
          .map(cell => cell.value)
          .sort((a, b) => a - b)
          .slice(0, Math.min(5, currentLevel + 2));
      }
      case "ascending":
        return flatGrid
          .filter(cell => !cell.isTrap)
          .map(cell => cell.value)
          .sort((a, b) => a - b)
          .slice(0, Math.min(6, currentLevel + 3));
      case "descending":
        return flatGrid
          .filter(cell => !cell.isTrap)
          .map(cell => cell.value)
          .sort((a, b) => b - a)
          .slice(0, Math.min(6, currentLevel + 3));
      case "multiples": {
        // Use a random multiplier between 2 and 10
        const multiplier = multiplierOverride ?? (Math.floor(Math.random() * 9) + 2);
        const availableMultiples = flatGrid
          .filter(cell => !cell.isTrap && cell.value % multiplier === 0)
          .map(cell => cell.value)
          .sort((a, b) => a - b);
        if (availableMultiples.length < 2) {
          return [];
        }
        return availableMultiples.slice(0, Math.min(4, currentLevel + 2));
      }
      case "diagonal": {
        const diagonal = [];
        for (let i = 0; i < Math.min(grid.length, grid[0].length); i++) {
          if (!grid[i][i].isTrap) {
            diagonal.push(grid[i][i].value);
          }
        }
        return diagonal.slice(0, Math.min(4, currentLevel + 2));
      }
      case "l-shape": {
        const lShape = [];
        for (let col = 0; col < Math.min(3, grid[0].length); col++) {
          if (!grid[0][col].isTrap) {
            lShape.push(grid[0][col].value);
          }
        }
        for (let row = 1; row < Math.min(3, grid.length); row++) {
          if (!grid[row][grid[0].length - 1].isTrap) {
            lShape.push(grid[row][grid[0].length - 1].value);
          }
        }
        return lShape.slice(0, Math.min(4, currentLevel + 2));
      }
      default:
        return [];
    }
  }, [currentLevel]);

  // Initialize game level
  const initializeLevel = useCallback(() => {
    const config = getDifficultyConfig();
    const gridSize = Math.min(config.gridSize, config.gridSize);
    const patterns: Pattern[] = ["prime", "ascending", "descending", "multiples", "diagonal", "l-shape"];
    let selectedPattern = patterns[Math.floor(Math.random() * Math.min(patterns.length, 2 + currentLevel))];
    let newGrid: GridCell[][] = [];
    let newTarget: number[] = [];
    let attempts = 0;
    let finalPattern = selectedPattern;
    let multiplierForMultiples: number | null = null;
    // Ensure we generate a valid puzzle
    do {
      newGrid = generateGrid(gridSize);
      if (selectedPattern === "multiples") {
        // Pick a random multiplier and try to generate a valid sequence
        let found = false;
        for (let tryMult = 0; tryMult < 10; tryMult++) {
          const randomMultiplier = Math.floor(Math.random() * 9) + 2; // 2-10
          const candidateTarget = generateTargetSequence(newGrid, "multiples", randomMultiplier);
          if (candidateTarget && candidateTarget.length >= 2 && validateSequence(candidateTarget, "multiples", randomMultiplier)) {
            newTarget = candidateTarget;
            multiplierForMultiples = randomMultiplier;
            found = true;
            break;
          }
        }
        if (!found) {
          newTarget = [];
        }
      } else {
        newTarget = generateTargetSequence(newGrid, selectedPattern);
      }
      attempts++;
      const isValid = selectedPattern === "multiples"
        ? validateSequence(newTarget, "multiples", multiplierForMultiples ?? undefined)
        : validateSequence(newTarget, selectedPattern);
      if ((newTarget.length < 2 || !isValid) && attempts < 10) {
        selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
        multiplierForMultiples = null;
      }
    } while ((newTarget.length < 2 || !(selectedPattern === "multiples"
      ? validateSequence(newTarget, "multiples", multiplierForMultiples ?? undefined)
      : validateSequence(newTarget, selectedPattern))) && attempts < 10);
    // If we still can't generate a good puzzle, fall back to ascending pattern
    if (newTarget.length < 2 || !(selectedPattern === "multiples"
      ? validateSequence(newTarget, "multiples", multiplierForMultiples ?? undefined)
      : validateSequence(newTarget, selectedPattern))) {
      finalPattern = "ascending";
      newTarget = generateTargetSequence(newGrid, finalPattern) ?? [];
      multiplierForMultiples = null;
    } else {
      finalPattern = selectedPattern;
    }
    setCurrentPattern(finalPattern);
    setGrid(newGrid);
    setTargetSequence(newTarget ?? []);
    setSelectedCells([]);
    setErrorMessage("");
    setShowPipeline(false);
    setPipelineProgress(0);
    setCurrentMultiplier(multiplierForMultiples);
  }, [currentLevel, generateGrid, generateTargetSequence, validateSequence, getDifficultyConfig]);

  // Handle cell click
  const handleCellClick = useCallback((cell: GridCell) => {
    if (gameState !== "playing") return;
    
    // Check if it's a trap
    if (cell.isTrap) {
      setErrorMessage("SECURITY ALARM TRIGGERED!");
      setLives(prev => prev - 1);
      playSound("error");
      
      if (lives <= 1) {
        setGameState("failed");
      } else {
        // Reset current sequence
        setSelectedCells([]);
        setGrid(prev => prev.map(row => 
          row.map(c => ({ ...c, isSelected: false, isCorrect: false }))
        ));
        setTimeout(() => setErrorMessage(""), 2000);
      }
      return;
    }
    
    // Check if cell is already selected
    if (cell.isSelected) return;
    
    const newSelectedCells = [...selectedCells, cell];
    const expectedValue = targetSequence[selectedCells.length];
    
    if (cell.value === expectedValue) {
      // Correct selection
      setSelectedCells(newSelectedCells);
      setGrid(prev => prev.map(row => 
        row.map(c => 
          c.row === cell.row && c.col === cell.col 
            ? { ...c, isSelected: true, isCorrect: true }
            : c
        )
      ));
      
      playSound("ding");
      
      // Update pipeline progress
      const progress = (newSelectedCells.length / targetSequence.length) * 100;
      setPipelineProgress(progress);
      setShowPipeline(true);
      
      // Check if sequence is complete
      if (newSelectedCells.length === targetSequence.length) {
        setScore(prev => prev + (currentLevel * 100));
        
        if (currentLevel >= 3) {
          // Game complete
          setTimeout(() => setGameState("success"), 1000);
        } else {
          // Next level
          setTimeout(() => {
            setCurrentLevel(prev => prev + 1);
            initializeLevel();
          }, 1500);
        }
      }
    } else {
      // Wrong selection
      setErrorMessage("Port Blocked! Incorrect sequence.");
      setLives(prev => prev - 1);
      playSound("error");
      
      if (lives <= 1) {
        setGameState("failed");
      } else {
        // Reset current sequence
        setSelectedCells([]);
        setGrid(prev => prev.map(row => 
          row.map(c => ({ ...c, isSelected: false, isCorrect: false }))
        ));
        setTimeout(() => setErrorMessage(""), 2000);
      }
    }
  }, [gameState, selectedCells, targetSequence, lives, currentLevel, playSound, initializeLevel]);

  // Start game
  const startGame = () => {
    setGameState("playing");
    setCurrentLevel(1);
    setLives(3);
    setScore(0);
    initializeLevel();
  };

  // Initialize level when game starts
  useEffect(() => {
    if (gameState === "playing" && grid.length === 0) {
      initializeLevel();
    }
  }, [gameState, grid.length, initializeLevel]);

  // Get pattern description
  const getPatternDescription = (pattern: Pattern): string => {
    switch (pattern) {
      case "prime": return "Select all prime numbers in ascending order";
      case "ascending": return "Select numbers in ascending order";
      case "descending": return "Select numbers in descending order";
      case "multiples": return `Select multiples of ${currentMultiplier ?? '?'} in ascending order`;
      case "diagonal": return "Select numbers along the main diagonal";
      case "l-shape": return "Select numbers in an L-shape pattern";
      default: return "";
    }
  };

  if (gameState === "intro") {
    return (
      <div className="w-full h-full bg-[#c0c0c0] p-4 overflow-auto">
        {/* Terminal-style header */}
        <div className="bg-black text-green-400 p-4 mb-4 border-2 border-inset font-mono">
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-xs">ShadowByte Security Terminal v2.1.4</span>
          </div>
          <h2 className="text-xl font-bold text-center tracking-wide">
            === FIREWALL BYPASS PROTOCOL ===
          </h2>
          <div className="text-center text-sm mt-2 opacity-80">
            CLEARANCE LEVEL: CLASSIFIED
          </div>
        </div>
        
        {/* Main briefing window */}
        <div className="mb-4 p-4 border-2 border-inset bg-[#f0f0f0] shadow-[inset_-1px_-1px_#000,inset_1px_1px_#fff]">
          <div className="bg-red-600 text-white p-2 mb-3 border border-red-800">
            <h3 className="font-bold text-center">⚠️ CLASSIFIED OPERATION ⚠️</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-3 border-2 border-inset">
              <h4 className="font-bold text-blue-800 mb-2 border-b border-gray-300 pb-1">
                📋 MISSION BRIEFING
              </h4>
              <div className="space-y-2 text-sm">
                <p><strong className="text-red-600">Target:</strong> ShadowByte&apos;s Security Grid</p>
                <p><strong className="text-blue-600">Objective:</strong> Bypass multilayer firewall defense</p>
                <p><strong className="text-green-600">Method:</strong> Sequential port penetration</p>
                <p><strong className="text-orange-600">Risk Level:</strong> EXTREME</p>
              </div>
            </div>
            
            <div className="bg-white p-3 border-2 border-inset">
              <h4 className="font-bold text-purple-800 mb-2 border-b border-gray-300 pb-1">
                🎯 OPERATION GUIDE
              </h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">▶</span>
                  Follow pattern sequences to unlock ports
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">▶</span>
                  Avoid trap nodes (highlighted in red)
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">▶</span>
                  Complete data pipeline for each layer
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">▶</span>
                  3 detection attempts = mission failure
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 bg-yellow-50 border-2 border-yellow-400 p-3">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="font-bold text-yellow-800">SECURITY WARNING</span>
            </div>
            <p className="text-sm text-yellow-800">
              This is a high-risk penetration operation. Detection algorithms are active.
              Maintain operational security at all times.
            </p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="text-center space-y-3">
          <div className="bg-black text-green-400 p-2 font-mono text-sm border border-gray-600">
            &gt; Awaiting authorization to proceed...
          </div>
          <button
            onClick={startGame}
            className="bg-[#c0c0c0] border-2 border-outset px-8 py-3 font-bold hover:bg-[#e0e0e0] active:border-inset transition-all duration-100 shadow-md"
          >
            🔓 INITIATE BREACH PROTOCOL
          </button>
          <div className="text-xs text-gray-600 mt-2">
            By proceeding, you acknowledge the risks of this operation
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="w-full h-full bg-[#c0c0c0] p-2 overflow-auto">
        {/* Terminal-style header */}
        <div className="bg-black text-green-400 p-3 mb-3 border-2 border-inset font-mono">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              <h2 className="text-lg font-bold">FIREWALL BREACH - LAYER {currentLevel}</h2>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center">
                <span className="text-red-400">❤️</span>
                <span className="ml-1">{lives}</span>
              </div>
              <div className="flex items-center">
                <span className="text-yellow-400">⭐</span>
                <span className="ml-1">{score}</span>
              </div>
            </div>
          </div>
          <div className="text-xs mt-1 opacity-75">
            &gt; Penetrating security layer {currentLevel} of 3...
          </div>
        </div>

        {/* Pattern instruction with enhanced styling */}
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-3 border-2 border-yellow-400 mb-3 shadow-md">
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <strong className="text-orange-800">CURRENT PATTERN ANALYSIS:</strong>
          </div>
          <div className="text-sm font-mono bg-white p-2 border border-orange-300 rounded">
            {getPatternDescription(currentPattern)}
          </div>
        </div>

        {/* Enhanced target sequence display */}
        <div className="bg-white p-3 border-2 border-inset mb-3 shadow-[inset_-2px_-2px_#000,inset_2px_2px_#fff]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold text-blue-800">🎯 TARGET SEQUENCE</div>
            <div className="text-xs text-gray-600">
              Progress: {selectedCells.length}/{targetSequence.length}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {targetSequence.map((num, index) => (
              <div
                key={index}
                className={`w-12 h-12 border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  index < selectedCells.length 
                    ? "bg-green-400 border-green-600 text-white shadow-md transform scale-105" 
                    : "bg-gray-200 border-gray-400 text-gray-600"
                }`}
              >
                {index < selectedCells.length ? (
                  <div className="flex flex-col items-center">
                    <span className="text-xs">✓</span>
                    <span>{num}</span>
                  </div>
                ) : (
                  <span className="text-2xl">?</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced pipeline progress */}
        {showPipeline && (
          <div className="bg-white p-3 border-2 border-inset mb-3 shadow-[inset_-2px_-2px_#000,inset_2px_2px_#fff]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-purple-800">📊 DATA PIPELINE STATUS</div>
              <div className="text-xs font-mono text-purple-600">
                {Math.round(pipelineProgress)}% COMPLETE
              </div>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-400 h-6 border-2 border-inset">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500 flex items-center justify-center"
                  style={{ width: `${pipelineProgress}%` }}
                >
                  {pipelineProgress > 20 && (
                    <span className="text-white text-xs font-bold">UPLOADING...</span>
                  )}
                </div>
              </div>
              {pipelineProgress > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced error message */}
        {errorMessage && (
          <div className="bg-red-600 text-white p-3 mb-3 border-2 border-red-800 animate-pulse shadow-lg">
            <div className="flex items-center justify-center">
              <span className="text-xl mr-2">🚨</span>
              <span className="font-bold">{errorMessage}</span>
              <span className="text-xl ml-2">🚨</span>
            </div>
            <div className="text-center text-xs mt-1">
              SECURITY BREACH DETECTED - PROCEED WITH CAUTION
            </div>
          </div>
        )}

        {/* Enhanced game grid */}
        <div className="flex justify-center mb-4">
          <div className="bg-black p-4 border-4 border-gray-600 shadow-xl">
            <div className="bg-gray-800 p-2 mb-2 text-green-400 text-xs font-mono text-center">
              NETWORK PORT MATRIX - {grid.length}x{grid.length}
            </div>
            <div 
              className="grid gap-1"
              style={{ 
                gridTemplateColumns: `repeat(${grid.length}, 1fr)`,
                maxWidth: "480px"
              }}
            >
              {grid.flat().map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleCellClick(cell)}
                  className={`
                    w-14 h-14 border-2 text-sm font-bold transition-all duration-200 relative
                    ${cell.isTrap 
                      ? "bg-red-500 border-red-700 text-white shadow-red-500/50 shadow-lg animate-pulse" 
                      : cell.isCorrect
                      ? "bg-green-500 border-green-700 text-white shadow-green-500/50 shadow-lg"
                      : cell.isSelected
                      ? "bg-blue-500 border-blue-700 text-white shadow-blue-500/50 shadow-lg"
                      : "bg-gray-300 border-gray-500 hover:bg-gray-200 hover:shadow-md transform hover:scale-105"
                    }
                    ${!cell.isSelected && !cell.isTrap ? 'hover:border-blue-400' : ''}
                  `}
                  disabled={cell.isSelected}
                >
                  {cell.value}
                  {cell.isTrap && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full">
                      <span className="text-white text-xs">!</span>
                    </div>
                  )}
                  {cell.isCorrect && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="text-green-400 text-xs font-mono text-center mt-2">
              &gt; Click ports to establish connection sequence
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "success") {
    return (
      <div className="w-full h-full bg-[#c0c0c0] p-4 overflow-auto">
        {/* Terminal success header */}
        <div className="bg-black text-green-400 p-4 mb-4 border-2 border-inset font-mono">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2 animate-pulse">
              === BREACH SUCCESSFUL ===
            </div>
            <div className="flex justify-center items-center mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-ping"></div>
              <span>ESTABLISHING SECURE CONNECTION...</span>
              <div className="w-3 h-3 bg-green-400 rounded-full ml-2 animate-ping"></div>
            </div>
            <div className="text-sm opacity-75">
              All firewall layers penetrated successfully
            </div>
          </div>
        </div>
        
        {/* Main success content */}
        <div className="bg-white p-4 border-2 border-inset mb-4 shadow-[inset_-2px_-2px_#000,inset_2px_2px_#fff]">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Mission success details */}
            <div className="bg-green-50 p-4 border-2 border-green-400">
              <h3 className="font-bold text-green-800 mb-3 text-center border-b border-green-300 pb-2">
                🎉 MISSION ACCOMPLISHED
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Final Score:</span>
                  <span className="bg-yellow-200 px-2 py-1 rounded font-bold">{score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Layers Breached:</span>
                  <span className="text-green-600 font-bold">3/3 ✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Detection Level:</span>
                  <span className="text-orange-600 font-bold">MINIMAL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Status:</span>
                  <span className="text-green-600 font-bold">CONNECTED</span>
                </div>
              </div>
            </div>

            {/* System access display */}
            <div className="bg-gray-900 text-green-400 p-4 border-2 border-gray-600 font-mono text-sm">
              <div className="border-b border-green-400 pb-2 mb-3">
                <h4 className="font-bold">📁 REMOTE SYSTEM ACCESS</h4>
              </div>
              <div className="space-y-1">
                <div className="flex items-center">
                  <span className="text-yellow-400">$</span>
                  <span className="ml-2">cd C:\SHADOWBYTE\</span>
                </div>
                <div className="ml-4 space-y-1">
                  <div>📂 Documents\ [ACCESSIBLE]</div>
                  <div>📂 Projects\ [ACCESSIBLE]</div>
                  <div>📂 System\ [RESTRICTED]</div>
                  <div>📂 Logs\ [MONITORING]</div>
                  <div>📂 Database\ [ENCRYPTED]</div>
                </div>
                <div className="mt-3 pt-2 border-t border-green-400">
                  <div className="text-yellow-400">
                    &gt; Remote shell established
                  </div>
                  <div className="text-blue-400">
                    &gt; Downloading intelligence...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security breach warning with enhanced styling */}
        <div className="bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-600 p-4 mb-4 shadow-lg">
          <div className="bg-red-600 text-white p-3 text-center font-bold mb-3 border border-red-800 shadow-md">
            <div className="flex items-center justify-center">
              <span className="text-xl mr-2">⚠️</span>
              <span>SECURITY BREACH DETECTED</span>
              <span className="text-xl ml-2">⚠️</span>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-red-800 font-bold">
              🔍 Intrusion Analysis: PARTIAL DETECTION
            </p>
            <p className="text-sm text-red-700">
              Your penetration methods have triggered automated logging systems.
            </p>
            <div className="bg-white p-2 border border-red-300 text-xs font-mono">
              LOG: Unusual port access patterns detected at {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="text-center space-y-3">
          <div className="bg-black text-green-400 p-3 font-mono text-sm border border-gray-600">
            <div className="flex justify-center items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              &gt; Mission parameters updated. Proceed to next objective...
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-[#c0c0c0] border-2 border-outset px-8 py-3 font-bold hover:bg-[#e0e0e0] active:border-inset transition-all duration-100 shadow-md"
          >
            🚀 CONTINUE MISSION
          </button>
          <div className="text-xs text-gray-600">
            Intelligence downloaded successfully
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "failed") {
    return (
      <div className="w-full h-full bg-[#c0c0c0] p-4 overflow-auto">
        {/* Terminal failure header */}
        <div className="bg-black text-red-400 p-4 mb-4 border-2 border-inset font-mono">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2 animate-pulse">
              === MISSION COMPROMISED ===
            </div>
            <div className="flex justify-center items-center mb-2">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-2 animate-ping"></div>
              <span>SECURITY SYSTEMS ACTIVATED</span>
              <div className="w-3 h-3 bg-red-400 rounded-full ml-2 animate-ping"></div>
            </div>
            <div className="text-sm opacity-75 text-orange-400">
              Connection terminated - Too many detection events
            </div>
          </div>
        </div>
        
        {/* Failure analysis */}
        <div className="bg-white p-4 border-2 border-inset mb-4 shadow-[inset_-2px_-2px_#000,inset_2px_2px_#fff]">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Mission failure details */}
            <div className="bg-red-50 p-4 border-2 border-red-400">
              <h3 className="font-bold text-red-800 mb-3 text-center border-b border-red-300 pb-2">
                ❌ MISSION FAILED
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Final Score:</span>
                  <span className="bg-gray-200 px-2 py-1 rounded font-bold">{score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Detection Events:</span>
                  <span className="text-red-600 font-bold">MAXIMUM REACHED</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Breach Level:</span>
                  <span className="text-orange-600 font-bold">INCOMPLETE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Status:</span>
                  <span className="text-red-600 font-bold">DISCONNECTED</span>
                </div>
              </div>
            </div>

            {/* Security response display */}
            <div className="bg-gray-900 text-red-400 p-4 border-2 border-gray-600 font-mono text-sm">
              <div className="border-b border-red-400 pb-2 mb-3">
                <h4 className="font-bold">🚨 SECURITY RESPONSE LOG</h4>
              </div>
              <div className="space-y-1">
                <div className="text-yellow-400">
                  [ALERT] Multiple failed access attempts
                </div>
                <div className="text-orange-400">
                  [WARN] Suspicious pattern recognition
                </div>
                <div className="text-red-400">
                  [CRIT] Intrusion attempt blocked
                </div>
                <div className="text-red-600">
                  [FAIL] Connection terminated
                </div>
                <div className="mt-3 pt-2 border-t border-red-400">
                  <div className="text-white">
                    &gt; Firewall integrity: MAINTAINED
                  </div>
                  <div className="text-red-400">
                    &gt; Trace initiated: IP LOGGED
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security lockdown warning */}
        <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-600 p-4 mb-4 shadow-lg">
          <div className="bg-orange-600 text-white p-3 text-center font-bold mb-3 border border-orange-800 shadow-md">
            <div className="flex items-center justify-center">
              <span className="text-xl mr-2">🔒</span>
              <span>SECURITY LOCKDOWN INITIATED</span>
              <span className="text-xl ml-2">🔒</span>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-orange-800 font-bold">
              🛡️ Defense Systems: FULLY ACTIVATED
            </p>
            <p className="text-sm text-orange-700">
              Your access attempts have been logged and traced by automated security protocols.
            </p>
            <div className="bg-white p-2 border border-orange-300 text-xs font-mono">
              TRACE: Source IP flagged for enhanced monitoring
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="text-center space-y-3">
          <div className="bg-black text-orange-400 p-3 font-mono text-sm border border-gray-600">
            <div className="flex justify-center items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></div>
              &gt; Awaiting new approach strategy. Retry recommended...
            </div>
          </div>
          <button
            onClick={startGame}
            className="bg-[#c0c0c0] border-2 border-outset px-8 py-3 font-bold hover:bg-[#e0e0e0] active:border-inset transition-all duration-100 shadow-md"
          >
            🔄 RETRY MISSION
          </button>
          <div className="text-xs text-gray-600">
            Security protocols require strategy adjustment
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default NumberJumpingGame;
