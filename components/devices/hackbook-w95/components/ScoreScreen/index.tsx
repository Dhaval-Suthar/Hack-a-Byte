"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Button from "@/components/ui/Button";
import Leaderboard from "../Leaderboard";
import { addLeaderboardEntry } from "@/app/actions/leaderboard";
import GameDifficultyManager from "../../hooks/useGameDifficulty";
import audioManager from "../../hooks/useAudioManager";
import './styles.css';

interface ScoreScreenProps {
  score: number;
  timeRemaining: number;
  completedEvents: number;
  totalEvents: number;
  difficulty: string;
  deviceId?: string;
  onReplay: (difficulty: string) => void;
  onClose: () => void;
}

const ScoreScreen: React.FC<ScoreScreenProps> = ({
  score,
  timeRemaining,
  completedEvents,
  totalEvents,
  difficulty,
  deviceId,
  onReplay,
  onClose,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(difficulty || "normal");
  const [showConfetti, setShowConfetti] = useState(true);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  
  // Toggle between results and leaderboard
  const [activeTab, setActiveTab] = useState<'results' | 'leaderboard'>('results');

  // Memoize confetti particles to prevent re-renders
  const confettiParticles = useMemo(() => {
    const colors = [`#ff0000`, `#00ff00`, `#0000ff`, `#ffff00`, `#ff00ff`, `#00ffff`];
    return Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: Math.random() * 10 + 5,
      height: Math.random() * 10 + 5,
      animationDuration: Math.random() * 5 + 3,
      animationDelay: Math.random() * 5,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, []); // Empty dependency array means this runs only once

  // Calculate grade based on score
  const getGrade = (score: number): string => {
    if (score >= 90) return "S";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
  };

  // Calculate message based on score
  const getMessage = (score: number): string => {
    if (score >= 90) return "Elite Hacker Status!";
    if (score >= 80) return "Outstanding Performance!";
    if (score >= 70) return "Great Job!";
    if (score >= 60) return "Mission Accomplished!";
    if (score >= 50) return "Barely Made It!";
    return "Better Luck Next Time!";
  };

  // Submit score to leaderboard
  const submitScore = useCallback(async () => {
    if (deviceId && !scoreSubmitted) {
      try {
        const result = await addLeaderboardEntry(deviceId, {
          score,
          difficulty,
          timeRemaining,
          completedEvents,
          game: "quick-event-presser"
        });
        
        if (result.success) {
          setScoreSubmitted(true);
        } else {
          console.error("Failed to submit score:", result.error);
        }
      } catch (error) {
        console.error("Error submitting score:", error);
      }
    }
  }, [deviceId, scoreSubmitted, score, difficulty, timeRemaining, completedEvents]);

  // Play victory sound and submit score
  useEffect(() => {
    // Play sound using audio manager
    audioManager.playSound("/hackbook-W95/sounds/ding.mp3", 0.7);

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []); // Remove deviceId from dependencies to prevent re-runs

  // Separate effect for score submission to prevent infinite loops
  useEffect(() => {
    if (deviceId && !scoreSubmitted) {
      submitScore();
    }
  }, [deviceId, scoreSubmitted, submitScore]);

  // Auto-switch to leaderboard tab after score submission
  useEffect(() => {
    if (scoreSubmitted) {
      const timer = setTimeout(() => {
        setActiveTab('leaderboard');
      }, 1000); // Small delay to show submission feedback
      
      return () => clearTimeout(timer);
    }
  }, [scoreSubmitted]); // Remove setActiveTab dependency as it's stable

  const grade = getGrade(score);
  const message = getMessage(score);

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#008080] to-[#006666] text-white p-8 flex flex-col items-center justify-center font-mono relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          animation: 'float 20s linear infinite'
        }} />
      </div>

      {/* Windows 95 style window with enhanced styling */}
      <div className="bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] border-2 text-black p-0 w-[95%] max-w-4xl shadow-2xl relative z-10 animate-slideIn">
        {/* Enhanced title bar */}
        <div className="bg-gradient-to-r from-[#000080] to-[#0040ff] text-white p-2 flex items-center justify-between shadow-md">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border border-[#808080] mr-2 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#000080]"></div>
            </div>
            <span className="text-lg font-bold ml-1">🎯 Mission Results Dashboard</span>
          </div>
          <div className="flex space-x-1">
            <div className="w-4 h-4 bg-[#c0c0c0] border border-[#808080] flex items-center justify-center text-xs">_</div>
            <div className="w-4 h-4 bg-[#c0c0c0] border border-[#808080] flex items-center justify-center text-xs">□</div>
          </div>
        </div>

        {/* Enhanced tabs with animation */}
        <div className="flex border-b border-[#808080] bg-[#d4d0c8]">
          <button
            className={`px-6 py-3 font-bold transition-all duration-200 relative ${
              activeTab === 'results'
                ? 'bg-[#c0c0c0] border-t-2 border-l-2 border-r-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-0 transform -translate-y-0.5'
                : 'bg-[#a0a0a0] hover:bg-[#b0b0b0]'
            }`}
            onClick={() => setActiveTab('results')}
          >
            📊 Your Score
            {activeTab === 'results' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c0c0c0]"></div>
            )}
          </button>
          <button
            className={`px-6 py-3 font-bold transition-all duration-200 relative ${
              activeTab === 'leaderboard'
                ? 'bg-[#c0c0c0] border-t-2 border-l-2 border-r-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-0 transform -translate-y-0.5'
                : 'bg-[#a0a0a0] hover:bg-[#b0b0b0]'
            }`}
            onClick={() => setActiveTab('leaderboard')}
          >
            🏆 Leaderboard
            {activeTab === 'leaderboard' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c0c0c0]"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-8 bg-[#c0c0c0] max-h-[70vh] overflow-y-auto score-content">
          {activeTab === 'results' ? (
            <div className="space-y-6">
              {/* Hero section with enhanced styling */}
              <div className="text-center mb-8 relative">
                <div className="bg-gradient-to-r from-[#000080] to-[#0040ff] text-white p-6 rounded-lg shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-20">
                    <div className="text-6xl">🎯</div>
                  </div>
                  <h1 className="text-4xl font-bold mb-3 relative z-10 animate-bounce">Mission Complete!</h1>
                  <h2 className="text-2xl font-bold relative z-10">{message}</h2>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
                </div>
              </div>

              {/* Enhanced score display with visual improvements */}
              <div className="bg-[#ffffff] border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] border-2 p-6 mb-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-lg">Final Assessment:</span>
                  <div className="flex items-center space-x-4">
                    <div className={`text-6xl font-bold px-4 py-2 rounded-lg border-2 animate-pulse ${
                      grade === 'S' ? 'text-yellow-500 bg-yellow-50 border-yellow-200' :
                      grade === 'A' ? 'text-green-500 bg-green-50 border-green-200' :
                      grade === 'B' ? 'text-blue-500 bg-blue-50 border-blue-200' :
                      grade === 'C' ? 'text-orange-500 bg-orange-50 border-orange-200' :
                      'text-red-500 bg-red-50 border-red-200'
                    }`}>
                      {grade}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#f0f0f0] p-4 rounded border border-[#808080]">
                    <div className="text-sm text-gray-600 mb-1">Score</div>
                    <div className="text-2xl font-bold text-[#000080]">{score} points</div>
                  </div>
                  
                  <div className="bg-[#f0f0f0] p-4 rounded border border-[#808080]">
                    <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
                    <div className="text-2xl font-bold text-[#000080]">{completedEvents}/{totalEvents}</div>
                  </div>
                  
                  <div className="bg-[#f0f0f0] p-4 rounded border border-[#808080]">
                    <div className="text-sm text-gray-600 mb-1">Time Remaining</div>
                    <div className="text-2xl font-bold text-[#000080]">{timeRemaining}s</div>
                  </div>
                  
                  <div className="bg-[#f0f0f0] p-4 rounded border border-[#808080]">
                    <div className="text-sm text-gray-600 mb-1">Difficulty</div>
                    <div className="text-xl font-bold text-[#000080] capitalize">{difficulty}</div>
                  </div>
                </div>
                
                {/* Enhanced progress bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Performance</span>
                    <span>{score}%</span>
                  </div>
                  <div className="w-full h-6 bg-[#d4d0c8] border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] border-2 rounded overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#000080] to-[#0040ff] transition-all duration-1000 ease-out relative overflow-hidden"
                      style={{ width: `${Math.min(score, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced difficulty selection */}
              <div className="bg-gradient-to-br from-[#d4d0c8] to-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] border-2 p-6 mb-6 shadow-lg">
                <h3 className="font-bold mb-4 text-lg flex items-center">
                  ⚙️ Configure Next Mission:
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "easy", label: "Easy", desc: "More time, slower events", color: "green", icon: "🟢" },
                    { value: "normal", label: "Normal", desc: "Standard challenge", color: "blue", icon: "🔵" },
                    { value: "hard", label: "Hard", desc: "Less time, faster events", color: "orange", icon: "🟠" },
                    { value: "nightmare", label: "Nightmare", desc: "Extreme challenge", color: "red", icon: "🔴" }
                  ].map((diff) => (
                    <label key={diff.value} className={`flex items-center space-x-3 p-3 rounded cursor-pointer transition-all duration-200 border-2 ${
                      selectedDifficulty === diff.value 
                        ? 'bg-white border-[#000080] shadow-md transform scale-105' 
                        : 'bg-[#f0f0f0] border-[#c0c0c0] hover:bg-white hover:border-[#808080]'
                    }`}>
                      <input
                        type="radio"
                        name="difficulty"
                        value={diff.value}
                        checked={selectedDifficulty === diff.value}
                        onChange={() => {
                          setSelectedDifficulty(diff.value);
                          GameDifficultyManager.setGlobalDifficulty(diff.value);
                        }}
                        className="hidden"
                      />
                      <div className="text-2xl">{diff.icon}</div>
                      <div className="flex-1">
                        <div className={`font-bold ${diff.value === 'nightmare' ? 'text-red-600' : 'text-black'}`}>
                          {diff.label}
                        </div>
                        <div className="text-sm text-gray-600">{diff.desc}</div>
                      </div>
                      {selectedDifficulty === diff.value && (
                        <div className="text-[#000080] text-xl">✓</div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Enhanced buttons */}
              <div className="flex justify-center space-x-6">
                <Button
                  onClick={() => {
                    // Save the selected difficulty globally for all games
                    GameDifficultyManager.setGlobalDifficulty(selectedDifficulty);
                    
                    // Reset game progress flags
                    if (typeof window !== 'undefined') {
                      // Get the values we want to preserve
                      const deviceId = localStorage.getItem("selectedDeviceId");
                      const playspaceId = localStorage.getItem("playspaceId");
                      
                      // Clear all localStorage
                      localStorage.clear();
                      
                      // Restore the values we want to keep
                      if (deviceId) localStorage.setItem("selectedDeviceId", deviceId);
                      if (playspaceId) localStorage.setItem("playspaceId", playspaceId);
                      
                      // Reset database progress if device ID is available
                      if (deviceId) {
                        // Import and call reset function
                        import('@/app/actions/userProgress').then(async ({ resetAllProgress }) => {
                          try {
                            if (resetAllProgress) {
                              await resetAllProgress(deviceId, "hackbook-w95");
                            }
                          } catch (error) {
                            console.error("Error resetting database progress:", error);
                          }
                        });
                      }
                      
                      // Dispatch reset event before reloading
                      window.dispatchEvent(new CustomEvent('resetGameState'));
                      
                      // Reload the page to restart everything fresh
                      window.location.reload();
                    } else {
                      // Fallback to just calling the replay function if window is not available
                      onReplay(selectedDifficulty);
                    }
                  }}
                  className="bg-gradient-to-r from-[#d4d0c8] to-[#e8e4e0] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] border-2 text-black hover:from-[#e8e4e0] hover:to-[#f0f0f0] px-8 py-3 font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  🔄 Play Again
                </Button>
                <Button
                  onClick={() => {
                    // Save the selected difficulty globally before closing
                    GameDifficultyManager.setGlobalDifficulty(selectedDifficulty);
                    onClose();
                  }}
                  className="bg-gradient-to-r from-[#000080] to-[#0040ff] text-white hover:from-[#0040ff] hover:to-[#0060ff] px-8 py-3 font-bold shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-[#000040]"
                >
                  ➡️ Continue Mission
                </Button>
              </div>
            </div>
          ) : (
            <Leaderboard
              game="quick-event-presser"
              currentScore={score}
              initialDifficulty={difficulty}
              className="mb-4"
            />
          )}
        </div>
      </div>

      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {confettiParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: `${particle.width}px`,
                height: `${particle.height}px`,
                animation: `fall ${particle.animationDuration}s linear infinite`,
                animationDelay: `${particle.animationDelay}s`,
                backgroundColor: particle.backgroundColor,
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 100px)) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ScoreScreen;
