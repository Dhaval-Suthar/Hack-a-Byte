"use client";

import React, { useEffect, useState, useRef } from "react";

interface LogoutAnimationProps {
  username: string;
  onComplete: () => void;
}

const LogoutAnimation: React.FC<LogoutAnimationProps> = ({ username, onComplete }) => {
  const [logoutStage, setLogoutStage] = useState(0);
  const [progressDots, setProgressDots] = useState("");
  const onCompleteRef = useRef(onComplete);
  
  // Update the ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Play logout sound
    try {
      const logoutSound = new Audio("/hackbook-w95/sounds/shutdown.mp3");
      logoutSound.play().catch(e => console.log("Audio play failed:", e));
    } catch (error) {
      console.error("Audio error:", error);
    }

    // Start the sequence
    const timeouts: NodeJS.Timeout[] = [];
    
    // Stage 1: Logging out message
    const stage1 = setTimeout(() => {
      setLogoutStage(1);
    }, 500);
    timeouts.push(stage1);
    
    // Stage 2: Saving user data
    const stage2 = setTimeout(() => {
      setLogoutStage(2);
    }, 2000);
    timeouts.push(stage2);
    
    // Stage 3: Closing user session
    const stage3 = setTimeout(() => {
      setLogoutStage(3);
    }, 3500);
    timeouts.push(stage3);
    
    // Stage 4: Logout complete
    const stage4 = setTimeout(() => {
      setLogoutStage(4);
    }, 5000);
    timeouts.push(stage4);
    
    // Complete: Trigger onComplete
    const complete = setTimeout(() => {
      onCompleteRef.current();
    }, 6500);
    timeouts.push(complete);
    
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
  }, []); // Empty dependency array since we use ref for onComplete

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-[#008080] flex items-center justify-center text-black font-mono z-50" style={{fontFamily: '"Perfect DOS VGA 437", monospace'}}>
      {logoutStage === 0 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold mr-3">i</div>
              <h2 className="text-lg font-bold">Windows 95</h2>
            </div>
            <p className="mb-4">Logging out{progressDots}</p>
            <div className="flex justify-center">
              <div className="bg-[#c0c0c0] px-4 py-2 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]">
                Please wait...
              </div>
            </div>
          </div>
        </div>
      )}
      
      {logoutStage === 1 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-orange-500 text-white flex items-center justify-center font-bold mr-3" aria-label="Waving hand icon">👋</div>
              <h2 className="text-lg font-bold">Logging Out</h2>
            </div>
            <p className="mb-4">Goodbye, {username}!</p>
            <p className="mb-4 text-sm">Ending your session{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-1/4 h-full bg-orange-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {logoutStage === 2 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold mr-3" aria-label="Floppy disk icon">💾</div>
              <h2 className="text-lg font-bold">Saving User Data</h2>
            </div>
            <p className="mb-4">Saving your progress and settings{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-1/2 h-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {logoutStage === 3 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-500 text-white flex items-center justify-center font-bold mr-3" aria-label="Lock icon">🔒</div>
              <h2 className="text-lg font-bold">Closing Session</h2>
            </div>
            <p className="mb-4">Securing your account{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-3/4 h-full bg-red-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {logoutStage === 4 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500 text-white flex items-center justify-center font-bold mr-3">✓</div>
              <h2 className="text-lg font-bold">Logout Complete</h2>
            </div>
            <p className="mb-4">Thank you for using Windows 95!</p>
            <p className="mb-4 text-sm">Redirecting to login{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-full h-full bg-green-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoutAnimation;
