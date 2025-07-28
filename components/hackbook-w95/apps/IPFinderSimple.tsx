"use client";

import React, { useState, useEffect, useCallback } from "react";
import clsx from "clsx";

interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  x: number;
  y: number;
  isTarget: boolean;
  isActive: boolean;
}

interface IPFinderProps {
  onSuccess: (targetIP: string) => void;
  onClose: () => void;
}

const IPFinder: React.FC<IPFinderProps> = ({ onSuccess, onClose }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameFailed, setGameFailed] = useState(false);
  const [targetIP, setTargetIP] = useState("");
  const [showConnectionRefused, setShowConnectionRefused] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [scenarioDescription, setScenarioDescription] = useState("Locating Target System");
  const [hint, setHint] = useState("");
  
  const MAX_ATTEMPTS = 5; // Increased for easier gameplay

  // Generate simple hint system
  const generateHint = useCallback((targetDevice: NetworkDevice): string => {
    const hints = [
      `Look for a device with suspicious activity - it has an unusual name`,
      `The target device doesn't look like normal office equipment`,
      `Scan for devices that stand out from typical network hardware`,
      `The target has a hacker-style name that's different from others`,
      `One of these devices doesn't belong in a normal office network`
    ];
    
    return hints[Math.floor(Math.random() * hints.length)];
  }, []);

  // Generate network devices with simpler logic
  const generateNetworkDevices = useCallback((): NetworkDevice[] => {
    const deviceNames = [
      "Office Printer", "Coffee Machine", "Router Gateway", "File Server",
      "Game Console", "Lab Computer", "Mail Server", "Database Server",
      "Backup Server", "Security Camera", "Employee PC #1", "Employee PC #2"
    ];

    // Dynamic target scenarios
    const scenarios = [
      {
        targetName: "ShadowByte's Lair",
        targetIP: "192.168.1.142",
        description: "Locating ShadowByte's Virtual Lair"
      },
      {
        targetName: "CyberPhantom's Den", 
        targetIP: "192.168.1.187",
        description: "Tracking CyberPhantom's Hideout"
      },
      {
        targetName: "DarkNet Infiltrator",
        targetIP: "192.168.1.221",
        description: "Finding DarkNet Operative Base"
      },
      {
        targetName: "Ghost Protocol Hub",
        targetIP: "192.168.1.156",
        description: "Locating Rogue Ghost Agent"
      },
      {
        targetName: "Binary Assassin HQ",
        targetIP: "192.168.1.199",
        description: "Hunting Binary Assassin's Station"
      }
    ];

    // Randomly select a scenario
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const targetIndex = Math.floor(Math.random() * deviceNames.length);
    
    // Replace one device name with the target
    deviceNames[targetIndex] = scenario.targetName;
    
    const devices: NetworkDevice[] = [];
    
    deviceNames.forEach((name, index) => {
      const isTarget = index === targetIndex;
      const baseIP = "192.168.1.";
      const lastOctet = isTarget ? scenario.targetIP.split('.')[3] : (100 + index).toString();
      
      devices.push({
        id: `device_${index}`,
        name,
        ip: baseIP + lastOctet,
        x: 80 + (index % 4) * 160,
        y: 60 + Math.floor(index / 4) * 120,
        isTarget,
        isActive: Math.random() > 0.2 // Most devices are active
      });
    });

    setTargetIP(scenario.targetIP);
    setScenarioDescription(scenario.description);
    
    // Generate hint for the target
    const targetDevice = devices.find(d => d.isTarget)!;
    setHint(generateHint(targetDevice));
    
    return devices;
  }, [generateHint]);

  const [networkDevices] = useState(() => generateNetworkDevices());

  // Handle device click
  const handleDeviceClick = (device: NetworkDevice) => {
    setAttempts(prev => prev + 1);

    if (device.isTarget) {
      // Success!
      setGameComplete(true);
      setShowSuccessAnimation(true);
      
      setTimeout(() => {
        onSuccess(device.ip);
      }, 2000);
    } else {
      // Wrong device
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      
      if (newWrongAttempts >= MAX_ATTEMPTS) {
        // Game over - too many wrong attempts
        setGameFailed(true);
        setShowGameOver(true);
      } else {
        setShowConnectionRefused(true);
        setTimeout(() => {
          setShowConnectionRefused(false);
        }, 2000);
      }
    }
  };

  // Start game immediately
  useEffect(() => {
    setGameStarted(true);
  }, []);

  return (
    <div className="w-full h-full bg-[#c0c0c0] p-2 relative">
      {/* Header */}
      <div className="bg-[#000080] text-white p-2 mb-2 text-center">
        <h2 className="font-bold">Network Reconnaissance Tool v2.1</h2>
        <p className="text-sm">{scenarioDescription}</p>
      </div>

      {!gameStarted ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-pulse text-lg mb-4">Initializing Network Scanner...</div>
            <div className="w-32 h-2 bg-[#808080] border-2 border-inset">
              <div className="w-full h-full bg-green-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full gap-2">
          {/* Hint Panel */}
          <div className="w-1/3 bg-white border-2 border-inset p-2">
            <div className="bg-[#000080] text-white p-1 mb-2">
              <h3 className="font-bold text-sm">Mission Intel</h3>
            </div>
            
            <div className="space-y-3">
              <div className="bg-yellow-100 border-2 border-yellow-400 p-2 rounded">
                <h4 className="font-bold text-sm mb-1">🎯 Objective:</h4>
                <p className="text-xs">Find and click on the target device to establish connection.</p>
              </div>
              
              <div className="bg-blue-100 border-2 border-blue-400 p-2 rounded">
                <h4 className="font-bold text-sm mb-1">💡 Hint:</h4>
                <p className="text-xs">{hint}</p>
              </div>
              
              <div className="bg-gray-100 border-2 border-gray-400 p-2 rounded">
                <h4 className="font-bold text-sm mb-1">📊 Status:</h4>
                <p className="text-xs">Attempts: {attempts}</p>
                <p className="text-xs">Wrong: {wrongAttempts}/{MAX_ATTEMPTS}</p>
                <p className="text-xs">Online Devices: {networkDevices.filter(d => d.isActive).length}</p>
              </div>
              
              {wrongAttempts >= MAX_ATTEMPTS - 1 && wrongAttempts < MAX_ATTEMPTS && (
                <div className="bg-red-100 border-2 border-red-400 p-2 rounded">
                  <p className="text-xs font-bold">⚠️ FINAL ATTEMPT!</p>
                  <p className="text-xs">Choose carefully!</p>
                </div>
              )}
            </div>
          </div>

          {/* Network Map Panel */}
          <div className="w-2/3 bg-white border-2 border-inset p-2 relative">
            <div className="bg-[#000080] text-white p-1 mb-2">
              <h3 className="font-bold text-sm">Network Topology Map</h3>
              <p className="text-xs">Click on a device to attempt connection</p>
            </div>
            
            <div className="relative h-80 bg-[#008080] border-2 border-inset overflow-auto">
              {/* Network devices container */}
              <div className="relative" style={{ height: '480px', width: '640px' }}>
                {networkDevices.map((device) => (
                  <div
                    key={device.id}
                    className={clsx(
                      "absolute cursor-pointer transform transition-all duration-300 hover:scale-110",
                      {
                        "opacity-60": !device.isActive,
                        "animate-pulse": device.isTarget && attempts > 2 // Give subtle hint after some attempts
                      }
                    )}
                    style={{ left: device.x, top: device.y }}
                    onClick={() => !gameComplete && !gameFailed && handleDeviceClick(device)}
                  >
                    {/* Device icon */}
                    <div className={clsx(
                      "w-12 h-12 border-2 rounded flex items-center justify-center text-xs",
                      {
                        "bg-gray-400 border-gray-600": !device.isActive,
                        "bg-blue-400 border-blue-600": device.isActive && !device.isTarget,
                        "bg-green-400 border-green-600": device.isActive && device.isTarget && attempts <= 2,
                        "bg-red-400 border-red-600": device.isActive && device.isTarget && attempts > 2
                      }
                    )}>
                      💻
                    </div>
                    
                    {/* Device label */}
                    <div className="text-xs text-center mt-1 bg-white px-1 rounded max-w-24">
                      <div className="truncate font-bold">{device.name}</div>
                      <div className="text-gray-600">{device.ip}</div>
                    </div>
                    
                    {/* Connection indicator */}
                    {device.isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Refused Dialog */}
      {showConnectionRefused && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] border-2 border-outset p-4 min-w-64">
            <div className="bg-red-600 text-white p-2 mb-4 text-center">
              <h3 className="font-bold">Connection Refused!</h3>
            </div>
            <p className="text-center mb-4">
              Wrong target device selected.
              <br />
              Look for the suspicious device name.
              <br />
              <span className="text-red-600 font-bold">
                Remaining attempts: {MAX_ATTEMPTS - wrongAttempts}
              </span>
            </p>
            <div className="text-center">
              <button
                className="bg-[#c0c0c0] border-2 border-outset px-4 py-1"
                onClick={() => setShowConnectionRefused(false)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Dialog */}
      {showGameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] border-2 border-outset p-4 min-w-80">
            <div className="bg-red-600 text-white p-2 mb-4 text-center">
              <h3 className="font-bold">MISSION FAILED!</h3>
            </div>
            <div className="text-center space-y-2">
              <p className="font-bold text-red-600">Target security system activated!</p>
              <p className="text-sm">
                Too many failed connection attempts detected.
                <br />
                The target has gone into lockdown mode.
              </p>
              <p className="text-xs text-gray-600">
                You exceeded the maximum allowed attempts ({MAX_ATTEMPTS}).
                <br />
                Return to WinTalk95 for further instructions.
              </p>
            </div>
            <div className="text-center mt-4">
              <button
                className="bg-red-600 text-white border-2 border-outset px-4 py-1 mr-2"
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="bg-[#c0c0c0] border-2 border-outset px-4 py-1"
                onClick={() => {
                  setShowGameOver(false);
                  setGameFailed(false);
                  setWrongAttempts(0);
                  setAttempts(0);
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {showSuccessAnimation && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#c0c0c0] border-2 border-outset p-4 min-w-80">
            <div className="bg-green-600 text-white p-2 mb-4 text-center">
              <h3 className="font-bold">Target Acquired!</h3>
            </div>
            <div className="text-center space-y-2">
              <p className="animate-pulse">Initiating Connection...</p>
              <div className="font-mono text-lg text-green-600">PING {targetIP}</div>
              <div className="w-full h-2 bg-[#808080] border-2 border-inset">
                <div className="h-full bg-green-500 animate-pulse"></div>
              </div>
              <p className="text-sm">
                Target location confirmed: <strong>{targetIP}</strong>
              </p>
              <p className="text-xs text-gray-600">
                Preparing to bypass target defenses...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Close button */}
      {!showSuccessAnimation && (
        <button
          className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs"
          onClick={onClose}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default IPFinder;
