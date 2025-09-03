"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { getPlayspaceId } from "@/lib/playspace-utils";

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
  x = ((((x + GRID_RADIUS) % span) + span) % span) - GRID_RADIUS;
  y = ((((y + GRID_RADIUS) % span) + span) % span) - GRID_RADIUS;
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

const drawHexPath = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
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
  // mark props as used to avoid lint warnings when they're intentionally unused
  void onClose;
  void time;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStatus, setGameStatus] = useState("Menu");
  const [level, setLevel] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed] = useState(4);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gameStateRef = useRef({
    snake: [] as Array<{ q: number; r: number }>,
    dirIndex: 0,
    targetDir: 0,
    food: null as { q: number; r: number; type: string; spawnAt: number } | null,
    moveTimer: null as NodeJS.Timeout | null,
    animationId: null as number | null,
  });

  // (HEX_BASE) removed as unused

  // formatTime helper removed (unused in this component)

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("hexHighScore");
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
    let type = "normal";
    const goldenChance = Math.min(0.08 + level * 0.02, 0.2);
    const poisonChance = Math.min(0.05 + level * 0.015, 0.15);

    if (roll < goldenChance) {
      type = "golden";
    } else if (roll < goldenChance + poisonChance) {
      type = "poison";
    }

    gameStateRef.current.food = {
      q: base.q,
      r: base.r,
      type,
      spawnAt: Date.now() / 1000,
    };
  }, [level]);

  const initGame = useCallback(() => {
    gameStateRef.current.snake = [
      { q: 0, r: 0 },
      { q: -1, r: 1 },
      { q: -2, r: 2 },
    ];
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
      canvas.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => {
        if (canvas) canvas.style.animation = "";
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
    if (state.snake.some((s) => s.q === newHead.q && s.r === newHead.r)) {
      gameOver();
      return;
    }

    state.snake.push(newHead);

    // Check food collision
    if (state.food && state.food.q === newHead.q && state.food.r === newHead.r) {
      let points = 1;
      let shouldGrow = true;

      switch (state.food.type) {
        case "golden":
          points = 2;
          // Golden apple: double growth (add extra segment)
          state.snake.push({ ...newHead });
          break;
        case "poison":
          points = -1;
          shouldGrow = false;
          // Poison apple: shrink by removing 2 segments if possible
          if (state.snake.length > 3) {
            state.snake.shift();
            state.snake.shift();
          }
          break;
        case "normal":
        default:
          points = 1;
          break;
      }

      setScore((prev) => {
        const newScore = Math.max(0, prev + points);
        const newLevel = 1 + Math.floor(newScore / 6);
        setLevel(newLevel);

        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem("hexHighScore", newScore.toString());
        }

        // Award 10 bitcoins per successful (positive) point gain only when points > 0
        if (points > 0) {
          const playspaceId = getPlayspaceId();
          fetch('/api/reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-playspace-id': playspaceId || '' },
            body: JSON.stringify({ amount: 10, reason: 'snake-point' })
          }).catch(()=>{});
        }
        return newScore;
      });

      placeFood();

      // Only remove tail if it's normal food or if we didn't shrink from poison
      if (!shouldGrow || state.food.type === "normal") {
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

  // pauseGame removed (unused) — use game state toggles via setIsRunning/setGameStatus directly when needed

  const setDirection = (idx: number) => {
    if ((idx + 3) % 6 === gameStateRef.current.dirIndex) return;
    gameStateRef.current.targetDir = idx;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Enhanced retro background with animated gradient
    const time = Date.now() * 0.001;
    const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
    bgGradient.addColorStop(0, "#0a0a0a");
    bgGradient.addColorStop(0.3, `hsl(${220 + Math.sin(time) * 10}, 60%, 8%)`);
    bgGradient.addColorStop(0.7, `hsl(${200 + Math.cos(time * 0.7) * 15}, 70%, 6%)`);
    bgGradient.addColorStop(1, "#000000");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Enhanced CRT scanlines with subtle animation
    const scanlineAlpha = 0.03 + Math.sin(time * 2) * 0.01;
    ctx.strokeStyle = `rgba(0, 255, 255, ${scanlineAlpha})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 3) {
      ctx.globalAlpha = 1 - (i % 6) * 0.1;
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Add subtle noise texture
    if (Math.random() < 0.1) {
      ctx.fillStyle = `rgba(0, 255, 255, ${0.02 + Math.random() * 0.01})`;
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
      }
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const hexSize = Math.min(width, height) / (GRID_RADIUS * 4);

    // Enhanced grid with dynamic lighting effect
    ctx.shadowBlur = 0;
    const gridPulse = 0.1 + Math.sin(time * 1.5) * 0.05;
    ctx.strokeStyle = `rgba(0, 255, 255, ${gridPulse})`;
    ctx.lineWidth = 1;

    // Add subtle grid glow effect
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 2;

    allCells().forEach((cell) => {
      const pixel = hexToPixel(cell.q, cell.r, hexSize);
      const x = centerX + pixel.x;
      const y = centerY + pixel.y;
      
      // Distance-based grid opacity for depth effect
      const distance = Math.sqrt(pixel.x * pixel.x + pixel.y * pixel.y);
      const maxDistance = Math.sqrt((GRID_RADIUS * hexSize) ** 2 * 2);
      const opacity = 1 - (distance / maxDistance) * 0.7;
      
      ctx.globalAlpha = opacity * gridPulse * 3;
      drawHexPath(ctx, x, y, hexSize);
      ctx.stroke();
    });
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Enhanced snake with trail effects and better animation
    gameStateRef.current.snake.forEach((segment, index) => {
      const pixel = hexToPixel(segment.q, segment.r, hexSize);
      const x = centerX + pixel.x;
      const y = centerY + pixel.y;
      const isHead = index === gameStateRef.current.snake.length - 1;

      // Create size variation for better visual hierarchy
      const segmentSize = isHead ? hexSize * 0.95 : hexSize * (0.7 + (index / gameStateRef.current.snake.length) * 0.2);
      
      drawHexPath(ctx, x, y, segmentSize);

      if (isHead) {
        // Enhanced head with pulsing effect and directional indicator
        const headPulse = 1 + Math.sin(time * 4) * 0.1;
        ctx.shadowColor = "#00ff41";
        ctx.shadowBlur = 20 * headPulse;

        const headGradient = ctx.createRadialGradient(x, y, 0, x, y, segmentSize);
        headGradient.addColorStop(0, "#ffffff");
        headGradient.addColorStop(0.3, "#00ff41");
        headGradient.addColorStop(0.7, "#00cc33");
        headGradient.addColorStop(1, "#008822");
        ctx.fillStyle = headGradient;
        ctx.fill();

        // Animated head border
        ctx.shadowBlur = 12;
        ctx.strokeStyle = `hsl(${120 + Math.sin(time * 3) * 10}, 100%, 60%)`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Direction indicator (small arrow or glow in movement direction)
        const dir = DIRECTIONS[gameStateRef.current.dirIndex];
        const dirPixel = hexToPixel(dir.q * 0.3, dir.r * 0.3, hexSize);
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x + dirPixel.x, y + dirPixel.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Enhanced body with flowing energy effect
        const segmentIndex = gameStateRef.current.snake.length - index;
        const bodyAlpha = Math.max(0.4, 1 - segmentIndex * 0.08);
        const flowEffect = Math.sin(time * 3 - index * 0.5) * 0.3 + 0.7;
        
        ctx.shadowColor = "#00cc33";
        ctx.shadowBlur = 12 * flowEffect;

        const bodyGradient = ctx.createRadialGradient(x, y, 0, x, y, segmentSize);
        bodyGradient.addColorStop(0, `rgba(${100 + flowEffect * 50}, 255, ${100 + flowEffect * 50}, ${bodyAlpha})`);
        bodyGradient.addColorStop(0.5, `rgba(0, 204, 51, ${bodyAlpha * 0.9})`);
        bodyGradient.addColorStop(0.8, `rgba(0, 136, 34, ${bodyAlpha * 0.7})`);
        bodyGradient.addColorStop(1, `rgba(0, 102, 26, ${bodyAlpha * 0.5})`);
        ctx.fillStyle = bodyGradient;
        ctx.fill();

        // Animated body border with energy flow
        const borderIntensity = flowEffect * bodyAlpha;
        ctx.strokeStyle = `rgba(0, 255, 100, ${borderIntensity})`;
        ctx.lineWidth = 1 + borderIntensity;
        ctx.stroke();
      }
    });

    // Enhanced food with advanced visual effects
    if (gameStateRef.current.food) {
      const pixel = hexToPixel(gameStateRef.current.food.q, gameStateRef.current.food.r, hexSize);
      const x = centerX + pixel.x;
      const y = centerY + pixel.y;

      // Enhanced pulsing animation with rotation
      const foodTime = time * 2;
      const pulseScale = 0.75 + Math.sin(foodTime) * 0.25;
      const rotationOffset = Math.sin(foodTime * 0.5) * 0.1;

      // Save context for rotation
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotationOffset);
      ctx.translate(-x, -y);

      drawHexPath(ctx, x, y, hexSize * pulseScale);

      if (gameStateRef.current.food.type === "golden") {
        // Enhanced golden apple with particle effects
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 30 + Math.sin(foodTime * 2) * 10;

        // Multi-layer golden gradient
        const goldGradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize * pulseScale);
        goldGradient.addColorStop(0, "#ffffff");
        goldGradient.addColorStop(0.2, "#ffff88");
        goldGradient.addColorStop(0.4, "#ffd700");
        goldGradient.addColorStop(0.7, "#ffb300");
        goldGradient.addColorStop(1, "#cc8800");
        ctx.fillStyle = goldGradient;
        ctx.fill();

        // Animated golden border with sparkle effect
        ctx.shadowBlur = 20;
        ctx.strokeStyle = `hsl(${50 + Math.sin(foodTime) * 20}, 100%, ${70 + Math.sin(foodTime * 3) * 20}%)`;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Sparkle particles around golden apple
        for (let i = 0; i < 6; i++) {
          const angle = (time + i) * 2;
          const sparkleRadius = hexSize * (1.2 + Math.sin(angle) * 0.3);
          const sparkleX = x + Math.cos(angle) * sparkleRadius;
          const sparkleY = y + Math.sin(angle) * sparkleRadius;
          const sparkleAlpha = Math.max(0, Math.sin(angle * 2));
          
          ctx.shadowBlur = 5;
          ctx.fillStyle = `rgba(255, 255, 0, ${sparkleAlpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (gameStateRef.current.food.type === "poison") {
        // Enhanced poison apple with toxic effects
        ctx.shadowColor = "#8b0000";
        ctx.shadowBlur = 25 + Math.sin(foodTime * 1.5) * 8;

        const poisonGradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize * pulseScale);
        poisonGradient.addColorStop(0, "#330066");
        poisonGradient.addColorStop(0.3, "#4b0082");
        poisonGradient.addColorStop(0.6, "#800080");
        poisonGradient.addColorStop(0.8, "#8b0000");
        poisonGradient.addColorStop(1, "#2f0000");
        ctx.fillStyle = poisonGradient;
        ctx.fill();

        // Pulsing toxic border
        ctx.shadowBlur = 15;
        ctx.strokeStyle = `hsl(${280 + Math.sin(foodTime) * 30}, 100%, ${40 + Math.sin(foodTime * 2) * 20}%)`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Toxic vapor effect
        for (let i = 0; i < 4; i++) {
          const vaporTime = time * 0.8 + i * 1.5;
          const vaporY = y - hexSize * (0.5 + Math.sin(vaporTime) * 0.3) - i * 8;
          const vaporAlpha = Math.max(0, 0.3 - i * 0.08) * Math.sin(vaporTime);
          
          ctx.shadowBlur = 3;
          ctx.fillStyle = `rgba(139, 0, 139, ${vaporAlpha})`;
          ctx.beginPath();
          ctx.arc(x + Math.sin(vaporTime) * 5, vaporY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Enhanced normal food with appetizing effects
        ctx.shadowColor = "#ff073a";
        ctx.shadowBlur = 20 + Math.sin(foodTime * 1.2) * 5;

        const redGradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize * pulseScale);
        redGradient.addColorStop(0, "#ff6b7a");
        redGradient.addColorStop(0.3, "#ff4757");
        redGradient.addColorStop(0.7, "#ff073a");
        redGradient.addColorStop(1, "#c44569");
        ctx.fillStyle = redGradient;
        ctx.fill();

        // Juicy border effect
        ctx.strokeStyle = `hsl(${350 + Math.sin(foodTime) * 10}, 100%, ${60 + Math.sin(foodTime * 2) * 15}%)`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Shine effect on the apple
        const shineGradient = ctx.createRadialGradient(
          x - hexSize * 0.3, y - hexSize * 0.3, 0,
          x - hexSize * 0.3, y - hexSize * 0.3, hexSize * 0.5
        );
        shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.6)");
        shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = shineGradient;
        
        ctx.beginPath();
        ctx.arc(x - hexSize * 0.3, y - hexSize * 0.3, hexSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Restore context after rotation
      ctx.restore();

      // Add floating score preview on food
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.font = `${hexSize * 0.3}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const scoreText = gameStateRef.current.food.type === "golden" ? "+2" : 
                       gameStateRef.current.food.type === "poison" ? "-1" : "+1";
      const floatY = y - hexSize * (1.2 + Math.sin(foodTime * 3) * 0.1);
      ctx.fillText(scoreText, x, floatY);
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
              <p>
                🍎 <span className="text-red-400">RED APPLE</span>: +1 point, grow by 1
              </p>
              <p>
                🍎 <span className="text-yellow-400">GOLDEN APPLE</span>: +2 points, grow by 2
              </p>
              <p>
                ☠️ <span className="text-purple-400">POISON APPLE</span>: -1 point, shrink by 2
              </p>
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
              Snakee is a retro-futuristic take on the classic Snake game, set in a hexagonal grid world. Navigate
              through the neon-lit digital landscape as a cyber-snake seeking digital nutrition.
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
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden matrix-bg">
      {/* Enhanced retro background with multiple layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-green-900/20"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/5 to-transparent"></div>
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(0, 255, 255, 0.1) 0%, transparent 25%),
              radial-gradient(circle at 75% 75%, rgba(0, 255, 0, 0.1) 0%, transparent 25%),
              linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "200px 200px, 200px 200px, 25px 25px, 25px 25px",
            animation: "circuit-flow 30s linear infinite, glow-pulse 4s ease-in-out infinite",
          }}
        ></div>
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `floating ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes grid-move {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(20px, 20px);
          }
        }
        @keyframes neon-pulse {
          0%,
          100% {
            box-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff;
          }
          50% {
            box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff;
          }
        }
        @keyframes retro-blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0.3;
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }
        @keyframes glow-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.6));
          }
        }
        @keyframes floating {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes matrix-rain {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
        @keyframes circuit-flow {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 100% 100%;
          }
        }
        .matrix-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(90deg, transparent 95%, rgba(0, 255, 0, 0.03) 100%),
            linear-gradient(180deg, transparent 95%, rgba(0, 255, 255, 0.02) 100%);
          background-size: 50px 50px;
          animation: circuit-flow 20s linear infinite;
          pointer-events: none;
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
          transition: all 0.3s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.8);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #a855f7);
          border: 2px solid #c084fc;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
          transition: all 0.3s ease;
        }
        .retro-button {
          position: relative;
          overflow: hidden;
        }
        .retro-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        .retro-button:hover::before {
          left: 100%;
        }
        .glitch-text {
          position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch-text::before {
          animation: glitch-1 0.5s infinite;
          color: #ff0000;
          z-index: -1;
        }
        .glitch-text::after {
          animation: glitch-2 0.5s infinite;
          color: #00ffff;
          z-index: -2;
        }
        @keyframes glitch-1 {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
        @keyframes glitch-2 {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(2px, -2px); }
          40% { transform: translate(2px, 2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(-2px, 2px); }
        }
      `}</style>
      {/* Enhanced game header with glitch effect */}
      <div className="text-center py-4 relative z-10">
        <h1 
          className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 font-mono tracking-wider glitch-text"
          data-text="SNAKEE"
          style={{
            animation: "glow-pulse 3s ease-in-out infinite",
            textShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
          }}
        >
          SNAKEE
        </h1>
        <div className="text-cyan-300 text-xs font-mono mt-1 opacity-80 tracking-wide">
          <span className="inline-block animate-pulse">●</span> HEX GRID EDITION <span className="inline-block animate-pulse">●</span>
        </div>

        {/* Enhanced tutorial and description buttons */}
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={() => setShowTutorial(true)}
            className="retro-button bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500/90 hover:to-indigo-500/90 text-white px-4 py-2 rounded-lg text-xs font-mono border border-blue-400/50 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-400/40 transform hover:scale-105"
          >
            📖 TUTORIAL
          </button>
          <button
            onClick={() => setShowDescription(true)}
            className="retro-button bg-gradient-to-r from-purple-600/90 to-pink-600/90 hover:from-purple-500/90 hover:to-pink-500/90 text-white px-4 py-2 rounded-lg text-xs font-mono border border-purple-400/50 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-400/40 transform hover:scale-105"
          >
            ℹ️ ABOUT
          </button>
        </div>
      </div>{" "}
      {/* Main game area */}
      <div className="flex-1 flex flex-col p-4 relative z-10">
        {/* Enhanced game canvas with multi-layer effects */}
        <div className="relative mx-auto mb-4 group">
          {/* Multiple glow layers for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-green-500/30 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-xl blur-md opacity-60"></div>
          <div className="absolute inset-0 bg-cyan-400/10 rounded-xl blur-sm animate-pulse"></div>
          
          {/* Corner accent lights */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-cyan-400 rounded-full blur-sm opacity-60 animate-pulse"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full blur-sm opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full blur-sm opacity-60 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-purple-400 rounded-full blur-sm opacity-60 animate-pulse" style={{animationDelay: '1.5s'}}></div>
          
          <canvas
            ref={canvasRef}
            width={320}
            height={380}
            className="relative bg-black/90 rounded-xl border-2 border-cyan-500/60 shadow-2xl shadow-cyan-500/30 touch-none backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/80 hover:shadow-cyan-400/40"
            style={{
              maxWidth: "100%",
              height: "auto",
              filter: "drop-shadow(0 0 15px rgba(0, 255, 255, 0.4))",
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
          
          {/* Game status indicator */}
          <div className="absolute top-2 right-2 flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              gameStatus === "Running" 
                ? "bg-green-400 animate-pulse" 
                : gameStatus === "GAME OVER"
                ? "bg-red-400"
                : gameStatus === "Paused"
                ? "bg-yellow-400"
                : "bg-cyan-400"
            }`}></div>
            <span className="text-xs font-mono text-white/80">{gameStatus.toUpperCase()}</span>
          </div>
        </div>

        {/* Enhanced retro game stats panel */}
        <div className="bg-black/80 border border-cyan-500/60 rounded-xl p-5 mb-4 backdrop-blur-md shadow-lg shadow-cyan-500/20 relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-green-500 opacity-20"></div>
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(0, 255, 255, 0.1) 10px,
                  rgba(0, 255, 255, 0.1) 20px
                )`,
                animation: "circuit-flow 15s linear infinite"
              }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center relative z-10">
            <div className="border border-green-500/40 rounded-lg p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/5 relative overflow-hidden group hover:border-green-400/60 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/5 to-transparent transform -skew-x-12 group-hover:animate-pulse"></div>
              <div className="text-green-400 font-mono text-3xl font-bold animate-pulse relative z-10" style={{textShadow: "0 0 10px rgba(0, 255, 0, 0.5)"}}>{score.toLocaleString()}</div>
              <div className="text-green-300 text-xs font-mono tracking-wider relative z-10">SCORE</div>
            </div>
            <div className="border border-yellow-500/40 rounded-lg p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 relative overflow-hidden group hover:border-yellow-400/60 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent transform -skew-x-12 group-hover:animate-pulse"></div>
              <div className="text-yellow-400 font-mono text-3xl font-bold relative z-10" style={{textShadow: "0 0 10px rgba(255, 255, 0, 0.5)"}}>{highScore.toLocaleString()}</div>
              <div className="text-yellow-300 text-xs font-mono tracking-wider relative z-10">HIGH SCORE</div>
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
