"use client";

import React, { useEffect, useState } from "react";

interface LoginAnimationProps {
  username: string;
  onComplete: () => void;
}

const LoginAnimation: React.FC<LoginAnimationProps> = ({ username, onComplete }) => {
  const [loginStage, setLoginStage] = useState(0);
  const [progressDots, setProgressDots] = useState("");

  useEffect(() => {
    const loginSequence = [
      { delay: 500, stage: 1 },   // Authenticating user
      { delay: 1500, stage: 2 },  // Loading user profile
      { delay: 2500, stage: 3 },  // Preparing desktop
      { delay: 3500, stage: 4 },  // Starting Windows 95
      { delay: 5000, stage: 5 },  // Complete
    ];

    const timeouts: NodeJS.Timeout[] = [];
    
    // Play login sound
    try {
      const loginSound = new Audio("/hackbook-w95/sounds/win95-startup.mp3");
      loginSound.play().catch(e => console.log("Audio play failed:", e));
    } catch (error) {
      console.error("Audio error:", error);
    }

    loginSequence.forEach(({ delay, stage }) => {
      const id = setTimeout(() => {
        if (stage === 5) {
          onComplete();
        } else {
          setLoginStage(stage);
        }
      }, delay);
      timeouts.push(id);
    });
    
    // Progress dots animation
    const dotsInterval = setInterval(() => {
      setProgressDots(prev => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);
    
    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(dotsInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-[#008080] flex items-center justify-center text-black font-mono z-50" style={{fontFamily: '"Perfect DOS VGA 437", monospace'}}>
      {loginStage === 0 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold mr-3">i</div>
              <h2 className="text-lg font-bold">Windows 95</h2>
            </div>
            <p className="mb-4">Logging in{progressDots}</p>
            <div className="flex justify-center">
              <div className="bg-[#c0c0c0] px-4 py-2 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]">
                Please wait...
              </div>
            </div>
          </div>
        </div>
      )}
      
      {loginStage === 1 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold mr-3" role="img" aria-label="Lock icon">🔐</div>
              <h2 className="text-lg font-bold">Authenticating User</h2>
            </div>
            <p className="mb-4">Verifying credentials for: <strong>{username}</strong>{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-1/4 h-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {loginStage === 2 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold mr-3" aria-label="User Profile Icon">👤</div>
              <h2 className="text-lg font-bold">Loading User Profile</h2>
            </div>
            <p className="mb-4">Welcome back, {username}!</p>
            <p className="mb-4 text-sm">Loading personal settings{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-1/2 h-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {loginStage === 3 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold mr-3" aria-label="Desktop icon">🖥️</div>
              <h2 className="text-lg font-bold">Preparing Desktop</h2>
            </div>
            <p className="mb-4">Setting up your workspace{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-3/4 h-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {loginStage === 4 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500 text-white flex items-center justify-center font-bold mr-3">✓</div>
              <h2 className="text-lg font-bold">Login Successful</h2>
            </div>
            <p className="mb-4">Starting Windows 95 desktop{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-full h-full bg-green-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginAnimation;
