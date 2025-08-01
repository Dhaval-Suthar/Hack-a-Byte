"use client";

import React, { useEffect, useState, useRef } from "react";
import audioManager from "./hooks/useAudioManager";

interface RestartAnimationProps {
  onComplete: () => void;
}

const RestartAnimation: React.FC<RestartAnimationProps> = ({ onComplete }) => {
  const [restartStage, setRestartStage] = useState(0);
  const [progressDots, setProgressDots] = useState("");
  const onCompleteRef = useRef(onComplete);
  
  // Update the ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Play shutdown sound (reused here for restart) using AudioManager
    try {
      audioManager.playSound("/hackbook-w95/sounds/shutdown.mp3", 0.7);
    } catch (error) {
      console.error("Audio error:", error);
    }

    // Start the sequence
    const timeouts: NodeJS.Timeout[] = [];
    
    // Stage 1: Restart message
    const stage1 = setTimeout(() => {
      setRestartStage(1);
    }, 500);
    timeouts.push(stage1);
    
    // Stage 2: Saving settings
    const stage2 = setTimeout(() => {
      setRestartStage(2);
    }, 2500);
    timeouts.push(stage2);
    
    // Stage 3: Safe to restart
    const stage3 = setTimeout(() => {
      setRestartStage(3);
    }, 4500);
    timeouts.push(stage3);
    
    // Stage 4: Black screen
    const stage4 = setTimeout(() => {
      setRestartStage(4);
    }, 6500);
    timeouts.push(stage4);
    
    // Stage 5: BIOS restart
    const stage5 = setTimeout(() => {
      setRestartStage(5);
    }, 7500);
    timeouts.push(stage5);
    
    // Complete: Trigger onComplete
    const complete = setTimeout(() => {
      onCompleteRef.current();
    }, 9500);
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
    <div 
      className="fixed top-0 left-0 w-screen h-screen bg-black flex items-center justify-center text-white font-mono z-50" 
      style={{fontFamily: '"Perfect DOS VGA 437", monospace'}}
    >
      {restartStage === 0 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-500 text-black flex items-center justify-center font-bold mr-3">!</div>
              <h2 className="text-lg font-bold">Windows 95</h2>
            </div>
            <p className="mb-4">Preparing to restart your computer...</p>
            <div className="flex justify-center">
              <div className="bg-[#c0c0c0] px-4 py-2 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]">
                Please wait...
              </div>
            </div>
          </div>
        </div>
      )}
      
      {restartStage === 1 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold mr-3">i</div>
              <h2 className="text-lg font-bold">Restarting Windows 95</h2>
            </div>
            <p className="mb-4">Saving your settings{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-1/2 h-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {restartStage === 2 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold mr-3">i</div>
              <h2 className="text-lg font-bold">Restarting Windows 95</h2>
            </div>
            <p className="mb-4">Closing programs{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-3/4 h-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {restartStage === 3 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500 text-white flex items-center justify-center font-bold mr-3">✓</div>
              <h2 className="text-lg font-bold">Windows 95</h2>
            </div>
            <p className="mb-4">It&apos;s now safe to restart your computer.</p>
            <p className="text-sm text-gray-600">Your computer will restart automatically.</p>
          </div>
        </div>
      )}
      
      {restartStage === 4 && (
        <div className="w-full h-full bg-black"></div>
      )}
      
      {restartStage === 5 && (
        <div className="text-left max-w-2xl animate-pulse">
          <p className="text-2xl mb-4 tracking-widest">PhoenixBIOS 4.0 Release 6.0</p>
          <p className="mb-2">System Restarting{progressDots}</p>
          <div className="w-64 h-2 bg-gray-700 mx-auto mt-4">
            <div className="w-full h-full bg-white animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestartAnimation;
