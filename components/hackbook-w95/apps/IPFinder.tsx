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
  connections: string[];
}

interface LogEntry {
  timestamp: string;
  port: number;
  source: string;
  destination: string;
  activity: string;
  bytes: number;
  isClue: boolean;
}

interface IPFinderProps {
  onSuccess: (targetIP: string) => void;
  onClose: () => void;
}

const IPFinder: React.FC<IPFinderProps> = ({ onSuccess, onClose }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedLogEntries, setSelectedLogEntries] = useState<Set<number>>(new Set());
  const [highlightedDevices, setHighlightedDevices] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [targetIP, setTargetIP] = useState("");
  const [showConnectionRefused, setShowConnectionRefused] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [pingAnimation, setPingAnimation] = useState<{from: string, to: string} | null>(null);

  // Generate network devices
  const generateNetworkDevices = useCallback((): NetworkDevice[] => {
    const deviceNames = [
      "Granny's PC", "Dungeon Master 386", "Spam Server 9000", "Coffee Machine",
      "Unknown Host #1", "Office Printer", "Router Gateway", "File Server",
      "Unknown Host #2", "Game Console", "ShadowByte's Lair", "Backup Server",
      "Unknown Host #3", "Lab Computer", "Mail Server", "Unknown Host #4"
    ];

    const devices: NetworkDevice[] = [];
    const targetIndex = 10; // ShadowByte's Lair
    
    // Generate target IP for ShadowByte
    const targetIPAddress = "192.168.1.142";
    
    deviceNames.forEach((name, index) => {
      const isTarget = index === targetIndex;
      const baseIP = "192.168.1.";
      const lastOctet = isTarget ? "142" : (100 + index).toString();
      
      devices.push({
        id: `device_${index}`,
        name,
        ip: baseIP + lastOctet,
        x: 80 + (index % 4) * 160,
        y: 60 + Math.floor(index / 4) * 120,
        isTarget,
        isActive: Math.random() > 0.3,
        connections: []
      });
    });

    setTargetIP(targetIPAddress);
    return devices;
  }, []);

  // Generate log entries with clues
  const generateLogEntries = useCallback((): LogEntry[] => {
    const logs: LogEntry[] = [];
    const now = new Date();
    
    // Generate normal traffic
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now.getTime() - (Math.random() * 3600000));
      logs.push({
        timestamp: timestamp.toLocaleTimeString(),
        port: Math.floor(Math.random() * 65535),
        source: `192.168.1.${100 + Math.floor(Math.random() * 50)}`,
        destination: `192.168.1.${100 + Math.floor(Math.random() * 50)}`,
        activity: ["HTTP_REQUEST", "FTP_TRANSFER", "TELNET_SESSION", "MAIL_SYNC"][Math.floor(Math.random() * 4)],
        bytes: Math.floor(Math.random() * 10000),
        isClue: false
      });
    }

    // Generate clue entries for ShadowByte
    const clueEntries = [
      {
        timestamp: new Date(now.getTime() - 1800000).toLocaleTimeString(),
        port: 1337,
        source: "192.168.1.142",
        destination: "192.168.1.1",
        activity: "SUSPICIOUS_OUTBOUND",
        bytes: 4096,
        isClue: true
      },
      {
        timestamp: new Date(now.getTime() - 2400000).toLocaleTimeString(),
        port: 22,
        source: "unknown",
        destination: "192.168.1.142",
        activity: "SSH_ATTEMPT",
        bytes: 512,
        isClue: true
      },
      {
        timestamp: new Date(now.getTime() - 3000000).toLocaleTimeString(),
        port: 80,
        source: "192.168.1.142",
        destination: "external",
        activity: "DATA_EXFILTRATION",
        bytes: 16384,
        isClue: true
      },
      {
        timestamp: new Date(now.getTime() - 600000).toLocaleTimeString(),
        port: 31337,
        source: "192.168.1.xxx",
        destination: "192.168.1.1",
        activity: "ENCRYPTED_COMM",
        bytes: 2048,
        isClue: true
      }
    ];

    // Insert clue entries randomly
    clueEntries.forEach(entry => {
      const insertIndex = Math.floor(Math.random() * logs.length);
      logs.splice(insertIndex, 0, entry);
    });

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const [networkDevices] = useState(() => generateNetworkDevices());
  const [logEntries] = useState(() => generateLogEntries());

  // Handle log entry selection
  const handleLogEntryClick = (index: number) => {
    const entry = logEntries[index];
    const newSelected = new Set(selectedLogEntries);
    
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    
    setSelectedLogEntries(newSelected);

    // Highlight devices based on selected clues
    if (entry.isClue && !newSelected.has(index)) {
      // If we're deselecting a clue, remove highlights
      const highlighted = new Set(highlightedDevices);
      networkDevices.forEach(device => {
        if (device.ip === entry.source || device.ip.includes(entry.source.split('.')[3])) {
          highlighted.delete(device.id);
        }
      });
      setHighlightedDevices(highlighted);
    } else if (entry.isClue) {
      // If selecting a clue, add highlights
      const highlighted = new Set(highlightedDevices);
      networkDevices.forEach(device => {
        if (device.ip === entry.source || 
            device.ip.includes(entry.source.split('.')[3]) ||
            (entry.source.includes('xxx') && device.ip === targetIP)) {
          highlighted.add(device.id);
          
          // Trigger brief flash animation
          setTimeout(() => {
            highlighted.add(device.id + '_flash');
            setHighlightedDevices(new Set(highlighted));
            setTimeout(() => {
              highlighted.delete(device.id + '_flash');
              setHighlightedDevices(new Set(highlighted));
            }, 500);
          }, 100);
        }
      });
      setHighlightedDevices(highlighted);
    }
  };

  // Handle device click
  const handleDeviceClick = (device: NetworkDevice) => {
    setAttempts(prev => prev + 1);

    if (device.isTarget) {
      // Success!
      setGameComplete(true);
      setShowSuccessAnimation(true);
      
      // Trigger ping animation
      setPingAnimation({ from: 'user', to: device.id });
      
      setTimeout(() => {
        onSuccess(device.ip);
      }, 2000);
    } else {
      // Wrong device
      setWrongAttempts(prev => prev + 1);
      setShowConnectionRefused(true);
      
      setTimeout(() => {
        setShowConnectionRefused(false);
      }, 2000);
    }
  };

  // Start game after brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setGameStarted(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full bg-[#c0c0c0] p-2 relative">
      {/* Header */}
      <div className="bg-[#000080] text-white p-2 mb-2 text-center">
        <h2 className="font-bold">Network Reconnaissance Tool v2.1</h2>
        <p className="text-sm">Locating ShadowByte&apos;s Virtual Lair</p>
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
          {/* Log Analysis Panel */}
          <div className="w-1/2 bg-white border-2 border-inset p-2">
            <div className="bg-[#000080] text-white p-1 mb-2">
              <h3 className="font-bold text-sm">Network Activity Logs</h3>
              <p className="text-xs">Click suspicious entries to highlight potential targets</p>
            </div>
            
            <div className="h-80 overflow-auto bg-black text-green-400 p-2 font-mono text-xs">
              {logEntries.map((entry, index) => (
                <div
                  key={index}
                  className={clsx(
                    "cursor-pointer hover:bg-green-900 p-1 border-l-2",
                    {
                      "border-l-yellow-400 bg-green-800": selectedLogEntries.has(index),
                      "border-l-red-400": entry.isClue && !selectedLogEntries.has(index),
                      "border-l-transparent": !entry.isClue
                    }
                  )}
                  onClick={() => handleLogEntryClick(index)}
                >
                  <div className="grid grid-cols-6 gap-1 text-xs">
                    <span>{entry.timestamp}</span>
                    <span>:{entry.port}</span>
                    <span className="truncate">{entry.source}</span>
                    <span className="truncate">{entry.destination}</span>
                    <span className="truncate">{entry.activity}</span>
                    <span>{entry.bytes}b</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-2 text-sm">
              <p>Attempts: {attempts} | Wrong: {wrongAttempts}</p>
              <p className="text-xs text-gray-600">Selected Entries: {selectedLogEntries.size}</p>
            </div>
          </div>

          {/* Network Map Panel */}
          <div className="w-1/2 bg-white border-2 border-inset p-2 relative">
            <div className="bg-[#000080] text-white p-1 mb-2">
              <h3 className="font-bold text-sm">Network Topology Map</h3>
              <p className="text-xs">Click on a device to attempt connection</p>
            </div>
            
            <div className="relative h-80 bg-[#008080] border-2 border-inset overflow-hidden">
              {/* Network devices */}
              {networkDevices.map((device) => (
                <div
                  key={device.id}
                  className={clsx(
                    "absolute cursor-pointer transform transition-all duration-300",
                    {
                      "animate-pulse": highlightedDevices.has(device.id),
                      "animate-bounce": highlightedDevices.has(device.id + '_flash'),
                      "filter brightness-150": highlightedDevices.has(device.id),
                      "opacity-60": !device.isActive && !highlightedDevices.has(device.id)
                    }
                  )}
                  style={{ left: device.x, top: device.y }}
                  onClick={() => !gameComplete && handleDeviceClick(device)}
                >
                  {/* Device icon */}
                  <div className={clsx(
                    "w-12 h-12 border-2 rounded flex items-center justify-center text-xs",
                    {
                      "bg-red-400 border-red-600": device.isTarget && highlightedDevices.has(device.id),
                      "bg-yellow-400 border-yellow-600": !device.isTarget && highlightedDevices.has(device.id),
                      "bg-gray-400 border-gray-600": !highlightedDevices.has(device.id) && !device.isActive,
                      "bg-blue-400 border-blue-600": !highlightedDevices.has(device.id) && device.isActive
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

              {/* Ping animation */}
              {pingAnimation && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-4 h-4 bg-green-400 rounded-full animate-ping absolute left-1/2 top-1/2"></div>
                </div>
              )}
            </div>

            {/* Status display */}
            <div className="mt-2 text-sm">
              <p>Network Status: {networkDevices.filter(d => d.isActive).length} devices online</p>
              <p className="text-xs text-gray-600">Highlighted: {highlightedDevices.size} suspicious devices</p>
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
              Target device rejected connection attempt.
              <br />
              Re-analyze the logs for better targeting.
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
                ShadowByte&apos;s location confirmed: <strong>{targetIP}</strong>
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
