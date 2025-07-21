"use client";

import React, { useState, useEffect } from 'react';

interface ScreenSaverProps {
  timeoutMinutes?: number;
  onExit?: () => void;
}

const ScreenSaver: React.FC<ScreenSaverProps> = ({
  timeoutMinutes = 2,
  onExit,
}) => {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [direction, setDirection] = useState({ x: 1, y: 1 });
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Monitor user activity
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (active) {
        setActive(false);
        if (onExit) onExit();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [active, onExit]);

  // Check inactivity timer
  useEffect(() => {
    const interval = setInterval(() => {
      const inactiveTime = (Date.now() - lastActivity) / 1000 / 60;
      if (inactiveTime >= timeoutMinutes && !active) {
        setActive(true);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [lastActivity, timeoutMinutes, active]);

  // Animate logo when active
  useEffect(() => {
    if (!active) return;

    const speed = 2;
    const logoWidth = 150;
    const logoHeight = 150;

    const animate = () => {
      if (!active) return;

      setPosition(prev => {
        let newX = prev.x + direction.x * speed;
        let newY = prev.y + direction.y * speed;
        let newDirX = direction.x;
        let newDirY = direction.y;

        // Get window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Check horizontal bounds
        if (newX <= 0) {
          newX = 0;
          newDirX = 1;
        } else if (newX + logoWidth >= windowWidth) {
          newX = windowWidth - logoWidth;
          newDirX = -1;
        }

        // Check vertical bounds
        if (newY <= 0) {
          newY = 0;
          newDirY = 1;
        } else if (newY + logoHeight >= windowHeight) {
          newY = windowHeight - logoHeight;
          newDirY = -1;
        }

        // Update direction if needed
        if (newDirX !== direction.x || newDirY !== direction.y) {
          setDirection({ x: newDirX, y: newDirY });
        }

        return { x: newX, y: newY };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    const animationRef = { current: 0 };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, direction]);

  if (!active) return null;

  return (
    <div 
      className="fixed inset-0 bg-black z-50 select-none cursor-none"
      onClick={() => {
        setActive(false);
        if (onExit) onExit();
      }}
    >
      <div
        className="absolute" 
        style={{ left: position.x, top: position.y }}
      >
        <div className="flex items-center justify-center w-[150px] h-[150px]">
          <div className="text-[#008080] font-bold text-6xl transform rotate-45">
            {/* Windows 95 Logo */}
            <div className="grid grid-cols-2 gap-1">
              <div className="w-16 h-16 bg-[#ff0000]"></div>
              <div className="w-16 h-16 bg-[#00ff00]"></div>
              <div className="w-16 h-16 bg-[#0000ff]"></div>
              <div className="w-16 h-16 bg-[#ffff00]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenSaver;
