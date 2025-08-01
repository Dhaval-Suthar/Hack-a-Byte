"use client";

import React, { useEffect, useState, useRef } from "react";
import audioManager from "./hooks/useAudioManager";

interface ShutdownAnimationProps {
  onComplete: () => void;
}

const ShutdownAnimation: React.FC<ShutdownAnimationProps> = ({ onComplete }) => {
  const [shutdownStage, setShutdownStage] = useState(0);
  const [progressDots, setProgressDots] = useState("");
  const onCompleteRef = useRef(onComplete);
  
  // Update the ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Intentionally play the shutdown sound only once on component mount
    try {
      audioManager.playSound("/hackbook-w95/sounds/shutdown.mp3", 0.7);
    } catch (error) {
      console.error("Audio error:", error);
    }

    // Start the sequence
    const timeouts: NodeJS.Timeout[] = [];
    
    // Stage 1: Shutdown message
    const stage1 = setTimeout(() => {
      setShutdownStage(1);
    }, 500);
    timeouts.push(stage1);
    
    // Stage 2: Saving settings
    const stage2 = setTimeout(() => {
      setShutdownStage(2);
    }, 2500);
    timeouts.push(stage2);
    
    // Stage 3: Closing programs
    const stage3 = setTimeout(() => {
      setShutdownStage(3);
    }, 4500);
    timeouts.push(stage3);
    
    // Stage 4: Safe to turn off
    const stage4 = setTimeout(() => {
      setShutdownStage(4);
    }, 6500);
    timeouts.push(stage4);
    
    // Stage 5: Black screen with fade
    const stage5 = setTimeout(() => {
      setShutdownStage(5);
    }, 8500);
    timeouts.push(stage5);
    
    // Complete: Trigger onComplete
    const complete = setTimeout(() => {
      onCompleteRef.current();
    }, 10500);
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
      {shutdownStage === 0 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-500 text-black flex items-center justify-center font-bold mr-3">!</div>
              <h2 className="text-lg font-bold">Windows 95</h2>
            </div>
            <p className="mb-4">Preparing to shut down your computer...</p>
            <div className="flex justify-center">
              <div className="bg-[#c0c0c0] px-4 py-2 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]">
                Please wait...
              </div>
            </div>
          </div>
        </div>
      )}
      
      {shutdownStage === 1 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold mr-3">i</div>
              <h2 className="text-lg font-bold">Shutting Down Windows 95</h2>
            </div>
            <p className="mb-4">Saving your settings{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-1/3 h-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {shutdownStage === 2 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold mr-3">i</div>
              <h2 className="text-lg font-bold">Shutting Down Windows 95</h2>
            </div>
            <p className="mb-4">Closing programs{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-2/3 h-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {shutdownStage === 3 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold mr-3">i</div>
              <h2 className="text-lg font-bold">Shutting Down Windows 95</h2>
            </div>
            <p className="mb-4">Preparing to shut down{progressDots}</p>
            <div className="w-64 h-2 bg-gray-300 mx-auto">
              <div className="w-full h-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {shutdownStage === 4 && (
        <div className="text-center">
          <div className="bg-[#c0c0c0] text-black p-8 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500 text-white flex items-center justify-center font-bold mr-3">✓</div>
              <h2 className="text-lg font-bold">Windows 95</h2>
            </div>
            <p className="mb-4">It&apos;s now safe to turn off your computer.</p>
            <p className="text-sm text-gray-600">You may now power off your computer safely.</p>
          </div>
        </div>
      )}
      
      {shutdownStage === 5 && (
        <div className="w-full h-full bg-black animate-pulse">
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-out">
              <div className="text-4xl mb-4 opacity-50">⚫</div>
              <p className="text-lg opacity-30">System Powered Down</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShutdownAnimation;
