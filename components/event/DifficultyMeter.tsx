"use client";

import React from "react";
import { DifficultyMeterProps } from "@/types/event";

const DifficultyMeter = ({ level }: DifficultyMeterProps) => {
  const difficultyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];
  const levelIndex = difficultyLevels.indexOf(level);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Difficulty</span>
        <span className="text-cyber-primary">{level}</span>
      </div>
      <div className="flex space-x-1">
        {difficultyLevels.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index <= levelIndex
                ? "bg-gradient-to-r from-cyber-primary to-cyber-secondary"
                : "bg-gray-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default DifficultyMeter;
