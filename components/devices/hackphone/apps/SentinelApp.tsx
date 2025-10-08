"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSocket } from "@/hooks/useSocket";
import { logger } from '@/lib/logger';
import { generateCodeSnippet, TerminalDeviceList, shuffleArray } from './hackerUtils';
import { getPlayspaceId } from '@/lib/playspace-utils';

// Core interfaces - keeping the same data structure
interface DeviceInfo {
  id: string;
  deviceMacAddress: string;
  deviceType: string;
  status: "online" | "offline" | "maintenance";
  ipAddress: string;
  securityLevel: "low" | "medium" | "high" | "extreme";
  vulnerabilities: string[];
  lastSeen: string;
  teamId?: string;
  walletAddress?: string;
  bitcoinBalance?: number;
  isBank?: boolean;
  configuration?: {
    securitySettings?: {
      firewall?: boolean;
      antiVirus?: boolean;
      vpn?: boolean;
      enc?: boolean;
      ids?: boolean;
      vulnerabilities?: string[];
    };
  };
}

interface WalletInfo {
  teamId: string;
  address: string;
  balance: number;
  teamName?: string;
  lastActivity: string;
  isOwnTeam: boolean;
}

interface SentinelAppProps {
  onClose: () => void;
  time: string;
  teamId?: string;
}

// ==========================================
// HACKER-THEMED CORE COMPONENTS
// ==========================================

// Terminal Text - simulates a typing effect for a hacker feel
const TerminalText = ({ 
  text, 
  className = "", 
  typeDelay = 50,
  showCursor = true,
  startWithDelay = 0
}: { 
  text: string; 
  className?: string;
  typeDelay?: number;
  showCursor?: boolean;
  startWithDelay?: number;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let currentIndex = 0;
    
    // Initial delay before typing starts
    const initialDelay = setTimeout(() => {
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          currentIndex++;
          timeout = setTimeout(typeNextChar, typeDelay);
        } else {
          setIsTyping(false);
        }
      };
      
      typeNextChar();
    }, startWithDelay);
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(initialDelay);
    };
  }, [text, typeDelay, startWithDelay]);
  
  return (
    <span className={`font-mono break-words overflow-hidden ${className}`}>
      {displayedText}
      {showCursor && isTyping && (
        <span className="animate-blink text-green-500 inline-block">█</span>
      )}
    </span>
  );
};

