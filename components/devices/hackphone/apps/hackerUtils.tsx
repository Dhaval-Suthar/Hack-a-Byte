import React, { useEffect, useState } from 'react';

// Fisher-Yates shuffle algorithm to randomize device order
export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]; // Create a copy to avoid mutating the original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Hexadecimal code snippet generator for fake code display
export const generateCodeSnippet = (): string[] => {
  const lines: string[] = [];
  const addresses = ['0x7FF8', '0xAD45', '0xBC01', '0xDF37', '0xE812'];
  const opcodes = ['48 89 5C 24', '48 8B C4', '48 83 EC 28', '48 8B 49 38', 'C3 90 90 90'];

  for (let i = 0; i < 5; i++) {
    const addr = addresses[Math.floor(Math.random() * addresses.length)];
    const opcode = opcodes[Math.floor(Math.random() * opcodes.length)];
    lines.push(`${addr}: ${opcode}`);
  }

  return lines;
};

// Custom hooks for keyboard shortcuts
export const useKeyboardShortcut = (
  key: string,
  callback: () => void,
  dependencies: React.DependencyList = []
): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === key.toLowerCase()) {
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, dependencies]);
};// Terminal Text - simulates a typing effect for a hacker feel
export const TerminalText = ({
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
    <span className={`font-mono ${className}`}>
      {displayedText}
      {showCursor && isTyping && (
        <span className="animate-blink text-green-500">█</span>
      )}
    </span>
  );
};

