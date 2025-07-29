"use client";

import React, { useState, useEffect, useCallback } from "react";

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

  // Sound effects
  const playSound = useCallback((sound: string) => {
    try {
      const audio = new Audio(`/hackbook-w95/sounds/${sound}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play failed:", e));
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
  const validateSequence = useCallback((sequence: number[], pattern: Pattern): boolean => {
    if (sequence.length === 0) return false;
    
    switch (pattern) {
      case "multiples":
        const multiplier = 3 + currentLevel;
        return sequence.every(num => num % multiplier === 0);
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
  }, [currentLevel]);

  // Generate target sequence based on pattern
  const generateTargetSequence = useCallback((grid: GridCell[][], pattern: Pattern): number[] => {
    const flatGrid = grid.flat();
    
    switch (pattern) {
      case "prime":
        const primes = generatePrimes(99);
        return flatGrid
          .filter(cell => primes.includes(cell.value) && !cell.isTrap)
          .map(cell => cell.value)
          .sort((a, b) => a - b)
          .slice(0, Math.min(5, currentLevel + 2));
          
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
          
      case "multiples":
        const multiplier = 3 + currentLevel;
        
        const availableMultiples = flatGrid
          .filter(cell => !cell.isTrap && cell.value % multiplier === 0 && cell.value > 0)
          .map(cell => cell.value)
          .sort((a, b) => a - b);
        
        // If we don't have enough positive multiples, include 0 if it exists
        if (availableMultiples.length < 2) {
          const allMultiples = flatGrid
            .filter(cell => !cell.isTrap && cell.value % multiplier === 0)
            .map(cell => cell.value)
            .sort((a, b) => a - b);
          
          // Only return if we have at least 2 valid multiples
          if (allMultiples.length >= 2) {
            return allMultiples.slice(0, Math.min(4, currentLevel + 2));
          } else {
            return []; // Return empty array to trigger pattern change
          }
        }
        
        return availableMultiples.slice(0, Math.min(4, currentLevel + 2));
          
      case "diagonal":
        const diagonal = [];
        for (let i = 0; i < Math.min(grid.length, grid[0].length); i++) {
          if (!grid[i][i].isTrap) {
            diagonal.push(grid[i][i].value);
          }
        }
        return diagonal.slice(0, Math.min(4, currentLevel + 2));
        
      case "l-shape":
        const lShape = [];
        // L-shape: first row, then last column
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
        
      default:
        return [];
    }
  }, [currentLevel]);

  // Initialize game level
  const initializeLevel = useCallback(() => {
    const gridSize = Math.min(6, 4 + Math.floor(currentLevel / 2));
    const patterns: Pattern[] = ["prime", "ascending", "descending", "multiples", "diagonal", "l-shape"];
    let selectedPattern = patterns[Math.floor(Math.random() * Math.min(patterns.length, 2 + currentLevel))];
    
    let newGrid;
    let newTarget;
    let attempts = 0;
    let finalPattern = selectedPattern;
    
    // Ensure we generate a valid puzzle
    do {
      newGrid = generateGrid(gridSize);
      newTarget = generateTargetSequence(newGrid, selectedPattern);
      attempts++;
      
      // Validate that the sequence actually matches the pattern
      const isValid = validateSequence(newTarget, selectedPattern);
      
      // If the current pattern doesn't work or validation fails, try a different one
      if ((newTarget.length < 2 || !isValid) && attempts < 10) {
        selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
      }
    } while ((newTarget.length < 2 || !validateSequence(newTarget, selectedPattern)) && attempts < 10);
    
    // If we still can't generate a good puzzle, fall back to ascending pattern
    if (newTarget.length < 2 || !validateSequence(newTarget, selectedPattern)) {
      finalPattern = "ascending";
      newTarget = generateTargetSequence(newGrid, finalPattern);
    } else {
      finalPattern = selectedPattern;
    }
    
    setCurrentPattern(finalPattern);
    
    setGrid(newGrid);
    setTargetSequence(newTarget);
    setSelectedCells([]);
    setErrorMessage("");
    setShowPipeline(false);
    setPipelineProgress(0);
  }, [currentLevel, generateGrid, generateTargetSequence, validateSequence]);

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
        
        if (currentLevel >= 5) {
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
    const multiplier = 3 + currentLevel;
    switch (pattern) {
      case "prime": return "Select all prime numbers in ascending order";
      case "ascending": return "Select numbers in ascending order";
      case "descending": return "Select numbers in descending order";
      case "multiples": return `Select multiples of ${multiplier} in ascending order`;
      case "diagonal": return "Select numbers along the main diagonal";
      case "l-shape": return "Select numbers in an L-shape pattern";
      default: return "";
    }
  };

  if (gameState === "intro") {
    return (
      <div className="w-full h-full bg-[#c0c0c0] p-4 overflow-auto">
        <div className="bg-[#000080] text-white p-2 mb-4 text-center">
          <h2 className="text-lg font-bold">FIREWALL BYPASS PROTOCOL</h2>
        </div>
        
        <div className="mb-4 p-4 border-2 border-inset bg-white">
          <h3 className="font-bold text-red-600 mb-2">⚠️ CLASSIFIED OPERATION</h3>
          <p className="mb-2">
            <strong>Objective:</strong> Navigate through ShadowByte&apos;s security firewalls using stealth protocols.
          </p>
          <p className="mb-2">
            <strong>Method:</strong> Identify correct data packet sequences to create secure tunnels through firewall gaps.
          </p>
          <p className="mb-4">
            <strong>Warning:</strong> Incorrect selections will trigger security alarms. You have 3 attempts before detection.
          </p>
          
          <div className="bg-yellow-100 p-2 border border-yellow-600 mb-4">
            <h4 className="font-bold">How to Play:</h4>
            <ul className="list-disc ml-4 text-sm">
              <li>Each level presents a grid of numbers representing network ports</li>
              <li>Follow the pattern instructions to select the correct sequence</li>
              <li>Avoid red numbers - they are security traps!</li>
              <li>Complete the data pipeline to breach each firewall layer</li>
            </ul>
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={startGame}
            className="bg-[#c0c0c0] border-2 border-outset px-6 py-2 font-bold hover:bg-[#e0e0e0]"
          >
            INITIATE BREACH PROTOCOL
          </button>
        </div>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="w-full h-full bg-[#c0c0c0] p-2 overflow-auto">
        {/* Header */}
        <div className="bg-[#000080] text-white p-2 mb-2 flex justify-between items-center">
          <h2 className="text-sm font-bold">FIREWALL BREACH - LEVEL {currentLevel}</h2>
          <div className="flex gap-4 text-sm">
            <span>Lives: {lives}</span>
            <span>Score: {score}</span>
          </div>
        </div>

        {/* Pattern instruction */}
        <div className="bg-yellow-100 p-2 border border-yellow-600 mb-2 text-sm">
          <strong>Current Pattern:</strong> {getPatternDescription(currentPattern)}
        </div>

        {/* Target sequence display */}
        <div className="bg-white p-2 border-2 border-inset mb-2">
          <div className="text-sm font-bold mb-1">Target Sequence:</div>
          <div className="flex gap-1">
            {targetSequence.map((num, index) => (
              <div
                key={index}
                className={`w-8 h-8 border flex items-center justify-center text-xs ${
                  index < selectedCells.length 
                    ? "bg-green-200 border-green-600" 
                    : "bg-gray-100 border-gray-400"
                }`}
              >
                {index < selectedCells.length ? num : "?"}
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline progress */}
        {showPipeline && (
          <div className="bg-white p-2 border-2 border-inset mb-2">
            <div className="text-sm font-bold mb-1">Data Pipeline Progress:</div>
            <div className="w-full bg-gray-300 h-4 border border-gray-600">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${pipelineProgress}%` }}
              />
            </div>
            <div className="text-xs text-center mt-1">{Math.round(pipelineProgress)}%</div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-500 text-white p-2 mb-2 text-center font-bold animate-pulse">
            {errorMessage}
          </div>
        )}

        {/* Game grid */}
        <div className="flex justify-center mb-4">
          <div 
            className="grid gap-1 p-2 bg-black border-2 border-gray-600"
            style={{ 
              gridTemplateColumns: `repeat(${grid.length}, 1fr)`,
              maxWidth: "400px"
            }}
          >
            {grid.flat().map((cell, index) => (
              <button
                key={index}
                onClick={() => handleCellClick(cell)}
                className={`
                  w-12 h-12 border-2 text-sm font-bold transition-all duration-200
                  ${cell.isTrap 
                    ? "bg-red-400 border-red-600 text-white" 
                    : cell.isCorrect
                    ? "bg-green-400 border-green-600 text-white"
                    : cell.isSelected
                    ? "bg-blue-400 border-blue-600 text-white"
                    : "bg-gray-200 border-gray-400 hover:bg-gray-300"
                  }
                `}
                disabled={cell.isSelected}
              >
                {cell.value}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "success") {
    return (
      <div className="w-full h-full bg-[#c0c0c0] p-4">
        <div className="bg-[#008000] text-white p-3 mb-4 text-center">
          <h2 className="text-lg font-bold">FIREWALL BREACHED!</h2>
          <p>Establishing Connection...</p>
        </div>
        
        <div className="bg-white p-4 border-2 border-inset mb-4">
          <p className="text-green-600 font-bold mb-2">✓ All firewall layers bypassed successfully!</p>
          <p className="mb-2">Final Score: {score}</p>
          <p className="mb-4">Remote access established to target system...</p>
          
          <div className="bg-gray-100 p-3 border border-gray-400">
            <h4 className="font-bold mb-2">📁 Remote File Directory Access</h4>
            <div className="text-sm font-mono">
              <div>C:\SHADOWBYTE\</div>
              <div>├── Documents\</div>
              <div>├── Projects\</div>
              <div>├── System\</div>
              <div>└── Logs\</div>
            </div>
          </div>
        </div>

        {/* Security breach warning */}
        <div className="bg-red-100 border-2 border-red-600 p-3 mb-4 animate-pulse">
          <div className="bg-red-600 text-white p-2 text-center font-bold mb-2">
            ⚠️ SECURITY BREACH DETECTED ⚠️
          </div>
          <p className="text-red-800 font-bold text-center">
            Brute Force Attempts Registered. System Logged.
          </p>
          <p className="text-sm text-center mt-2">
            Warning: Your intrusion methods have been partially detected.
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-[#c0c0c0] border-2 border-outset px-6 py-2 font-bold hover:bg-[#e0e0e0]"
          >
            CONTINUE MISSION
          </button>
        </div>
      </div>
    );
  }

  if (gameState === "failed") {
    return (
      <div className="w-full h-full bg-[#c0c0c0] p-4">
        <div className="bg-[#800000] text-white p-3 mb-4 text-center">
          <h2 className="text-lg font-bold">MISSION FAILED</h2>
          <p>Security systems activated!</p>
        </div>
        
        <div className="bg-white p-4 border-2 border-inset mb-4 text-center">
          <p className="text-red-600 font-bold mb-2">⚠️ Too many security alarms triggered!</p>
          <p className="mb-2">Your attempts have been logged and traced.</p>
          <p className="mb-4">Final Score: {score}</p>
        </div>

        <div className="text-center">
          <button
            onClick={startGame}
            className="bg-[#c0c0c0] border-2 border-outset px-4 py-2 mr-2 hover:bg-[#e0e0e0]"
          >
            RETRY MISSION
          </button>
          <button
            onClick={onClose}
            className="bg-[#c0c0c0] border-2 border-outset px-4 py-2 hover:bg-[#e0e0e0]"
          >
            ABORT
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default NumberJumpingGame;
