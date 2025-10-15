"use client";

import React, { useState, useEffect, useCallback } from "react";
import GameDifficultyManager from "../hooks/useGameDifficulty";

interface Cell {
  revealed: boolean;
  mine: boolean;
  flagged: boolean;
  adjacentMines: number;
}

interface MinesweeperProps {
  onClose: () => void;
}

const Minesweeper: React.FC<MinesweeperProps> = ({ onClose }) => {
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [mineCount, setMineCount] = useState(10);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [faceState, setFaceState] = useState<"smile" | "wow" | "dead" | "cool">("smile");

  // Get difficulty configuration
  const getDifficultyConfig = useCallback(() => {
    const difficulty = GameDifficultyManager.getGlobalDifficulty();
    
    switch (difficulty) {
      case "easy":
        return { rows: 8, cols: 8, mines: 8 };
      case "normal":
        return { rows: 9, cols: 9, mines: 10 };
      case "hard":
        return { rows: 16, cols: 16, mines: 40 };
      case "nightmare":
        return { rows: 16, cols: 30, mines: 99 };
      default:
        return { rows: 9, cols: 9, mines: 10 };
    }
  }, []);

  // Initialize the grid
  useEffect(() => {
    const initializeGrid = () => {
      const config = getDifficultyConfig();
      const { rows, cols, mines } = config;
      
      // Create empty grid
      const newGrid: Cell[][] = Array(rows).fill(null).map(() => 
        Array(cols).fill(null).map(() => ({
          revealed: false,
          mine: false,
          flagged: false,
          adjacentMines: 0,
        }))
      );
      
      // Place mines randomly
      let minesPlaced = 0;
      while (minesPlaced < mines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        
        if (!newGrid[row][col].mine) {
          newGrid[row][col].mine = true;
          minesPlaced++;
        }
      }
      
      // Calculate adjacent mines
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (newGrid[row][col].mine) continue;
          
          let count = 0;
          for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
              if (r === 0 && c === 0) continue;
              
              const newRow = row + r;
              const newCol = col + c;
              
              if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                if (newGrid[newRow][newCol].mine) count++;
              }
            }
          }
          
          newGrid[row][col].adjacentMines = count;
        }
      }
      
      setGrid(newGrid);
      setMineCount(mines);
      setTimer(0);
      setGameState("playing");
      setGameStarted(false);
      setFaceState("smile");
    };

    initializeGrid();
  }, [getDifficultyConfig]);

  // Separate initializeGrid function for reset button
  const initializeGrid = () => {
    const config = getDifficultyConfig();
    const { rows, cols, mines } = config;
    
    // Create empty grid
    const newGrid: Cell[][] = Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => ({
        revealed: false,
        mine: false,
        flagged: false,
        adjacentMines: 0,
      }))
    );
    
    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      if (!newGrid[row][col].mine) {
        newGrid[row][col].mine = true;
        minesPlaced++;
      }
    }
    
    // Calculate adjacent mines
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (newGrid[row][col].mine) continue;
        
        let count = 0;
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            if (r === 0 && c === 0) continue;
            
            const newRow = row + r;
            const newCol = col + c;
            
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
              if (newGrid[newRow][newCol].mine) count++;
            }
          }
        }
        
        newGrid[row][col].adjacentMines = count;
      }
    }
    
    setGrid(newGrid);
    setMineCount(mines);
    setTimer(0);
    setGameState("playing");
    setGameStarted(false);
    setFaceState("smile");
  };
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (gameStarted && gameState === "playing") {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev >= 999) {
            clearInterval(interval as NodeJS.Timeout);
            return 999;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStarted, gameState]);
  
  const revealCell = (row: number, col: number) => {
    if (gameState !== "playing" || grid[row][col].revealed || grid[row][col].flagged) return;
    
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    const newGrid = [...grid];
    const config = getDifficultyConfig();
    
    // If it's a mine, game over
    if (newGrid[row][col].mine) {
      // Reveal all mines
      for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
          if (newGrid[r][c].mine) {
            newGrid[r][c].revealed = true;
          }
        }
      }
      setGameState("lost");
      setFaceState("dead");
      return;
    }
    
    // Reveal current cell
    revealCellRecursive(newGrid, row, col);
    
    // Check if player won
    const allNonMinesCellsRevealed = newGrid.every((row) =>
      row.every((cell) => cell.revealed || cell.mine)
    );
    
    if (allNonMinesCellsRevealed) {
      setGameState("won");
      setFaceState("cool");
      
      // Flag all mines
      for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
          if (newGrid[r][c].mine) {
            newGrid[r][c].flagged = true;
          }
        }
      }
      
      setMineCount(0);
    }
    
    setGrid(newGrid);
  };
  
  // Recursive function to reveal cells (for empty cells)
  const revealCellRecursive = (grid: Cell[][], row: number, col: number) => {
    const config = getDifficultyConfig();
    if (
      row < 0 || row >= config.rows || 
      col < 0 || col >= config.cols || 
      grid[row][col].revealed || 
      grid[row][col].flagged
    ) {
      return;
    }
    
    grid[row][col].revealed = true;
    
    // If it's an empty cell, reveal adjacent cells
    if (grid[row][col].adjacentMines === 0) {
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          revealCellRecursive(grid, row + r, col + c);
        }
      }
    }
  };
  
  const toggleFlag = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent context menu
    
    if (gameState !== "playing" || grid[row][col].revealed) return;
    
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    const newGrid = [...grid];
    newGrid[row][col].flagged = !newGrid[row][col].flagged;
    setGrid(newGrid);
    
    // Update mine count
    const config = getDifficultyConfig();
    const flaggedCount = newGrid.flat().filter(cell => cell.flagged).length;
    setMineCount(config.mines - flaggedCount);
  };
  
  const handleMouseDown = () => {
    if (gameState === "playing") {
      setFaceState("wow");
    }
  };
  
  const handleMouseUp = () => {
    if (gameState === "playing") {
      setFaceState("smile");
    }
  };
  
  // Format numbers for the displays
  const formatNumber = (num: number): string => {
    if (num < 0) return "-" + Math.min(Math.abs(num), 99).toString().padStart(2, "0");
    return Math.min(num, 999).toString().padStart(3, "0");
  };

  // Get cell display
  const getCellContent = (cell: Cell) => {
    if (!cell.revealed) {
      if (cell.flagged) {
        return <div className="text-red-600 font-bold">🚩</div>;
      }
      return null;
    }
    
    if (cell.mine) {
      return <div className="text-black">💣</div>;
    }
    
    if (cell.adjacentMines === 0) {
      return null;
    }
    
    // Color map for numbers
    const colorMap = {
      1: 'text-blue-700',
      2: 'text-green-700',
      3: 'text-red-700',
      4: 'text-blue-900',
      5: 'text-red-900',
      6: 'text-teal-700',
      7: 'text-black',
      8: 'text-gray-700',
    };
    
    return (
      <div className={`font-bold ${colorMap[cell.adjacentMines as keyof typeof colorMap]}`}>
        {cell.adjacentMines}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#c0c0c0] text-black">
      {/* Toolbar */}
      <div className="w-full flex items-center bg-[#c0c0c0] border-b border-b-[#808080] p-1">
        <div className="flex-1"></div>
        <button 
          className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={onClose}
        >
          <span className="text-xs">Close</span>
        </button>
      </div>

      {/* Game header with mine counter, face button, and timer */}
      <div className="p-2 flex justify-between items-center bg-[#c0c0c0]">
        {/* Mine Counter Display */}
        <div className="bg-black text-red-600 font-digital px-1 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff]">
          <span className="font-mono text-xl font-bold">{formatNumber(mineCount)}</span>
        </div>
        
        {/* Reset Button */}
        <button 
          className="w-8 h-8 flex items-center justify-center bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={initializeGrid}
        >
          <span className="text-xl" role="img" aria-label="reset">
            {faceState === "smile" && "🙂"}
            {faceState === "wow" && "😮"}
            {faceState === "dead" && "😵"}
            {faceState === "cool" && "😎"}
          </span>
        </button>
        
        {/* Timer Display */}
        <div className="bg-black text-red-600 font-digital px-1 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff]">
          <span className="font-mono text-xl font-bold">{formatNumber(timer)}</span>
        </div>
      </div>
      
      {/* Game grid */}
      <div className="flex-1 p-3 flex items-center justify-center">
        <div 
          className="grid gap-0 border-4 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff]"
          style={{
            gridTemplateColumns: `repeat(${getDifficultyConfig().cols}, minmax(16px, 1fr))`,
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {grid.map((row, rowIndex) => 
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`w-6 h-6 flex items-center justify-center text-sm ${
                  cell.revealed 
                    ? "bg-[#c0c0c0] border border-[#808080]"
                    : "bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
                }`}
                onClick={() => revealCell(rowIndex, colIndex)}
                onContextMenu={(e) => toggleFlag(rowIndex, colIndex, e)}
                disabled={gameState !== "playing" || cell.revealed}
              >
                {getCellContent(cell)}
              </button>
            ))
          )}
        </div>
      </div>
      
      {/* Game information */}
      <div className="p-2 text-xs text-center">
        {gameState === "won" && "You won! Click the face to play again."}
        {gameState === "lost" && "Game over! Click the face to try again."}
        {gameState === "playing" && "Left click to reveal, right click to flag."}
      </div>
    </div>
  );
};

export default Minesweeper;