// Enhanced Matrix rain effect background with dynamic characters and varied speeds
export const MatrixRainBackground = ({ intensity = 'low' }: { intensity?: 'low' | 'medium' | 'high' }) => {
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
export const Scanlines = ({ opacity = 0.15 }: { opacity?: number }) => {
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
export const GlitchEffect = ({
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
export const TerminalWindow = ({
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
        <div className="flex items-center space-x-1">
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
        </div>
        <span className="text-xs">{title}</span>
        <span className="text-xs">bash - 80x24</span>
      </div>

      {/* Terminal content */}
      <div className="p-3 text-green-500 font-mono">
        {children}
      </div>
    </div>
  );
};

// CommandPrompt component simulates a command line interface
export const CommandPrompt = ({
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
      <div className="flex">
        <span className="text-green-600 mr-2">root@sentinel:~$</span>
        <TerminalText text={command} typeDelay={30} className="text-white" />
      </div>

      {/* Command output */}
      <div className="pl-4 text-green-400 opacity-90">
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 animate-ping rounded-full"></div>
            <span>Processing...</span>
          </div>
        ) : (
          output
        )}
      </div>
    </div>
  );
};

// Hacker-themed notification system
export const HackerNotification = ({
  message,
  type = 'info',
  isVisible = true,
  onClose
}: {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  isVisible?: boolean;
  onClose?: () => void;
}) => {
  if (!isVisible) return null;

  const typeColors = {
    info: 'border-blue-500 bg-blue-900/20',
    success: 'border-green-500 bg-green-900/20',
    warning: 'border-yellow-500 bg-yellow-900/20',
    error: 'border-red-500 bg-red-900/20'
  };

  const typeIcons = {
    info: '[INFO]',
    success: '[SUCCESS]',
    warning: '[WARNING]',
    error: '[ERROR]'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm ${typeColors[type]} border rounded-md p-3 font-mono text-sm animate-slide-in`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="text-green-400 font-bold mb-1">{typeIcons[type]}</div>
          <div className="text-green-200">{message}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-green-400 hover:text-green-200 text-lg leading-none"
          >
            ×
          </button> 
        )}
      </div>
    </div>
  );
};

// Progress bar with hacker theme
export const HackerProgressBar = ({
  progress,
  label,
  color = 'green'
}: {
  progress: number;
  label?: string;
  color?: 'green' | 'blue' | 'red' | 'yellow';
}) => {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="w-full font-mono text-sm">
      {label && <div className="text-green-400 mb-1">{label}</div>}
      <div className="bg-gray-800 border border-green-500 rounded-sm h-4 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <div className="text-green-300 mt-1 text-xs">
        {Math.round(progress)}%
      </div>
    </div>
  );
};

// Enhanced scanning radar component with advanced hacker theme and more interactive elements
export const HackerRadar = ({
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
        <div className="text-xs text-green-700 mt-0.5">
          {isActive ? '[ESC] to cancel' : '[S] to scan'}
        </div>
      </div>
    </div>
  );
};

// Terminal-style device list component
export const TerminalDeviceList = ({
  devices,
  selectedDevice,
  onDeviceSelect,
  lockedDevices = [],
  className = '',
  calculateSecurityLevel
}: {
  devices: Array<{
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
  }>;
  selectedDevice?: {
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
  };
  onDeviceSelect?: (device: {
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
  }) => void;
  lockedDevices?: string[];
  className?: string;
  calculateSecurityLevel?: (device: {
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
  }) => "low" | "medium" | "high" | "extreme";
}) => {
  const defaultCalculateSecurityLevel = (device: {
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
  }): "low" | "medium" | "high" | "extreme" => {
    // Use firewall settings to calculate dynamic security level
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
    
    // Fallback to vulnerability count if no security settings available
    if (!device.configuration?.securitySettings) {
      if (device.vulnerabilities && device.vulnerabilities.length > 2) return 'low';
      if (device.vulnerabilities && device.vulnerabilities.length > 0) return 'medium';
      return 'high';
    }
    
    // Determine level based on score (max score is 100 with all features enabled)
    if (score >= 80) return "extreme"; // 4-5 security features enabled
    if (score >= 60) return "high";    // 3 security features enabled
    if (score >= 25) return "medium";  // 1-2 security features enabled
    return "low";                      // No security features enabled
  };

  return (
    <div className={`bg-black border border-green-500 rounded-md overflow-hidden ${className}`}>
      {/* Terminal header */}
      <div className="bg-green-900 text-green-200 px-3 py-1 font-mono text-sm border-b border-green-500 flex justify-between items-center">
        <div className="flex items-center space-x-1 flex-shrink-0">
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
        </div>
        <span className="text-xs truncate px-2 flex-1 text-center">DEVICE SCANNER v2.1</span>
        <span className="text-xs whitespace-nowrap flex-shrink-0">bash - 80x24</span>
      </div>

      {/* Column headers */}
      <div className="px-3 py-2 border-b border-green-900 text-green-400 font-mono text-xs grid grid-cols-12 gap-2">
        <div className="col-span-3 truncate">STATUS</div>
        <div className="col-span-4 truncate">IP ADDRESS</div>
        <div className="col-span-3 truncate">SECURITY</div>
        <div className="col-span-2 truncate text-center">VULN</div>
      </div>

      {/* Device list */}
      <div className="max-h-64 overflow-y-auto">
        {devices.length === 0 ? (
          <div className="px-3 py-4 text-center text-green-600 font-mono text-sm">
            $ scan --no-targets-found
            <br />
            <span className="text-green-700">No devices detected in network range</span>
          </div>
        ) : (
          devices.map((device) => {
            const isLocked = lockedDevices.includes(device.id);
            const securityLevel = calculateSecurityLevel ? calculateSecurityLevel(device) : defaultCalculateSecurityLevel(device);
            const isSelected = selectedDevice?.id === device.id;
            const vulnCount = device.vulnerabilities?.length || 0;

            return (
              <div
                key={device.id}
                className={`px-3 py-2 border-b border-green-900 hover:bg-green-900 hover:bg-opacity-10 cursor-pointer transition-colors font-mono text-sm grid grid-cols-12 gap-2 ${
                  isLocked ? 'opacity-50' : ''
                } ${
                  isSelected ? 'bg-green-900 bg-opacity-20 border-green-500' : ''
                }`}
                onClick={() => !isLocked && onDeviceSelect?.(device)}
              >
                {/* Status */}
                <div className="col-span-3 flex items-center">
                  <span className={`h-2 w-2 rounded-full mr-2 ${
                    device.status === 'online' ? 'bg-green-500 animate-pulse' :
                    device.status === 'maintenance' ? 'bg-yellow-500 animate-ping' :
                    'bg-red-500'
                  }`}></span>
                  <span className={
                    device.status === 'online' ? 'text-green-500' :
                    device.status === 'maintenance' ? 'text-yellow-500' :
                    'text-red-500'
                  }>
                    {device.status.toUpperCase()}
                  </span>
                  {device.isBank && <span className="text-yellow-500 flex-shrink-0 ml-2">🏦</span>}
                </div>

                {/* IP Address */}
                <div className="col-span-4 text-green-400 truncate" title={device.ipAddress}>
                  {device.ipAddress}
                </div>

                {/* Security Level */}
                <div className="col-span-3 truncate">
                  <span className={`
                    ${securityLevel === 'extreme' ? 'text-purple-500' :
                      securityLevel === 'high' ? 'text-red-500' :
                      securityLevel === 'medium' ? 'text-yellow-500' :
                      'text-green-500'}
                    ${isSelected ? 'font-bold' : ''}
                  `}>
                    {securityLevel.toUpperCase()}
                    {securityLevel === 'low' && isSelected && (
                      <span className="ml-1 animate-pulse">⚠️</span>
                    )}
                    {securityLevel === 'extreme' && isSelected && (
                      <span className="ml-1 animate-pulse">🛡️</span>
                    )}
                  </span>
                </div>

                {/* Vulnerabilities */}
                <div className="col-span-2 text-center">
                  <span className={`
                    ${vulnCount > 2 ? 'text-red-500' :
                      vulnCount > 0 ? 'text-yellow-500' :
                      'text-green-500'}
                  `}>
                    {vulnCount}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-green-900 text-green-700 font-mono text-xs flex flex-wrap justify-between">
        <span className="truncate mr-2">$ devices.list() --count={devices.length}</span>
        <span className="whitespace-nowrap">↑↓ to navigate | ENTER to select</span>
      </div>
    </div>
  );
};