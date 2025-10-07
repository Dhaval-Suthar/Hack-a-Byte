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
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Sound effect references
  const soundRefs = useRef({
    eat: typeof Audio !== 'undefined' ? new Audio('/sounds/eat.mp3') : null,
    golden: typeof Audio !== 'undefined' ? new Audio('/sounds/golden.mp3') : null,
    poison: typeof Audio !== 'undefined' ? new Audio('/sounds/poison.mp3') : null,
    gameOver: typeof Audio !== 'undefined' ? new Audio('/sounds/game-over.mp3') : null,
    powerUp: typeof Audio !== 'undefined' ? new Audio('/sounds/power-up.mp3') : null,
    click: typeof Audio !== 'undefined' ? new Audio('/sounds/click.mp3') : null,
    move: typeof Audio !== 'undefined' ? new Audio('/sounds/move.mp3') : null
  });
  
  // Function to play sound effects
  const playSound = useCallback((sound: keyof typeof soundRefs.current) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    
    const audio = soundRefs.current[sound];
    if (audio) {
      audio.currentTime = 0; // Reset sound to start
      audio.volume = 0.5; // Adjust volume
      audio.play().catch(() => {}); // Ignore autoplay errors
    }
  }, [soundEnabled]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gameStateRef = useRef({
    snake: [] as Array<{ q: number; r: number }>,
    dirIndex: 0,
    targetDir: 0,
    food: null as { q: number; r: number; type: string; spawnAt: number } | null,
    powerUp: null as { 
      type: "shield" | "slowTime" | "pointBoost"; 
      expiresAt: number;
      q: number;
      r: number;
    } | null,
    moveTimer: null as NodeJS.Timeout | null,
    animationId: null as number | null,
    activePowerUp: null as {
      type: "shield" | "slowTime" | "pointBoost";
      expiresAt: number;
    } | null,
    particles: [] as Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      life: number;
      maxLife: number;
    }>,
    lastHeadPos: { x: 0, y: 0 } // To track movement for trail particles
  });

  // (HEX_BASE) removed as unused

  // formatTime helper removed (unused in this component)
  
  // Create particles function
  const createParticles = useCallback((
    x: number, 
    y: number, 
    count: number, 
    color: string | string[], 
    size: number | [number, number] = 3,
    speed: number = 2,
    life: number = 30
  ) => {
    const particles = [];
    const colors = Array.isArray(color) ? color : [color];
    const sizeRange = Array.isArray(size) ? size : [size, size];
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const s = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
      const velocity = speed * (0.5 + Math.random() * 0.5);
      const maxLife = life * (0.7 + Math.random() * 0.6);
      
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: s,
        alpha: 1,
        life: maxLife,
        maxLife
      });
    }
    
    gameStateRef.current.particles = [
      ...gameStateRef.current.particles,
      ...particles
    ].slice(0, 200); // Limit total particles for performance
  }, []);
  
  // Update particles
  const updateParticles = useCallback(() => {
    gameStateRef.current.particles = gameStateRef.current.particles
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vx: p.vx * 0.96, // Add some drag
        vy: p.vy * 0.96,
        size: p.size * 0.97, // Particles shrink over time
        life: p.life - 1,
        alpha: (p.life / p.maxLife) * 0.8 // Fade out
      }))
      .filter(p => p.life > 0 && p.size > 0.3);
  }, []);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("hexHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Hex coordinate utilities moved to module scope above

  // Function to place a power-up
  const placePowerUp = useCallback(() => {
    // Only place power-up if we don't have an active or placed one
    if (gameStateRef.current.activePowerUp || gameStateRef.current.powerUp) {
      return;
    }
    
    // Power-up spawns are rare, so check chance
    const powerUpChance = 0.1 + level * 0.02; // Increase chance with level
    if (Math.random() > powerUpChance) {
      return;
    }
    
    // Find empty cell that's not where the snake or food is
    const exclude = new Set([
      ...gameStateRef.current.snake.map(coordKey),
      gameStateRef.current.food ? coordKey(gameStateRef.current.food) : ''
    ]);
    const base = randomEmptyCell(exclude);
    if (!base) {
      return;
    }
    
    // Choose a power-up type
    const powerUpTypes: Array<"shield" | "slowTime" | "pointBoost"> = ["shield", "slowTime", "pointBoost"];
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    gameStateRef.current.powerUp = {
      q: base.q,
      r: base.r,
      type,
      expiresAt: Date.now() + 10000 // Power-up disappears after 10 seconds if not collected
    };
  }, [level]);

  const placeFood = useCallback(() => {
    const exclude = new Set(gameStateRef.current.snake.map(coordKey));
    // Also exclude power-up position if exists
    if (gameStateRef.current.powerUp) {
      exclude.add(coordKey(gameStateRef.current.powerUp));
    }
    
    const base = randomEmptyCell(exclude);
    if (!base) {
      gameStateRef.current.food = null;
      return;
    }

    const roll = Math.random();
    let type = "normal";
    
    // Fixed food spawn rates (balanced difficulty)
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
    
    // Check if we should place a power-up
    placePowerUp();
  }, [level, placePowerUp]);

  const initGame = useCallback(() => {
    gameStateRef.current.snake = [
      { q: 0, r: 0 },
      { q: -1, r: 1 },
      { q: -2, r: 2 },
    ];
    gameStateRef.current.dirIndex = 0;
    gameStateRef.current.targetDir = 0;
    gameStateRef.current.powerUp = null;
    gameStateRef.current.activePowerUp = null;
    gameStateRef.current.particles = [];
    gameStateRef.current.lastHeadPos = { x: 0, y: 0 };
    setScore(0);
    setLevel(1);
    setGameStatus("Menu");
    setIsRunning(false);
    
    // Set fixed game speed
    setSpeed(4);
    
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
    
    // Play game over sound
    playSound("gameOver");

    // Add screen shake effect for game over
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => {
        if (canvas) canvas.style.animation = "";
      }, 500);
      
      // Create massive explosion particles at game over location
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Create an explosion effect from the last snake head position
      if (gameStateRef.current.snake.length > 0) {
        const head = gameStateRef.current.snake[gameStateRef.current.snake.length - 1];
        const hexSize = Math.min(width, height) / (GRID_RADIUS * 4);
        const headPixel = hexToPixel(head.q, head.r, hexSize);
        const headX = centerX + headPixel.x;
        const headY = centerY + headPixel.y;
        
        // Big explosion at snake head
        createParticles(
          headX, 
          headY, 
          50, 
          ['#ff0000', '#ff4500', '#ff6347', '#ffaa33', '#ffcc00', '#ff7700'], 
          [2, 5], 
          4, 
          60
        );
        
        // Secondary explosions along snake body
        const bodyPositions = Math.min(gameStateRef.current.snake.length - 1, 5); // Up to 5 body segments
        for (let i = 0; i < bodyPositions; i++) {
          const idx = gameStateRef.current.snake.length - 2 - i;
          if (idx >= 0) {
            const segment = gameStateRef.current.snake[idx];
            const segPixel = hexToPixel(segment.q, segment.r, hexSize);
            const segX = centerX + segPixel.x;
            const segY = centerY + segPixel.y;
            
            // Create smaller explosion with delay
            setTimeout(() => {
              createParticles(
                segX, 
                segY, 
                20, 
                ['#ff0000', '#ff4500', '#ff6347'], 
                [1.5, 3], 
                3, 
                40
              );
            }, 100 * (i + 1));
          }
        }
      }
    }

    setTimeout(() => initGame(), 3000);
  }, [initGame, playSound, createParticles]);

  const tickMove = useCallback(() => {
    if (!isRunning) return;

    const state = gameStateRef.current;
    
    // Check if we have an active power-up that has expired
    if (state.activePowerUp && Date.now() > state.activePowerUp.expiresAt) {
      // Restore speed if slow time power-up is ending
      if (state.activePowerUp.type === "slowTime") {
        // Reset speed to fixed setting
        setSpeed(4);
      }
      
      state.activePowerUp = null;
    }
    
    // Check if placed power-up has expired
    if (state.powerUp && Date.now() > state.powerUp.expiresAt) {
      state.powerUp = null;
    }
    
    // Update direction
    if ((state.targetDir + 3) % 6 !== state.dirIndex) {
      state.dirIndex = state.targetDir;
    }

    const head = state.snake[state.snake.length - 1];
    const d = DIRECTIONS[state.dirIndex];
    let newHead = { q: head.q + d.q, r: head.r + d.r };
    newHead = axialWrap(newHead.q, newHead.r);
    
    // Calculate pixel position for the head for particle effects
    const width = canvasRef.current?.width || 320;
    const height = canvasRef.current?.height || 380;
    const centerX = width / 2;
    const centerY = height / 2;
    const hexSize = Math.min(width, height) / (GRID_RADIUS * 4);
    const headPixel = hexToPixel(head.q, head.r, hexSize);
    const headX = centerX + headPixel.x;
    const headY = centerY + headPixel.y;
    
    // Store head position for movement trail
    state.lastHeadPos = { x: headX, y: headY };
    
    // Create movement trail particles occasionally
    if (Math.random() < 0.3 && isRunning) {
      createParticles(
        headX, 
        headY, 
        1, 
        ['rgba(0, 255, 100, 0.6)', 'rgba(0, 200, 100, 0.5)'], 
        [1, 2],
        0.5,
        20
      );
    }

    // Check self collision - skip if shield power-up is active
    if (state.snake.some((s) => s.q === newHead.q && s.r === newHead.r)) {
      if (state.activePowerUp && state.activePowerUp.type === "shield") {
        // Shield absorbs one collision and then expires
        state.activePowerUp = null;
      } else {
        gameOver();
        return;
      }
    }

    state.snake.push(newHead);

    // Check power-up collision
    if (state.powerUp && state.powerUp.q === newHead.q && state.powerUp.r === newHead.r) {
      // Activate the power-up
      const powerUpDuration = 10000; // 10 seconds
      
      state.activePowerUp = {
        type: state.powerUp.type,
        expiresAt: Date.now() + powerUpDuration
      };
      
      // Play power-up sound
      playSound("powerUp");
      
      // Calculate power-up position for particle effects
      const width = canvasRef.current?.width || 320;
      const height = canvasRef.current?.height || 380;
      const centerX = width / 2;
      const centerY = height / 2;
      const hexSize = Math.min(width, height) / (GRID_RADIUS * 4);
      const powerUpPixel = hexToPixel(state.powerUp.q, state.powerUp.r, hexSize);
      const powerUpX = centerX + powerUpPixel.x;
      const powerUpY = centerY + powerUpPixel.y;
      
      // Apply power-up effect and create specific particles
      switch(state.powerUp.type) {
        case "shield":
          // Shield is handled when collision happens
          createParticles(
            powerUpX, 
            powerUpY, 
            25, 
            ['#4287f5', '#1c54b2', '#87b3ff', '#ffffff'], 
            [2, 4], 
            3, 
            50
          );
          break;
        case "slowTime":
          // Slow down the game speed
          setSpeed(Math.max(2, speed * 0.6));
          createParticles(
            powerUpX, 
            powerUpY, 
            25, 
            ['#34ebc9', '#00c3ff', '#87cefa', '#ffffff'], 
            [2, 4], 
            1, // Slower speed for time effect
            80  // Longer life for time effect
          );
          break;
        case "pointBoost":
          // Point boost will be applied when collecting food
          createParticles(
            powerUpX, 
            powerUpY, 
            25, 
            ['#ffcc00', '#ffd700', '#ffff00', '#ffffff'], 
            [2, 4], 
            3, 
            50
          );
          break;
      }
      
      state.powerUp = null;
    }

    // Check food collision
    if (state.food && state.food.q === newHead.q && state.food.r === newHead.r) {
      let points = 1;
      
      // Apply point boost if active
      const hasPointBoost = state.activePowerUp && state.activePowerUp.type === "pointBoost";
      
      // Calculate food position for particle effects
      const width = canvasRef.current?.width || 320;
      const height = canvasRef.current?.height || 380;
      const centerX = width / 2;
      const centerY = height / 2;
      const hexSize = Math.min(width, height) / (GRID_RADIUS * 4);
      const foodPixel = hexToPixel(state.food.q, state.food.r, hexSize);
      const foodX = centerX + foodPixel.x;
      const foodY = centerY + foodPixel.y;

      switch (state.food.type) {
        case "golden":
          points = hasPointBoost ? 4 : 2; // Double points with boost
          // Golden apple: double growth (add extra segment)
          state.snake.push({ ...newHead });
          playSound("golden"); // Play golden apple sound
          
          // Create golden particle explosion
          createParticles(
            foodX, 
            foodY, 
            20, 
            ['#ffd700', '#ffcc00', '#ffb700', '#fff4cc', '#ffffff'], 
            [2, 4], 
            3, 
            45
          );
          break;
        case "poison":
          // Shield protects from poison effects
          if (state.activePowerUp && state.activePowerUp.type === "shield") {
            points = 1; // Convert poison to normal apple
            state.activePowerUp = null; // Use up the shield
            playSound("eat"); // Regular eating sound
            
            // Create shield activation particles
            createParticles(
              foodX, 
              foodY, 
              15, 
              ['#4287f5', '#1c54b2', '#ffffff'], 
              [2, 3.5], 
              2.5, 
              35
            );
          } else {
            points = -1;
            // Poison apple: shrink by removing 2 segments if possible
            if (state.snake.length > 3) {
              state.snake.shift();
              state.snake.shift();
            }
            playSound("poison"); // Play poison apple sound
            
            // Create poison particle effect
            createParticles(
              foodX, 
              foodY, 
              15, 
              ['#800080', '#4b0082', '#330066', '#2f0000', '#660066'], 
              [1.5, 3], 
              2, 
              40
            );
          }
          break;
        case "normal":
        default:
          points = hasPointBoost ? 2 : 1; // Double points with boost
          playSound("eat"); // Play normal eating sound
          
          // Create regular eating particles
          createParticles(
            foodX, 
            foodY, 
            10, 
            ['#ff6b7a', '#ff4757', '#ff073a'], 
            [1, 3], 
            2, 
            30
          );
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

      // Food was eaten, don't remove tail (snake grows)
    } else {
      // No food eaten, remove tail (normal movement)
      state.snake.shift();
    }
  }, [isRunning, highScore, placeFood, gameOver, speed, playSound, createParticles]);

  const startGame = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setIsPaused(false);
    setGameStatus("Running");
    
    // Play click sound when starting game
    playSound("click");

    const moveMs = 1000 / speed;
    if (gameStateRef.current.moveTimer) {
      clearInterval(gameStateRef.current.moveTimer);
    }
    gameStateRef.current.moveTimer = setInterval(tickMove, moveMs);
  }, [isRunning, speed, tickMove, playSound]);

  const togglePause = useCallback(() => {
    if (!isRunning) return;
    
    // Play click sound when toggling pause
    playSound("click");
    
    if (isPaused) {
      // Resume game
      setIsPaused(false);
      setGameStatus("Running");
      const moveMs = 1000 / speed;
      gameStateRef.current.moveTimer = setInterval(tickMove, moveMs);
    } else {
      // Pause game
      setIsPaused(true);
      setGameStatus("Paused");
      if (gameStateRef.current.moveTimer) {
        clearInterval(gameStateRef.current.moveTimer);
        gameStateRef.current.moveTimer = null;
      }
    }
  }, [isRunning, isPaused, speed, tickMove, playSound]);

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

    // Draw active power-up indicator
    if (gameStateRef.current.activePowerUp) {
      const powerUpType = gameStateRef.current.activePowerUp.type;
      const remainingTime = Math.max(0, (gameStateRef.current.activePowerUp.expiresAt - Date.now()) / 1000);
      const progress = Math.min(1, remainingTime / 10); // 10 seconds total duration
      
      // Draw power-up status indicator at top of screen
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(centerX - 50, 10, 100, 25);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.strokeRect(centerX - 50, 10, 100, 25);
      
      // Progress bar
      let barColor;
      let label;
      switch(powerUpType) {
        case "shield":
          barColor = "#4287f5";
          label = "🛡️ SHIELD";
          break;
        case "slowTime":
          barColor = "#42f5a7";
          label = "⏱️ SLOW";
          break;
        case "pointBoost":
          barColor = "#f5d742";
          label = "💎 2x PTS";
          break;
      }
      
      ctx.fillStyle = barColor;
      ctx.fillRect(centerX - 48, 12, 96 * progress, 21);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, centerX, 22);
      ctx.restore();
    }
    
    // Draw power-up if available
    if (gameStateRef.current.powerUp) {
      const pixel = hexToPixel(gameStateRef.current.powerUp.q, gameStateRef.current.powerUp.r, hexSize);
      const x = centerX + pixel.x;
      const y = centerY + pixel.y;
      
      const powerUpTime = time * 3;
      const pulseScale = 0.85 + Math.sin(powerUpTime) * 0.15;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(powerUpTime * 0.2);
      ctx.translate(-x, -y);
      
      drawHexPath(ctx, x, y, hexSize * pulseScale);
      
      let powerUpColor1, powerUpColor2, powerUpSymbol;
      switch(gameStateRef.current.powerUp.type) {
        case "shield":
          powerUpColor1 = "#4287f5"; // Blue
          powerUpColor2 = "#1c54b2";
          powerUpSymbol = "🛡️";
          break;
        case "slowTime":
          powerUpColor1 = "#42f5a7"; // Green
          powerUpColor2 = "#1cb26c";
          powerUpSymbol = "⏱️";
          break;
        case "pointBoost":
          powerUpColor1 = "#f5d742"; // Yellow
          powerUpColor2 = "#b29e1c";
          powerUpSymbol = "💎";
          break;
      }
      
      // Create a starburst gradient for the power-up
      const powerUpGradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize * pulseScale);
      powerUpGradient.addColorStop(0, "#ffffff");
      powerUpGradient.addColorStop(0.3, powerUpColor1);
      powerUpGradient.addColorStop(0.7, powerUpColor2);
      powerUpGradient.addColorStop(1, "#000000");
      ctx.fillStyle = powerUpGradient;
      ctx.fill();
      
      // Add glowing border
      ctx.shadowBlur = 15;
      ctx.shadowColor = powerUpColor1;
      ctx.strokeStyle = powerUpColor1;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add rotating particles
      for (let i = 0; i < 6; i++) {
        const angle = powerUpTime + (i * Math.PI / 3);
        const particleX = x + Math.cos(angle) * hexSize * 1.2;
        const particleY = y + Math.sin(angle) * hexSize * 1.2;
        const particleSize = 2 + Math.sin(powerUpTime * 2 + i) * 1;
        
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fillStyle = powerUpColor1;
        ctx.fill();
      }
      
      // Render power-up symbol
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.font = `${hexSize * 0.4}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(powerUpSymbol, x, y);
      
      ctx.restore();
      
      // Show remaining time for power-up
      const remainingTime = Math.max(0, Math.ceil((gameStateRef.current.powerUp.expiresAt - Date.now()) / 1000));
      if (remainingTime <= 3) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `${hexSize * 0.3}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${remainingTime}s`, x, y - hexSize * 1.2);
      }
    }
    
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

    // Update and draw particles
    updateParticles();
    
    gameStateRef.current.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
    
    // Reset shadow
    ctx.shadowBlur = 0;
    gameStateRef.current.animationId = requestAnimationFrame(draw);
  }, [updateParticles]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (isRunning && !isPaused) {
      if (gameStateRef.current.moveTimer) {
        clearInterval(gameStateRef.current.moveTimer);
      }
      const moveMs = 1000 / speed;
      gameStateRef.current.moveTimer = setInterval(tickMove, moveMs);
    }
  }, [speed, isRunning, isPaused, tickMove]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (isRunning) {
          togglePause();
        } else {
          startGame();
        }
        e.preventDefault();
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        setDirection(0); // East
        if (!isRunning) startGame();
      } else if (e.code === "ArrowUp" || e.code === "KeyW") {
        setDirection(1); // Northeast
        if (!isRunning) startGame();
      } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        setDirection(3); // West
        if (!isRunning) startGame();
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        setDirection(5); // Southeast
        if (!isRunning) startGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, togglePause, startGame]);

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
          
          <div className="bg-black/50 border border-blue-500/30 rounded p-3">
            <h3 className="text-blue-400 font-mono font-bold mb-2">✨ POWER-UPS</h3>
            <div className="text-blue-200 font-mono text-xs space-y-1">
              <p>
                🛡️ <span className="text-blue-400">SHIELD</span>: Protects from collision & poison
              </p>
              <p>
                ⏱️ <span className="text-green-400">SLOW TIME</span>: Reduces game speed
              </p>
              <p>
                💎 <span className="text-yellow-400">POINT BOOST</span>: Doubles points from food
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
            onClick={() => {
              setShowTutorial(true);
              playSound("click");
            }}
            className="retro-button bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500/90 hover:to-indigo-500/90 text-white px-4 py-2 rounded-lg text-xs font-mono border border-blue-400/50 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-400/40 transform hover:scale-105"
          >
            📖 TUTORIAL
          </button>
          <button
            onClick={() => {
              setShowDescription(true);
              playSound("click");
            }}
            className="retro-button bg-gradient-to-r from-purple-600/90 to-pink-600/90 hover:from-purple-500/90 hover:to-pink-500/90 text-white px-4 py-2 rounded-lg text-xs font-mono border border-purple-400/50 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-400/40 transform hover:scale-105"
          >
            ℹ️ ABOUT
          </button>
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playSound("click");
            }}
            className={`retro-button ${
              soundEnabled
                ? "bg-gradient-to-r from-green-600/90 to-teal-600/90 hover:from-green-500/90 hover:to-teal-500/90 border-green-400/50"
                : "bg-gradient-to-r from-red-600/90 to-rose-600/90 hover:from-red-500/90 hover:to-rose-500/90 border-red-400/50"
            } text-white px-4 py-2 rounded-lg text-xs font-mono transition-all duration-300 shadow-lg transform hover:scale-105`}
          >
            {soundEnabled ? "🔊 SOUND" : "🔇 MUTED"}
          </button>
        </div>
        
        {/* Pause button */}
        {isRunning && (
          <div className="mt-3">
            <button
              onClick={togglePause}
              className={`retro-button ${
                isPaused 
                  ? "bg-gradient-to-r from-green-600/90 to-teal-600/90 hover:from-green-500/90 hover:to-teal-500/90 border-green-400/50" 
                  : "bg-gradient-to-r from-amber-600/90 to-orange-600/90 hover:from-amber-500/90 hover:to-orange-500/90 border-amber-400/50"
              } text-white px-6 py-2 rounded-lg text-xs font-mono transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/40 transform hover:scale-105`}
            >
              {isPaused ? "▶️ RESUME" : "⏸️ PAUSE"}
            </button>
          </div>
        )}
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
          
          {/* Game controls */}
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
