"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import './styles.css';

interface ScoreScreenProps {
  score: number;
  timeRemaining: number;
  completedEvents: number;
  totalEvents: number;
  onReplay: (difficulty: string) => void;
  onClose: () => void;
}

const ScoreScreen: React.FC<ScoreScreenProps> = ({
  score,
  timeRemaining,
  completedEvents,
  totalEvents,
  onReplay,
  onClose,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("normal");
  const [showConfetti, setShowConfetti] = useState(true);

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

  // Play victory sound
  useEffect(() => {
    try {
      const audio = new Audio("/hackbook-W95/sounds/tada.mp3");
      audio.volume = 0.7;
      audio.play().catch(console.log);
    } catch (error) {
      console.log("Audio error:", error);
    }

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const grade = getGrade(score);
  const message = getMessage(score);

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

        {/* Content */}
        <div className="p-6">
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
                  onChange={() => setSelectedDifficulty("easy")}
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
                  onChange={() => setSelectedDifficulty("normal")}
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
                  onChange={() => setSelectedDifficulty("hard")}
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
                  onChange={() => setSelectedDifficulty("nightmare")}
                  className="form-radio"
                />
                <span className="text-red-600 font-bold">Nightmare (Extreme challenge)</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => onReplay(selectedDifficulty)}
              className="bg-[#d4d0c8] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] border-2 text-black hover:bg-[#d4d0c8] px-6 py-2"
            >
              Play Again
            </Button>
            <Button
              onClick={onClose}
              className="bg-[#d4d0c8] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] border-2 text-black hover:bg-[#d4d0c8] px-6 py-2"
            >
              Continue
            </Button>
          </div>
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