// Enhanced Matrix rain effect background with dynamic characters and varied speeds
const MatrixRainBackground = ({ intensity = 'low' }: { intensity?: 'low' | 'medium' | 'high' }) => {
  // Determine number of columns based on intensity
  const columns = intensity === 'low' ? 15 : intensity === 'medium' ? 30 : 50;
  
  // Characters for the matrix rain (use more varied symbols for a better hacker look)
  const matrixChars = ['0', '1', '$', '#', '%', '&', '+', '-', '*', ':', ';', '=', '>', '<'];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
      {/* Matrix columns */}
      {Array.from({ length: columns }).map((_, i) => {
        // Randomize positioning and animation
        const left = `${(100 / columns) * i}%`;
        const animationDuration = `${Math.random() * 10 + 5}s`;
        const animationDelay = `${Math.random() * 5}s`;
        const fontSize = `${Math.random() * 2 + 10}px`;
        
        return (
          <div 
            key={i}
            className="absolute top-0 text-green-500 font-mono text-opacity-60 whitespace-nowrap animate-matrix-fall"
            style={{ 
              left, 
              animationDuration, 
              animationDelay,
              fontSize
            }}
          >
            {Array.from({ length: 25 }).map((_, j) => {
              // Generate random character from our matrix characters list
              const charIndex = Math.floor(Math.random() * matrixChars.length);
              const char = matrixChars[charIndex];
              
              // Randomize opacity and color for more dynamic effect
              const opacity = Math.random() * 0.7 + 0.3; // Between 0.3 and 1
              const isHighlighted = Math.random() > 0.9; // 10% chance to be highlighted
              
              return (
                <div 
                  key={j} 
                  className={`${isHighlighted ? 'text-green-300 font-bold' : 'text-green-500'}`}
                  style={{ opacity }}
                >
                  {char}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// CRT Scanlines effect for retro look
const Scanlines = ({ opacity = 0.15 }: { opacity?: number }) => {
  return (
    <div 
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, ${opacity}) 0px,
          rgba(0, 0, 0, ${opacity}) 1px,
          transparent 1px,
          transparent 2px
        )`,
        backgroundSize: '100% 4px'
      }}
    />
  );
};

// Screen glitch effect for important events
const GlitchEffect = ({ 
  isActive = false,
  intensity = 'medium'
}: { 
  isActive?: boolean;
  intensity?: 'low' | 'medium' | 'high'; 
}) => {
  if (!isActive) return null;
  
  const glitchOpacity = intensity === 'low' ? 0.1 : intensity === 'medium' ? 0.15 : 0.2;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Horizontal glitch lines */}
      <div className="absolute inset-0 animate-glitch-horizontal">
        <div className="absolute bg-red-500 h-0.5 w-full opacity-70" 
             style={{top: '10%', left: 0}}></div>
        <div className="absolute bg-green-500 h-0.5 w-full opacity-70"
             style={{top: '30%', left: 0}}></div>
        <div className="absolute bg-blue-500 h-0.5 w-full opacity-70"
             style={{top: '70%', left: 0}}></div>
      </div>
      
      {/* RGB shift effect */}
      <div className="absolute inset-0 mix-blend-screen opacity-30 animate-rgb-shift">
        <div className="absolute inset-0 bg-red-500 transform -translate-x-1"></div>
        <div className="absolute inset-0 bg-green-500"></div>
        <div className="absolute inset-0 bg-blue-500 transform translate-x-1"></div>
      </div>
      
      {/* Noise overlay */}
      <div 
        className="absolute inset-0 mix-blend-overlay animate-noise"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: glitchOpacity
        }}
      />
    </div>
  );
};

// Terminal window component for containing content
const TerminalWindow = ({ 
  title,
  children, 
  className = "" 
}: { 
  title: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`bg-black border border-green-500 rounded-md overflow-hidden ${className}`}>
      {/* Terminal header */}
      <div className="bg-green-900 text-green-200 px-3 py-1 font-mono text-sm border-b border-green-500 flex justify-between items-center">
        <div className="flex items-center space-x-1 flex-shrink-0">
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
        </div>
        <span className="text-xs truncate px-2 text-center flex-1">{title}</span>
        <span className="text-xs whitespace-nowrap flex-shrink-0">bash - 80x24</span>
      </div>
      
      {/* Terminal content */}
      <div className="p-3 text-green-500 font-mono overflow-x-auto break-words">
        {children}
      </div>
    </div>
  );
};

// CommandPrompt component simulates a command line interface
const CommandPrompt = ({ 
  command, 
  output,
  isProcessing = false
}: { 
  command: string;
  output: string | React.ReactNode;
  isProcessing?: boolean;
}) => {
  return (
    <div className="space-y-1 text-sm">
      {/* Command with prompt */}
      <div className="flex flex-wrap">
        <span className="text-green-600 mr-2 whitespace-nowrap">root@sentinel:~$</span>
        <TerminalText text={command} typeDelay={30} className="text-white break-all" />
      </div>
      
      {/* Command output */}
      <div className="pl-4 text-green-400 opacity-90 break-words">
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 animate-ping rounded-full flex-shrink-0"></div>
            <span>Processing...</span>
          </div>
        ) : (
          <div className="break-words overflow-x-auto">{output}</div>
        )}
      </div>
    </div>
  );
};

// Enhanced scanning radar component with advanced hacker theme and more interactive elements
const HackerRadar = ({ 
  isActive, 
  discoveredDevices = 0,
  targets = [] 
}: { 
  isActive: boolean; 
  discoveredDevices?: number;
  targets?: Array<{x: number, y: number, status: string}>;
}) => {
  // Define target type for TypeScript
  type RadarTarget = {
    cx: number;
    cy: number;
    r: number;
    color: string;
    opacityValues: string;
    dur: string;
    type: string;
    isVulnerable?: boolean;
    isNoise?: boolean;
  };
  
  // Generate dynamic targets based on discovered devices
  const generateTargets = (): RadarTarget[] => {
    const generatedTargets: RadarTarget[] = [];
    const baseTargets: RadarTarget[] = [
      { cx: 35, cy: 30, r: 2, color: "#ff0000", opacityValues: "0.8;0.2;0.8", dur: "1s", type: "server" },
      { cx: 70, cy: 40, r: 2, color: "#ff0000", opacityValues: "0.2;0.8;0.2", dur: "1.5s", type: "router" },
      { cx: 45, cy: 65, r: 2, color: "#ff0000", opacityValues: "0.8;0.2;0.8", dur: "0.8s", type: "device" },
    ];
    
    // Add base targets
    generatedTargets.push(...baseTargets);
    
    // Add targets from props if provided
    if (targets && targets.length > 0) {
      targets.forEach((target, i) => {
        // Convert the x,y coordinates (range -1 to 1) to the SVG viewport (0-100)
        const cx = 50 + (target.x * 45); // Scale and center
        const cy = 50 + (target.y * 45);
        
        // Different styling based on device status
        const color = target.status === 'online' ? "#00ff00" :
                      target.status === 'maintenance' ? "#ffff00" : "#ff0000";
        
        generatedTargets.push({
          cx,
          cy,
          r: 2.5,
          color,
          opacityValues: target.status === 'online' ? "1;0.6;1" : "0.8;0.3;0.8",
          dur: `${0.8 + (i % 3) * 0.4}s`,
          isVulnerable: target.status === 'online',
          type: 'target'
        });
      });
    } else {
      // Add additional targets based on discovered devices
      for (let i = 0; i < Math.min(discoveredDevices, 5); i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 40 + 5;
        const cx = 50 + Math.cos(angle) * distance;
        const cy = 50 + Math.sin(angle) * distance;
        const isVulnerable = Math.random() > 0.6; // 40% chance to be vulnerable
        
        generatedTargets.push({
          cx,
          cy,
          r: isVulnerable ? 3 : 2,
          color: isVulnerable ? "#ff3000" : "#ff0000",
          opacityValues: isVulnerable ? "1;0.4;1" : "0.6;0.2;0.6",
          dur: `${Math.random() * 1 + 0.5}s`,
          isVulnerable,
          type: Math.random() > 0.5 ? 'server' : 'device'
        });
      }
    }
    
    return generatedTargets;
  };
  
  // Generate targets
  const displayTargets = generateTargets();
  
  // Random noise targets that only appear during active scanning
  const noiseTargets: RadarTarget[] = isActive ? Array.from({length: 6}, () => ({
    cx: 10 + Math.random() * 80,
    cy: 10 + Math.random() * 80,
    r: 1,
    color: "#00ff00",
    opacityValues: "0.2;0.6;0.2",
    dur: `${Math.random() * 0.5 + 0.3}s`,
    isNoise: true,
    type: 'noise'
  })) : [];
  
  // All targets to display
  const allTargets: RadarTarget[] = [...displayTargets, ...noiseTargets];
  
  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Gradient definitions */}
        <defs>
          <radialGradient id="scanGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="rgba(0, 255, 0, 0.2)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
          <filter id="greenGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background with hex pattern */}
        <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.7)" />
        <pattern id="hexGrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M5,0 L10,5 L5,10 L0,5 Z" fill="none" stroke="rgba(0, 255, 0, 0.1)" strokeWidth="0.2" />
        </pattern>
        <rect x="0" y="0" width="100" height="100" fill="url(#hexGrid)" />
        
        {/* Additional hex grid overlay for cyberpunk feel */}
        <pattern id="largeHexGrid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M15,0 L30,15 L15,30 L0,15 Z" fill="none" stroke="rgba(0, 255, 0, 0.05)" strokeWidth="0.5" />
        </pattern>
        <rect x="0" y="0" width="100" height="100" fill="url(#largeHexGrid)" />
        
        {/* Grid lines with enhanced styling */}
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0, 255, 0, 0.3)" strokeWidth="0.3" strokeDasharray="3,3" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0, 255, 0, 0.3)" strokeWidth="0.3" strokeDasharray="3,3" />
        
        {/* Radar circles with enhanced pulsing effect */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0, 255, 0, 0.4)" strokeWidth="0.5">
          {isActive && <animate attributeName="opacity" values="0.4;0.6;0.4" dur="3s" repeatCount="indefinite" />}
        </circle>
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(0, 255, 0, 0.5)" strokeWidth="0.5" strokeDasharray="2,2">
          {isActive && <animate attributeName="opacity" values="0.5;0.7;0.5" dur="4s" repeatCount="indefinite" />}
        </circle>
        <circle cx="50" cy="50" r="24" fill="none" stroke="rgba(0, 255, 0, 0.6)" strokeWidth="0.5">
          {isActive && <animate attributeName="opacity" values="0.6;0.8;0.6" dur="5s" repeatCount="indefinite" />}
        </circle>
        <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(0, 255, 0, 0.7)" strokeWidth="0.5" strokeDasharray="1,1">
          {isActive && <animate attributeName="opacity" values="0.7;0.9;0.7" dur="2.5s" repeatCount="indefinite" />}
        </circle>
        
        {/* Add subtle background glow */}
        <circle cx="50" cy="50" r="30" fill="url(#scanGradient)" opacity="0.3">
          {isActive && <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />}
        </circle>
        
        {/* Center point with enhanced pulse */}
        <circle cx="50" cy="50" r="2" fill="#00ff00" filter="url(#greenGlow)">
          {isActive && <animate attributeName="r" values="2;3;2" dur="1.5s" repeatCount="indefinite" />}
          {isActive && <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" repeatCount="indefinite" />}
        </circle>
        
        {/* Scanning beam with enhanced glow effect */}
        {isActive && (
          <>
            {/* Beam shadow for wider glow effect */}
            <line 
              x1="50" 
              y1="50" 
              x2="50" 
              y2="5" 
              stroke="#00ff00" 
              strokeWidth="4" 
              opacity="0.2"
              strokeLinecap="round"
              filter="url(#greenGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 50 50;360 50 50"
                dur="3s"
                repeatCount="indefinite"
              />
            </line>
            
            {/* Main beam with sharper look */}
            <line 
              x1="50" 
              y1="50" 
              x2="50" 
              y2="2" 
              stroke="#00ff00" 
              strokeWidth="2" 
              opacity="0.8"
              strokeLinecap="round"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 50 50;360 50 50"
                dur="3s"
                repeatCount="indefinite"
              />
            </line>
            
            {/* Beam tip enhanced glow */}
            <circle cx="50" cy="5" r="2" fill="#00ff00" opacity="0.5" filter="url(#greenGlow)">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 50 50;360 50 50"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1s" repeatCount="indefinite" />
              <animate attributeName="r" values="1.5;2.5;1.5" dur="1s" repeatCount="indefinite" />
            </circle>
          </>
        )}
        
        {/* Enhanced target displays with crosshairs and type indicators */}
        {allTargets.map((target, idx) => (
          <g key={idx}>
            {/* Target circle */}
            <circle 
              cx={target.cx} 
              cy={target.cy} 
              r={target.r} 
              fill={target.color} 
              opacity={target.isNoise ? "0.6" : "0.8"}
              filter={target.isVulnerable ? "url(#greenGlow)" : ""}
            >
              <animate 
                attributeName="opacity" 
                values={target.opacityValues} 
                dur={target.dur} 
                repeatCount="indefinite"
              />
              {/* Add ping effect for "vulnerable" targets */}
              {target.isVulnerable && (
                <animate 
                  attributeName="r" 
                  values={`${target.r};${target.r + 2};${target.r}`} 
                  dur="2s" 
                  repeatCount="indefinite"
                />
              )}
            </circle>
            
            {/* Add crosshairs for non-noise targets */}
            {!target.isNoise && (
              <>
                <line 
                  x1={target.cx - 5} 
                  y1={target.cy} 
                  x2={target.cx + 5} 
                  y2={target.cy} 
                  stroke={target.color} 
                  strokeWidth="0.3" 
                  opacity="0.6"
                />
                <line 
                  x1={target.cx} 
                  y1={target.cy - 5} 
                  x2={target.cx} 
                  y2={target.cy + 5} 
                  stroke={target.color} 
                  strokeWidth="0.3" 
                  opacity="0.6"
                />
                
                {/* Target type indicator */}
                <text 
                  x={target.cx + 3} 
                  y={target.cy - 3} 
                  fill={target.color} 
                  fontSize="2.5" 
                  fontFamily="monospace"
                >
                  {target.type === 'server' ? 'SVR' : 
                   target.type === 'router' ? 'RTR' : 
                   target.type === 'target' ? 'TGT' : 'DEV'}
                </text>
              </>
            )}
          </g>
        ))}
        
        {/* Enhanced coordinate labels for authentic look */}
        <text x="2" y="8" fill="#00ff00" fontSize="3" fontFamily="monospace" opacity="0.8">0,0</text>
        <text x="92" y="8" fill="#00ff00" fontSize="3" fontFamily="monospace" opacity="0.8">100,0</text>
        <text x="88" y="98" fill="#00ff00" fontSize="3" fontFamily="monospace" opacity="0.8">100,100</text>
        <text x="2" y="98" fill="#00ff00" fontSize="3" fontFamily="monospace" opacity="0.8">0,100</text>
        
        {/* Additional data overlay for cyberpunk feel */}
        <text x="35" y="5" fill="#00ff00" fontSize="2.5" fontFamily="monospace" opacity="0.6">SUBNET:192.168.1.0/24</text>
      </svg>
      
      {/* Enhanced status overlay with code-style indicators */}
      <div className="absolute bottom-1 left-0 right-0 text-center text-xs text-green-500 font-mono">
        <div className="flex justify-center items-center space-x-2">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
          <span>{isActive ? 'SCAN_ACTIVE' : 'STANDBY'}</span>
        </div>
        {isActive && (
          <div className="text-xs opacity-70 mt-0.5">
            {discoveredDevices > 0 ? `${discoveredDevices} targets` : 'Searching...'}
          </div>
        )}
      </div>
    </div>
  );
};

// Progress bar with hacker theme
const HackerProgressBar = ({ progress, label }: { progress: number; label: string }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-green-500 font-mono">{label}</span>
        <span className="text-green-500 font-mono">{progress}%</span>
      </div>
      <div className="h-2 bg-gray-900 border border-green-800 overflow-hidden">
        {/* Progress bar */}
        <div 
          className="h-full bg-green-500 relative transition-all duration-300"
          style={{ width: `${progress}%` }}
        >
          {/* Animated glitch effect inside bar */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i}
                className="h-full bg-green-300 opacity-40"
                style={{ 
                  width: '10%',
                  marginLeft: `${i * 10}%`,
                  animation: `flicker ${0.3 + Math.random() * 0.5}s infinite`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Code snippet display component
const CodeSnippet = ({ lines, title = "memory.dump", className = "" }: { 
  lines: string[]; 
  title?: string;
  className?: string;
}) => {
  return (
    <div className={`bg-black border border-green-800 rounded font-mono text-xs overflow-hidden ${className}`}>
      <div className="bg-green-900 bg-opacity-30 px-2 py-0.5 text-green-400 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
        </div>
        <span>{title}</span>
        <span className="text-green-700">x86_64</span>
      </div>
      <div className="p-2 space-y-0.5">
        {lines.map((line, idx) => (
          <div key={idx} className="text-green-500">{line}</div>
        ))}
        <div className="text-green-500 animate-blink">_</div>
      </div>
    </div>
  );
};

// Terminal-style notification toast system
const TerminalNotification = ({ notifications }: { notifications: string[] }) => {
  return (
    <div className="fixed bottom-20 right-4 space-y-2 z-50 max-w-md">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className="bg-black border border-green-500 p-3 font-mono text-sm animate-slide-in"
        >
          <div className="flex items-start space-x-2">
            <div className="text-green-500 mt-1">&gt;</div>
            <TerminalText 
              text={notification} 
              className="text-green-400"
              typeDelay={10}
              startWithDelay={index * 100}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// BankTransfersTab COMPONENT
// ==========================================

// BankTransfersTab Component for managing Bitcoin transfers
const BankTransfersTab = ({
  addNotification,
  fetchTeamBalance,
  fetchWallets
}: {
  addNotification: (message: string) => void;
  fetchTeamBalance: () => Promise<void>;
  fetchWallets: () => Promise<void>;
}) => {
  const [senderWallet, setSenderWallet] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [receiverWallet, setReceiverWallet] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  // Load persisted values from localStorage on mount
  useEffect(() => {
    const persistedData = localStorage.getItem('sentinel-transfer-form');
    if (persistedData) {
      try {
        const { senderWallet: savedSender, privateKey: savedPrivateKey, receiverWallet: savedReceiver, amount: savedAmount } = JSON.parse(persistedData);
        if (savedSender) setSenderWallet(savedSender);
        if (savedPrivateKey) setPrivateKey(savedPrivateKey);
        if (savedReceiver) setReceiverWallet(savedReceiver);
        if (savedAmount) setAmount(savedAmount);
      } catch (error) {
        logger.error('Failed to load persisted transfer form data:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      }
    }
  }, []);

  // Persist values to localStorage whenever they change
  useEffect(() => {
    const dataToPersist = {
      senderWallet,
      privateKey,
      receiverWallet,
      amount
    };
    localStorage.setItem('sentinel-transfer-form', JSON.stringify(dataToPersist));
  }, [senderWallet, privateKey, receiverWallet, amount]);
  
  const handleTransfer = async () => {
    if (!senderWallet || !privateKey || !receiverWallet || !amount || isNaN(parseFloat(amount))) {
      addNotification('Invalid input: Please check all fields (sender wallet, private key, receiver wallet, and amount)');
      return;
    }

    // Validate private key length (Bitcoin private keys are 64 hex characters)
    if (privateKey.length !== 64) {
      addNotification('Invalid private key: Must be exactly 64 characters');
      return;
    }

    // Validate wallet addresses (hex format for this app's wallet system)
    const walletRegex = /^[a-f0-9]{42}$/;
    if (!walletRegex.test(senderWallet)) {
      addNotification('Invalid sender wallet address format');
      return;
    }
    if (!walletRegex.test(receiverWallet)) {
      addNotification('Invalid receiver wallet address format');
      return;
    }

    // Check if sender and receiver are the same
    if (senderWallet === receiverWallet) {
      addNotification('Cannot transfer to the same wallet address');
      return;
    }

    // Validate amount
    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      addNotification('Transfer amount must be greater than 0');
      return;
    }

    setIsTransferring(true);

    try {
      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress: senderWallet,
          toAddress: receiverWallet,
          amount: transferAmount,
          privateKey: privateKey
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowSuccessMessage(true);
        addNotification(`Transfer of ₿${amount} successful`);

        // Reset form and update balances
        setSenderWallet('');
        setPrivateKey('');
        setReceiverWallet('');
        setAmount('');
        await fetchTeamBalance();
        await fetchWallets();

        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } else {
        addNotification(`Transfer failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error('Transfer error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      addNotification('Network error during transfer');
    } finally {
      setIsTransferring(false);
    }
  };  return (
    <div className="space-y-4 font-mono">
      {/* Transfer form */}
      <div className="space-y-3">
        {/* Sender wallet field */}
        <div className="space-y-1">
          <label className="text-xs text-green-700">SENDER WALLET ADDRESS</label>
          <input
            type="text"
            value={senderWallet}
            onChange={(e) => setSenderWallet(e.target.value)}
            className="w-full bg-black border border-green-700 px-2 py-1 text-green-500 focus:border-green-500 focus:outline-none"
            placeholder="Enter sender's wallet address"
          />
        </div>

        {/* Private key field */}
        <div className="space-y-1">
          <label className="text-xs text-green-700">PRIVATE KEY</label>
          <input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            className="w-full bg-black border border-green-700 px-2 py-1 text-green-500 focus:border-green-500 focus:outline-none font-mono"
            placeholder="Enter private key (64 characters)"
            maxLength={64}
          />
          <div className="text-xs text-green-600">{privateKey.length}/64 characters</div>
        </div>

        {/* Receiver wallet field */}
        <div className="space-y-1">
          <label className="text-xs text-green-700">RECEIVER WALLET ADDRESS</label>
          <input
            type="text"
            value={receiverWallet}
            onChange={(e) => setReceiverWallet(e.target.value)}
            className="w-full bg-black border border-green-700 px-2 py-1 text-green-500 focus:border-green-500 focus:outline-none"
            placeholder="Enter receiver's wallet address"
          />
        </div>

        {/* Amount field */}
        <div className="space-y-1">
          <label className="text-xs text-green-700">BTC AMOUNT</label>
          <div className="flex">
            <span className="bg-green-900 bg-opacity-20 border border-green-700 px-2 flex items-center text-green-500">
              ₿
            </span>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-black border border-green-700 px-2 py-1 text-green-500 focus:border-green-500 focus:outline-none"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleTransfer}
          disabled={isTransferring}
          className={`w-full py-2 border ${
            isTransferring
              ? "bg-green-900 bg-opacity-10 border-green-900 text-green-900 cursor-not-allowed"
              : "bg-black border-green-500 text-green-500 hover:bg-green-900 hover:bg-opacity-20"
          }`}
        >
          {isTransferring ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent"></div>
              <span>EXECUTING TRANSFER...</span>
            </div>
          ) : (
            "EXECUTE TRANSFER"
          )}
        </button>

        {/* Security warning */}
        <div className="border border-yellow-700 bg-yellow-900 bg-opacity-10 p-3 text-yellow-400 text-xs">
          <div className="font-bold mb-1">⚠️ SECURITY WARNING</div>
          <div className="text-yellow-500">
            • Never share your private key with anyone
            <br />
            • Double-check all wallet addresses before transferring
            <br />
            • This action cannot be undone
            <br />• Ensure you have sufficient balance for the transfer
          </div>
        </div>
      </div>

      {/* Success message */}
      {showSuccessMessage && (
        <div className="border border-green-500 bg-green-900 bg-opacity-20 p-3 text-center text-green-500 animate-pulse">
          Transfer completed successfully
        </div>
      )}

      {/* Transfer terminal */}
      <div className="border border-green-900 p-3 text-xs">
        <div className="text-green-700 mb-2">{"// Transfer log"}</div>
        <div className="space-y-1">
          <div>$ Initializing secure connection...</div>
          <div>$ Validating wallet signatures...</div>
          <div>$ Ready for BTC transfer</div>
          {amount && receiverWallet && senderWallet && (
            <div className="text-yellow-500">
              $ Preparing transfer of ₿{amount} from {senderWallet.substring(0, 12)}...
              {senderWallet.substring(senderWallet.length - 8)} to {receiverWallet.substring(0, 12)}...
              {receiverWallet.substring(receiverWallet.length - 8)}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

// ==========================================
// MAIN SENTINEL APP COMPONENT
// ==========================================

function SentinelApp({ onClose, time, teamId }: SentinelAppProps) {
  // State management from original component
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [walletData, setWalletData] = useState<WalletInfo[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [discoveredDevices, setDiscoveredDevices] = useState<number>(0);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'mission' | 'transfers' | 'wallets'>('mission');
  // const [ownTeamBalance, setOwnTeamBalance] = useState<number | null>(null);
  // Store team ID for future use
  const [, setOwnTeamId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [deviceSecuritySettings, setDeviceSecuritySettings] = useState<{
    firewall?: boolean;
    antiVirus?: boolean;
    vpn?: boolean;
    enc?: boolean;
    ids?: boolean;
  } | null>(null);
  
  // Scan state
  const SCAN_COOLDOWN_MS = 60_000; // 1 minute
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [deviceLockedForScan, setDeviceLockedForScan] = useState<DeviceInfo | null>(null);
  const [nowTs, setNowTs] = useState(Date.now());
  
  // Exploit state
  const [exploitUsed, setExploitUsed] = useState(false);
  
  // Game termination state
  const [isTerminating, setIsTerminating] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [gameTerminated, setGameTerminated] = useState(false);
  
  // UI state
  const [showGlitch, setShowGlitch] = useState(false);
  const [codeSnippets, setCodeSnippets] = useState<string[]>(generateCodeSnippet());

  // Command history references
  
  
  // Socket connection
  const { socket } = useSocket();
  
  // Tick every second to update cooldown display
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  
  // Refresh code snippets periodically for a more dynamic feel
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCodeSnippets(generateCodeSnippet());
    }, 8000); // Every 8 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Track active keys for shortcuts display
  
  
  // Enhanced notification system with typing effect
  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [...prev.slice(-2), message]);
    
    setTimeout(() => {
      setNotifications(prev => {
        const newNotifications = [...prev];
        newNotifications.shift();
        return newNotifications;
      });
    }, 5000);
  }, []);

  // Scan function with visual effects
  const startScan = useCallback(async () => {
    if (lastScanTime && Date.now() - lastScanTime < SCAN_COOLDOWN_MS) {
      addNotification("[ERROR] Scan cooldown active");
      return;
    }
    
    setIsScanning(true);
    setScanProgress(0);
    setDiscoveredDevices(0);
    addNotification("[EXECUTING] network_reconnaissance.py --deep-scan");
    setSelectedDevice(null);
    setDeviceLockedForScan(null);
    setScanCompleted(false);
    
    // Reset exploit state for new network scan
    setExploitUsed(false);
    
    // Brief glitch effect at scan start
    setShowGlitch(true);
    setTimeout(() => setShowGlitch(false), 500);

    // Simulate scanning process with a hacking feel
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setScanProgress(i);
      
      // Simulate device discovery with terminal-style notifications
      if (i % 20 === 0 && i > 0) {
        setDiscoveredDevices(prev => prev + Math.floor(Math.random() * 2) + 1);
        
        if (i === 20) addNotification("[INFO] Network topology mapped");
        if (i === 40) addNotification("[INFO] Analyzing security configurations");
        if (i === 60) addNotification("[INFO] Checking firewall rules");
        if (i === 80) addNotification("[INFO] Running vulnerability assessment");
      }
    }

    // Scan completion
    setLastScanTime(Date.now());
    localStorage.setItem('sentinelLastScanTime', Date.now().toString());
    
    // Fetch devices from API (same as original app)
    try {
      const response = await fetch('/api/devices/scan', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Randomize device order to confuse users about their own device
        const randomizedDevices = shuffleArray(result.devices as DeviceInfo[]);
        setDevices(randomizedDevices);
        addNotification(`[SUCCESS] Scan complete - ${randomizedDevices.length} targets identified`);
      } else {
        addNotification(`[ERROR] Scan failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error('Scan error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      addNotification("[ERROR] Scan protocol interrupted");
    } finally {
      setIsScanning(false);
      setScanCompleted(true);
    }
  }, [SCAN_COOLDOWN_MS, lastScanTime, addNotification]);

  // Global keyboard listener for any key
  
  
  // Keyboard shortcuts
  

  // Check user role on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const selectedRole = localStorage.getItem('selectedRole');
      setUserRole(selectedRole);
      
      // Load last scan time from localStorage
      const savedLastScanTime = localStorage.getItem('sentinelLastScanTime');
      if (savedLastScanTime) {
        const lastScanTs = parseInt(savedLastScanTime, 10);
        setLastScanTime(lastScanTs);
        
        // Check if cooldown is still active
        const timeSinceLastScan = Date.now() - lastScanTs;
        if (timeSinceLastScan < SCAN_COOLDOWN_MS) {
          setScanCompleted(true); // Mark as completed if cooldown was active
        }
      }
    }
  }, []);

  // Game termination handler
  const handleGameTerminated = useCallback(() => {
    setGameTerminated(true);
    setShowGlitch(true); // Show glitch effect on termination
    addNotification("[ALERT] Game terminated by administrator");
    addNotification("[SYSTEM] All devices offline");
    addNotification("[SYSTEM] Redirecting to game over screen...");
    
    // Redirect to game over after a short delay
    setTimeout(() => {
      window.location.href = '/game-over';
    }, 5000);
  }, [addNotification]);

  // Socket event listeners for game termination
  useEffect(() => {
    if (!socket) return;

    socket.on('game-terminated', handleGameTerminated);

    return () => {
      socket.off('game-terminated', handleGameTerminated);
    };
  }, [socket, handleGameTerminated]);

  // Game termination function
  const terminateGame = async () => {
    setIsTerminating(true);
    addNotification("[EXECUTING] game_termination.sh --force");
    
    // Trigger glitch effect
    setShowGlitch(true);
    setTimeout(() => setShowGlitch(false), 2000);

    try {
      // Get device MAC address from localStorage
      const deviceMacAddress = localStorage.getItem('device_mac_address');
      
      if (!deviceMacAddress) {
        addNotification("[ERROR] Device MAC address not found");
        setIsTerminating(false);
        return;
      }

      // Get device ID from MAC address
      const deviceIdResponse = await fetch(`/api/device/get-device-id?deviceMacAddress=${encodeURIComponent(deviceMacAddress)}`);
      const deviceIdResult = await deviceIdResponse.json();

      if (!deviceIdResponse.ok || !deviceIdResult.success) {
        addNotification(`[ERROR] Failed to get device ID: ${deviceIdResult.error || 'Unknown error'}`);
        setIsTerminating(false);
        return;
      }

      const deviceId = deviceIdResult.deviceId;

      // Terminate the specific device
      const response = await fetch('/api/admin/terminate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ deviceId })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addNotification("[SUCCESS] Game terminated");
        addNotification("[SYSTEM] Device offline");
        
        // Trigger local termination state
        setGameTerminated(true);
        
        // Redirect to device selection after successful termination
        setTimeout(() => {
          window.location.href = '/device-selection';
        }, 3000);
      } else {
        addNotification(`[ERROR] ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error('Game termination error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      addNotification("[ERROR] Network connection failed");
    } finally {
      setIsTerminating(false);
      setShowTerminateConfirm(false);
    }
  };

  // Wrap fetch functions in useCallback to prevent dependency array warnings
  const fetchWallets = useCallback(async () => {
    try {
      const playspaceId = getPlayspaceId();
      
      const response = await fetch('/api/wallet/intel', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          ...(playspaceId && { 'x-playspace-id': playspaceId })
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // For the current user's team, try to get their actual wallet address
        let currentUserWalletAddress = null;
        if (teamId) {
          try {
            const userWalletResponse = await fetch(`/api/team/${teamId}/wallet`, {
              headers: { 
                'Content-Type': 'application/json',
                ...(playspaceId && { 'x-playspace-id': playspaceId })
              }
            });
            if (userWalletResponse.ok) {
              const userWalletData = await userWalletResponse.json();
              if (userWalletData.success && userWalletData.wallet?.walletAddress) {
                currentUserWalletAddress = userWalletData.wallet.walletAddress;
              }
            }
          } catch (error) {
            logger.error(`Failed to fetch current user wallet:`, { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
          }
        }

        // Fetch actual wallet addresses for each team
        const walletsWithAddresses = await Promise.all(
          result.wallets.map(async (wallet: WalletInfo) => {
            // If this is the current user's team and we have their wallet address, use it
            if (wallet.isOwnTeam && currentUserWalletAddress) {
              return {
                ...wallet,
                address: currentUserWalletAddress
              };
            }

            try {
              // Use the teamId from the wallet data
              const teamIdFromWallet = wallet.teamId;
              if (teamIdFromWallet) {
                const walletResponse = await fetch(`/api/team/${teamIdFromWallet}/wallet`, {
                  headers: { 
                    'Content-Type': 'application/json',
                    ...(playspaceId && { 'x-playspace-id': playspaceId })
                  }
                });
                if (walletResponse.ok) {
                  const walletData = await walletResponse.json();
                  if (walletData.success && walletData.wallet?.walletAddress) {
                    return {
                      ...wallet,
                      address: walletData.wallet.walletAddress
                    };
                  }
                } else if (walletResponse.status === 500) {
                  // If the team doesn't exist or has no wallet, show a placeholder
                  return {
                    ...wallet,
                    address: `${teamIdFromWallet} (no wallet found)`
                  };
                }
              }
            } catch (error) {
              logger.error(`Failed to fetch wallet address for ${wallet.teamId}:`, { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
            }
            return wallet; // Return original wallet if fetch fails
          })
        );
        
        setWalletData(walletsWithAddresses);
        
        // Find own team wallet
        const ownTeam = walletsWithAddresses.find((w: WalletInfo) => w.isOwnTeam);
        if (ownTeam) {
          // setOwnTeamBalance(ownTeam.balance);
        }
      } else {
        addNotification(`[ERROR] Wallet data retrieval failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error('Wallet data error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      addNotification("[ERROR] Wallet data protocol interrupted");
    }
  }, [addNotification, teamId]);

  // Team balance fetch function
  const fetchTeamBalance = useCallback(async () => {
    try {
      const response = await fetch('/api/team/balance', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // setOwnTeamBalance(result.balance);
        setOwnTeamId(result.teamId);
      }
    } catch (error) {
      logger.error('Balance error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  }, []);

  // Calculate security level of devices based on security settings
  const calculateSecurityLevel = (device: DeviceInfo, securitySettings?: {
    firewall?: boolean;
    antiVirus?: boolean;
    vpn?: boolean;
    enc?: boolean;
    ids?: boolean;
  }): "low" | "medium" | "high" | "extreme" => {
    // Use provided securitySettings, or deviceSecuritySettings for selected device, or device configuration
    const settings = securitySettings || (selectedDevice?.id === device.id ? deviceSecuritySettings : null) || device.configuration?.securitySettings;
    if (!settings) return "medium"; // Default if no security settings available

    let score = 0; // Start with no security

    // Add score for enabled security features
    if (settings.firewall === true) score += 25;
    if (settings.antiVirus === true) score += 20;
    if (settings.vpn === true) score += 15;
    if (settings.enc === true) score += 20;
    if (settings.ids === true) score += 20;

    // High bitcoin balance indicates valuable target (potentially better secured)
    if (device.bitcoinBalance && device.bitcoinBalance > 50) {
      score += 10;
    }

    // Bank devices are typically more secure
    if (device.isBank) {
      score += 15;
    }

    // Status affects security
    if (device.status === 'online') {
      score += 5;
    }

    // Determine level based on score (max base score is 100, but bonuses can increase it)
    if (score >= 90) return "extreme"; // All 5 security features + bonuses
    if (score >= 70) return "high";    // 3-4 security features + bonuses
    if (score >= 35) return "medium";  // 1-2 security features + bonuses
    return "low";                      // No security features enabled
  };

  // Generate vulnerabilities based on security settings
  const generateVulnerabilities = (device: DeviceInfo, securitySettings?: {
    firewall?: boolean;
    antiVirus?: boolean;
    vpn?: boolean;
    enc?: boolean;
    ids?: boolean;
  }): string[] => {
    // Use provided securitySettings, or deviceSecuritySettings for selected device, or device configuration
    const settings = securitySettings || (selectedDevice?.id === device.id ? deviceSecuritySettings : null) || device.configuration?.securitySettings;
    if (!settings) return [];

    const vulnerabilities: string[] = [];

    if (!settings.firewall) {
      vulnerabilities.push("Firewall disabled - Network exposed to unauthorized access");
    }
    if (!settings.antiVirus) {
      vulnerabilities.push("Antivirus software not installed - Vulnerable to malware");
    }
    if (!settings.vpn) {
      vulnerabilities.push("VPN not configured - Traffic interception possible");
    }
    if (!settings.enc) {
      vulnerabilities.push("Data encryption disabled - Information at risk");
    }
    if (!settings.ids) {
      vulnerabilities.push("Intrusion Detection System offline - Attacks may go undetected");
    }

    // Add existing vulnerabilities from the device data
    if (device.vulnerabilities && device.vulnerabilities.length > 0) {
      vulnerabilities.push(...device.vulnerabilities);
    }

    return vulnerabilities;
  };

  // Fetch security settings for a specific device
  const fetchDeviceSecuritySettings = useCallback(async (deviceMacAddress: string) => {
    try {
      const response = await fetch(`/api/device/security?deviceMacAddress=${encodeURIComponent(deviceMacAddress)}`);
      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Fetched security settings for', deviceMacAddress, ':', result.device);
        return result.device;
      } else {
        console.error('Failed to fetch security settings:', result);
      }
    } catch (error) {
      console.error('Error fetching device security settings:', error);
      logger.error('Failed to fetch device security settings:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
    return null;
  }, []);

  // Access denied screen
  if (userRole && userRole.toLowerCase() !== 'professor') {
    return (
      <div className="h-screen w-screen bg-black flex flex-col font-sans text-white overflow-hidden relative">
        <MatrixRainBackground intensity="low" />
        <Scanlines opacity={0.1} />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-black border-2 border-red-500 p-8 rounded-md max-w-md w-full">
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4 text-red-500">🔒</div>
              <div className="space-y-3">
                <h3 className="text-xl font-mono font-bold text-red-500 tracking-wider">ACCESS DENIED</h3>
                <TerminalText 
                  text="SECURITY CLEARANCE INSUFFICIENT" 
                  className="text-red-400 block"
                  typeDelay={50}
                />
                <p className="text-gray-400 text-sm mt-2 font-mono">
                  User: <span className="text-red-400">{userRole}</span><br/>
                  Required: <span className="text-green-400">PROFESSOR</span>
                </p>
              </div>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-3 bg-black border-2 border-red-500 hover:bg-red-500 hover:text-black text-red-500 text-sm transition-colors font-mono"
              >
                RETURN TO TERMINAL
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game terminated screen
  if (gameTerminated) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col font-sans text-white overflow-hidden relative">
        <MatrixRainBackground intensity="high" />
        <Scanlines opacity={0.2} />
        <GlitchEffect isActive={true} intensity="high" />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-black border-2 border-red-500 p-8 rounded-md max-w-md w-full">
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4 text-red-500 animate-pulse">⚠️</div>
              <div className="space-y-3">
                <h3 className="text-xl font-mono font-bold text-red-500 animate-pulse tracking-wider">SYSTEM TERMINATED</h3>
                <TerminalText 
                  text="CONNECTION LOST. SESSION KILLED BY ADMINISTRATOR." 
                  className="text-red-400 block"
                  typeDelay={30}
                />
                <div className="text-green-500 font-mono text-sm mt-4 bg-black border border-green-500 p-3">
                  <div className="animate-pulse">REDIRECTING TO GAME OVER...</div>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent"></div>
                    <span>Processing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats for display (only hackphone devices that are online)
  const hackphoneDevices = devices.filter(d => d.deviceType === 'hackphone' && d.status === 'online');
  const cooldownRemaining = lastScanTime ? Math.max(0, SCAN_COOLDOWN_MS - (nowTs - lastScanTime)) : 0;
  const cooldownSeconds = Math.ceil(cooldownRemaining / 1000);

  // Main app UI
  return (
    <div className="h-screen w-screen bg-black flex flex-col font-sans text-green-500 overflow-hidden relative">
      {/* Background effects */}
      <MatrixRainBackground intensity="low" />
      <Scanlines opacity={0.1} />
      <GlitchEffect isActive={showGlitch} intensity="medium" />
      
      {/* Help modal with keyboard shortcuts */}
      
      
      {/* Notifications */}
      <TerminalNotification notifications={notifications} />
      
      {/* Header bar */}
      <div className="bg-black border-b border-green-500 p-2 sm:p-4 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border border-green-500 relative">
            <Image 
              src="/hackphone/apps/sentinel/app-icon.png" 
              alt="Sentinel" 
              width={20} 
              height={20} 
              className="w-4 h-4 sm:w-6 sm:h-6"
            />
            {/* Animated corner dots */}
            <div className="absolute top-0 left-0 w-1 h-1 bg-green-500 animate-pulse"></div>
            <div className="absolute top-0 right-0 w-1 h-1 bg-red-500 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-0 left-0 w-1 h-1 bg-yellow-500 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-0 right-0 w-1 h-1 bg-green-500 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          </div>
          <div>
            <div className="font-mono text-green-500 tracking-wider text-xs sm:text-sm">SENTINEL v3.0</div>
            <div className="text-xs text-green-700 hidden xs:block">{'// root@professor: ~'}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Last executed command - only on larger screens */}
          <div className="hidden md:block border-l border-green-800 pl-4">
            <div className="text-xs font-mono text-green-700">Last command:</div>
            <div className="text-xs font-mono text-green-500 truncate max-w-[200px]">system.init()</div>
          </div>
          
          <div className="text-right">
            <div className="text-xs font-mono">{time}</div>
            <div className="text-xs text-green-700 flex items-center justify-end space-x-1">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="whitespace-nowrap">PROFESSOR</span>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex bg-black border-b border-green-700">
        {[
          { id: 'mission', name: 'MISSION CONTROL', shortName: 'MISSION', cmd: './mission.sh' },
          { id: 'transfers', name: 'BTC TRANSFER', shortName: 'TRANSFER', cmd: './btc_transfer.sh' },
          { id: 'wallets', name: 'WALLETS', shortName: 'WALLETS', cmd: './wallets.sh' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as 'mission' | 'transfers' | 'wallets');
              // Brief glitch effect on tab change
              setShowGlitch(true);
              setTimeout(() => setShowGlitch(false), 300);
              addNotification(`[EXEC] ${tab.cmd}`);
              // Fetch wallets when wallets tab is selected
              if (tab.id === 'wallets') {
                fetchWallets();
              }
            }}
            className={`flex-1 py-2 px-1 sm:px-3 font-mono text-xs sm:text-sm transition-colors relative
              ${activeTab === tab.id ? 'text-green-400 bg-black' : 'text-green-700 hover:text-green-500'}`}
          >
            <div className="flex items-center justify-center">
              <span className="hidden xs:inline-block mr-1">$</span>
              {/* Show shorter name on smaller screens */}
              <span className="whitespace-nowrap truncate hidden sm:inline-block">{tab.name}</span>
              <span className="whitespace-nowrap truncate sm:hidden">{tab.shortName}</span>
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"></div>
            )}
          </button>
        ))}
      </div>
      
      {/* Main Content Area - scrollable */}
      <div className="flex-1 overflow-y-auto bg-black p-4 space-y-4 mb-20">
        {/* MISSION CONTROL TAB */}
        {activeTab === 'mission' && (
          <div className="space-y-6">
            {/* Terminal header */}
            <CommandPrompt 
              command="cat mission_status.txt"
              output={(
                <div className="border border-green-700 p-3 space-y-2">
                  <div className="font-bold">-- SENTINEL MISSION CONTROL --</div>
                  <div>Date: {new Date().toLocaleDateString()}</div>
                  <div>Time: {time}</div>
                  <div>Status: {scanCompleted ? 'Network Mapped' : 'Awaiting Reconnaissance'}</div>
                </div>
              )}
            />
          
            
            {/* Code snippets display for hacker feel */}
            <div className="mb-4">
              <CodeSnippet lines={codeSnippets} title="memory_dump.hex" />
            </div>
            
            {/* Terminal Window with radar */}
            <TerminalWindow title="network_scan.bin" className="mb-4">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 p-2">
                {/* Left: Enhanced Radar visualization with targets */}
                <div className="flex-shrink-0 relative">
                  <HackerRadar 
                    isActive={isScanning} 
                    discoveredDevices={discoveredDevices}
                    targets={scanCompleted && devices ? devices.filter(d => d.deviceType === 'hackphone' && d.status === 'online').map(d => ({
                      x: Math.random() * 0.8 - 0.4,
                      y: Math.random() * 0.8 - 0.4,
                      status: d.status
                    })) : []}
                  />
                  
                  {/* Terminal overlay during scanning */}
                  {isScanning && (
                    <div className="absolute inset-0 pointer-events-none flex items-end justify-center">
                      <div className="p-1 bg-black bg-opacity-70 text-xs font-mono text-green-500 w-full text-center">
                        <div className="animate-typewriter overflow-hidden whitespace-nowrap">
                          {scanProgress < 30 ? 'Initializing vulnerability scan...' :
                           scanProgress < 60 ? 'Analyzing security configurations...' :
                           'Running vulnerability assessment...'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right: Enhanced Scan controls with terminal styling */}
                <div className="flex-1 space-y-4">
                  {/* Scan progress with enhanced terminal styling */}
                  {isScanning && (
                    <div className="border border-green-900 p-2 bg-black bg-opacity-30">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        <div className="font-mono text-xs text-yellow-500">SCAN IN PROGRESS</div>
                      </div>
                      
                      <HackerProgressBar progress={scanProgress} label="SCAN PROGRESS" />
                      
                      <div className="mt-3 font-mono text-xs space-y-1">
                        {/* Dynamic scan messages */}
                        <div className="text-green-500">
                          $ sudo openvas --scan-config &quot;Full and fast&quot; --target 192.168.1.0/24
                        </div>
                        <div className="text-green-700">
                          {scanProgress < 25 && '> Initializing vulnerability scanner...'}
                          {scanProgress >= 25 && scanProgress < 50 && '> Checking security configurations...'}
                          {scanProgress >= 50 && scanProgress < 75 && '> Analyzing firewall rules...'}
                          {scanProgress >= 75 && '> Running vulnerability assessment...'}
                        </div>
                        
                        {/* Live stats */}
                        <div className="flex justify-between text-green-600 mt-2">
                          <span>Hosts: {Math.min(Math.floor(scanProgress/10), discoveredDevices)}/{discoveredDevices}</span>
                          <span>Vulnerabilities: {Math.floor(scanProgress/3)}</span>
                          <span>Rate: {Math.floor(50 + Math.random() * 100)} checks/s</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced scan button with keyboard shortcut hint */}
                  <button
                    onClick={startScan}
                    disabled={isScanning || cooldownRemaining > 0}
                    className={`w-full py-3 font-mono border-2 transition-colors ${
                      isScanning || cooldownRemaining > 0
                        ? 'bg-gray-900 text-gray-600 border-gray-700 cursor-not-allowed'
                        : 'bg-black text-green-500 border-green-500 hover:bg-green-900 hover:bg-opacity-20'
                    }`}
                  >
                    {isScanning ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent"></div>
                        <span>SCANNING IN PROGRESS...</span>
                      </div>
                    ) : cooldownRemaining > 0 ? (
                      <div className="flex items-center justify-center space-x-2">
                        <span>COOLDOWN: {cooldownSeconds}s</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>EXECUTE NETWORK SCAN</span>
                      </div>
                    )}
                  </button>
                  
                  {/* Enhanced status messages with terminal styling */}
                  {!scanCompleted && !isScanning && (
                    <div className="text-xs font-mono border border-green-900 p-2 bg-black bg-opacity-30">
                      <div className="text-green-500">$ scan_help</div>
                      <div className="text-green-700 mt-1">Execute network scan to enumerate targets</div>
                      <div className="text-green-700 mt-1">Execute scan to enumerate targets</div>
                    </div>
                  )}
                  
                  {/* Locked target info with enhanced styling */}
                  {deviceLockedForScan && (
                    <div className="text-xs font-mono border border-cyan-900 p-2 bg-cyan-900 bg-opacity-10">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse mr-2"></div>
                        <span className="text-cyan-500">TARGET LOCKED</span>
                      </div>
                      <div className="mt-1 pl-4 text-cyan-400">
                        Type: {deviceLockedForScan.deviceType.toUpperCase()}
                      </div>
                      <div className="pl-4 text-cyan-400">
                        ID: {deviceLockedForScan.deviceMacAddress.slice(-8)}
                      </div>
                      <div className="pl-4 text-cyan-400">
                        Status: <span className={deviceLockedForScan.status === 'online' ? 'text-green-500' : 'text-red-500'}>
                          {deviceLockedForScan.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Scan results summary */}
                  {scanCompleted && !isScanning && (
                    <div className="text-xs font-mono border border-green-900 p-2">
                      <div className="text-green-500">$ scan_summary</div>
                      <div className="text-green-700 mt-1">Scan completed at {new Date().toLocaleTimeString()}</div>
                      <div className="flex justify-between mt-1">
                        <span className="text-green-600">Total devices:</span>
                        <span className="text-green-400">{hackphoneDevices.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Online:</span>
                        <span className="text-green-400">{hackphoneDevices.filter(d => d.status === 'online').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Vulnerable:</span>
                        <span className="text-yellow-400">{hackphoneDevices.filter(d => {
                          const level = calculateSecurityLevel(d);
                          return level === 'low' || level === 'medium';
                        }).length}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TerminalWindow>
            
            {/* Device list in terminal style */}
            <TerminalWindow title="target_devices.log" className="mb-4">
              {!scanCompleted ? (
                <div className="text-center py-6 animate-pulse">
                  <div className="text-green-500 mb-2">[NO DATA]</div>
                  <div className="text-green-700 text-sm">Execute scan to enumerate targets</div>
                  <div className="mt-4 text-xs text-green-700 font-mono">
                    <div>Execute scan to enumerate targets</div>
                  </div>
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-yellow-500 mb-2">[EMPTY RESULTS]</div>
                  <div className="text-green-700 text-sm">No targets detected in scan</div>
                </div>
              ) : (
                <>
                  {deviceLockedForScan && (
                    <div className="text-xs font-mono border border-yellow-900 p-2 bg-yellow-900 bg-opacity-10 mb-2">
                      <div className="text-yellow-500">⚠ TARGET SELECTION LOCKED</div>
                      <div className="text-yellow-700">One target per scan session - start new scan to change target</div>
                    </div>
                  )}
                  <TerminalDeviceList
                    devices={devices.filter(device => device.deviceType === 'hackphone' && device.status === 'online')}
                    selectedDevice={selectedDevice || undefined}
                    onDeviceSelect={async (device) => {
                      // Prevent selecting any device if one is already locked for this scan session
                      if (deviceLockedForScan) {
                        addNotification(`[ERROR] Target already locked for this scan session`);
                        return;
                      }

                      // Trigger brief glitch effect when selecting a device
                      setShowGlitch(true);
                      setTimeout(() => setShowGlitch(false), 300);

                      setSelectedDevice(device);
                      
                      // Reset exploit state for new device
                      setExploitUsed(false);
                      
                      // Fetch security settings for the selected device
                      const securitySettings = await fetchDeviceSecuritySettings(device.deviceMacAddress);
                      setDeviceSecuritySettings(securitySettings);
                      
                      // Lock this device for the entire scan session
                      setDeviceLockedForScan(device);
                      addNotification(`[TARGET LOCKED] ${device.deviceType} (${device.ipAddress})`);

                      // Update code snippets to show "hacking" the device
                      setCodeSnippets([
                        `0xAD45: connecting to ${device.ipAddress}`,
                        `0xBC01: bypassing firewall...`,
                        `0xDF37: enumerating services`,
                        `0xE812: collecting device info`,
                        `0x7FF8: extracting vulnerabilities`
                      ]);
                    }}
                    lockedDevices={deviceLockedForScan ? devices.filter(d => d.deviceType === 'hackphone' && d.status === 'online').map(d => d.id) : []}
                    calculateSecurityLevel={(device) => {
                      // Fetch security settings for this device to calculate dynamic security level
                      // Check if security features are explicitly enabled (true)
                      const hasFirewall = device.configuration?.securitySettings?.firewall === true;
                      const hasAntivirus = device.configuration?.securitySettings?.antiVirus === true;
                      const hasVpn = device.configuration?.securitySettings?.vpn === true;
                      const hasEncryption = device.configuration?.securitySettings?.enc === true;
                      const hasIds = device.configuration?.securitySettings?.ids === true;
                      
                      let score = 0; // Start with no security
                      
                      // Add score for enabled security features
                      if (hasFirewall) score += 25;
                      if (hasAntivirus) score += 20;
                      if (hasVpn) score += 15;
                      if (hasEncryption) score += 20;
                      if (hasIds) score += 20;
                      
                      // High bitcoin balance indicates valuable target (potentially better secured)
                      if (device.bitcoinBalance && device.bitcoinBalance > 50) {
                        score += 10;
                      }
                      
                      // Bank devices are typically more secure
                      if (device.isBank) {
                        score += 15;
                      }
                      
                      // Status affects security
                      if (device.status === 'online') {
                        score += 5;
                      }
                      
                      // Determine level based on score (max base score is 100, but bonuses can increase it)
                      if (score >= 90) return "extreme"; // All 5 security features + bonuses
                      if (score >= 75) return "high";    // 3-4 security features + bonuses
                      if (score >= 35) return "medium";  // 1-2 security features + bonuses  
                      return "low";                       // No security features enabled
                    }}
                    className="mb-4"
                  />
                </>
              )}
            </TerminalWindow>
            
            {/* Enhanced Selected device details with interactive elements */}
            {selectedDevice && (
              <TerminalWindow title={`target_${selectedDevice.deviceMacAddress.slice(-8)}.exe`} className="mb-4">
                <div className="space-y-4">
                  {/* Enhanced Device header with more data and terminal styling */}
                  <div className="flex items-center justify-between border-b border-green-900 pb-2">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-2 ${
                        selectedDevice.status === 'online' ? 'bg-green-500 animate-pulse' :
                        selectedDevice.status === 'maintenance' ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}></div>
                      <div className="text-lg font-bold text-green-400">
                        {selectedDevice.deviceType.toUpperCase()}
                        {selectedDevice.isBank && <span className="ml-2 text-yellow-500">🏦</span>}
                      </div>
                    </div>
                    <div className={`px-2 py-1 border-2 font-mono text-sm ${
                      selectedDevice.status === 'online' ? 'border-green-500 text-green-500 animate-pulse' :
                      selectedDevice.status === 'maintenance' ? 'border-yellow-500 text-yellow-500' : 
                      'border-red-500 text-red-500'
                    }`}>
                      {selectedDevice.status.toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Terminal command header */}
                  <div className="text-xs font-mono text-green-600">
                    $ openvas --target {selectedDevice.ipAddress} --scan-config &quot;Full and fast&quot;
                    <div className="mt-1">
                      Starting vulnerability scan at {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                  
                  
                  {/* Enhanced Device info grid with more hacker data */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-green-900 p-2 bg-black bg-opacity-30">
                      <div className="text-xs text-green-700">MAC ADDRESS</div>
                      <div className="font-mono flex items-center flex-wrap">
                        <span 
                          className="text-green-500 break-all cursor-pointer hover:text-green-300 transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(`${selectedDevice.deviceMacAddress} ${selectedDevice.ipAddress}`);
                            addNotification(`Device info copied: ${selectedDevice.deviceMacAddress} ${selectedDevice.ipAddress}`);
                          }}
                          title="Click to copy MAC and IP addresses"
                        >
                          {selectedDevice.deviceMacAddress}
                        </span>
                        <span className="ml-1 text-xs text-green-700 whitespace-nowrap">(OUI: {selectedDevice.deviceMacAddress.slice(0,8)})</span>
                      </div>
                    </div>
                    <div className="border border-green-900 p-2 bg-black bg-opacity-30">
                      <div className="text-xs text-green-700">IP ADDRESS</div>
                      <div className="font-mono flex items-center flex-wrap">
                        <span 
                          className="text-green-500 break-all cursor-pointer hover:text-green-300 transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(`${selectedDevice.deviceMacAddress} ${selectedDevice.ipAddress}`);
                            addNotification(`Device info copied: ${selectedDevice.deviceMacAddress} ${selectedDevice.ipAddress}`);
                          }}
                          title="Click to copy MAC and IP addresses"
                        >
                          {selectedDevice.ipAddress}
                        </span>
                        <span className="ml-1 text-xs text-green-700 whitespace-nowrap">(TTL: 64)</span>
                      </div>
                    </div>
                    
                    {/* Security status section - shows security settings */}
                    <div className="border border-green-900 p-2 bg-black bg-opacity-30">
                      <div className="text-xs text-green-700">SECURITY STATUS</div>
                      <div className="font-mono text-xs space-y-1 mt-1">
                        <div className={`flex items-center ${deviceSecuritySettings?.firewall ? 'text-green-500' : 'text-red-500'}`}>
                          <span className="mr-2">🔥</span>Firewall: {deviceSecuritySettings?.firewall ? 'ENABLED' : 'DISABLED'}
                        </div>
                        <div className={`flex items-center ${deviceSecuritySettings?.antiVirus ? 'text-green-500' : 'text-red-500'}`}>
                          <span className="mr-2">🛡️</span>Antivirus: {deviceSecuritySettings?.antiVirus ? 'ENABLED' : 'DISABLED'}
                        </div>
                        <div className={`flex items-center ${deviceSecuritySettings?.vpn ? 'text-green-500' : 'text-red-500'}`}>
                          <span className="mr-2">🔒</span>VPN: {deviceSecuritySettings?.vpn ? 'ENABLED' : 'DISABLED'}
                        </div>
                        <div className={`flex items-center ${deviceSecuritySettings?.enc ? 'text-green-500' : 'text-red-500'}`}>
                          <span className="mr-2">🔐</span>Encryption: {deviceSecuritySettings?.enc ? 'ENABLED' : 'DISABLED'}
                        </div>
                      </div>
                    </div>
                    
                    {/* OS Detection section - always shown */}
                    <div className="border border-green-900 p-2 bg-black bg-opacity-30">
                      <div className="text-xs text-green-700">OS DETECTION</div>
                      <div className="font-mono text-xs mt-1">
                        <div className="text-green-500">
                          {selectedDevice.deviceType === 'router' ? 'Linux 5.15 (94%)' : 
                           selectedDevice.deviceType === 'server' ? 'Debian 11 (98%)' :
                           'Ubuntu 22.04 (92%)'}
                        </div>
                        <div className="text-green-700 mt-1">
                          {selectedDevice.deviceType === 'router' ? 'Network: Cisco/Juniper' :
                           selectedDevice.deviceType === 'server' ? 'App: NGINX/1.18.0' :
                           'App: Apache/2.4.52'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Financial info with enhanced styling */}
                    {selectedDevice.walletAddress && (
                      <div className="border border-green-900 p-2 col-span-2 bg-black bg-opacity-30">
                        <div className="text-xs text-yellow-600">FINANCIAL DATA</div>
                        <div className="flex flex-wrap justify-between items-center">
                          <div className="font-mono text-xs text-yellow-500 max-w-full overflow-hidden">
                            <div className="overflow-hidden text-ellipsis">WALLET: <span className="break-all">{selectedDevice.walletAddress}</span></div>
                            {selectedDevice.bitcoinBalance && (
                              <div>BALANCE: <span className="text-yellow-400 font-bold">₿{selectedDevice.bitcoinBalance.toFixed(2)}</span></div>
                            )}
                          </div>
                          {selectedDevice.isBank && (
                            <div className="border-2 border-yellow-600 rounded px-2 py-1 text-yellow-500 text-xs animate-pulse ml-2 mt-1">
                              HIGH-VALUE TARGET
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Vulnerabilities section with enhanced visual styling */}
                  <div className="border border-red-900 p-2 bg-red-900 bg-opacity-10">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs text-red-500 font-bold">VULNERABILITY SCAN</div>
                      <div className="text-xs text-red-700">
                        {calculateSecurityLevel(selectedDevice, deviceSecuritySettings || undefined) === 'low' ? '(CRITICAL ISSUES FOUND)' : 
                         calculateSecurityLevel(selectedDevice, deviceSecuritySettings || undefined) === 'medium' ? '(POTENTIAL ISSUES FOUND)' :
                         calculateSecurityLevel(selectedDevice, deviceSecuritySettings || undefined) === 'high' ? '(MINOR ISSUES FOUND)' :
                         '(FORTRESS-LEVEL SECURITY)'}
                      </div>
                    </div>
                    
                    {generateVulnerabilities(selectedDevice, deviceSecuritySettings || undefined).length > 0 ? (
                      <div className="space-y-1">
                        {generateVulnerabilities(selectedDevice, deviceSecuritySettings || undefined).map((v, i) => (
                          <div key={i} className="text-xs text-red-500 font-mono flex items-start">
                            <span className="inline-block h-2 w-2 bg-red-500 mr-2 mt-1 flex-shrink-0"></span>
                            <span className="text-red-400 whitespace-nowrap mr-2">CVE-2023-{Math.floor(Math.random() * 9000) + 1000}</span>
                            <span className="mx-2 flex-shrink-0">|</span>
                            <span className="break-words">{v}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-green-500 font-mono">
                        <span className="inline-block h-2 w-2 bg-green-500 mr-2"></span>
                        No exploitable vulnerabilities detected
                      </div>
                    )}
                  </div>
                  
                  {/* Interactive action buttons with hacker theme */}
                  <div className="flex space-x-2 pt-2 border-t border-green-900">
                    <button
                      className="flex-1 bg-black hover:bg-green-900 hover:bg-opacity-30 text-green-500 border border-green-700 py-1 px-2 text-sm font-mono transition-colors"
                      onClick={async () => {
                        // Show a brief glitch effect
                        setShowGlitch(true);
                        setTimeout(() => setShowGlitch(false), 300);
                        
                        // Fetch fresh security settings before scanning
                        const freshSecuritySettings = await fetchDeviceSecuritySettings(selectedDevice.deviceMacAddress);
                        setDeviceSecuritySettings(freshSecuritySettings);
                        
                        // Add a notification
                        addNotification(`[INFO] Vulnerability scan completed on ${selectedDevice.ipAddress}`);
                        
                        // Update code snippets to show vulnerability scan output
                        const vulnerabilities = generateVulnerabilities(selectedDevice, freshSecuritySettings);
                        setCodeSnippets([
                          `VULNERABILITY SCAN REPORT`,
                          `Target: ${selectedDevice.ipAddress}`,
                          `Security Level: ${calculateSecurityLevel(selectedDevice, freshSecuritySettings).toUpperCase()}`,
                          `Vulnerabilities Found: ${vulnerabilities.length}`,
                          ...vulnerabilities.slice(0, 3).map(v => `• ${v.substring(0, 50)}${v.length > 50 ? '...' : ''}`)
                        ]);
                      }}
                    >
                      VULNERABILITY SCAN
                    </button>
                    
                    <button
                      className={`flex-1 bg-black hover:bg-red-900 hover:bg-opacity-30 text-red-500 border border-red-700 py-1 px-2 text-sm font-mono transition-colors ${exploitUsed ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={async () => {
                        if (exploitUsed) return;
                        
                        // Show a more intense glitch effect
                        setShowGlitch(true);
                        setTimeout(() => setShowGlitch(false), 500);
                        
                        // Mark exploit as used
                        setExploitUsed(true);
                        
                        // Randomly select a security setting to disable
                        const securityKeys = ['firewall', 'antiVirus', 'vpn', 'enc', 'ids'] as const;
                        const enabledSettings = securityKeys.filter(key => deviceSecuritySettings?.[key]);
                        
                        if (enabledSettings.length === 0) {
                          // No security settings to disable
                          addNotification(`[ERROR] No security systems to exploit on ${selectedDevice.deviceType}`);
                          setCodeSnippets([
                            `Launching exploit module...`,
                            `Target: ${selectedDevice.ipAddress}`,
                            `No exploitable security systems found!`,
                            `Exploit failed - target already compromised.`
                          ]);
                          return;
                        }
                        
                        const randomIndex = Math.floor(Math.random() * enabledSettings.length);
                        const settingToDisable = enabledSettings[randomIndex];
                        
                        // Update security settings on server
                        try {
                          const response = await fetch('/api/device/security', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              deviceMacAddress: selectedDevice.deviceMacAddress,
                              [settingToDisable]: false
                            })
                          });
                          
                          if (response.ok) {
                            // Update local state
                            const updatedSettings = {
                              ...deviceSecuritySettings,
                              [settingToDisable]: false
                            };
                            setDeviceSecuritySettings(updatedSettings);
                            
                            // Add notification
                            addNotification(`[SUCCESS] Security breach! ${settingToDisable.toUpperCase()} disabled on ${selectedDevice.deviceType}`);
                            
                            // Update code snippets to show exploit output
                            setCodeSnippets([
                              `Launching exploit module...`,
                              `Target: ${selectedDevice.ipAddress}`,
                              `Security breach successful!`,
                              `${settingToDisable.toUpperCase()} system compromised and disabled.`,
                              `Target vulnerability increased.`,
                              selectedDevice.isBank ? `Financial system access: ENHANCED` : ''
                            ].filter(Boolean));
                          } else {
                            // Revert exploit used state on failure
                            setExploitUsed(false);
                            addNotification(`[ERROR] Exploit failed on ${selectedDevice.deviceType}`);
                            setCodeSnippets([
                              `Launching exploit module...`,
                              `Target: ${selectedDevice.ipAddress}`,
                              `Exploit execution failed!`,
                              `Security systems remain intact.`
                            ]);
                          }
                        } catch (error) {
                          console.error('Exploit failed:', error);
                          // Revert exploit used state on error
                          setExploitUsed(false);
                          addNotification(`[ERROR] Exploit failed on ${selectedDevice.deviceType}`);
                          setCodeSnippets([
                            `Launching exploit module...`,
                            `Target: ${selectedDevice.ipAddress}`,
                            `Network error during exploit!`,
                            `Security systems remain intact.`
                          ]);
                        }
                      }}
                      disabled={exploitUsed}
                    >
                      {exploitUsed ? 'EXPLOIT USED' : 'EXPLOIT'}
                    </button>
                  </div>
                  
                  {/* Scan completion timestamp */}
                  <div className="text-xs font-mono text-green-700 border-t border-green-900 pt-2">
                    Scan completed in 3.45s at {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </TerminalWindow>
            )}
            
            {/* Game Termination Section */}
            <div className="pt-4 mt-4 pb-20 border-t border-red-900">
              <TerminalWindow title="admin_controls.sh" className="mb-4">
                {!showTerminateConfirm ? (
                  <div className="space-y-4">
                    <CommandPrompt 
                      command="cat termination_warning.txt"
                      output={
                        <div className="text-yellow-500">
                          WARNING: Terminating the game will disconnect all players and end the current session.
                        </div>
                      }
                    />
                    
                    <button
                      onClick={() => setShowTerminateConfirm(true)}
                      className="w-full py-3 bg-black border-2 border-red-500 text-red-500 hover:bg-red-900 hover:bg-opacity-20 font-mono"
                    >
                      INITIATE GAME TERMINATION SEQUENCE
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-red-500 p-4 animate-pulse">
                      <div className="text-center text-red-500 font-bold">CONFIRM TERMINATION</div>
                      <div className="text-yellow-500 text-sm mt-2">
                        This action will immediately terminate this device&apos;s connection, end the game session and redirect 
                        to device selection. This action cannot be undone.
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowTerminateConfirm(false)}
                        className="flex-1 py-2 bg-black border border-green-500 text-green-500 hover:bg-green-900 hover:bg-opacity-20 font-mono"
                      >
                        ABORT
                      </button>
                      <button
                        onClick={terminateGame}
                        disabled={isTerminating}
                        className="flex-1 py-2 bg-black border-2 border-red-500 text-red-500 hover:bg-red-900 hover:bg-opacity-20 font-mono"
                      >
                        {isTerminating ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin h-4 w-4 border-2 border-red-500 rounded-full border-t-transparent"></div>
                            <span>PROCESSING...</span>
                          </div>
                        ) : (
                          <span>EXECUTE TERMINATION</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </TerminalWindow>
            </div>
          </div>
        )}
        
        {/* TRANSFERS TAB */}
        {activeTab === 'transfers' && (
          <TerminalWindow title="btc_transfer.bin" className="mb-4">
            <div className="space-y-4">
              <CommandPrompt
                command="cat transfer_instructions.txt"
                output={
                  <div className="text-green-400">
                    Transfer Bitcoin between any wallets using sender&apos;s address, private key, and receiver&apos;s address.
                  </div>
                }
              />

              <BankTransfersTab
                addNotification={(message) => addNotification(`[TRANSFER] ${message}`)}
                fetchTeamBalance={fetchTeamBalance}
                fetchWallets={fetchWallets}
              />
            </div>
          </TerminalWindow>
        )}
        
        {/* WALLETS TAB */}
        {activeTab === 'wallets' && (
          <TerminalWindow title="wallet_intel.bin" className="mb-4">
            <div className="space-y-4">
              <CommandPrompt 
                command="ls -la /wallets/"
                output={
                  <div className="text-xs font-mono">
                    <div className="text-green-700">
                      total {walletData.length} wallets found
                    </div>
                  </div>
                }
              />
              
              <div className="space-y-1">
                {/* Header row */}
                <div className="flex text-xs font-bold border-b border-green-900 pb-1 mb-2">
                  <div className="w-24 truncate">TEAM</div>
                  <div className="flex-1 px-1 truncate">ADDRESS</div>
                  <div className="w-24 flex-shrink-0 text-right px-1">BALANCE</div>
                </div>
                
                {/* Wallet rows */}
                {walletData.map((wallet) => (
                  <div
                    key={wallet.address}
                    className={`flex text-xs border p-2 ${
                      wallet.isOwnTeam ? 'border-green-500 bg-green-900 bg-opacity-10' : 'border-green-900 hover:border-green-700'
                    }`}
                  >
                    {/* Team name */}
                    <div className="w-24 flex items-center space-x-1">
                      <span className={wallet.isOwnTeam ? 'text-green-500' : 'text-green-400'} title={wallet.teamName || 'Unknown'}>
                        <span className="truncate block max-w-[70px]">{wallet.teamName || 'Unknown'}</span>
                      </span>
                      {wallet.isOwnTeam && <span className="text-green-500 flex-shrink-0">*</span>}
                    </div>
                    
                    {/* Wallet address */}
                    <div className="flex-1 font-mono px-1">
                      <span 
                        className="text-gray-500 break-all cursor-pointer hover:text-green-300 transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(wallet.address);
                          addNotification(`Wallet address copied: ${wallet.address}`);
                        }}
                        title="Click to copy wallet address"
                      >
                        {wallet.address}
                      </span>
                    </div>
                    
                    {/* Balance */}
                    <div className="w-24 text-yellow-500 font-mono flex-shrink-0 text-right px-1">
                      ₿{wallet.balance.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TerminalWindow>
        )}
      </div>
      
      {/* Add hacking-themed CSS animations */}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes matrix-fall {
          from { transform: translateY(-100%); }
          to { transform: translateY(100vh); }
        }
        
        @keyframes glitch-horizontal {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(3px); opacity: 0.5; }
          75% { transform: translateY(-3px); opacity: 0.7; }
        }
        
        @keyframes rgb-shift {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        
        @keyframes noise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          20% { transform: translate(-10%, 5%); }
          30% { transform: translate(5%, -10%); }
          40% { transform: translate(-5%, 15%); }
          50% { transform: translate(-10%, 5%); }
          60% { transform: translate(15%, 0); }
          70% { transform: translate(0, 10%); }
          80% { transform: translate(-15%, 0); }
          90% { transform: translate(10%, 5%); }
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.1; }
        }
        
        @keyframes slide-in {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
        
        .animate-matrix-fall {
          animation: matrix-fall linear infinite;
        }
        
        .animate-glitch-horizontal {
          animation: glitch-horizontal 0.2s ease-in-out infinite;
        }
        
        .animate-rgb-shift {
          animation: rgb-shift 2s ease-in-out infinite;
        }
        
        .animate-noise {
          animation: noise 0.3s linear infinite;
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #000;
          border-left: 1px solid rgb(22, 163, 74, 0.3);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgb(22, 163, 74);
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgb(34, 197, 94);
        }
      `}</style>
    </div>
  );
}

export default SentinelApp;