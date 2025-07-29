"use client";

import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";

interface FingerprintHackProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type GameState = "intro" | "playing" | "success" | "failed";

interface FingerprintSegment {
  id: number;
  pattern: string;
  isCorrect: boolean;
  completed: boolean;
}

const FingerprintHack: React.FC<FingerprintHackProps> = ({ onClose, onSuccess }) => {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [currentSegment, setCurrentSegment] = useState<number>(0);
  const [segments, setSegments] = useState<FingerprintSegment[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize fingerprint segments
  useEffect(() => {
    // Create 4 fingerprint segments, each with a correct pattern (0-5)
    const newSegments: FingerprintSegment[] = [];
    
    for (let i = 0; i < 4; i++) {
      const correctPattern = Math.floor(Math.random() * 6);
      newSegments.push({
        id: i,
        pattern: correctPattern.toString(),
        isCorrect: false,
        completed: false
      });
    }
    
    setSegments(newSegments);
  }, []);
  
  // Sound effect helper
  const playSound = (name: string) => {
    const audio = new Audio(`/hackbook-w95/sounds/${name}.mp3`);
    audio.volume = 0.7;
    audio.play().catch(() => {});
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
          setTimeout(() => onClose(), 2500);
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
  const handleSelectPattern = (patternId: number) => {
    if (gameState !== "playing") return;
    
    const segment = segments[currentSegment];
    const isCorrect = parseInt(segment.pattern) === patternId;
    
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
          setTimeout(() => onClose(), 2500);
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
              {[0, 1, 2, 3].map(index => (
                <div key={index} className="bg-[#1a1a1a] border-2 border-green-900 p-2 flex items-center justify-center">
                  <div className="bg-black w-full h-full flex items-center justify-center">
                    <div className="text-5xl text-green-700 opacity-50">?</div>
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
                        <div className="text-green-500 text-2xl">✓</div>
                      ) : currentSegment === idx ? (
                        <div className="text-amber-500 text-xs animate-pulse">SELECT MATCHING PATTERN</div>
                      ) : (
                        <div className="text-green-700 opacity-50 text-5xl">?</div>
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
                <div className="grid grid-cols-3 grid-rows-2 gap-2">
                  {[0, 1, 2, 3, 4, 5].map(patternId => (
                    <button
                      key={patternId}
                      onClick={() => handleSelectPattern(patternId)}
                      disabled={segments[currentSegment]?.completed}
                      className={clsx(
                        "bg-black border hover:border-green-500 transition-colors p-1 h-28",
                        segments[currentSegment]?.completed && parseInt(segments[currentSegment].pattern) === patternId
                          ? "border-green-500" 
                          : "border-gray-800"
                      )}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-green-500 text-xs">
                          {/* Simplified pattern representation */}
                          <div className="border border-green-700 p-1 w-14 h-14">
                            {patternId === 0 && (
                              <div className="w-full h-full flex flex-col justify-between">
                                <div className="w-full h-0.5 bg-green-500 my-1"></div>
                                <div className="w-full h-0.5 bg-green-500 my-1"></div>
                                <div className="w-full h-0.5 bg-green-500 my-1"></div>
                              </div>
                            )}
                            {patternId === 1 && (
                              <div className="w-full h-full flex flex-row justify-between">
                                <div className="w-0.5 h-full bg-green-500 mx-1"></div>
                                <div className="w-0.5 h-full bg-green-500 mx-1"></div>
                                <div className="w-0.5 h-full bg-green-500 mx-1"></div>
                              </div>
                            )}
                            {patternId === 2 && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full border-2 border-green-500"></div>
                              </div>
                            )}
                            {patternId === 3 && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-green-500 transform rotate-45"></div>
                              </div>
                            )}
                            {patternId === 4 && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-10 h-0.5 bg-green-500 absolute transform rotate-45"></div>
                                <div className="w-10 h-0.5 bg-green-500 absolute transform -rotate-45"></div>
                              </div>
                            )}
                            {patternId === 5 && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-green-500 m-1"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500 m-1"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500 m-1"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
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
                      <div className="text-green-500 text-2xl">✓</div>
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
            <div className="bg-[#1a0a0a] p-4 border-2 border-red-700 text-red-500">
              <p className="font-bold">SECURITY ALERT TRIGGERED</p>
              <p className="text-sm">System lockdown initiated</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FingerprintHack;
