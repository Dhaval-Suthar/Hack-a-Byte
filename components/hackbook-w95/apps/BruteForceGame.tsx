"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import clsx from "clsx";

interface BruteForceGameProps {
  onSuccess: (password: string) => void;
  onClose: () => void;
  targetFileName?: string;
}

const BruteForceGame: React.FC<BruteForceGameProps> = ({
  onSuccess,
  onClose,
  targetFileName = "Archive.zip"
}) => {
  // Generate a random password for the game
  const generateRandomPassword = useCallback(() => {
    const passwordChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const length = Math.floor(Math.random() * 3) + 4; // Random length between 4-6 characters
    let password = "";
    for (let i = 0; i < length; i++) {
      password += passwordChars[Math.floor(Math.random() * passwordChars.length)];
    }
    return password;
  }, []);

  const [gamePassword] = useState(() => generateRandomPassword());
  const [currentSlot, setCurrentSlot] = useState(0);
  const [crackedChars, setCrackedChars] = useState<string[]>(new Array(gamePassword.length).fill(""));
  const [currentChar, setCurrentChar] = useState("");
  const [isAnimating, setIsAnimating] = useState(true);
  const [speed, setSpeed] = useState(800); // Start slower for better gameplay, then increase
  const [attempts, setAttempts] = useState(0);
  const [misses, setMisses] = useState(0);
  const [showMismatchDialog, setShowMismatchDialog] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [scrambleEffect, setScrambleEffect] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Character set for the brute force simulation
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

  // Start the game after a brief delay
  useEffect(() => {
    const startTimer = setTimeout(() => {
      setGameStarted(true);
    }, 2000); // 2 second delay to read instructions

    return () => clearTimeout(startTimer);
  }, []);

  // Play sound effect
  const playSound = useCallback((soundType: 'click' | 'error' | 'success' | 'type') => {
    try {
      let audio: HTMLAudioElement;
      switch (soundType) {
        case 'click':
          audio = new Audio("/hackbook-w95/sounds/click.mp3");
          break;
        case 'error':
          audio = new Audio("/hackbook-w95/sounds/error.mp3");
          break;
        case 'success':
          audio = new Audio("/hackbook-w95/sounds/ding.mp3");
          break;
        case 'type':
          audio = new Audio("/hackbook-w95/sounds/click.mp3");
          break;
        default:
          return;
      }
      audio.volume = 0.3;
      audio.play().catch(e => console.log("Audio play failed:", e));
    } catch (error) {
      console.error("Sound error:", error);
    }
  }, []);

  // Animation loop for character cycling with weighted target character frequency
  useEffect(() => {
    if (isAnimating && gameStarted && currentSlot < gamePassword.length) {
      animationRef.current = setInterval(() => {
        const targetChar = gamePassword[currentSlot];
        let randomChar;
        
        // 40% chance to show the target character, 60% chance for random
        if (Math.random() < 0.4) {
          randomChar = targetChar;
        } else {
          // Select a random character that's not the target
          const otherChars = characters.split('').filter(char => char !== targetChar);
          randomChar = otherChars[Math.floor(Math.random() * otherChars.length)];
        }
        
        setCurrentChar(randomChar);
      }, speed);

      return () => {
        if (animationRef.current) {
          clearInterval(animationRef.current);
        }
      };
    }
  }, [isAnimating, gameStarted, currentSlot, speed, characters, gamePassword]);

  // Handle character selection (click or keypress)
  const handleCharacterSelect = useCallback(() => {
    const targetChar = gamePassword[currentSlot];
    setAttempts(prev => prev + 1);

    if (currentChar === targetChar) {
      // Correct character
      playSound('success');
      
      const newCrackedChars = [...crackedChars];
      newCrackedChars[currentSlot] = currentChar;
      setCrackedChars(newCrackedChars);
      
      // Move to next slot
      const nextSlot = currentSlot + 1;
      if (nextSlot >= gamePassword.length) {
        // Password complete!
        setGameComplete(true);
        setIsAnimating(false);
        playSound('success');
        setTimeout(() => {
          onSuccess(gamePassword); // Pass the generated password to the parent
        }, 1500);
      } else {
        setCurrentSlot(nextSlot);
        // Increase speed progressively - start slow, get faster
        setSpeed(prev => Math.max(150, prev - 50)); // Minimum 150ms, decrease by 50ms each time for faster progression
      }
    } else {
      // Incorrect character - reset progress
      playSound('error');
      setMisses(prev => prev + 1);
      setShowMismatchDialog(true);
      setScrambleEffect(true);
      
      // Reset progress after failure
      setCrackedChars(new Array(gamePassword.length).fill(""));
      setCurrentSlot(0);
      setSpeed(800); // Reset speed to initial value
      
      // Auto-hide mismatch dialog and continue
      setTimeout(() => {
        setShowMismatchDialog(false);
        setScrambleEffect(false);
      }, 1500);
    }
  }, [currentChar, gamePassword, currentSlot, crackedChars, playSound, onSuccess]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isAnimating && gameStarted && !showMismatchDialog) {
        e.preventDefault();
        handleCharacterSelect();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleCharacterSelect, isAnimating, gameStarted, showMismatchDialog]);

  // Focus the game container for keyboard events
  useEffect(() => {
    if (gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full h-full bg-black text-green-500 p-4 font-mono relative overflow-hidden">
      {/* Header */}
      <div className="mb-4 border-b border-green-500 pb-2">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-green-400">BRUTE FORCE ATTACK SIMULATION</h1>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-300 font-bold px-2"
          >
            [X]
          </button>
        </div>
        <div className="text-sm mt-1">
          Target: <span className="text-yellow-400">{targetFileName}</span>
        </div>
      </div>

      {/* Progress Info */}
      <div className="mb-6 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>Attempts: <span className="text-yellow-400">{attempts}</span></div>
          <div>Misses: <span className="text-red-400">{misses}</span></div>
          <div>Speed: <span className="text-cyan-400">{(1000/speed).toFixed(1)} Hz</span></div>
          <div>Progress: <span className="text-green-400">{currentSlot}/{gamePassword.length}</span></div>
        </div>
      </div>

      {/* Password Display */}
      <div className="mb-8">
        <div className="text-center mb-4">
          <div className="text-lg">PASSWORD RECOVERY IN PROGRESS...</div>
        </div>
        
        <div className="flex justify-center space-x-2 mb-4">
          {Array.from({ length: gamePassword.length }).map((_, index) => (
            <div
              key={index}
              className={clsx(
                "w-12 h-12 border-2 flex items-center justify-center text-2xl font-bold",
                {
                  "border-green-500 bg-green-900": index < currentSlot,
                  "border-yellow-500 bg-yellow-900 animate-pulse": index === currentSlot && isAnimating && gameStarted,
                  "border-gray-500": index > currentSlot || !gameStarted,
                  "animate-bounce": scrambleEffect && index === currentSlot,
                  "border-blue-500 bg-blue-900 animate-pulse": !gameStarted // Different color during initialization
                }
              )}
            >
              {index < currentSlot ? (
                <span className="text-green-300">{crackedChars[index]}</span>
              ) : index === currentSlot && gameStarted ? (
                <span className={clsx("text-yellow-300", { "animate-pulse": isAnimating })}>
                  {isAnimating ? currentChar : "_"}
                </span>
              ) : (
                <span className={clsx("text-gray-500", { "text-blue-300": !gameStarted })}>
                  {!gameStarted ? "?" : "_"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Character Display */}
      {gameStarted && isAnimating && currentSlot < gamePassword.length && (
        <div className="text-center mb-6">
          <div className="text-sm mb-2">SCANNING SLOT {currentSlot + 1}:</div>
          <div className={clsx(
            "text-6xl font-bold border-4 border-yellow-500 w-20 h-20 flex items-center justify-center mx-auto",
            { "animate-spin": scrambleEffect }
          )}>
            <span className="text-yellow-300">{currentChar}</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!gameStarted && (
        <div className="text-center text-sm">
          <div className="text-xl text-yellow-300 font-bold mb-4">INITIALIZING BRUTE FORCE ATTACK...</div>
          <div className="mb-2">System preparing to crack password protection</div>
          <div className="text-xs text-gray-400">Brute force engine starting in 3... 2... 1...</div>
        </div>
      )}

      {gameStarted && isAnimating && !showMismatchDialog && !gameComplete && (
        <div className="text-center text-sm">
          <div className="mb-2">Click the character or press <span className="bg-green-900 px-2 py-1 rounded">SPACE</span> when the correct character appears!</div>
          <div className="text-xs text-gray-400">Target character: <span className="text-yellow-300 font-bold">{gamePassword[currentSlot]}</span></div>
        </div>
      )}

      {/* Game Complete */}
      {gameComplete && (
        <div className="text-center">
          <div className="text-2xl text-green-300 font-bold mb-4 animate-pulse">
            ACCESS GRANTED!
          </div>
          <div className="text-lg">Password: <span className="text-yellow-300">{gamePassword}</span></div>
          <div className="text-sm mt-2 text-gray-400">Launching file viewer...</div>
        </div>
      )}

      {/* Click Area (invisible) */}
      {isAnimating && gameStarted && !showMismatchDialog && (
        <div
          ref={gameContainerRef}
          tabIndex={0}
          className="absolute inset-0 cursor-pointer"
          onClick={handleCharacterSelect}
          onKeyDown={(e) => {
            if (e.code === 'Space') {
              e.preventDefault();
              handleCharacterSelect();
            }
          }}
        />
      )}

      {/* Hash Mismatch Dialog */}
      {showMismatchDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-red-900 border-2 border-red-500 p-6 text-center">
            <div className="text-red-300 font-bold text-lg mb-2">HASH MISMATCH</div>
            <div className="text-red-400">Incorrect character detected</div>
            <div className="text-sm mt-2 text-gray-400">Rescanning...</div>
          </div>
        </div>
      )}

      {/* Matrix-style background effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-green-500 text-xs animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            {characters[Math.floor(Math.random() * characters.length)]}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BruteForceGame;
