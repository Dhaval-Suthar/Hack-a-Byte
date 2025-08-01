"use client";

import React, { useEffect, useState } from "react";
import audioManager from "./hooks/useAudioManager";
import Image from "next/image";


const BootAnimation = () => {
  const [bootStage, setBootStage] = useState(0);
  const [progressDots, setProgressDots] = useState("");

  useEffect(() => {
    const bootSequence = [
      { delay: 1000, stage: 1 }, // BIOS screen
      { delay: 2000, stage: 2 }, // Memory test
      { delay: 3500, stage: 3 }, // DOS initialization
      { delay: 5000, stage: 4 }, // Starting Windows 95
      { delay: 7000, stage: 5 }, // Windows 95 logo
    ];

    const timeouts: NodeJS.Timeout[] = [];
    bootSequence.forEach(({ delay, stage }) => {
      const id = setTimeout(() => {
        setBootStage(stage);
        if (stage === 5) {
          try {
            audioManager.playSound("/hackbook-W95/sounds/win95-startup.mp3", 0.7);
          } catch (error) {
            console.error("Audio error:", error);
          }
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
  }, []);

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center text-white font-mono" style={{fontFamily: '"Perfect DOS VGA 437", monospace'}}>
      {bootStage === 0 && (
        <div className="text-center">
          <p className="text-2xl mb-4 tracking-widest animate-pulse">PhoenixBIOS 4.0 Release 6.0</p>
          <div className="w-64 h-2 bg-gray-700 mx-auto">
            <div className="w-1/3 h-full bg-white animate-pulse"></div>
          </div>
        </div>
      )}
      
      {bootStage === 1 && (
        <div className="text-left max-w-2xl">
          <p className="font-bold mb-2">HackBIOS v2.5</p>
          <p>CPU: HackProcessor 133MHz</p>
          <p>Memory Test: 32768K OK</p>
          <p className="mt-4">Initializing Disk Drives{progressDots}</p>
          <p>Primary Master: HACKDISK-420MB</p>
          <p className="mt-4 animate-pulse">Press DEL to enter SETUP</p>
        </div>
      )}
      
      {bootStage === 2 && (
        <div className="text-left max-w-2xl">
          <p>Memory Test: 640K OK, 32768K Extended</p>
          <p>Mouse: PS/2 Mouse detected</p>
          <p>Hard Disk 0: Type 47, 420MB</p>
          <p>Floppy Disk A: 1.44MB</p>
          <p className="mt-4 animate-pulse">Starting MS-DOS{progressDots}</p>
        </div>
      )}
      
      {bootStage === 3 && (
        <div className="text-left max-w-2xl">
          <p>Microsoft<span className="text-xs align-super">®</span> MS-DOS<span className="text-xs align-super">®</span> Version 7.0</p>
          <p>(C)Copyright Microsoft Corp 1981-1995.</p>
          <p className="mt-4">HIMEM is testing extended memory{progressDots}done.</p>
          <p>Mouse driver installed.</p>
          <p>MSCDEX Version 2.23</p>
          <p>CD-ROM driver installed.</p>
          <p className="mt-2">C:\&gt;win</p>
        </div>
      )}
      
      {bootStage === 4 && (
        <div className="text-center">
          <p className="animate-pulse text-xl">Starting Windows 95{progressDots}</p>
        </div>
      )}
      
      {bootStage === 5 && (
        <div className="flex flex-col items-center">
          <div className="bg-[#008080] w-full h-full absolute top-0 left-0"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-8 flex items-center justify-center">
              <div className="w-64 h-64 flex items-center justify-center">
                {/* Windows 95 Logo/Image */}
                <div className="flex flex-col items-center">
                  <Image 
                    src="/hackbook-W95/app-icon/start.png" 
                    alt="Windows 95 Logo" 
                    width={250}
                    height={250}
                    className="mb-4 animate-pulse"
                  />
                  <div className="text-white text-6xl font-bold">
                    Windows<span className="text-4xl align-top">®</span> 95
                  </div>
                </div>
              </div>
            </div>
            <div className="w-80 h-1 bg-white mb-3"></div>
            <p className="text-2xl font-bold text-white mb-2" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
              Microsoft<span className="font-normal">®</span> Windows<span className="font-normal">®</span> 95
            </p>
            <p className="text-sm text-white" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
              Copyright © 1981-1995 Microsoft Corp.
            </p>
            <div className="w-80 h-1 bg-white mt-3"></div>
            <div className="mt-10 flex justify-center">
              <div className="w-32 h-1 bg-gray-500 relative">
                <div className="absolute top-0 left-0 h-1 bg-white animate-progress w-5"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BootAnimation;