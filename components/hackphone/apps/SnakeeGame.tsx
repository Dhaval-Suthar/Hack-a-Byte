"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

// Constants and pure helpers (module scope to keep stable identities)
const GRID_RADIUS = 9;
const DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

const hexToPixel = (q: number, r: number, size: number) => {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const y = size * (3 / 2) * r;
  return { x, y };
};

const coordKey = (c: { q: number; r: number }) => `${c.q},${c.r}`;

const axialWrap = (q: number, r: number) => {
  let x = q,
    z = r,
    y = -x - z;
  const span = 2 * GRID_RADIUS + 1;
  x = ((x + GRID_RADIUS) % span + span) % span - GRID_RADIUS;
  y = ((y + GRID_RADIUS) % span + span) % span - GRID_RADIUS;
  z = -x - y;
  return { q: x, r: z };
};

const allCells = () => {
  const cells: Array<{ q: number; r: number }> = [];
  for (let q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
    const r1 = Math.max(-GRID_RADIUS, -q - GRID_RADIUS);
    const r2 = Math.min(GRID_RADIUS, -q + GRID_RADIUS);
    for (let r = r1; r <= r2; r++) {
      cells.push({ q, r });
    }
  }
  return cells;
};

const randomEmptyCell = (excludeSet: Set<string>) => {
  const cells = allCells().filter((c) => !excludeSet.has(coordKey(c)));
  return cells.length ? cells[Math.floor(Math.random() * cells.length)] : null;
};

const drawHexPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = x + size * Math.cos(angle);
    const py = y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
};

interface SnakeeGameProps {
  onClose: () => void;
  time: Date;
}

