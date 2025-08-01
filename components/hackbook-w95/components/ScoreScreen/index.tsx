"use client";

import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";
import Leaderboard from "../Leaderboard";
import { addLeaderboardEntry } from "@/app/actions/leaderboard";
import GameDifficultyManager from "../../hooks/useGameDifficulty";
import gameScoring from "../../hooks/useGameScoring";
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
  
  // Get comprehensive scoring data
  const comprehensiveScore = gameScoring.calculateOverallScore();
  const [showComprehensiveScoring, setShowComprehensiveScoring] = useState(comprehensiveScore.gamesCompleted > 1);

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
          setActiveTab('leaderboard'); // Switch to leaderboard tab after submission
          console.log("Score submitted to leaderboard:", result.entry);
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
    audioManager.playSound("/hackbook-w95/sounds/ding.mp3", 0.7);

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

  const grade = getGrade(score);
  const message = getMessage(score);

  // Toggle between results and leaderboard
  const [activeTab, setActiveTab] = useState<'results' | 'leaderboard'>('results');

  return (
    <div className="w-full h-full bg-[#008080] text-white p-8 flex flex-col items-center justify-center font-mono relative overflow-hidden">
      {/* Windows 95 style window */}
      <div className="bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] border-2 text-black p-0 w-[90%] max-w-xl shadow-lg">
        {/* Title bar */}
        <div className="bg-[#000080] text-white p-1 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg font-bold ml-1">Game Results</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#808080]">
          <button
            className={`px-4 py-2 font-bold ${
              activeTab === 'results'
                ? 'bg-[#c0c0c0] border-t-2 border-l-2 border-r-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-0'
                : 'bg-[#a0a0a0]'
            }`}
            onClick={() => setActiveTab('results')}
          >
            Your Score
          </button>
          <button
            className={`px-4 py-2 font-bold ${
              activeTab === 'leaderboard'
                ? 'bg-[#c0c0c0] border-t-2 border-l-2 border-r-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-0'
                : 'bg-[#a0a0a0]'
            }`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'results' ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">Mission Complete!</h1>
                <h2 className="text-2xl text-[#000080] font-bold">{message}</h2>
              </div>

          {/* Score display */}
          <div className="bg-[#ffffff] border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] border-2 p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold">Final Grade:</span>
              <span className="text-4xl font-bold text-[#000080]">{grade}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span>Score:</span>
              <span className="font-bold">{score} points</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span>Events Completed:</span>
              <span>{completedEvents}/{totalEvents}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span>Time Remaining:</span>
              <span>{timeRemaining} seconds</span>
            </div>
            
            <div className="w-full h-4 bg-[#d4d0c8] border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] border-2 mt-4">
              <div 
                className="h-full bg-[#000080]"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Comprehensive Scoring Display */}
          {showComprehensiveScoring && (
            <div className="bg-[#ffffff] border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] border-2 p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">Mission Sequence Score</h3>
                <button 
                  className="text-sm bg-[#c0c0c0] border border-[#808080] px-2 py-1 hover:bg-[#d0d0d0]"
                  onClick={() => setShowComprehensiveScoring(!showComprehensiveScoring)}
                >
                  {showComprehensiveScoring ? '−' : '+'}
                </button>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="font-bold">Total Score:</span>
                <span className="font-bold text-[#000080]">{comprehensiveScore.totalScore} points</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span>Games Completed:</span>
                <span>{comprehensiveScore.gamesCompleted}/5</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span>Average Time:</span>
                <span>{comprehensiveScore.averageTime}s</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span>Total Attempts:</span>
                <span>{comprehensiveScore.totalAttempts}</span>
              </div>
              
              {comprehensiveScore.perfectionBonus > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Perfection Bonus:</span>
                  <span className="text-green-600 font-bold">+{comprehensiveScore.perfectionBonus}</span>
                </div>
              )}
              
              <div className="flex justify-between mb-2">
                <span>Difficulty Multiplier:</span>
                <span>×{comprehensiveScore.difficultyMultiplier}</span>
              </div>
              
              {/* Individual Game Breakdown */}
              <div className="mt-4 pt-3 border-t border-[#808080]">
                <h4 className="font-bold mb-2">Game Breakdown:</h4>
                <div className="text-sm space-y-1">
                  {comprehensiveScore.breakdown.map((gameData, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="truncate">{gameData.game}:</span>
                      <span>{gameData.score}pts ({gameData.time}s, {gameData.attempts} tries)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Difficulty selection */}
          <div className="bg-[#d4d0c8] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] border-2 p-4 mb-6">
            <h3 className="font-bold mb-3">Select Difficulty:</h3>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="difficulty"
                  value="easy"
                  checked={selectedDifficulty === "easy"}
                  onChange={() => {
                    setSelectedDifficulty("easy");
                    GameDifficultyManager.setGlobalDifficulty("easy");
                  }}
                  className="form-radio"
                />
                <span>Easy (More time, slower events)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="difficulty"
                  value="normal"
                  checked={selectedDifficulty === "normal"}
                  onChange={() => {
                    setSelectedDifficulty("normal");
                    GameDifficultyManager.setGlobalDifficulty("normal");
                  }}
                  className="form-radio"
                />
                <span>Normal (Standard challenge)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="difficulty"
                  value="hard"
                  checked={selectedDifficulty === "hard"}
                  onChange={() => {
                    setSelectedDifficulty("hard");
                    GameDifficultyManager.setGlobalDifficulty("hard");
                  }}
                  className="form-radio"
                />
                <span>Hard (Less time, faster events)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="difficulty"
                  value="nightmare"
                  checked={selectedDifficulty === "nightmare"}
                  onChange={() => {
                    setSelectedDifficulty("nightmare");
                    GameDifficultyManager.setGlobalDifficulty("nightmare");
                  }}
                  className="form-radio"
                />
                <span className="text-red-600 font-bold">Nightmare (Extreme challenge)</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => {
                // Save the selected difficulty globally for all games
                GameDifficultyManager.setGlobalDifficulty(selectedDifficulty);
                
                // Reset game progress flags
                if (typeof window !== 'undefined') {
                  // Get device ID for database reset
                  const deviceId = localStorage.getItem("selectedDeviceId");
                  
                  // Reset database progress if device ID is available
                  if (deviceId) {
                    // Import and call reset function
                    import('@/app/actions/userProgress').then(async ({ resetAllProgress }) => {
                      try {
                        if (resetAllProgress) {
                          await resetAllProgress(deviceId, "hackbook-w95");
                          console.log("Database progress reset successfully");
                        }
                      } catch (error) {
                        console.error("Error resetting database progress:", error);
                      }
                    });
                  }
                  
                  // Remove game-specific flags to reset progress
                  localStorage.removeItem("emergencyProtocolLaunched");
                  localStorage.removeItem("secureVaultCompleted");
                  localStorage.removeItem("neuralNetworkCompleted");
                  
                  // Remove app installation flags
                  localStorage.removeItem("networkToolInstalled");
                  localStorage.removeItem("neuralNetworkUnlocked");
                  localStorage.removeItem("vaultUnlocked");
                  localStorage.removeItem("devToolsUnlocked");
                  
                  // Remove mission progress flags
                  localStorage.removeItem("mission1Completed");
                  localStorage.removeItem("mission2Completed");
                  localStorage.removeItem("neural_data_discovered");
                  localStorage.removeItem("mission2JustCompleted");
                  localStorage.removeItem("zebra_code_activated");
                  localStorage.removeItem("final_mission");
                  
                  // Clear any other game state
                  localStorage.removeItem("hasSeenMission");
                  
                  // Dispatch reset event before reloading
                  window.dispatchEvent(new CustomEvent('resetGameState'));
                  
                  // Reload the page to restart everything fresh
                  window.location.reload();
                } else {
                  // Fallback to just calling the replay function if window is not available
                  onReplay(selectedDifficulty);
                }
              }}
              className="bg-[#d4d0c8] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] border-2 text-black hover:bg-[#d4d0c8] px-6 py-2"
            >
              Play Again
            </Button>
            <Button
              onClick={() => {
                // Save the selected difficulty globally before closing
                GameDifficultyManager.setGlobalDifficulty(selectedDifficulty);
                onClose();
              }}
              className="bg-[#d4d0c8] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] border-2 text-black hover:bg-[#d4d0c8] px-6 py-2"
            >
              Continue
            </Button>
          </div>
            </>
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
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-yellow-300 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                animation: `fall ${Math.random() * 5 + 3}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
                backgroundColor: [`#ff0000`, `#00ff00`, `#0000ff`, `#ffff00`, `#ff00ff`, `#00ffff`][
                  Math.floor(Math.random() * 6)
                ],
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
