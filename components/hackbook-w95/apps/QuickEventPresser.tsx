"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Button from "../../ui/Button";
import ScoreScreen from "../components/ScoreScreen";
import GameDifficultyManager from "../hooks/useGameDifficulty";
import gameScoring, { GameScoringManager } from "../hooks/useGameScoring";
import audioManager from "../hooks/useAudioManager";

interface QuickEventPresserProps {
  onClose: () => void;
  onSuccess?: () => void;
  onFailure?: () => void;
}

interface QuickEvent {
  id: string;
  type: "click" | "type" | "drag" | "rightclick"; // Removed "keypress" - no hotkeys allowed
  instruction: string;
  target?: string;
  position?: { x: number; y: number };
  duration: number;
  completed: boolean;
  failed: boolean;
}

const QuickEventPresser: React.FC<QuickEventPresserProps> = ({
  onClose,
  onSuccess,
  onFailure,
}) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [currentEvent, setCurrentEvent] = useState<QuickEvent | null>(null);
  const [completedEvents, setCompletedEvents] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [systemUnstable, setSystemUnstable] = useState(false);
  const [flickerEffect, setFlickerEffect] = useState(false);
  const [typeInput, setTypeInput] = useState("");
  const [dragTarget, setDragTarget] = useState<{ x: number; y: number } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [windowGlitch, setWindowGlitch] = useState(false);
  const [showScoreScreen, setShowScoreScreen] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [difficulty, setDifficulty] = useState(GameDifficultyManager.getGlobalDifficulty());

  const gameRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const eventTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Listen for global difficulty changes
  useEffect(() => {
    // Set up listener for difficulty changes
    const cleanupListener = GameDifficultyManager.onDifficultyChange((newDifficulty) => {
      setDifficulty(newDifficulty);
    });
    
    return () => {
      // Clean up the listener when component unmounts
      cleanupListener();
    };
  }, []);

  // Define event types with increasing difficulty - ALL CLICK/MOUSE BASED (NO HOTKEYS)
  const eventTypes = React.useMemo(() => [
    {
      type: "click" as const,
      instruction: "CLICK EMERGENCY STOP!",
      target: "emergency-button",
      duration: 3000,
    },
    {
      type: "click" as const,
      instruction: "CLICK OK!",
      target: "ok-button",
      duration: 2500,
    },
    {
      type: "type" as const,
      instruction: "TYPE 'ABORT'!",
      target: "ABORT",
      duration: 4000,
    },
    {
      type: "click" as const,
      instruction: "CLICK CONFIRM NOW!",
      target: "confirm-button",
      duration: 2000,
    },
    {
      type: "rightclick" as const,
      instruction: "RIGHT CLICK TARGET!",
      target: "right-click-target",
      duration: 2500,
    },
    {
      type: "drag" as const,
      instruction: "DRAG WINDOW TO ZONE!",
      target: "drag-window",
      duration: 4000,
    },
    {
      type: "click" as const,
      instruction: "RAPID CLICK SHUTDOWN!",
      target: "rapid-click-button",
      duration: 2000,
    },
    {
      type: "type" as const,
      instruction: "TYPE 'STOP'!",
      target: "STOP",
      duration: 3000,
    },
    {
      type: "click" as const,
      instruction: "CLICK CANCEL!",
      target: "cancel-button",
      duration: 2000,
    },
    {
      type: "click" as const,
      instruction: "CLICK FORCE STOP!",
      target: "force-stop-button",
      duration: 3500,
    },
  ], []);

  // Play panic sounds
  const playPanicSound = useCallback((type: "alarm" | "error" | "success" | "tick") => {
    try {
      switch (type) {
        case "alarm":
        case "error":
          audioManager.playSound("/hackbook-W95/sounds/error.mp3", 0.7);
          break;
        case "success":
          audioManager.playSound("/hackbook-W95/sounds/ding.mp3", 0.8);
          break;
        case "tick":
          // Simple tick sound using existing audio
          audioManager.playSound("/hackbook-W95/sounds/click.mp3", 0.3);
          break;
      }
    } catch {
    }
  }, []);

  // Fail current event
  const failCurrentEvent = useCallback(() => {
    if (currentEvent && !currentEvent.completed && !currentEvent.failed) {
      setCurrentEvent(prev => prev ? { ...prev, failed: true } : null);
      
      // Add error message
      setErrorMessages(prev => {
        const newErrors = [...prev, `FATAL ERROR! Failed: ${currentEvent.instruction}`];
        
        // Update game progress with new attempt count
        const totalAttempts = completedEvents + 1 + newErrors.length;
        gameScoring.updateGameProgress(GameScoringManager.QUICK_EVENT_PRESSER, totalAttempts);
        
        return newErrors;
      });
      
      // Remove more time for fatal error
      setTimeRemaining(prev => Math.max(0, prev - 5));
      
      // Trigger dramatic visual effects
      setSystemUnstable(true);
      setFlickerEffect(true);
      setWindowGlitch(true);
      
      // Play multiple error sounds for emphasis
      playPanicSound("error");
      setTimeout(() => playPanicSound("error"), 200);
      setTimeout(() => playPanicSound("error"), 400);
      
      // Reset visual effects after dramatic display
      setTimeout(() => {
        setFlickerEffect(false);
        setWindowGlitch(false);
      }, 2000);
    }
  }, [currentEvent, playPanicSound, completedEvents]);

  // Generate random event
  const generateNewEvent = useCallback(() => {
    const eventTemplate = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    // Apply difficulty modifiers to duration
    let durationModifier = 0;
    switch (difficulty) {
      case "easy":
        durationModifier = 500; // Extra time for easy mode
        break;
      case "hard":
        durationModifier = -500; // Less time for hard mode
        break;
      case "nightmare":
        durationModifier = -1000; // Even less time for nightmare mode
        break;
      default:
        durationModifier = 0; // Normal difficulty
    }
    
    const event: QuickEvent = {
      ...eventTemplate,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
      failed: false,
      // Adjust duration based on game progression and difficulty
      duration: Math.max(
        1000, // Minimum duration (1 second)
        eventTemplate.duration - (completedEvents * 200) + durationModifier
      ),
    };

    // Set drag target position if it's a drag event
    if (event.type === "drag") {
      // Container is 384px wide, 256px tall, with 64px draggable element
      // Zone is 64px diameter, so we need safe bounds
      
      // Make target position more challenging based on difficulty
      let minX = 50, maxX = 300;
      let minY = 50, maxY = 200;
      
      if (difficulty === "hard" || difficulty === "nightmare") {
        // For hard modes, place targets closer to edges
        minX = difficulty === "nightmare" ? 20 : 30;
        maxX = difficulty === "nightmare" ? 330 : 320;
        minY = difficulty === "nightmare" ? 20 : 30;
        maxY = difficulty === "nightmare" ? 220 : 210;
      }
      
      setDragTarget({
        x: Math.random() * (maxX - minX) + minX,
        y: Math.random() * (maxY - minY) + minY,
      });
      
      // Reset drag position to opposite corner for challenge
      setDragPosition({
        x: 20,  // Start near top-left
        y: 20,
      });
    }

    setCurrentEvent(event);
    setTypeInput("");

    // Auto-fail event after duration
    eventTimeoutRef.current = setTimeout(() => {
      failCurrentEvent();
    }, event.duration);

    playPanicSound("alarm");
  }, [completedEvents, eventTypes, failCurrentEvent, playPanicSound, difficulty]);

  // Calculate final score based on completed events, time remaining, and errors
  const calculateScore = useCallback(() => {
    // Base score from completed events (max 70 points)
    const eventsScore = (completedEvents / 10) * 70;
    
    // Time bonus (max 20 points)
    const timeScore = (timeRemaining / 30) * 20;
    
    // Error penalty (max 10 points deduction)
    const errorPenalty = Math.min(10, errorMessages.length * 2);
    
    // Calculate final score (max 100)
    return Math.max(0, Math.min(100, Math.round(eventsScore + timeScore - errorPenalty)));
  }, [completedEvents, timeRemaining, errorMessages.length]);

  // Complete current event with difficulty-based rewards
  const completeEvent = useCallback(() => {
    if (currentEvent && !currentEvent.completed && !currentEvent.failed) {
      setCurrentEvent(prev => prev ? { ...prev, completed: true } : null);
      setCompletedEvents(prev => prev + 1);
      
      // Add time bonus based on difficulty
      let timeBonus = 2; // Default bonus
      let maxTime = 30; // Default max time
      
      switch (difficulty) {
        case "easy":
          timeBonus = 3;  // More time bonus for easy mode
          maxTime = 45;   // Higher max time for easy mode
          break;
        case "hard":
          timeBonus = 1.5; // Less time bonus for hard mode
          maxTime = 25;    // Lower max time for hard mode
          break;
        case "nightmare":
          timeBonus = 1;   // Minimal time bonus for nightmare mode
          maxTime = 20;    // Even lower max time for nightmare mode
          break;
        default:
          timeBonus = 2;   // Normal difficulty
          maxTime = 30;    // Normal max time
      }
      
      setTimeRemaining(prev => Math.min(maxTime, prev + timeBonus));
      
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
      }
      
      playPanicSound("success");
      
      // Generate next event after brief delay
      setTimeout(() => {
        if (completedEvents >= 9) { // 10 total events (0-9)
          // Victory condition
          setGameWon(true);
          setGameOver(true);
          
          // Calculate and set final score with difficulty bonus
          let score = calculateScore();
          
          // Add difficulty bonus to score
          if (difficulty === "hard") {
            score = Math.min(100, score * 1.1); // 10% bonus for hard
          } else if (difficulty === "nightmare") {
            score = Math.min(100, score * 1.2); // 20% bonus for nightmare
          }
          
          const finalScore = Math.round(score);
          setFinalScore(finalScore);
          
          // Track game completion with total attempts (errors count as failed attempts)
          const totalAttempts = completedEvents + 1 + errorMessages.length;
          gameScoring.completeGame(
            GameScoringManager.QUICK_EVENT_PRESSER,
            finalScore,
            totalAttempts,
            {
              completedEvents,
              totalEvents: 10,
              timeRemaining,
              errors: errorMessages.length,
              difficulty
            }
          );
          
          // Auto-trigger score screen after 3 seconds (only if not already shown)
          setTimeout(() => {
            if (!showScoreScreen) {
              setShowScoreScreen(true);
            }
          }, 3000);
          
          // Call onSuccess callback to update database
          onSuccess?.();
        } else {
          generateNewEvent();
        }
      }, 500);
    }
  }, [currentEvent, completedEvents, onSuccess, generateNewEvent, playPanicSound, calculateScore, difficulty, errorMessages.length, timeRemaining, showScoreScreen]);

  // Handle keyboard events
  // NO KEYBOARD EVENT LISTENERS - Game is now purely click/mouse based
  // Removed keyboard event handling to avoid hotkey conflicts

  // Handle type input
  useEffect(() => {
    if (currentEvent?.type === "type" && typeInput.toUpperCase() === currentEvent.target) {
      completeEvent();
    }
  }, [typeInput, currentEvent, completeEvent]);

  // Handle drag completion - IMPROVED DETECTION
  useEffect(() => {
    if (currentEvent?.type === "drag" && dragTarget) {
      // Calculate distance between center of draggable element and center of target zone
      const dragCenterX = dragPosition.x + 48; // 96px width / 2
      const dragCenterY = dragPosition.y + 32; // 64px height / 2
      const targetCenterX = dragTarget.x + 32; // 64px zone width / 2
      const targetCenterY = dragTarget.y + 32; // 64px zone height / 2
      
      const distance = Math.sqrt(
        Math.pow(dragCenterX - targetCenterX, 2) + Math.pow(dragCenterY - targetCenterY, 2)
      );
      
      // Success when draggable overlaps significantly with target (within 40px)
      if (distance < 40) {
        completeEvent();
      }
    }
  }, [dragPosition, dragTarget, currentEvent, completeEvent]);

  // Game timer with difficulty adjustment
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Determine timer speed based on difficulty (faster tick rate for harder difficulties)
      let timerSpeed = 1000; // Default: 1 second per tick
      
      if (difficulty === "nightmare") {
        timerSpeed = 800; // 20% faster timer for nightmare mode
      }
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setGameOver(true);
            onFailure?.();
            return 0;
          }
          
          // Play tick sound for last 10 seconds
          if (prev <= 10) {
            playPanicSound("tick");
          }
          
          // Time decrease based on difficulty
          let decrease = 1;
          if (difficulty === "hard") {
            decrease = 1.2; // Time decreases 20% faster
          } else if (difficulty === "nightmare") {
            decrease = 1.5; // Time decreases 50% faster
          } else if (difficulty === "easy") {
            decrease = 0.8; // Time decreases 20% slower
          }
          
          return Math.max(0, prev - decrease);
        });
      }, timerSpeed);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStarted, gameOver, onFailure, playPanicSound, difficulty]);

  // System instability effects
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const instabilityInterval = setInterval(() => {
        setSystemUnstable(prev => !prev);
        setFlickerEffect(true);
        setTimeout(() => setFlickerEffect(false), 100);
        
        // Random window glitches
        if (Math.random() < 0.3) {
          setWindowGlitch(true);
          setTimeout(() => setWindowGlitch(false), 200);
        }
      }, 500);

      return () => clearInterval(instabilityInterval);
    }
  }, [gameStarted, gameOver]);

  // Start game with optional difficulty, using global difficulty when available
  const startGame = (selectedDifficulty?: string) => {
    // If no difficulty is provided, get global difficulty from GameDifficultyManager
    const difficultyToUse = selectedDifficulty || GameDifficultyManager.getGlobalDifficulty();
    
    setDifficulty(difficultyToUse);
    setGameStarted(true);
    setCompletedEvents(0);
    setGameOver(false);
    setGameWon(false);
    setErrorMessages([]);
    
    // Start tracking this game in the scoring system
    gameScoring.startGame(GameScoringManager.QUICK_EVENT_PRESSER, difficultyToUse);
    
    // Set initial time based on difficulty
    switch (difficultyToUse) {
      case "easy":
        setTimeRemaining(45); // More time for easy mode
        break;
      case "hard":
        setTimeRemaining(25); // Less time for hard mode
        break;
      case "nightmare":
        setTimeRemaining(20); // Even less time for nightmare mode
        break;
      default:
        setTimeRemaining(30); // Normal difficulty
    }
    
    generateNewEvent();
    playPanicSound("alarm");
  };

  // Handle mouse events for dragging - FIXED VERSION
  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentEvent?.type === "drag") {
      e.preventDefault();
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && currentEvent?.type === "drag") {
      // Get the drag container element
      const dragContainer = e.currentTarget.querySelector('.drag-container') as HTMLElement;
      if (dragContainer) {
        const rect = dragContainer.getBoundingClientRect();
        const newX = e.clientX - rect.left - 48; // Offset by half draggable width (96px / 2)
        const newY = e.clientY - rect.top - 32;  // Offset by half draggable height (64px / 2)
        
        // Constrain within container bounds
        const constrainedX = Math.max(0, Math.min(newX, 320)); // 384px container - 64px draggable
        const constrainedY = Math.max(0, Math.min(newY, 200)); // 256px container - 64px draggable
        
        setDragPosition({
          x: constrainedX,
          y: constrainedY,
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  if (!gameStarted) {
    return (
      <div className="w-full h-full bg-red-900 text-white p-8 flex flex-col items-center justify-center font-mono">
        <div className="text-center mb-8 animate-pulse">
          <h1 className="text-4xl font-bold text-red-300 mb-4">⚠️ CRITICAL ALERT ⚠️</h1>
          <h2 className="text-2xl font-bold text-yellow-300 mb-4">REMOTE WIPE DETECTED</h2>
          <p className="text-lg mb-4">ShadowByte&apos;s security protocol is active!</p>
          <p className="text-lg mb-4">System will be wiped in 30 seconds unless stopped!</p>
          <p className="text-lg font-bold text-red-300">You must disable the wipe sequence NOW!</p>
        </div>
        
        <div className="bg-black p-6 border-2 border-red-500 mb-6">
          <h3 className="text-xl font-bold text-red-300 mb-4">EMERGENCY PROTOCOL:</h3>
          <ul className="text-sm space-y-2">
            <li>• Follow each instruction EXACTLY as shown</li>
            <li>• Complete actions quickly before time runs out</li>
            <li>• Each success adds time, failures remove time</li>
            <li>• Complete 10 events to disable the wipe</li>
            <li>• If timer reaches zero, ALL DATA WILL BE LOST!</li>
          </ul>
          
          <div className="mt-4 p-3 bg-red-900 border-2 border-yellow-400 border-dashed">
            <div className="text-center">
              <p className="text-lg font-bold text-yellow-300 mb-2">⚠️ CRITICAL WARNING ⚠️</p>
              <p className="text-sm font-bold text-white">
                EVEN A SINGLE MISTAKE CANNOT BE AFFORDED!
              </p>
              <p className="text-xs text-red-300 mt-1">
                Every failure accelerates system corruption
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => startGame(GameDifficultyManager.getGlobalDifficulty())}
          className="bg-red-600 hover:bg-red-700 text-white text-xl px-8 py-4 border-2 border-red-400"
        >
          🚨 EMERGENCY START 🚨
        </Button>
      </div>
    );
  }

  // Handle difficulty selection and replay
  const handleReplay = (selectedDifficulty: string) => {
    // Store the selected difficulty both locally and globally
    setDifficulty(selectedDifficulty);
    
    // Store the difficulty globally for all games using the manager
    GameDifficultyManager.setGlobalDifficulty(selectedDifficulty);
    
    // Clear the emergency protocol launched flag so it can be launched again
    localStorage.removeItem("emergencyProtocolLaunched");
    
    // Reset the game state completely
    setShowScoreScreen(false);
    setGameOver(false);
    setGameWon(false);
    setErrorMessages([]);
    setCompletedEvents(0);
    
    // If there are any timeouts or intervals, clear them
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (eventTimeoutRef.current) {
      clearTimeout(eventTimeoutRef.current);
      eventTimeoutRef.current = null;
    }
    
    // Start a new game with the selected difficulty
    startGame(selectedDifficulty);
  };

  if (gameOver) {
    if (gameWon && showScoreScreen) {
      // Get deviceId from localStorage for leaderboard
      let deviceId: string | undefined;
      if (typeof window !== 'undefined') {
        deviceId = localStorage.getItem("selectedDeviceId") || undefined;
      }
      
      return (
        <ScoreScreen
          score={finalScore}
          timeRemaining={timeRemaining}
          completedEvents={completedEvents}
          totalEvents={10}
          difficulty={difficulty}
          deviceId={deviceId}
          onReplay={handleReplay}
          onClose={onClose}
        />
      );
    }
    
    return (
      <div className="w-full h-full bg-black text-white p-8 flex flex-col items-center justify-center font-mono">
        {gameWon ? (
          <div className="text-center animate-pulse">
            <h1 className="text-4xl font-bold text-green-300 mb-4">🎉 WIPE ABORTED! 🎉</h1>
            <h2 className="text-2xl font-bold text-green-300 mb-4">FILES SECURED!</h2>
            <p className="text-lg mb-4">You successfully disabled ShadowByte&apos;s remote wipe!</p>
            <p className="text-lg mb-4">System integrity maintained.</p>
            <p className="text-lg font-bold text-yellow-300">Mission Complete!</p>
            <div className="mt-8">
              <div className="flex space-x-2">
                <Button 
                  onClick={() => {
                    // Use the already calculated final score instead of recalculating
                    setShowScoreScreen(true);
                  }} 
                  className="bg-green-600 hover:bg-green-700 text-xl px-8 py-4 font-bold animate-pulse"
                >
                  🏆 View Results & Leaderboard 🏆
                </Button>
              </div>
              <p className="text-sm text-gray-300 mt-4">
                Click above to see your score and compare with other players!
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-300 mb-4">💀 SYSTEM WIPED 💀</h1>
            <h2 className="text-2xl font-bold text-red-300 mb-4">ALL DATA LOST</h2>
            <p className="text-lg mb-4">ShadowByte&apos;s security protocol succeeded.</p>
            <p className="text-lg mb-4">Time remaining: {timeRemaining} seconds</p>
            <p className="text-lg font-bold text-yellow-300">Mission Failed!</p>

            <div className="mt-8 space-x-4">
              <Button onClick={() => startGame(difficulty)} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
              <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
                Exit
              </Button>
              <Button onClick={startGame} className="bg-red-600 hover:bg-red-700 px-6 py-3">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={gameRef}
      className={`w-full h-full bg-black text-white font-mono relative overflow-hidden ${
        flickerEffect ? "animate-pulse" : ""
      } ${systemUnstable ? "bg-red-900" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Timer - Large and prominent */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[120]">
        <div className={`text-6xl font-bold px-8 py-4 border-4 ${
          timeRemaining <= 10 
            ? "text-red-300 border-red-500 bg-red-900 animate-bounce" 
            : timeRemaining <= 20
            ? "text-yellow-300 border-yellow-500 bg-yellow-900"
            : "text-white border-white bg-black"
        }`}>
          {timeRemaining.toString().padStart(2, '0')}
        </div>
        <div className="text-center text-xl font-bold text-red-300 mt-2">
          WIPE IN PROGRESS
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-4 left-4 bg-black border-2 border-white p-4">
        <div className="text-lg font-bold">Events Completed: {completedEvents}/10</div>
        <div className="w-64 h-4 bg-gray-700 border border-white mt-2">
          <div 
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(completedEvents / 10) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm">Difficulty:</span>
          <span className={`font-bold text-sm ${
            difficulty === "easy" 
              ? "text-green-400" 
              : difficulty === "hard" 
              ? "text-orange-400" 
              : difficulty === "nightmare" 
              ? "text-red-400" 
              : "text-yellow-400"
          }`}>
            {difficulty.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Current event display */}
      {currentEvent && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <div className={`bg-red-800 border-4 border-yellow-300 p-8 text-center ${
            windowGlitch ? "animate-ping" : "animate-pulse"
          }`}>
            <h2 className="text-4xl font-bold text-yellow-300 mb-4">
              {currentEvent.instruction}
            </h2>
            
            {/* Event-specific UI - ALL CLICK/MOUSE BASED */}
            {currentEvent.type === "click" && (
              <div className="space-y-4">
                {currentEvent.target === "emergency-button" && (
                  <Button
                    onClick={completeEvent}
                    className="bg-red-600 hover:bg-red-700 text-3xl px-12 py-6 font-bold animate-pulse"
                  >
                    🚨 EMERGENCY STOP 🚨
                  </Button>
                )}
                
                {currentEvent.target === "ok-button" && (
                  <Button
                    onClick={completeEvent}
                    className="bg-green-600 hover:bg-green-700 text-2xl px-8 py-4"
                  >
                    OK
                  </Button>
                )}
                
                {currentEvent.target === "confirm-button" && (
                  <Button
                    onClick={completeEvent}
                    className="bg-blue-600 hover:bg-blue-700 text-2xl px-8 py-4 font-bold"
                  >
                    CONFIRM NOW!
                  </Button>
                )}
                
                {currentEvent.target === "rapid-click-button" && (
                  <Button
                    onClick={completeEvent}
                    className="bg-orange-600 hover:bg-orange-700 text-2xl px-8 py-4 font-bold animate-bounce"
                  >
                    RAPID SHUTDOWN!
                  </Button>
                )}
                
                {currentEvent.target === "cancel-button" && (
                  <Button
                    onClick={completeEvent}
                    className="bg-gray-600 hover:bg-gray-700 text-2xl px-8 py-4"
                  >
                    CANCEL
                  </Button>
                )}
                
                {currentEvent.target === "force-stop-button" && (
                  <Button
                    onClick={completeEvent}
                    className="bg-purple-600 hover:bg-purple-700 text-2xl px-8 py-4 font-bold"
                  >
                    FORCE STOP!
                  </Button>
                )}
              </div>
            )}

            {currentEvent.type === "type" && (
              <div>
                <input
                  type="text"
                  value={typeInput}
                  onChange={(e) => setTypeInput(e.target.value.toUpperCase())}
                  className="bg-black text-green-300 border-2 border-green-300 px-4 py-2 text-2xl font-mono text-center"
                  placeholder={`Type: ${currentEvent.target}`}
                  autoFocus
                />
              </div>
            )}

            {currentEvent.type === "rightclick" && (
              <div
                className="w-32 h-32 bg-yellow-500 border-4 border-black mx-auto cursor-pointer flex items-center justify-center text-black font-bold text-xl"
                onContextMenu={(e) => {
                  e.preventDefault();
                  completeEvent();
                }}
              >
                TARGET
              </div>
            )}

            {currentEvent.type === "drag" && dragTarget && (
              <div className="drag-container relative w-96 h-64 bg-gray-800 border-4 border-yellow-300 mx-auto" style={{ userSelect: 'none' }}>
                <div className="absolute inset-2 bg-gray-900 border-2 border-gray-600">
                  <div className="text-center text-yellow-300 p-2 text-sm font-bold">
                    DRAG THE BLUE WINDOW TO THE GREEN ZONE!
                  </div>
                  
                  {/* Drag zone - Fixed position in container */}
                  <div
                    className="absolute bg-green-500 border-4 border-green-300 w-16 h-16 rounded-full flex items-center justify-center text-black font-bold text-xs"
                    style={{
                      left: `${dragTarget.x}px`,
                      top: `${dragTarget.y + 20}px`, // Offset for instruction text
                    }}
                  >
                    ZONE
                  </div>
                  
                  {/* Draggable window - Responsive to mouse */}
                  <div
                    className={`absolute w-24 h-16 bg-blue-600 border-2 border-white cursor-move flex items-center justify-center text-white font-bold text-xs select-none ${
                      isDragging ? 'shadow-lg scale-110' : ''
                    }`}
                    style={{
                      left: `${dragPosition.x}px`,
                      top: `${dragPosition.y + 20}px`, // Offset for instruction text
                      transition: isDragging ? 'none' : 'all 0.2s ease',
                      zIndex: isDragging ? 50 : 10,
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    DRAG
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error messages - DRAMATIC FATAL ERROR DISPLAY */}
      {errorMessages.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-red-900"></div>
          <div className="relative z-[110] text-center">
            {errorMessages.slice(-1).map((error, index) => (
              <div
                key={index}
                className="bg-black border-8 border-red-500 p-8 text-center shadow-2xl"
                style={{
                  boxShadow: '0 0 50px red, inset 0 0 50px rgba(255,0,0,0.3)',
                  animation: 'bounce 0.6s ease-out 1'
                }}
              >
                <div className="text-6xl font-bold text-red-300 mb-4">
                  💀 FATAL ERROR 💀
                </div>
                <div className="text-3xl font-bold text-white mb-4 bg-red-800 p-4 border-4 border-red-500">
                  SYSTEM COMPROMISED!
                </div>
                <div className="text-xl text-red-300 font-mono bg-black p-4 border-2 border-red-400">
                  {error}
                </div>
                <div className="text-2xl font-bold text-yellow-300 mt-4">
                  ⚠️ DATA CORRUPTION IN PROGRESS ⚠️
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Additional error messages history (smaller, bottom corner) */}
      <div className="absolute bottom-4 right-4 max-w-md">
        {errorMessages.slice(-3, -1).map((error, index) => (
          <div
            key={index}
            className="bg-red-800 border-2 border-red-500 p-2 mb-2 text-red-300 animate-bounce text-sm opacity-75"
          >
            {error}
          </div>
        ))}
      </div>

      {/* System instability effects */}
      {systemUnstable && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-red-600 opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickEventPresser;
