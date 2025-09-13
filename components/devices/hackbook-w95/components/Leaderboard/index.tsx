"use client";

import React, { useState, useEffect } from "react";
import { getTopLeaderboardEntries } from "@/app/actions/leaderboard";
import { logger } from '@/lib/logger';

interface LeaderboardProps {
  game: string;
  className?: string;
  currentScore?: number;
  initialDifficulty?: string;
}

interface LeaderboardEntry {
  _id: string;
  username: string;
  score: number;
  difficulty: string;
  timeRemaining: number;
  completedEvents: number;
  date: string; // Changed from Date to string for serialization
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  game, 
  className = "",
  currentScore,
  initialDifficulty = "normal"
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(initialDifficulty);
  const [currentPlayerRank, setCurrentPlayerRank] = useState<number | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const result = await getTopLeaderboardEntries(game, 10, selectedDifficulty);
        if (result.success) {
          setEntries(result.entries);
          
          // If we have a current score, calculate where it would rank
          if (currentScore !== undefined) {
            const rank = result.entries.findIndex(entry => entry.score < currentScore) + 1;
            setCurrentPlayerRank(rank > 0 ? rank : result.entries.length + 1);
          } else {
            setCurrentPlayerRank(null);
          }
        }
      } catch (error) {
        logger.error('Error loading leaderboard:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      } finally {
        setLoading(false);
      }
    };
    
    loadLeaderboard();
  }, [game, selectedDifficulty, currentScore]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className={`bg-[#d4d0c8] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] border-2 p-4 ${className}`}>
      <h3 className="font-bold text-lg mb-4">Leaderboard</h3>
      
      <div className="mb-4">
        <div className="flex mb-2">
          <span className="mr-2">Filter by:</span>
          <div className="flex space-x-1">
            <button
              className={`px-2 py-0.5 text-sm border-2 ${
                selectedDifficulty === "easy" 
                  ? "border-[#808080] border-t-[#404040] border-l-[#404040] bg-[#c0c0c0] shadow-inner" 
                  : "border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080]"
              }`}
              onClick={() => setSelectedDifficulty("easy")}
            >
              Easy
            </button>
            <button
              className={`px-2 py-0.5 text-sm border-2 ${
                selectedDifficulty === "normal" 
                  ? "border-[#808080] border-t-[#404040] border-l-[#404040] bg-[#c0c0c0] shadow-inner" 
                  : "border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080]"
              }`}
              onClick={() => setSelectedDifficulty("normal")}
            >
              Normal
            </button>
            <button
              className={`px-2 py-0.5 text-sm border-2 ${
                selectedDifficulty === "hard" 
                  ? "border-[#808080] border-t-[#404040] border-l-[#404040] bg-[#c0c0c0] shadow-inner" 
                  : "border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080]"
              }`}
              onClick={() => setSelectedDifficulty("hard")}
            >
              Hard
            </button>
            <button
              className={`px-2 py-0.5 text-sm border-2 ${
                selectedDifficulty === "nightmare" 
                  ? "border-[#808080] border-t-[#404040] border-l-[#404040] bg-[#c0c0c0] shadow-inner" 
                  : "border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080]"
              }`}
              onClick={() => setSelectedDifficulty("nightmare")}
            >
              Nightmare
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] border-2 p-2">
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-4">No scores yet. Be the first!</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-1 px-2 text-left">Rank</th>
                <th className="py-1 px-2 text-left">Player</th>
                <th className="py-1 px-2 text-left">Score</th>
                <th className="py-1 px-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr 
                  key={entry._id} 
                  className={`hover:bg-[#ececec] ${index % 2 === 0 ? 'bg-[#f5f5f5]' : ''}`}
                >
                  <td className="py-1 px-2 font-bold">{index + 1}</td>
                  <td className="py-1 px-2">{entry.username}</td>
                  <td className="py-1 px-2 font-bold">{entry.score}</td>
                  <td className="py-1 px-2 text-xs">{formatDate(entry.date)}</td>
                </tr>
              ))}
              
              {/* Show where current score would rank if provided and not already in top 10 */}
              {currentScore !== undefined && currentPlayerRank !== null && currentPlayerRank > entries.length && (
                <tr className="bg-yellow-100 border-t-2 border-yellow-300">
                  <td className="py-1 px-2 font-bold">{currentPlayerRank}</td>
                  <td className="py-1 px-2">You (current score)</td>
                  <td className="py-1 px-2 font-bold">{currentScore}</td>
                  <td className="py-1 px-2 text-xs">Just now</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {currentPlayerRank !== null && currentPlayerRank <= entries.length && currentPlayerRank <= 3 && (
        <div className="mt-4 p-3 bg-yellow-100 border-2 border-yellow-400 text-center animate-pulse">
          <p className="font-bold">Congratulations!</p>
          <p>You made it to the top {currentPlayerRank === 1 ? "spot" : `${currentPlayerRank}`}!</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
