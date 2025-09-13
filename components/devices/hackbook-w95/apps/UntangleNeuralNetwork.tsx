"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import gameScoring, { GameScoringManager } from "../hooks/useGameScoring";
import GameDifficultyManager from "../hooks/useGameDifficulty";
import audioManager from "../hooks/useAudioManager";
import { useGameFailureHandler } from "../hooks/useGameFailureHandler";
import Win95Alert from "../Win95Alert";

interface Node {
  id: string;
  x: number;
  y: number;
  isDragging?: boolean;
  isFixed?: boolean; // Some nodes might be locked in position
  isHovered?: boolean;
  pulseIntensity?: number;
}

interface Connection {
  from: string;
  to: string;
  isIntersecting: boolean;
  animationOffset?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface UntangleNeuralNetworkProps {
  onClose: () => void;
  onSuccess: (data: string) => void;
}

const UntangleNeuralNetwork: React.FC<UntangleNeuralNetworkProps> = ({
  onClose,
  onSuccess
}) => {
  const { handleFailure, alertMessage, showAlert, closeAlert } = useGameFailureHandler();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [gameComplete, setGameComplete] = useState(false);
  const [gameFailed, setGameFailed] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [revealedData, setRevealedData] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes timeout
  
  // Enhanced game state
  const [particles, setParticles] = useState<Particle[]>([]);
  const [moveHistory, setMoveHistory] = useState<Array<{nodes: Node[], timestamp: number}>>([]);
  const [showHint, setShowHint] = useState(false);
  const [hintNode, setHintNode] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Start game tracking on component mount
  useEffect(() => {
    const currentDifficulty = GameDifficultyManager.getGlobalDifficulty();
    gameScoring.startGame(GameScoringManager.UNTANGLE_NEURAL_NETWORK, currentDifficulty);
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (gameComplete || gameFailed) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameFailed(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameComplete, gameFailed]);

  // Handle game failure - delete account
  useEffect(() => {
    if (gameFailed) {
      setTimeout(() => {
        handleFailure();
      }, 3000); // 3 second delay to show failure message
    }
  }, [gameFailed, handleFailure]);

  // Configuration based on difficulty - Enhanced for better challenge
  const getDifficultyConfig = useCallback(() => {
    const globalDifficulty = GameDifficultyManager.getGlobalDifficulty();
    
    switch (globalDifficulty) {
      case "easy":
        return { nodeCount: 4, connectionDensity: 0.5, canvasWidth: 300, canvasHeight: 200 };
      case "normal":
        return { nodeCount: 5, connectionDensity: 0.6, canvasWidth: 350, canvasHeight: 250 };
      case "hard":
        return { nodeCount: 6, connectionDensity: 0.7, canvasWidth: 400, canvasHeight: 300 };
      case "nightmare":
        return { nodeCount: 7, connectionDensity: 0.8, canvasWidth: 450, canvasHeight: 350 };
      default:
        return { nodeCount: 5, connectionDensity: 0.6, canvasWidth: 350, canvasHeight: 250 };
    }
  }, []);

  // Generate initial puzzle configuration with guaranteed tangling
  const generatePuzzle = useCallback(() => {
    const config = getDifficultyConfig();
    const { nodeCount, connectionDensity, canvasWidth, canvasHeight } = config;
    
    // Generate nodes with better distribution for tangling
    const padding = 60;
    const usableWidth = canvasWidth - 2 * padding;
    const usableHeight = canvasHeight - 2 * padding;
    
    // Generate connections first to ensure we have enough
    const newConnections: Connection[] = [];
    const minConnections = Math.max(nodeCount, Math.floor((nodeCount * (nodeCount - 1) / 2) * connectionDensity));
    
    // Create a cycle to ensure connectivity
    for (let i = 0; i < nodeCount; i++) {
      const nextIndex = (i + 1) % nodeCount;
      newConnections.push({
        from: `node-${i}`,
        to: `node-${nextIndex}`,
        isIntersecting: false,
        animationOffset: Math.random() * Math.PI * 2
      });
    }
    
    // Add cross connections to guarantee intersections
    if (nodeCount >= 4) {
      // Add diagonal connections that will definitely create intersections
      for (let i = 0; i < nodeCount - 2; i++) {
        const targetIndex = (i + 2) % nodeCount;
        const connectionExists = newConnections.some(conn => 
          (conn.from === `node-${i}` && conn.to === `node-${targetIndex}`) ||
          (conn.from === `node-${targetIndex}` && conn.to === `node-${i}`)
        );
        
        if (!connectionExists) {
          newConnections.push({
            from: `node-${i}`,
            to: `node-${targetIndex}`,
            isIntersecting: false,
            animationOffset: Math.random() * Math.PI * 2
          });
        }
      }
    }
    
    // Add additional random connections if needed
    while (newConnections.length < minConnections) {
      const from = Math.floor(Math.random() * nodeCount);
      const to = Math.floor(Math.random() * nodeCount);
      
      if (from !== to) {
        const connectionExists = newConnections.some(conn => 
          (conn.from === `node-${from}` && conn.to === `node-${to}`) ||
          (conn.from === `node-${to}` && conn.to === `node-${from}`)
        );
        
        if (!connectionExists) {
          newConnections.push({
            from: `node-${from}`,
            to: `node-${to}`,
            isIntersecting: false,
            animationOffset: Math.random() * Math.PI * 2
          });
        }
      }
    }

    // Generate tangled node positions that guarantee intersections
    let attempts = 0;
    let tangledNodes: Node[];
    let hasIntersections = false;
    
    do {
      tangledNodes = [];
      
      // Create deliberately tangled positions
      for (let i = 0; i < nodeCount; i++) {
        if (attempts === 0) {
          // First attempt: create a specific tangled pattern
          const angle = (i / nodeCount) * 2 * Math.PI + Math.PI; // Offset by PI to create intersections
          const radius = Math.min(usableWidth, usableHeight) * (0.2 + Math.random() * 0.3);
          const centerX = canvasWidth / 2 + (Math.random() - 0.5) * usableWidth * 0.3;
          const centerY = canvasHeight / 2 + (Math.random() - 0.5) * usableHeight * 0.3;
          
          tangledNodes.push({
            id: `node-${i}`,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            pulseIntensity: 0
          });
        } else {
          // Subsequent attempts: more random but still constrained to create tangles
          tangledNodes.push({
            id: `node-${i}`,
            x: padding + Math.random() * usableWidth,
            y: padding + Math.random() * usableHeight,
            pulseIntensity: 0
          });
        }
      }
      
      // Check if this configuration has intersections
      hasIntersections = false;
      for (let i = 0; i < newConnections.length && !hasIntersections; i++) {
        const conn1 = newConnections[i];
        const fromNode1 = tangledNodes.find(n => n.id === conn1.from);
        const toNode1 = tangledNodes.find(n => n.id === conn1.to);
        
        if (!fromNode1 || !toNode1) continue;
        
        for (let j = i + 1; j < newConnections.length; j++) {
          const conn2 = newConnections[j];
          const fromNode2 = tangledNodes.find(n => n.id === conn2.from);
          const toNode2 = tangledNodes.find(n => n.id === conn2.to);
          
          if (!fromNode2 || !toNode2) continue;
          
          // Check if these connections intersect
          const det = (toNode1.x - fromNode1.x) * (toNode2.y - fromNode2.y) - 
                      (toNode2.x - fromNode2.x) * (toNode1.y - fromNode1.y);
          
          if (det !== 0) {
            const lambda = ((toNode2.y - fromNode2.y) * (toNode2.x - fromNode1.x) + 
                            (fromNode2.x - toNode2.x) * (toNode2.y - fromNode1.y)) / det;
            const gamma = ((fromNode1.y - toNode1.y) * (toNode2.x - fromNode1.x) + 
                           (toNode1.x - fromNode1.x) * (toNode2.y - fromNode1.y)) / det;
            
            if ((0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)) {
              hasIntersections = true;
              break;
            }
          }
        }
      }
      
      attempts++;
    } while (!hasIntersections && attempts < 10);
    
    // If we still don't have intersections after 10 attempts, force create some
    if (!hasIntersections && nodeCount >= 4) {
      // Position nodes to definitely create intersections
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const spread = Math.min(usableWidth, usableHeight) * 0.4;
      
      tangledNodes = [
        { id: 'node-0', x: centerX - spread/2, y: centerY - spread/2, pulseIntensity: 0 },
        { id: 'node-1', x: centerX + spread/2, y: centerY - spread/2, pulseIntensity: 0 },
        { id: 'node-2', x: centerX - spread/2, y: centerY + spread/2, pulseIntensity: 0 },
        { id: 'node-3', x: centerX + spread/2, y: centerY + spread/2, pulseIntensity: 0 },
      ];
      
      // Add remaining nodes if needed
      for (let i = 4; i < nodeCount; i++) {
        tangledNodes.push({
          id: `node-${i}`,
          x: centerX + (Math.random() - 0.5) * spread,
          y: centerY + (Math.random() - 0.5) * spread,
          pulseIntensity: 0
        });
      }
    }

    setNodes(tangledNodes);
    setConnections(newConnections);
    setMoveHistory([{nodes: tangledNodes, timestamp: Date.now()}]);
    
    // Reset game state
    setMoveCount(0);
    setGameComplete(false);
    setShowCelebration(false);
    setRevealedData('');
    setCompletionTime(null);
    
    // Debug: Log puzzle generation info
  }, [getDifficultyConfig]);

  // Listen for difficulty changes
  useEffect(() => {
    const cleanupListener = GameDifficultyManager.onDifficultyChange(() => {
      // Regenerate puzzle when difficulty changes
      generatePuzzle();
    });
    
    return cleanupListener;
  }, [generatePuzzle]);

  // Generate revealed data based on completion - Enhanced with more variety
  const generateRevealedData = useCallback((): string => {
    const difficulty = GameDifficultyManager.getGlobalDifficulty();
    const dataOptions = {
      easy: [
        "TARGET: ShadowByte\nLOCATION: Delta-7\nSECURITY: LOW\nOBJECTIVE: Reconnaissance",
        "INTEL: BasicNet\nSECTOR: Alpha-3\nSTATUS: Vulnerable\nMISSION: Data Extraction"
      ],
      normal: [
        "TARGET: ShadowByte\nLOCATION: Delta-7\nSECURITY: MEDIUM\nOBJECTIVE: Infiltration\nASSETS: 3 Operatives",
        "NETWORK: CyberCore\nVAULT: Epsilon-12\nENCRYPTION: AES-256\nTIMEFRAME: 72 hours"
      ],
      hard: [
        "TARGET: ShadowByte\nLOCATION: Delta-7\nSECURITY: HIGH\nOBJECTIVE: Breach Vault\nGUARDS: Active\nALARM: Motion Sensors",
        "OPERATION: BlackNet\nCOORDS: 47.6062°N, 122.3321°W\nFIREWALL: Quantum\nBACKDOOR: Compromised"
      ],
      nightmare: [
        "CLASSIFIED: SHADOWBYTE\nLOCATION: DELTA-7 UNDERGROUND\nSECURITY: MAXIMUM\nOBJECTIVE: BREACH QUANTUM VAULT\nGUARDS: 24/7 PATROL\nCOUNTERMEASURES: AI SENTINELS\nEXTRACTION: T-MINUS 60 MINUTES",
        "PROJECT: NEURAL STORM\nFACILITY: BLACKSITE OMEGA\nCLEARANCE: COSMIC\nPAYLOAD: CONSCIOUSNESS TRANSFER\nSTATUS: INITIATION PROTOCOL ACTIVE"
      ]
    };
    
    const options = dataOptions[difficulty as keyof typeof dataOptions] || dataOptions.normal;
    return options[Math.floor(Math.random() * options.length)];
  }, []);

  // Add particle effect when nodes are moved or connections are untangled
  const addParticles = useCallback((x: number, y: number, color: string, count: number = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        maxLife: 60 + Math.random() * 40,
        color
      });
    }
    setParticles(prev => [...prev.slice(-50), ...newParticles]);
  }, []);

  // Update particles animation
  const updateParticles = useCallback(() => {
    setParticles(prev => 
      prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.98,
        vy: particle.vy * 0.98,
        life: particle.life - 1
      })).filter(particle => particle.life > 0)
    );
  }, []);

  // Provide hint for the next best move
  const provideHint = useCallback(() => {
    if (gameComplete || connections.length === 0) return;
    
    // Find the node that, when moved, would reduce the most intersections
    let bestNode: string | null = null;
    let maxImprovementCount = 0;
    
    nodes.forEach(node => {
      // Count current intersections involving this node
      const currentIntersections = connections.filter(conn => 
        (conn.from === node.id || conn.to === node.id) && conn.isIntersecting
      ).length;
      
      if (currentIntersections > maxImprovementCount) {
        maxImprovementCount = currentIntersections;
        bestNode = node.id;
      }
    });
    
    if (bestNode) {
      setHintNode(bestNode);
      setShowHint(true);
      audioManager.playSound("/hackbook-W95/sounds/chord.mp3", 0.5);
      
      setTimeout(() => {
        setShowHint(false);
        setHintNode(null);
      }, 3000);
    }
  }, [nodes, connections, gameComplete]);

  // Undo last move
  const undoMove = useCallback(() => {
    if (moveHistory.length > 1) {
      const previousState = moveHistory[moveHistory.length - 2];
      setNodes(previousState.nodes);
      setMoveHistory(prev => prev.slice(0, -1));
      setMoveCount(prev => Math.max(0, prev - 1));
      audioManager.playSound("/hackbook-W95/sounds/recycle.mp3", 0.6);
    }
  }, [moveHistory]);

  // Save move to history
  const saveMove = useCallback((newNodes: Node[]) => {
    setMoveHistory(prev => [...prev.slice(-20), {nodes: newNodes, timestamp: Date.now()}]);
  }, []);

  // Check if two line segments intersect
  const doLinesIntersect = useCallback((
    line1Start: { x: number; y: number },
    line1End: { x: number; y: number },
    line2Start: { x: number; y: number },
    line2End: { x: number; y: number }
  ): boolean => {
    const det = (line1End.x - line1Start.x) * (line2End.y - line2Start.y) - 
                (line2End.x - line2Start.x) * (line1End.y - line1Start.y);
    
    if (det === 0) return false; // Lines are parallel
    
    const lambda = ((line2End.y - line2Start.y) * (line2End.x - line1Start.x) + 
                    (line2Start.x - line2End.x) * (line2End.y - line1Start.y)) / det;
    const gamma = ((line1Start.y - line1End.y) * (line2End.x - line1Start.x) + 
                   (line1End.x - line1Start.x) * (line2End.y - line1Start.y)) / det;
    
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }, []);

  // Update connection intersection states
  const updateIntersections = useCallback(() => {
    setConnections(prevConnections => {
      // Early return if no connections exist yet
      if (prevConnections.length === 0) return prevConnections;
      
      const updatedConnections = prevConnections.map(connection => {
        const fromNode = nodes.find(n => n.id === connection.from);
        const toNode = nodes.find(n => n.id === connection.to);
        
        if (!fromNode || !toNode) return connection;
        
        let isIntersecting = false;
        
        // Check against all other connections
        for (const otherConnection of prevConnections) {
          if (otherConnection === connection) continue;
          
          const otherFromNode = nodes.find(n => n.id === otherConnection.from);
          const otherToNode = nodes.find(n => n.id === otherConnection.to);
          
          if (!otherFromNode || !otherToNode) continue;
          
          if (doLinesIntersect(
            { x: fromNode.x, y: fromNode.y },
            { x: toNode.x, y: toNode.y },
            { x: otherFromNode.x, y: otherFromNode.y },
            { x: otherToNode.x, y: otherToNode.y }
          )) {
            isIntersecting = true;
            break;
          }
        }
        
        return { ...connection, isIntersecting };
      });
      
      // Check if puzzle is solved (but not immediately after generation)
      const allUntangled = updatedConnections.every(conn => !conn.isIntersecting);
      if (allUntangled && !gameComplete && updatedConnections.length > 0 && moveCount > 0) {
        setGameComplete(true);
        const finalCompletionTime = Date.now() - startTime;
        setCompletionTime(finalCompletionTime);
        setShowCelebration(true);
        
        // Generate completion particles
        nodes.forEach(node => {
          addParticles(node.x, node.y, 'rgba(0, 255, 0, 1)', 15);
        });
        
        // Generate revealed data based on difficulty
        const dataRevealed = generateRevealedData();
        setRevealedData(dataRevealed);
        
        // Calculate score based on time and moves
        const timeScore = Math.max(0, 100 - Math.floor(finalCompletionTime / 1000)); // Points deducted for time
        const moveScore = Math.max(0, 100 - (moveCount * 5)); // Points deducted for moves
        const finalScore = Math.round((timeScore + moveScore) / 2);
        
        // Track game completion
        gameScoring.completeGame(
          GameScoringManager.UNTANGLE_NEURAL_NETWORK,
          finalScore,
          moveCount + 1, // +1 for the final successful move
          {
            completionTimeMs: finalCompletionTime,
            moveCount: moveCount,
            difficulty: GameDifficultyManager.getGlobalDifficulty(),
            dataRevealed: dataRevealed.length
          }
        );
        
        // Play success sound
        audioManager.playSound("/hackbook-W95/sounds/ding.mp3", 0.7);
        
        setTimeout(() => {
          onSuccess(dataRevealed);
        }, 3000);
      }
      
      return updatedConnections;
    });
  }, [nodes, doLinesIntersect, gameComplete, startTime, onSuccess, generateRevealedData, moveCount, addParticles]);

  // Enhanced drawing function with animations and effects
  const drawNetwork = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const globalDifficulty = GameDifficultyManager.getGlobalDifficulty();
    let config;
    switch (globalDifficulty) {
      case "easy":
        config = { canvasWidth: 300, canvasHeight: 200 };
        break;
      case "normal":
        config = { canvasWidth: 350, canvasHeight: 250 };
        break;
      case "hard":
        config = { canvasWidth: 400, canvasHeight: 300 };
        break;
      case "nightmare":
        config = { canvasWidth: 450, canvasHeight: 350 };
        break;
      default:
        config = { canvasWidth: 350, canvasHeight: 250 };
    }
    
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    
    // Clear canvas with subtle gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000814');
    gradient.addColorStop(1, '#001d3d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle grid pattern
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw connections with enhanced visuals
    connections.forEach((connection, index) => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return;
      
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      
      if (connection.isIntersecting) {
        // Tangled connection - pulsing red
        const pulse = 0.7 + 0.3 * Math.sin(animationTime * 0.05 + index);
        ctx.strokeStyle = `rgba(255, 50, 50, ${pulse})`;
        ctx.lineWidth = 3 + Math.sin(animationTime * 0.1 + index) * 0.5;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8;
      } else {
        // Untangled connection - flowing data effect
        const flowOffset = (animationTime * 0.02 + (connection.animationOffset || 0)) % (Math.PI * 2);
        const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
        
        const baseGreen = `rgba(0, 255, 100, 0.9)`;
        const flowGreen = `rgba(0, 255, 255, ${0.7 + 0.3 * Math.sin(flowOffset)})`;
        
        gradient.addColorStop(0, baseGreen);
        gradient.addColorStop(0.5 + 0.3 * Math.sin(flowOffset), flowGreen);
        gradient.addColorStop(1, baseGreen);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 4;
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Draw data packets flowing on untangled lines
      if (!connection.isIntersecting && !isPaused) {
        const flowProgress = (animationTime * 0.01 + (connection.animationOffset || 0)) % 1;
        const packetX = fromNode.x + (toNode.x - fromNode.x) * flowProgress;
        const packetY = fromNode.y + (toNode.y - fromNode.y) * flowProgress;
        
        ctx.beginPath();
        ctx.arc(packetX, packetY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ffff';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
    
    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2 * alpha, 0, 2 * Math.PI);
      ctx.fillStyle = particle.color.replace('1)', `${alpha})`);
      ctx.fill();
    });
    
    // Draw nodes with enhanced visuals
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      const isHint = showHint && hintNode === node.id;
      const isDragging = node.isDragging;
      
      // Node glow effect
      if (isHovered || isDragging || isHint) {
        const glowRadius = 20 + (isHint ? 10 * Math.sin(animationTime * 0.1) : 0);
        const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
        glowGradient.addColorStop(0, isHint ? 'rgba(255, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Main node circle
      ctx.beginPath();
      const nodeRadius = 12 + (isDragging ? 2 : 0) + (isHint ? 2 * Math.sin(animationTime * 0.15) : 0);
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      
      // Node fill with gradient
      const nodeGradient = ctx.createRadialGradient(node.x - 3, node.y - 3, 0, node.x, node.y, nodeRadius);
      if (isDragging) {
        nodeGradient.addColorStop(0, '#ffffff');
        nodeGradient.addColorStop(1, '#cccccc');
      } else if (isHint) {
        nodeGradient.addColorStop(0, '#ffff88');
        nodeGradient.addColorStop(1, '#ffaa00');
      } else {
        nodeGradient.addColorStop(0, '#88ccff');
        nodeGradient.addColorStop(1, '#0088cc');
      }
      
      ctx.fillStyle = nodeGradient;
      ctx.fill();
      
      // Node border
      ctx.strokeStyle = isDragging ? '#ffffff' : (isHint ? '#ffff00' : '#ffffff');
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Node ID text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id.split('-')[1], node.x, node.y);
    });
    
    // Draw progress and stats with enhanced styling
    const totalConnections = connections.length;
    const untangledConnections = connections.filter(c => !c.isIntersecting).length;
    const percentage = totalConnections > 0 ? Math.round((untangledConnections / totalConnections) * 100) : 0;
    
    // Progress bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(5, 5, 200, 70);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, 200, 70);
    
    // Progress bar
    const progressWidth = (200 - 20) * (percentage / 100);
    ctx.fillStyle = percentage === 100 ? '#00ff00' : '#ffaa00';
    ctx.fillRect(15, 50, progressWidth, 10);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(15, 50, 200 - 20, 10);
    
    // Stats text
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`INTEGRITY: ${percentage}%`, 15, 25);
    ctx.fillText(`MOVES: ${moveCount}`, 15, 40);
    
    // Game completion overlay
    if (gameComplete) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('NEURAL NETWORK RESTORED!', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('NEURAL NETWORK RESTORED!', canvas.width / 2, canvas.height / 2 - 20);
    }
  }, [nodes, connections, moveCount, gameComplete, animationTime, particles, hoveredNode, showHint, hintNode, isPaused]);

  // Enhanced mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameComplete || gameFailed) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= 15 && !node.isFixed;
    });
    
    if (clickedNode) {
      setDraggedNode(clickedNode.id);
      setDragOffset({ x: x - clickedNode.x, y: y - clickedNode.y });
      
      // Update node dragging state
      setNodes(prev => prev.map(node => 
        node.id === clickedNode.id 
          ? { ...node, isDragging: true }
          : node
      ));
      
      // Play grab sound
      audioManager.playSound("/hackbook-W95/sounds/click.mp3", 0.4);
      
      // Add grab particles
      addParticles(clickedNode.x, clickedNode.y, 'rgba(255, 255, 255, 1)', 3);
    }
  }, [nodes, gameComplete, gameFailed, addParticles]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - dragOffset.x;
    const y = event.clientY - rect.top - dragOffset.y;
    
    // Handle hover effects when not dragging
    if (!draggedNode) {
      const hoveredNodeId = nodes.find(node => {
        const distance = Math.sqrt((node.x - (x + dragOffset.x)) ** 2 + (node.y - (y + dragOffset.y)) ** 2);
        return distance <= 15;
      })?.id || null;
      
      setHoveredNode(hoveredNodeId);
      
      if (hoveredNodeId) {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'crosshair';
      }
      return;
    }
    
    // Handle dragging
    canvas.style.cursor = 'grabbing';
    
    const globalDifficulty = GameDifficultyManager.getGlobalDifficulty();
    let canvasWidth, canvasHeight;
    switch (globalDifficulty) {
      case "easy":
        canvasWidth = 300; canvasHeight = 200;
        break;
      case "normal":
        canvasWidth = 350; canvasHeight = 250;
        break;
      case "hard":
        canvasWidth = 400; canvasHeight = 300;
        break;
      case "nightmare":
        canvasWidth = 450; canvasHeight = 350;
        break;
      default:
        canvasWidth = 350; canvasHeight = 250;
    }
    
    const clampedX = Math.max(15, Math.min(canvasWidth - 15, x));
    const clampedY = Math.max(15, Math.min(canvasHeight - 15, y));
    
    setNodes(prev => prev.map(node => 
      node.id === draggedNode 
        ? { ...node, x: clampedX, y: clampedY }
        : node
    ));
  }, [draggedNode, dragOffset, nodes]);

  const handleMouseUp = useCallback(() => {
    if (draggedNode) {
      const newNodes = nodes.map(node => 
        node.id === draggedNode 
          ? { ...node, isDragging: false }
          : node
      );
      
      setMoveCount(prev => prev + 1);
      setNodes(newNodes);
      saveMove(newNodes);
      setDraggedNode(null);
      
      // Play release sound
      audioManager.playSound("/hackbook-W95/sounds/drop.mp3", 0.4);
      
      // Add release particles
      const draggedNodeData = newNodes.find(n => n.id === draggedNode);
      if (draggedNodeData) {
        addParticles(draggedNodeData.x, draggedNodeData.y, 'rgba(0, 255, 100, 1)', 5);
      }
    }
  }, [draggedNode, nodes, saveMove, addParticles]);

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'crosshair';
    }
  }, []);

  // Initialize puzzle
  useEffect(() => {
    generatePuzzle();
  }, [generatePuzzle]);

  // Animation loop for smooth effects
  useEffect(() => {
    const animate = () => {
      setAnimationTime(prev => prev + 1);
      updateParticles();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateParticles]);

  // Update intersections when nodes change
  useEffect(() => {
    updateIntersections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]); // Removed updateIntersections from dependencies to prevent circular updates

  // Draw network
  useEffect(() => {
    drawNetwork();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, connections, moveCount, gameComplete, animationTime, particles]); // Only depend on state that affects drawing

  // Handle celebration timeout
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-black text-green-500 font-mono relative overflow-hidden"
    >
      {/* Header */}
      <div className="bg-[#000080] text-white p-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          <span className="font-bold">NEURAL NETWORK RESTORATION</span>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:bg-red-600 px-2 py-1 text-sm"
        >
          [X]
        </button>
      </div>

      {/* Enhanced Game Instructions with Controls */}
      <div className="p-4 border-b border-green-500">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-yellow-400 font-bold mb-2">UNTANGLE THE NEURAL NETWORK</h3>
            <p className="text-sm mb-2">
              Drag the blue nodes so all lines turn green. Red lines are tangled, green lines flow data!
            </p>
            <div className="text-xs text-gray-400">
              <span className="text-red-400">RED LINES:</span> Tangled • <span className="text-green-400">GREEN LINES:</span> Data Flow Active
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={provideHint}
              disabled={gameComplete || showHint}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-mono border border-yellow-400"
              title="Highlight the node that will help most"
            >
              HINT
            </button>
            <button
              onClick={undoMove}
              disabled={moveHistory.length <= 1}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-mono border border-blue-400"
              title="Undo last move"
            >
              UNDO
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono border border-purple-400"
              title="Pause animations"
            >
              {isPaused ? 'PLAY' : 'PAUSE'}
            </button>
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center p-4">
        <canvas
          ref={canvasRef}
          className="border border-green-500 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {/* Enhanced Game Stats */}
      <div className="px-4 py-2 border-t border-green-500 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>Difficulty: <span className="text-yellow-400">{GameDifficultyManager.getGlobalDifficulty().toUpperCase()}</span></div>
          <div>Nodes: <span className="text-cyan-400">{nodes.length}</span></div>
          <div>Connections: <span className="text-cyan-400">{connections.length}</span></div>
          <div>Moves: <span className="text-orange-400">{moveCount}</span></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
          <div>Tangled: <span className="text-red-400">{connections.filter(c => c.isIntersecting).length}</span></div>
          <div>Flowing: <span className="text-green-400">{connections.filter(c => !c.isIntersecting).length}</span></div>
          <div>Time: <span className={`${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span></div>
          {completionTime && (
            <div>Final: <span className="text-green-400">{(completionTime / 1000).toFixed(1)}s</span></div>
          )}
        </div>
        {showHint && hintNode && (
          <div className="mt-2 text-yellow-400 text-xs animate-pulse">
            💡 Try moving node {hintNode.split('-')[1]} - it&apos;s involved in the most tangles!
          </div>
        )}
      </div>

      {/* Game Failure Overlay */}
      {gameFailed && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-red-900 to-red-800 border-2 border-red-400 p-8 text-center max-w-md shadow-2xl">
            <div className="mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">NEURAL BREACH FAILED!</h2>
              <div className="text-red-300 text-sm mb-4">
                Timeout: Security Protocols Activated
              </div>
            </div>
            
            <div className="bg-black border border-red-500 p-4 mb-4">
              <div className="text-left text-sm text-red-300 font-mono">
                SYSTEM ALERT: Unauthorized access detected<br/>
                Time limit exceeded: {Math.floor(180 / 60)}:{(180 % 60).toString().padStart(2, '0')}<br/>
                Moves attempted: {moveCount}<br/>
                Status: ACCOUNT TERMINATED
              </div>
            </div>
            
            <div className="border-t border-red-500 pt-4 mt-4">
              <p className="font-mono text-yellow-400 mb-2">ACCOUNT TERMINATION IN PROGRESS...</p>
              <p className="text-sm text-gray-300">Redirecting to login...</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-green-900 to-green-800 border-2 border-green-400 p-8 text-center max-w-md animate-pulse shadow-2xl">
            <div className="mb-4">
              <div className="text-4xl mb-2">🎯</div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">NEURAL NETWORK RESTORED!</h2>
              <div className="text-green-300 text-sm mb-4">
                Intelligence Matrix Successfully Untangled
              </div>
            </div>
            
            <div className="bg-black border border-green-500 p-4 mb-4">
              <div className="text-left text-sm text-green-300 mb-2 font-mono whitespace-pre-line">
                {revealedData}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs text-green-200 mb-4">
              <div>
                <div className="text-yellow-400">Completion Stats:</div>
                <div>Moves: {moveCount}</div>
                <div>Time: {completionTime ? (completionTime / 1000).toFixed(1) : 0}s</div>
              </div>
              <div>
                <div className="text-cyan-400">Network Status:</div>
                <div>Nodes: {nodes.length}</div>
                <div>Data Flows: {connections.length}</div>
              </div>
            </div>
            
            <div className="text-yellow-400 text-sm animate-bounce">
              🔓 SECURITY BREACH SUCCESSFUL
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Proceeding to target infiltration...
            </div>
          </div>
        </div>
      )}

      {/* Data Stream Effect */}
      {gameComplete && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="animate-pulse text-green-400 text-xs absolute top-20 left-4">
            [NEURAL_SYNC_COMPLETE]
          </div>
          <div className="animate-pulse text-cyan-400 text-xs absolute top-32 right-4 delay-500">
            [DATA_FLOW_OPTIMAL]
          </div>
          <div className="animate-pulse text-yellow-400 text-xs absolute bottom-20 left-1/2 delay-1000">
            [INTELLIGENCE_UNLOCKED]
          </div>
        </div>
      )}

      {/* Win95Alert for game failure */}
      {showAlert && alertMessage && (
        <Win95Alert message={alertMessage} onClose={closeAlert} />
      )}
    </div>
  );
};

export default UntangleNeuralNetwork;
