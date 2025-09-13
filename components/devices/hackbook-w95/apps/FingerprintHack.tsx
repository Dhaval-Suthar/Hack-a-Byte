"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import clsx from "clsx";
import audioManager from "../hooks/useAudioManager";
import GameDifficultyManager from "../hooks/useGameDifficulty";
import gameScoring, { GameScoringManager } from "../hooks/useGameScoring";
import { useGameFailureHandler } from "../hooks/useGameFailureHandler";
import Win95Alert from "../Win95Alert";
import { getMainImagePath, getRightPatternPath, getWrongPatternPath, testImageLoad } from "../../../../lib/fingerprint-images";
import FingerprintImage from "../components/FingerprintImage";

interface FingerprintHackProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type GameState = "intro" | "playing" | "success" | "failed";

interface FingerprintSegment {
  id: number;
  mainImage: string;
  correctPattern: string;
  isCorrect: boolean;
  completed: boolean;
}

const FingerprintHack: React.FC<FingerprintHackProps> = ({ onClose, onSuccess }) => {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [currentSegment, setCurrentSegment] = useState<number>(0);
  const [segments, setSegments] = useState<FingerprintSegment[]>([]);
  const [availablePatterns, setAvailablePatterns] = useState<string[][]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Game failure handler
  const { handleFailure, isProcessingFailure, alertMessage, showAlert, closeAlert } = useGameFailureHandler();
  
  // Get difficulty configuration
  const getDifficultyConfig = useCallback(() => {
    const difficulty = GameDifficultyManager.getGlobalDifficulty();
    
    switch (difficulty) {
      case "easy":
        return { segments: 3, timeLimit: 90, wrongPatterns: 3 };
      case "normal":
        return { segments: 4, timeLimit: 60, wrongPatterns: 5 };
      case "hard":
        return { segments: 5, timeLimit: 45, wrongPatterns: 7 };
      case "nightmare":
        return { segments: 6, timeLimit: 30, wrongPatterns: 9 };
      default:
        return { segments: 4, timeLimit: 60, wrongPatterns: 5 };
    }
  }, []);

  // Start game tracking on component mount
  useEffect(() => {
    const currentDifficulty = GameDifficultyManager.getGlobalDifficulty();
    gameScoring.startGame(GameScoringManager.FINGERPRINT_HACK, currentDifficulty);
  }, []);

  // Handle game failure - delete account and redirect
  useEffect(() => {
    if (gameState === "failed" && !isProcessingFailure) {
      // Give a brief moment to show the failure message, then delete account
      const timer = setTimeout(() => {
        handleFailure();
      }, 3000); // Show failure screen for 3 seconds before account deletion

      return () => clearTimeout(timer);
    }
  }, [gameState, handleFailure, isProcessingFailure]);
  
  // Initialize fingerprint segments
  useEffect(() => {
    const config = getDifficultyConfig();
    const newSegments: FingerprintSegment[] = [];
    const newAvailablePatterns: string[][] = [];
    
    // Set time limit based on difficulty
    setTimeLeft(config.timeLimit);
    
    for (let i = 0; i < config.segments; i++) {
      const segmentNumber = (i % 4) + 1; // Cycle through available segments
      // Each segment has 4 possible correct patterns
      const correctPatternIndex = Math.floor(Math.random() * 4) + 1;
      
      const mainImagePath = getMainImagePath(segmentNumber);
      const correctPatternPath = getRightPatternPath(segmentNumber, correctPatternIndex);
      
      // Debug logging for image paths
      
      // Test image loading (preload images)
      testImageLoad(mainImagePath);
      testImageLoad(correctPatternPath);
      
      newSegments.push({
        id: i,
        mainImage: mainImagePath,
        correctPattern: correctPatternPath,
        isCorrect: false,
        completed: false
      });

      // Create a mix of correct and wrong patterns for selection
      const segmentPatterns: string[] = [];
      
      // Add the correct pattern
      segmentPatterns.push(correctPatternPath);
      
      // Add wrong patterns based on difficulty
      const wrongPatterns: string[] = [];
      
      // Add wrong patterns for this segment
      for (let w = 1; w <= 4; w++) {
        wrongPatterns.push(getWrongPatternPath(segmentNumber, w));
      }
      
      // Add right patterns from OTHER segments to make it more challenging
      for (let otherSegment = 1; otherSegment <= 4; otherSegment++) {
        if (otherSegment !== segmentNumber) {
          for (let r = 1; r <= 4; r++) {
            wrongPatterns.push(getRightPatternPath(otherSegment, r));
          }
        }
      }
      
      // Shuffle and pick wrong patterns based on difficulty
      const shuffledWrong = wrongPatterns.sort(() => Math.random() - 0.5).slice(0, config.wrongPatterns);
      segmentPatterns.push(...shuffledWrong);
      
      // Shuffle all patterns so correct one isn't always first
      newAvailablePatterns.push(segmentPatterns.sort(() => Math.random() - 0.5));
    }
    
    setSegments(newSegments);
    setAvailablePatterns(newAvailablePatterns);
  }, [getDifficultyConfig]);
  
  // Sound effect helper
  const playSound = (name: string) => {
    audioManager.playSound(`/hackbook-W95/sounds/${name}.mp3`, 0.7);
  };

  // Timer logic
  useEffect(() => {
    if (gameState !== "playing") return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setGameState("failed");
          playSound("error");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, onClose]);

  // Reset on intro
  useEffect(() => {
    if (gameState === "intro") {
      setTimeLeft(60);
      setCurrentSegment(0);
      setAttempts(0);
      
      // Reset all segments
      setSegments(prev => prev.map(s => ({ ...s, completed: false, isCorrect: false })));
    }
  }, [gameState]);

  // Check for win condition
  useEffect(() => {
    if (segments.length > 0 && segments.every(s => s.completed)) {
      clearInterval(timerRef.current!);
      setGameState("success");
      playSound("ding");
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2500);
    }
  }, [segments, onSuccess, onClose]);

  // Handle pattern selection
  const handleSelectPattern = (selectedPattern: string) => {
    if (gameState !== "playing") return;
    
    const segment = segments[currentSegment];
    const isCorrect = segment.correctPattern === selectedPattern;
    
    if (isCorrect) {
      // Mark segment as completed with correct pattern
      playSound("ding");
      setSegments(prev => 
        prev.map((s, i) => i === currentSegment ? { ...s, completed: true, isCorrect: true } : s)
      );
      
      // Move to next segment
      if (currentSegment < 3) {
        setCurrentSegment(prev => prev + 1);
      }
    } else {
      // Wrong pattern selected
      playSound("error");
      setAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= 5) {
          setGameState("failed");
          clearInterval(timerRef.current!);
        }
        return newAttempts;
      });
    }
  };

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center relative select-none">
      {/* Header */}
      <div className="w-full bg-[#121212] text-green-500 p-2 flex justify-between items-center border-b border-green-800">
        <span className="font-bold">FINGERPRINT HACK - VAULT ACCESS</span>
        <div className="flex items-center gap-4">
          <span className="text-amber-500 font-mono">ATTEMPTS: {5 - attempts}/5</span>
          <span className="text-green-500 font-mono">
            {gameState === "playing" ? `TIME: ${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}` : null}
          </span>
          <button onClick={onClose} className="bg-[#333] text-red-500 px-2 py-1 text-sm border border-red-800 hover:bg-red-900 transition-colors">×</button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full bg-[#121212] p-4">
        {gameState === "intro" && (
          <div className="flex flex-col items-center justify-center h-full cursor-pointer" onClick={() => { setGameState("playing"); playSound("ding"); }}>
            <h2 className="text-2xl font-bold mb-2 text-green-500">FINGERPRINT IDENTIFICATION REQUIRED</h2>
            <p className="mb-4 text-green-400">Match all 4 fingerprint segments to bypass security.</p>
            
            <div className="grid grid-cols-2 grid-rows-2 gap-4 mb-6 w-96 h-96">
              {segments.map((segment, index) => (
                <div key={index} className="bg-[#1a1a1a] border-2 border-green-900 p-2 flex items-center justify-center">
                  <div className="bg-black w-full h-full flex items-center justify-center relative">
                    {segment.mainImage ? (
                      <FingerprintImage 
                        src={segment.mainImage} 
                        alt={`Fingerprint segment ${index + 1}`}
                        className="object-contain opacity-30"
                      />
                    ) : (
                      <div className="text-5xl text-green-700 opacity-50">?</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <span className="text-xs text-green-600 animate-pulse">CLICK ANYWHERE TO START</span>
          </div>
        )}

        {gameState === "playing" && (
          <div className="flex flex-row items-stretch justify-between w-full h-full gap-6">
            {/* Left side - Segments display */}
            <div className="flex-1 flex flex-col">
              <div className="bg-[#1a1a1a] border border-green-900 mb-4 p-2">
                <h3 className="text-green-500 font-mono text-sm">FINGERPRINT MATCHING IN PROGRESS</h3>
                <div className="text-amber-500 text-xs mb-2">
                  {segments.filter(s => s.completed).length}/4 SEGMENTS MATCHED
                </div>
              </div>
              
              <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1">
                {segments.map((segment, idx) => (
                  <div 
                    key={segment.id}
                    className={clsx(
                      "border-2 p-1 transition-all duration-300", 
                      currentSegment === idx ? "border-amber-500" : segment.completed ? "border-green-600" : "border-gray-800",
                      segment.completed ? "bg-[#0a2010]" : "bg-[#1a1a1a]"
                    )}
                  >
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      {segment.completed ? (
                        <div className="relative w-full h-full">
                          <FingerprintImage 
                            src={segment.mainImage} 
                            alt={`Fingerprint segment ${idx + 1}`}
                            className="object-contain opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-green-500 text-2xl bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center">✓</div>
                          </div>
                        </div>
                      ) : currentSegment === idx ? (
                        <div className="relative w-full h-full">
                          <FingerprintImage 
                            src={segment.mainImage} 
                            alt={`Fingerprint segment ${idx + 1}`}
                            className="object-contain opacity-60"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-amber-500 text-xs animate-pulse bg-black bg-opacity-70 p-1 rounded">SELECT MATCHING PATTERN</div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <FingerprintImage 
                            src={segment.mainImage} 
                            alt={`Fingerprint segment ${idx + 1}`}
                            className="object-contain opacity-30"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-green-700 opacity-50 text-5xl">?</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right side - Pattern selector */}
            <div className="w-1/2 flex flex-col">
              <div className="bg-[#1a1a1a] border border-green-900 mb-4 p-2">
                <h3 className="text-green-500 font-mono text-sm">SELECT CORRECT FINGERPRINT PATTERN</h3>
                <div className="text-amber-500 text-xs">
                  CURRENT SEGMENT: {currentSegment + 1}/4
                </div>
              </div>
              
              <div className="bg-[#0a0a0a] border border-green-900 p-3 flex-1">
                {availablePatterns[currentSegment] ? (
                  <div className="grid grid-cols-3 grid-rows-2 gap-2">
                    {availablePatterns[currentSegment].map((patternImage, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPattern(patternImage)}
                        disabled={segments[currentSegment]?.completed}
                        className={clsx(
                          "bg-black border hover:border-green-500 transition-colors p-1 h-28",
                          segments[currentSegment]?.completed && segments[currentSegment].correctPattern === patternImage
                            ? "border-green-500" 
                            : "border-gray-800"
                        )}
                      >
                        <div className="w-full h-full flex items-center justify-center relative">
                          <FingerprintImage 
                            src={patternImage} 
                            alt={`Pattern option ${idx + 1}`}
                            className="object-contain"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-green-500">
                    Loading patterns...
                  </div>
                )}
                
                <div className="flex justify-between mt-4">
                  <button 
                    className="px-3 py-1 bg-[#1a1a1a] text-green-500 border border-green-900 hover:bg-[#0a2010] transition-colors text-xs"
                    onClick={() => setGameState("intro")}
                  >
                    RESTART
                  </button>
                  <div className="text-amber-500 text-xs flex items-center">
                    {attempts > 0 && (
                      <>
                        <span className="mr-1">ERRORS:</span>
                        {[...Array(attempts)].map((_, i) => (
                          <span key={i} className="text-red-500 mx-px">■</span>
                        ))}
                        {[...Array(5 - attempts)].map((_, i) => (
                          <span key={i} className="text-gray-800 mx-px">■</span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === "success" && (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-bold mb-4 text-green-500">ACCESS GRANTED</h2>
            <div className="text-6xl mb-4">🔓</div>
            <div className="w-96 h-96 bg-[#0a1a0a] border-4 border-green-700 flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-green-500 text-xl mb-2">FINGERPRINT AUTHENTICATION SUCCESSFUL</div>
                <div className="grid grid-cols-2 grid-rows-2 gap-2 mb-4 mx-auto w-64 h-64">
                  {segments.map((segment) => (
                    <div key={segment.id} className="bg-black border border-green-900 p-1 flex items-center justify-center">
                      <div className="relative w-full h-full">
                        <FingerprintImage 
                          src={segment.mainImage} 
                          alt={`Fingerprint segment ${segment.id + 1}`}
                          className="object-contain opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-green-500 text-xl bg-black bg-opacity-50 rounded-full w-6 h-6 flex items-center justify-center">✓</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-green-400 text-sm animate-pulse">Accessing secured files...</div>
              </div>
            </div>
            <div className="bg-[#0a1a0a] p-4 border-2 border-green-700 text-green-500">
              <p className="font-bold">VAULT BREACH INITIATED</p>
              <p className="text-sm">Security measures bypassed successfully</p>
            </div>
          </div>
        )}

        {gameState === "failed" && (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-bold mb-4 text-red-600">ACCESS DENIED</h2>
            <div className="text-6xl mb-4">🔒</div>
            <div className="w-96 h-96 bg-[#1a0a0a] border-4 border-red-900 flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-red-500 text-xl mb-2">AUTHENTICATION FAILED</div>
                <div className="text-8xl text-red-700 mb-4">X</div>
                <div className="text-red-400 text-sm animate-pulse">Security protocols activated</div>
              </div>
            </div>
            <div className="bg-[#1a0a0a] p-4 border-2 border-red-700 text-red-500 mb-4">
              <p className="font-bold">⚠️ CRITICAL SECURITY BREACH ⚠️</p>
              <p className="text-sm">Account termination initiated</p>
              <p className="text-xs text-red-400 mt-2">
                Your hacker credentials are being revoked due to biometric authentication failure.
              </p>
            </div>
            {isProcessingFailure && (
              <div className="bg-gray-800 text-yellow-400 p-3 font-mono text-sm border border-yellow-600">
                <div className="flex justify-center items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-ping"></div>
                  Processing account termination...
                </div>
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              Redirecting to authentication terminal...
            </div>
          </div>
        )}
      </div>

      {/* Win95Alert for game failure */}
      {showAlert && alertMessage && (
        <Win95Alert message={alertMessage} onClose={closeAlert} />
      )}
    </div>
  );
};

export default FingerprintHack;
