"use client";

import React, { useState, useEffect } from "react";
import { CountdownTimerProps } from "@/types/event";

const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calcTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calcTimeLeft();
    const timer = setInterval(calcTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex justify-center space-x-4">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-cyber-primary relative">
            <div className="absolute inset-0 animate-pulse opacity-50 blur-sm bg-cyber-primary rounded-lg"></div>
            <div className="relative z-10">
              {value.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="text-xs uppercase text-gray-400 mt-1">{unit}</div>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
