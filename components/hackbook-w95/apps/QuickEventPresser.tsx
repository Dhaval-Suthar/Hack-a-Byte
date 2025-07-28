"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Button from "../../ui/Button";

interface QuickEventPresserProps {
  onClose: () => void;
  onSuccess?: () => void;
  onFailure?: () => void;
}

interface QuickEvent {
  id: string;
  type: "keypress" | "click" | "type" | "drag" | "rightclick";
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

  const gameRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const eventTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Define event types with increasing difficulty
  const eventTypes = React.useMemo(() => [
    {
      type: "keypress" as const,
      instruction: "SMASH ESC!",
      target: "Escape",
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
      type: "keypress" as const,
      instruction: "HIT ENTER NOW!",
      target: "Enter",
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
      type: "keypress" as const,
      instruction: "SPAM SPACEBAR!",
      target: " ",
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
      type: "keypress" as const,
      instruction: "PRESS CTRL+ALT+DEL!",
      target: "Control+Alt+Delete",
      duration: 3500,
    },
  ], []);

  // Play panic sounds
  const playPanicSound = useCallback((type: "alarm" | "error" | "success" | "tick") => {
    try {
      let audio: HTMLAudioElement;
      switch (type) {
        case "alarm":
        case "error":
          audio = new Audio("/hackbook-W95/sounds/error.mp3");
          audio.volume = 0.7;
          audio.play().catch(console.log);
          break;
        case "success":
          audio = new Audio("/hackbook-W95/sounds/ding.mp3");
          audio.volume = 0.8;
          audio.play().catch(console.log);
          break;
        case "tick":
          // Simple tick sound using existing audio
          audio = new Audio("/hackbook-W95/sounds/click.mp3");
          audio.volume = 0.3;
          audio.play().catch(console.log);
          break;
      }
    } catch (error) {
      console.log("Audio error:", error);
    }
  }, []);

  // Fail current event
  const failCurrentEvent = useCallback(() => {
    if (currentEvent && !currentEvent.completed && !currentEvent.failed) {
      setCurrentEvent(prev => prev ? { ...prev, failed: true } : null);
      
      // Add error message
      setErrorMessages(prev => [...prev, `FATAL ERROR! Failed: ${currentEvent.instruction}`]);
      
      // Remove time
      setTimeRemaining(prev => Math.max(0, prev - 3));
      
      playPanicSound("error");
    }
  }, [currentEvent, playPanicSound]);

  // Generate random event
  const generateNewEvent = useCallback(() => {
    const eventTemplate = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const event: QuickEvent = {
      ...eventTemplate,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
      failed: false,
      // Reduce duration as game progresses
      duration: Math.max(1500, eventTemplate.duration - (completedEvents * 200)),
    };

    // Set drag target position if it's a drag event
    if (event.type === "drag") {
      setDragTarget({
        x: Math.random() * 300 + 100,
        y: Math.random() * 200 + 100,
      });
    }

    setCurrentEvent(event);
    setTypeInput("");

    // Auto-fail event after duration
    eventTimeoutRef.current = setTimeout(() => {
      failCurrentEvent();
    }, event.duration);

    playPanicSound("alarm");
  }, [completedEvents, eventTypes, failCurrentEvent, playPanicSound]);

  // Complete current event
  const completeEvent = useCallback(() => {
    if (currentEvent && !currentEvent.completed && !currentEvent.failed) {
      setCurrentEvent(prev => prev ? { ...prev, completed: true } : null);
      setCompletedEvents(prev => prev + 1);
      
      // Add time bonus
      setTimeRemaining(prev => Math.min(30, prev + 2));
      
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
          onSuccess?.();
        } else {
          generateNewEvent();
        }
      }, 500);
    }
  }, [currentEvent, completedEvents, onSuccess, generateNewEvent, playPanicSound]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver || !currentEvent) return;

      if (currentEvent.type === "keypress") {
        if (currentEvent.target === "Control+Alt+Delete") {
          if (e.ctrlKey && e.altKey && e.key === "Delete") {
            e.preventDefault();
            completeEvent();
          }
        } else if (currentEvent.target === e.key) {
          completeEvent();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, gameOver, currentEvent, completeEvent]);

  // Handle type input
  useEffect(() => {
    if (currentEvent?.type === "type" && typeInput.toUpperCase() === currentEvent.target) {
      completeEvent();
    }
  }, [typeInput, currentEvent, completeEvent]);

  // Handle drag completion
  useEffect(() => {
    if (currentEvent?.type === "drag" && dragTarget) {
      const distance = Math.sqrt(
        Math.pow(dragPosition.x - dragTarget.x, 2) + Math.pow(dragPosition.y - dragTarget.y, 2)
      );
      if (distance < 30) {
        completeEvent();
      }
    }
  }, [dragPosition, dragTarget, currentEvent, completeEvent]);

  // Game timer
  useEffect(() => {
    if (gameStarted && !gameOver) {
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
          
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStarted, gameOver, onFailure, playPanicSound]);

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

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setTimeRemaining(30);
    setCompletedEvents(0);
    setGameOver(false);
    setGameWon(false);
    setErrorMessages([]);
    generateNewEvent();
    playPanicSound("alarm");
  };

  // Handle mouse events for dragging
  const handleMouseDown = () => {
    if (currentEvent?.type === "drag") {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && gameRef.current) {
      const rect = gameRef.current.getBoundingClientRect();
      setDragPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
          <h3 className="text-xl font-bold text-red-300 mb-4">INSTRUCTIONS:</h3>
          <ul className="text-sm space-y-2">
            <li>• Follow each instruction EXACTLY as shown</li>
            <li>• Complete actions quickly before time runs out</li>
            <li>• Each success adds time, failures remove time</li>
            <li>• Complete 10 events to disable the wipe</li>
            <li>• If timer reaches zero, ALL DATA WILL BE LOST!</li>
          </ul>
        </div>

        <Button
          onClick={startGame}
          className="bg-red-600 hover:bg-red-700 text-white text-xl px-8 py-4 border-2 border-red-400"
        >
          🚨 EMERGENCY START 🚨
        </Button>
      </div>
    );
  }

  if (gameOver) {
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
              <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                Continue
              </Button>
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
              <Button onClick={startGame} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
              <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
                Exit
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
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
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
            
            {/* Event-specific UI */}
            {currentEvent.type === "click" && (
              <Button
                onClick={completeEvent}
                className="bg-green-600 hover:bg-green-700 text-2xl px-8 py-4"
              >
                {currentEvent.target === "ok-button" ? "OK" : "CANCEL"}
              </Button>
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
              <div className="relative w-96 h-64">
                {/* Drag zone */}
                <div
                  className="absolute bg-green-500 border-4 border-green-300 w-16 h-16 rounded-full flex items-center justify-center text-black font-bold"
                  style={{
                    left: `${dragTarget.x}px`,
                    top: `${dragTarget.y}px`,
                  }}
                >
                  ZONE
                </div>
                
                {/* Draggable window */}
                <div
                  className="absolute w-24 h-16 bg-blue-600 border-2 border-white cursor-move flex items-center justify-center text-white font-bold"
                  style={{
                    left: `${dragPosition.x}px`,
                    top: `${dragPosition.y}px`,
                  }}
                  onMouseDown={handleMouseDown}
                >
                  DRAG
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error messages */}
      <div className="absolute bottom-4 right-4 max-w-md">
        {errorMessages.slice(-3).map((error, index) => (
          <div
            key={index}
            className="bg-red-800 border-2 border-red-500 p-2 mb-2 text-red-300 animate-bounce"
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