const SnakeeGame: React.FC<SnakeeGameProps> = ({ onClose, time }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStatus, setGameStatus] = useState("Menu");
  const [level, setLevel] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const gameStateRef = useRef({
    snake: [] as Array<{q: number, r: number}>,
    dirIndex: 0,
    targetDir: 0,
    food: null as {q: number, r: number, type: string, spawnAt: number} | null,
    moveTimer: null as NodeJS.Timeout | null,
    animationId: null as number | null
  });

  // (HEX_BASE) removed as unused

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('hexHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Hex coordinate utilities moved to module scope above

  const placeFood = useCallback(() => {
    const exclude = new Set(gameStateRef.current.snake.map(coordKey));
    const base = randomEmptyCell(exclude);
    if (!base) {
      gameStateRef.current.food = null;
      return;
    }
    
    const roll = Math.random();
    let type = 'normal';
    const goldenChance = Math.min(0.08 + level * 0.02, 0.20);
    const poisonChance = Math.min(0.05 + level * 0.015, 0.15);
    
    if (roll < goldenChance) {
      type = 'golden';
    } else if (roll < goldenChance + poisonChance) {
      type = 'poison';
    }
    
    gameStateRef.current.food = { 
      q: base.q, 
      r: base.r, 
      type, 
      spawnAt: Date.now() / 1000 
    };
  }, [level]);

  const initGame = useCallback(() => {
    gameStateRef.current.snake = [{q:0,r:0}, {q:-1,r:1}, {q:-2,r:2}];
    gameStateRef.current.dirIndex = 0;
    gameStateRef.current.targetDir = 0;
    setScore(0);
    setLevel(1);
    setGameStatus("Menu");
    setIsRunning(false);
    placeFood();
    
    if (gameStateRef.current.moveTimer) {
      clearInterval(gameStateRef.current.moveTimer);
      gameStateRef.current.moveTimer = null;
    }
  }, [placeFood]);

  const gameOver = useCallback(() => {
    setIsRunning(false);
    setGameStatus("GAME OVER");
    if (gameStateRef.current.moveTimer) {
      clearInterval(gameStateRef.current.moveTimer);
      gameStateRef.current.moveTimer = null;
    }
    
    // Add screen shake effect for game over
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        if (canvas) canvas.style.animation = '';
      }, 500);
    }
    
    setTimeout(() => initGame(), 3000);
  }, [initGame]);

  const tickMove = useCallback(() => {
    if (!isRunning) return;
    
    const state = gameStateRef.current;
    if ((state.targetDir + 3) % 6 !== state.dirIndex) {
      state.dirIndex = state.targetDir;
    }
    
    const head = state.snake[state.snake.length - 1];
    const d = DIRECTIONS[state.dirIndex];
    let newHead = { q: head.q + d.q, r: head.r + d.r };
    newHead = axialWrap(newHead.q, newHead.r);

    // Check self collision
    if (state.snake.some(s => s.q === newHead.q && s.r === newHead.r)) {
      gameOver();
      return;
    }

    state.snake.push(newHead);

    // Check food collision
    if (state.food && state.food.q === newHead.q && state.food.r === newHead.r) {
      let points = 1;
      let shouldGrow = true;
      
      switch (state.food.type) {
        case 'golden':
          points = 2;
          // Golden apple: double growth (add extra segment)
          state.snake.push({...newHead});
          break;
        case 'poison':
          points = -1;
          shouldGrow = false;
          // Poison apple: shrink by removing 2 segments if possible
          if (state.snake.length > 3) {
            state.snake.shift();
            state.snake.shift();
          }
          break;
        case 'normal':
        default:
          points = 1;
          break;
      }
      
      setScore(prev => {
        const newScore = Math.max(0, prev + points);
        const newLevel = 1 + Math.floor(newScore / 6);
        setLevel(newLevel);
        
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('hexHighScore', newScore.toString());
        }
        return newScore;
      });
      
      placeFood();
      
      // Only remove tail if it's normal food or if we didn't shrink from poison
      if (!shouldGrow || state.food.type === 'normal') {
        // For normal food, don't remove tail (grow)
        // For poison, we already handled shrinking above
      }
    } else {
      // No food eaten, remove tail (normal movement)
      state.snake.shift();
    }
  }, [isRunning, highScore, placeFood, gameOver]);

  const startGame = () => {
    if (isRunning) return;
    setIsRunning(true);
    setGameStatus("Running");
    
    const moveMs = 1000 / speed;
    if (gameStateRef.current.moveTimer) {
      clearInterval(gameStateRef.current.moveTimer);
    }
    gameStateRef.current.moveTimer = setInterval(tickMove, moveMs);
  };

  const pauseGame = () => {
    setIsRunning(false);
    setGameStatus("Paused");
    if (gameStateRef.current.moveTimer) {
      clearInterval(gameStateRef.current.moveTimer);
      gameStateRef.current.moveTimer = null;
    }
  };

  const setDirection = (idx: number) => {
    if ((idx + 3) % 6 === gameStateRef.current.dirIndex) return;
    gameStateRef.current.targetDir = idx;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Create retro scanline effect background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0a0a0a');
    bgGradient.addColorStop(0.5, '#1a1a2e');
    bgGradient.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add scanlines for retro CRT effect
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 4) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const hexSize = Math.min(width, height) / (GRID_RADIUS * 4);

    // Draw retro grid with neon glow effect
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    allCells().forEach(cell => {
      const pixel = hexToPixel(cell.q, cell.r, hexSize);
      drawHexPath(ctx, centerX + pixel.x, centerY + pixel.y, hexSize);
      ctx.stroke();
    });

    // Draw snake with retro neon glow
    gameStateRef.current.snake.forEach((segment, index) => {
      const pixel = hexToPixel(segment.q, segment.r, hexSize);
      const x = centerX + pixel.x;
      const y = centerY + pixel.y;
      
      drawHexPath(ctx, x, y, hexSize * 0.9);
      
      if (index === gameStateRef.current.snake.length - 1) {
        // Head - bright neon green with glow
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 15;
        
        const headGradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize);
        headGradient.addColorStop(0, '#00ff41');
        headGradient.addColorStop(0.7, '#00cc33');
        headGradient.addColorStop(1, '#008822');
        ctx.fillStyle = headGradient;
        ctx.fill();
        
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Body - neon green with trailing glow
        const bodyAlpha = Math.max(0.3, 1 - (gameStateRef.current.snake.length - index) * 0.1);
        ctx.shadowColor = '#00cc33';
        ctx.shadowBlur = 8;
        
        const bodyGradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize);
        bodyGradient.addColorStop(0, `rgba(0, 204, 51, ${bodyAlpha})`);
        bodyGradient.addColorStop(0.7, `rgba(0, 136, 34, ${bodyAlpha})`);
        bodyGradient.addColorStop(1, `rgba(0, 102, 26, ${bodyAlpha * 0.8})`);
        ctx.fillStyle = bodyGradient;
        ctx.fill();
        
        ctx.strokeStyle = `rgba(0, 204, 51, ${bodyAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Draw food with pulsing effect and different appearances
    if (gameStateRef.current.food) {
      const pixel = hexToPixel(gameStateRef.current.food.q, gameStateRef.current.food.r, hexSize);
      const x = centerX + pixel.x;
      const y = centerY + pixel.y;
      
      // Pulsing animation
      const pulseScale = 0.7 + Math.sin(Date.now() * 0.008) * 0.2;
      
      drawHexPath(ctx, x, y, hexSize * pulseScale);
      
      if (gameStateRef.current.food.type === 'golden') {
        // Golden apple - bright gold with intense glow
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 25;
        
        const goldGradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize);
        goldGradient.addColorStop(0, '#ffff00');
        goldGradient.addColorStop(0.3, '#ffd700');
        goldGradient.addColorStop(0.7, '#ffb300');
        goldGradient.addColorStop(1, '#ff8f00');
        ctx.fillStyle = goldGradient;
        ctx.fill();
        
        // Add sparkle effect
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#ffff88';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw apple symbol in center
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = `${hexSize * 0.6}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍎', x, y);
        
      } else if (gameStateRef.current.food.type === 'poison') {
        // Poison apple - dark purple/red with ominous glow
        ctx.shadowColor = '#8b0000';
        ctx.shadowBlur = 20;
        
        const poisonGradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize);
        poisonGradient.addColorStop(0, '#4b0082');
        poisonGradient.addColorStop(0.3, '#800080');
        poisonGradient.addColorStop(0.7, '#8b0000');
        poisonGradient.addColorStop(1, '#2f0000');
        ctx.fillStyle = poisonGradient;
        ctx.fill();
        
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw skull symbol in center
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = `${hexSize * 0.5}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠️', x, y);
        
      } else {
        // Normal food - red apple
        ctx.shadowColor = '#ff073a';
        ctx.shadowBlur = 15;
        
        const redGradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize);
        redGradient.addColorStop(0, '#ff4757');
        redGradient.addColorStop(0.5, '#ff073a');
        redGradient.addColorStop(1, '#c44569');
        ctx.fillStyle = redGradient;
        ctx.fill();
        
        ctx.strokeStyle = '#ff6b7a';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw apple symbol
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = `${hexSize * 0.6}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍎', x, y);
      }
    }

    // Reset shadow
    ctx.shadowBlur = 0;
    gameStateRef.current.animationId = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    initGame();
    draw();
    // Copy ref to a local variable so cleanup doesn't access a potentially changed ref
    const stateAtMount = gameStateRef.current;
    return () => {
      if (stateAtMount.moveTimer) {
        clearInterval(stateAtMount.moveTimer);
      }
      if (stateAtMount.animationId) {
        cancelAnimationFrame(stateAtMount.animationId);
      }
    };
  }, [initGame, draw]);

  useEffect(() => {
    if (isRunning) {
      if (gameStateRef.current.moveTimer) {
        clearInterval(gameStateRef.current.moveTimer);
      }
      const moveMs = 1000 / speed;
      gameStateRef.current.moveTimer = setInterval(tickMove, moveMs);
    }
  }, [speed, isRunning, tickMove]);

  // Touch event handlers for swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;
    
    // Check if swipe is long enough
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      touchStartRef.current = null;
      return;
    }
    
    // Determine swipe direction in hex coordinates
    // Convert screen coordinates to hex directions
    let direction = -1;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        direction = 0; // East
      } else {
        direction = 3; // West
      }
    } else {
      // Vertical or diagonal swipe
      if (deltaY < 0) {
        // Upward swipe
        if (deltaX > 0) {
          direction = 1; // Northeast
        } else {
          direction = 2; // Northwest
        }
      } else {
        // Downward swipe
        if (deltaX > 0) {
          direction = 5; // Southeast
        } else {
          direction = 4; // Southwest
        }
      }
    }
    
    if (direction >= 0) {
      setDirection(direction);
      if (!isRunning) {
        startGame();
      }
    }
    
    touchStartRef.current = null;
  };

  // Tutorial content
  const renderTutorial = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/50 rounded-lg p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-cyan-400 font-mono mb-2">HOW TO PLAY</h2>
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        </div>
        
        <div className="space-y-4 text-sm">
          <div className="bg-black/50 border border-green-500/30 rounded p-3">
            <h3 className="text-green-400 font-mono font-bold mb-2">🎯 OBJECTIVE</h3>
            <p className="text-green-200 font-mono text-xs">
              Control the snake to eat food and grow longer. Avoid hitting yourself!
            </p>
          </div>
          
          <div className="bg-black/50 border border-blue-500/30 rounded p-3">
            <h3 className="text-blue-400 font-mono font-bold mb-2">📱 CONTROLS</h3>
            <div className="text-blue-200 font-mono text-xs space-y-1">
              <p>• SWIPE on the game area to change direction</p>
              <p>• Or use the direction buttons below</p>
              <p>• 6 directions: NW, NE, E, W, SW, SE</p>
            </div>
          </div>
          
          <div className="bg-black/50 border border-yellow-500/30 rounded p-3">
            <h3 className="text-yellow-400 font-mono font-bold mb-2">🍎 FOOD TYPES</h3>
            <div className="text-yellow-200 font-mono text-xs space-y-1">
              <p>🍎 <span className="text-red-400">RED APPLE</span>: +1 point, grow by 1</p>
              <p>🍎 <span className="text-yellow-400">GOLDEN APPLE</span>: +2 points, grow by 2</p>
              <p>☠️ <span className="text-purple-400">POISON APPLE</span>: -1 point, shrink by 2</p>
            </div>
          </div>
          
          <div className="bg-black/50 border border-purple-500/30 rounded p-3">
            <h3 className="text-purple-400 font-mono font-bold mb-2">⚡ TIPS</h3>
            <div className="text-purple-200 font-mono text-xs space-y-1">
              <p>• Level increases every 6 points</p>
              <p>• Higher levels = more special food</p>
              <p>• Be careful with poison apples!</p>
              <p>• The snake wraps around edges</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowTutorial(false)}
          className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-3 rounded font-mono font-bold border border-cyan-400/50 transition-all duration-200"
        >
          GOT IT!
        </button>
      </div>
    </div>
  );

  // Description content
  const renderDescription = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/50 rounded-lg p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-cyan-400 font-mono mb-2">ABOUT SNAKEE</h2>
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        </div>
        
        <div className="space-y-4 text-sm">
          <div className="bg-black/50 border border-cyan-500/30 rounded p-3">
            <p className="text-cyan-200 font-mono text-xs leading-relaxed">
              Snakee is a retro-futuristic take on the classic Snake game, set in a hexagonal grid world. 
              Navigate through the neon-lit digital landscape as a cyber-snake seeking digital nutrition.
            </p>
          </div>
          
          <div className="bg-black/50 border border-green-500/30 rounded p-3">
            <h3 className="text-green-400 font-mono font-bold mb-2">🌟 FEATURES</h3>
            <div className="text-green-200 font-mono text-xs space-y-1">
              <p>• Hexagonal grid gameplay</p>
              <p>• Retro neon visual effects</p>
              <p>• Touch-optimized controls</p>
              <p>• Multiple food types</p>
              <p>• Progressive difficulty</p>
              <p>• Persistent high scores</p>
            </div>
          </div>
          
          <div className="bg-black/50 border border-purple-500/30 rounded p-3">
            <h3 className="text-purple-400 font-mono font-bold mb-2">🎮 GAME MODES</h3>
            <div className="text-purple-200 font-mono text-xs space-y-1">
              <p>• Classic endless mode</p>
              <p>• Increasing speed per level</p>
              <p>• Wraparound boundaries</p>
              <p>• Risk/reward food system</p>
            </div>
          </div>
          
          <div className="bg-black/50 border border-yellow-500/30 rounded p-3">
            <p className="text-yellow-200 font-mono text-xs text-center">
              &quot;In the digital realm, only the smartest snakes survive.&quot;
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowDescription(false)}
          className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-3 rounded font-mono font-bold border border-purple-400/50 transition-all duration-200"
        >
          CLOSE
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Retro background with animated grid */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20"></div>
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            animation: 'grid-move 20s linear infinite'
          }}
        ></div>
      </div>

      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, 20px); }
        }
        @keyframes neon-pulse {
          0%, 100% { 
            box-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff;
          }
          50% { 
            box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff;
          }
        }
        @keyframes retro-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #a855f7);
          border: 2px solid #c084fc;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #a855f7);
          border: 2px solid #c084fc;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }
      `}</style>

      {/* Status bar with retro styling */}
      <div className="flex justify-between items-center px-6 pt-12 pb-4 text-white text-sm relative z-10 bg-black/50 backdrop-blur-sm border-b border-cyan-500/30">
        <button 
          onClick={onClose} 
          className="text-cyan-400 text-sm font-mono hover:text-cyan-300 transition-colors duration-200 px-3 py-1 border border-cyan-500/50 rounded bg-black/30"
        >
          ← BACK
        </button>
        <div className="flex items-center space-x-3">
          <div className="text-green-400 font-mono text-xs animate-pulse">●</div>
          <span className="text-xs font-mono text-cyan-300">{formatTime(time)}</span>
          <div className="w-7 h-4 border border-cyan-400/60 rounded-sm relative bg-black/50">
            <div className="w-4 h-2 bg-green-400 rounded-sm m-0.5 animate-pulse" />
            <div className="w-0.5 h-1.5 bg-cyan-400/60 rounded-full absolute -right-1 top-1" />
          </div>
        </div>
      </div>

        {/* Game header */}
        <div className="text-center py-4 relative z-10">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 font-mono tracking-wider">
            SNAKEE
          </h1>
          <div className="text-cyan-300 text-xs font-mono mt-1 opacity-80">
            HEX GRID EDITION
          </div>
          
          {/* Tutorial and Description buttons */}
          <div className="flex gap-2 justify-center mt-3">
            <button
              onClick={() => setShowTutorial(true)}
              className="bg-blue-600/80 hover:bg-blue-500/80 text-white px-3 py-1 rounded text-xs font-mono border border-blue-400/50 transition-all duration-200"
            >
              📖 TUTORIAL
            </button>
            <button
              onClick={() => setShowDescription(true)}
              className="bg-purple-600/80 hover:bg-purple-500/80 text-white px-3 py-1 rounded text-xs font-mono border border-purple-400/50 transition-all duration-200"
            >
              ℹ️ ABOUT
            </button>
          </div>
        </div>      {/* Main game area */}
      <div className="flex-1 flex flex-col p-4 relative z-10">
        {/* Game canvas with retro border */}
        <div className="relative mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-green-500/20 rounded-lg blur-sm"></div>
          <canvas
            ref={canvasRef}
            width={320}
            height={380}
            className="relative bg-black rounded-lg border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20 touch-none"
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.3))'
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* Retro game stats panel */}
        <div className="bg-black/70 border border-cyan-500/50 rounded-lg p-4 mb-4 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="border border-green-500/30 rounded p-3 bg-green-500/5">
              <div className="text-green-400 font-mono text-2xl font-bold">{score.toLocaleString()}</div>
              <div className="text-green-300 text-xs font-mono">SCORE</div>
            </div>
            <div className="border border-yellow-500/30 rounded p-3 bg-yellow-500/5">
              <div className="text-yellow-400 font-mono text-2xl font-bold">{highScore.toLocaleString()}</div>
              <div className="text-yellow-300 text-xs font-mono">HIGH SCORE</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center mt-3">
            <div className="border border-blue-500/30 rounded p-2 bg-blue-500/5">
              <div className="text-blue-400 font-mono text-lg font-bold">LVL {level}</div>
              <div className="text-blue-300 text-xs font-mono">LEVEL</div>
            </div>
            <div className="border border-purple-500/30 rounded p-2 bg-purple-500/5">
              <div className={`font-mono text-lg font-bold ${
                gameStatus === 'Running' ? 'text-green-400 animate-pulse' :
                gameStatus === 'GAME OVER' ? 'text-red-400' :
                gameStatus === 'Paused' ? 'text-yellow-400' :
                'text-cyan-400'
              }`}>
                {gameStatus.toUpperCase()}
              </div>
              <div className="text-purple-300 text-xs font-mono">STATUS</div>
            </div>
          </div>
          
          {/* Food Legend */}
          <div className="mt-4 pt-3 border-t border-cyan-500/30">
            <div className="text-cyan-400 text-xs font-mono font-bold mb-2 text-center">FOOD TYPES</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="bg-red-500/10 border border-red-500/30 rounded p-1">
                <div className="text-red-400">🍎 +1</div>
                <div className="text-red-300 text-[10px]">NORMAL</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-1">
                <div className="text-yellow-400">🍎 +2</div>
                <div className="text-yellow-300 text-[10px]">GOLDEN</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded p-1">
                <div className="text-purple-400">☠️ -1</div>
                <div className="text-purple-300 text-[10px]">POISON</div>
              </div>
            </div>
          </div>
        </div>

        {/* Retro controls panel */}
        <div className="space-y-4">
          {/* Swipe instructions with retro terminal styling */}
          <div className="bg-black/80 border border-cyan-500/50 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <h3 className="text-cyan-400 text-sm font-mono font-bold tracking-wider">TOUCH CONTROLS</h3>
            </div>
            <p className="text-cyan-300 text-xs font-mono mb-3 opacity-90">
              &gt; SWIPE ON GAME GRID TO NAVIGATE
            </p>
            <div className="grid grid-cols-3 gap-1 text-xs font-mono text-center">
              <div className="text-cyan-300 p-1 border border-cyan-700/50 rounded bg-cyan-900/20">↖ NW</div>
              <div className="text-cyan-300 p-1 border border-cyan-700/50 rounded bg-cyan-900/20">↗ NE</div>
              <div className="text-cyan-300 p-1 border border-cyan-700/50 rounded bg-cyan-900/20">→ E</div>
              <div className="text-cyan-300 p-1 border border-cyan-700/50 rounded bg-cyan-900/20">← W</div>
              <div className="text-cyan-300 p-1 border border-cyan-700/50 rounded bg-cyan-900/20">↙ SW</div>
              <div className="text-cyan-300 p-1 border border-cyan-700/50 rounded bg-cyan-900/20">↘ SE</div>
            </div>
          </div>

          {/* Retro direction pad */}
          <div className="bg-black/80 border border-green-500/50 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <h3 className="text-green-400 text-sm font-mono font-bold tracking-wider">MANUAL CONTROLS</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              <div></div>
              <button 
                onClick={() => { setDirection(2); startGame(); }}
                className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white px-3 py-2 rounded font-mono text-sm font-bold border border-green-400/50 shadow-lg shadow-green-500/20 transition-all duration-200 hover:shadow-green-400/40"
                style={{ textShadow: '0 0 5px rgba(0, 255, 0, 0.5)' }}
              >
                NW
              </button>
              <button 
                onClick={() => { setDirection(1); startGame(); }}
                className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white px-3 py-2 rounded font-mono text-sm font-bold border border-green-400/50 shadow-lg shadow-green-500/20 transition-all duration-200 hover:shadow-green-400/40"
                style={{ textShadow: '0 0 5px rgba(0, 255, 0, 0.5)' }}
              >
                NE
              </button>
              
              <button 
                onClick={() => { setDirection(3); startGame(); }}
                className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white px-3 py-2 rounded font-mono text-sm font-bold border border-green-400/50 shadow-lg shadow-green-500/20 transition-all duration-200 hover:shadow-green-400/40"
                style={{ textShadow: '0 0 5px rgba(0, 255, 0, 0.5)' }}
              >
                W
              </button>
              <div></div>
              <button 
                onClick={() => { setDirection(0); startGame(); }}
                className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white px-3 py-2 rounded font-mono text-sm font-bold border border-green-400/50 shadow-lg shadow-green-500/20 transition-all duration-200 hover:shadow-green-400/40"
                style={{ textShadow: '0 0 5px rgba(0, 255, 0, 0.5)' }}
              >
                E
              </button>
              
              <div></div>
              <button 
                onClick={() => { setDirection(4); startGame(); }}
                className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white px-3 py-2 rounded font-mono text-sm font-bold border border-green-400/50 shadow-lg shadow-green-500/20 transition-all duration-200 hover:shadow-green-400/40"
                style={{ textShadow: '0 0 5px rgba(0, 255, 0, 0.5)' }}
              >
                SW
              </button>
              <button 
                onClick={() => { setDirection(5); startGame(); }}
                className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white px-3 py-2 rounded font-mono text-sm font-bold border border-green-400/50 shadow-lg shadow-green-500/20 transition-all duration-200 hover:shadow-green-400/40"
                style={{ textShadow: '0 0 5px rgba(0, 255, 0, 0.5)' }}
              >
                SE
              </button>
            </div>
          </div>

          {/* Retro game controls */}
          <div className="flex gap-3">
            <button 
              onClick={startGame}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-3 rounded font-mono font-bold border border-cyan-400/50 shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:shadow-cyan-400/40"
              style={{ textShadow: '0 0 5px rgba(0, 255, 255, 0.5)' }}
            >
              &gt; START
            </button>
            <button 
              onClick={pauseGame}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-4 py-3 rounded font-mono font-bold border border-orange-400/50 shadow-lg shadow-orange-500/20 transition-all duration-200 hover:shadow-orange-400/40"
              style={{ textShadow: '0 0 5px rgba(255, 165, 0, 0.5)' }}
            >
              || PAUSE
            </button>
          </div>

          {/* Retro speed control */}
          <div className="bg-black/80 border border-purple-500/50 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                <label className="text-purple-400 font-mono text-sm font-bold tracking-wider">SPEED</label>
              </div>
              <span className="text-purple-300 font-mono text-lg font-bold">{speed}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(speed-1)/9*100}%, #4c1d95 ${(speed-1)/9*100}%, #4c1d95 100%)`
              }}
            />
            <div className="flex justify-between text-purple-400 text-xs font-mono mt-1">
              <span>SLOW</span>
              <span>FAST</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tutorial Modal */}
      {showTutorial && renderTutorial()}
      
      {/* Description Modal */}
      {showDescription && renderDescription()}
    </div>
  );
};

export default SnakeeGame;
