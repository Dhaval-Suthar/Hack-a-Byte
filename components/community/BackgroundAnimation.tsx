"use client";
import React, { useEffect, useState, useCallback } from "react";

interface Dot {
  top: number;
  left: number;
  id: number;
  size: number;
  speed: number;
  direction: number;
}

interface BackgroundAnimationProps {
  scanlines: boolean;
}

export const BackgroundAnimation = ({ scanlines }: BackgroundAnimationProps) => {
  const [dots, setDots] = useState<Dot[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const initializeDots = useCallback(() => {
    const heightWindow = window.innerHeight;
    const widthWindow = window.innerWidth;
    return Array.from({ length: 40 }, (_, i) => ({
      top: Math.floor(Math.random() * heightWindow),
      left: Math.floor(Math.random() * widthWindow),
      id: i,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 2 + 0.5,
      direction: Math.random() > 0.5 ? 1 : -1,
    }));
  }, []);

  useEffect(() => {
    setDots(initializeDots());

    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.pageX, y: event.pageY });
    };

    const handleMouseOut = () => {
      setMousePosition({ x: 0, y: 0 });
    };

    const handleResize = () => {
      setDots(initializeDots());
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("resize", handleResize);

    const interval = setInterval(() => {
      setDots((prevDots) =>
        prevDots.map((dot) => {
          let newTop = dot.top + dot.speed * dot.direction;
          let newLeft = dot.left + (Math.random() - 0.5) * 2;

          // Boundary checks
          if (newTop > window.innerHeight) newTop = 0;
          if (newTop < 0) newTop = window.innerHeight;
          if (newLeft > window.innerWidth) newLeft = 0;
          if (newLeft < 0) newLeft = window.innerWidth;

          return {
            ...dot,
            top: newTop,
            left: newLeft,
          };
        })
      );
    }, 50);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
    };
  }, [initializeDots]);

  return (
    <>
      {/* Background elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black opacity-95" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at center, rgba(0, 255, 65, 0.1) 0%, transparent 70%)",
          }}
        />
        {scanlines && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 2px, rgba(0, 0, 0, 0.5) 2px, rgba(0, 0, 0, 0.5) 4px)",
              backgroundSize: "100% 4px",
              opacity: 0.2,
            }}
          />
        )}
      </div>

      {/* Network visualization */}
      <div className="absolute w-screen h-screen pointer-events-none">
        <svg width="100%" height="100%" id="svg">
          <defs>
            <filter id="cyber-glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k1="0" k2="1" k3="0" k4="0" />
            </filter>
          </defs>

          <g filter="url(#cyber-glow)">
            {dots.map((dot) => (
              <circle
                key={dot.id}
                className="dot"
                cx={dot.left}
                cy={dot.top}
                r={dot.size}
                fill="rgba(0, 255, 65, 0.4)"
              />
            ))}
          </g>

          {mousePosition.x !== 0 &&
            dots
              .filter(
                (dot) => Math.abs(dot.top - mousePosition.y) <= 200 && Math.abs(dot.left - mousePosition.x) <= 200
              )
              .map((dot) => (
                <line
                  key={`line_${dot.id}`}
                  className="line"
                  x1={dot.left}
                  y1={dot.top}
                  x2={mousePosition.x}
                  y2={mousePosition.y}
                  stroke="rgba(0, 255, 65, 0.2)"
                  strokeWidth={0.5}
                />
              ))}
        </svg>
      </div>
    </>
  );
};
