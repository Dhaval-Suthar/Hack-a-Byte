"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import gameScoring, { GameScoringManager } from "../hooks/useGameScoring";
import GameDifficultyManager from "../hooks/useGameDifficulty";
import audioManager from "../hooks/useAudioManager";

interface Node {
  id: string;
  x: number;
  y: number;
  isDragging?: boolean;
  isFixed?: boolean; // Some nodes might be locked in position
}

interface Connection {
  from: string;
  to: string;
  isIntersecting: boolean;
}

interface UntangleNeuralNetworkProps {
  onClose: () => void;
  onSuccess: (data: string) => void;
}

const UntangleNeuralNetwork: React.FC<UntangleNeuralNetworkProps> = ({
  onClose,
  onSuccess
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [gameComplete, setGameComplete] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [revealedData, setRevealedData] = useState<string>('');

  // Start game tracking on component mount
  useEffect(() => {
    const currentDifficulty = GameDifficultyManager.getGlobalDifficulty();
    gameScoring.startGame(GameScoringManager.UNTANGLE_NEURAL_NETWORK, currentDifficulty);
  }, []);

  // Configuration based on difficulty
  const getDifficultyConfig = useCallback(() => {
    const globalDifficulty = GameDifficultyManager.getGlobalDifficulty();
    
    switch (globalDifficulty) {
      case "easy":
        return { nodeCount: 3, connectionDensity: 0.2, canvasWidth: 300, canvasHeight: 200 };
      case "normal":
        return { nodeCount: 4, connectionDensity: 0.3, canvasWidth: 350, canvasHeight: 250 };
      case "hard":
        return { nodeCount: 5, connectionDensity: 0.4, canvasWidth: 400, canvasHeight: 300 };
      case "nightmare":
        return { nodeCount: 6, connectionDensity: 0.5, canvasWidth: 450, canvasHeight: 350 };
      default:
        return { nodeCount: 4, connectionDensity: 0.3, canvasWidth: 350, canvasHeight: 250 };
    }
  }, []);

  // Generate initial puzzle configuration
  const generatePuzzle = useCallback(() => {
    const config = getDifficultyConfig();
    const { nodeCount, connectionDensity, canvasWidth, canvasHeight } = config;
    
    // Generate nodes dynamically based on difficulty
    const newNodes: Node[] = [];
    const padding = 60;
    const usableWidth = canvasWidth - 2 * padding;
    const usableHeight = canvasHeight - 2 * padding;
    
    for (let i = 0; i < nodeCount; i++) {
      // Position nodes in a rough circle to create interesting tangled configurations
      const angle = (i / nodeCount) * 2 * Math.PI;
      const radius = Math.min(usableWidth, usableHeight) * 0.3;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      newNodes.push({
        id: `node-${i}`,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }
    
    // Generate connections based on density
    const newConnections: Connection[] = [];
    const maxConnections = Math.floor((nodeCount * (nodeCount - 1) / 2) * connectionDensity);
    let connectionsAdded = 0;
    
    // First, ensure each node has at least one connection (create a basic cycle)
    for (let i = 0; i < nodeCount; i++) {
      const nextIndex = (i + 1) % nodeCount;
      newConnections.push({
        from: `node-${i}`,
        to: `node-${nextIndex}`,
        isIntersecting: false
      });
      connectionsAdded++;
    }
    
    // Add additional random connections based on density
    while (connectionsAdded < maxConnections) {
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
            isIntersecting: false
          });
          connectionsAdded++;
        }
      }
    }

    setNodes(newNodes);
    setConnections(newConnections);
  }, [getDifficultyConfig]);

  // Listen for difficulty changes
  useEffect(() => {
    const cleanupListener = GameDifficultyManager.onDifficultyChange(() => {
      // Regenerate puzzle when difficulty changes
      generatePuzzle();
    });
    
    return cleanupListener;
  }, [generatePuzzle]);

  // Generate revealed data based on completion
  // SIMPLIFIED: Shorter revealed data
  const generateRevealedData = useCallback((): string => {
    return "TARGET: ShadowByte\nLOCATION: Delta-7\nSECURITY: MAX\nOBJECTIVE: Breach Vault";
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
    // Early return if no connections exist yet
    if (connections.length === 0) return;
    
    setConnections(prevConnections => {
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
      
      // Check if puzzle is solved
      const allUntangled = updatedConnections.every(conn => !conn.isIntersecting);
      if (allUntangled && !gameComplete && updatedConnections.length > 0) {
        setGameComplete(true);
        const finalCompletionTime = Date.now() - startTime;
        setCompletionTime(finalCompletionTime);
        setShowCelebration(true);
        
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
        audioManager.playSound("/hackbook-w95/sounds/ding.mp3", 0.7);
        
        setTimeout(() => {
          onSuccess(dataRevealed);
        }, 3000);
      }
      
      return updatedConnections;
    });
  }, [nodes, doLinesIntersect, gameComplete, startTime, onSuccess, generateRevealedData, connections.length, moveCount]);

  // Draw the neural network
  const drawNetwork = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const config = getDifficultyConfig();
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // SIMPLIFIED: No grid background
    
    // Draw connections
    connections.forEach(connection => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return;
      
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = connection.isIntersecting ? '#FF0000' : '#00FF00';
      ctx.lineWidth = connection.isIntersecting ? 3 : 2;
      ctx.stroke();
      
      // Add data flow animation for untangled lines
      if (!connection.isIntersecting) {
        const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
        gradient.addColorStop(0, '#00FF00');
        gradient.addColorStop(0.5, '#00FFFF');
        gradient.addColorStop(1, '#00FF00');
        ctx.strokeStyle = gradient;
        ctx.stroke();
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
      ctx.fillStyle = node.isDragging ? '#FFFFFF' : '#00CCFF';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Draw completion percentage
    const totalConnections = connections.length;
    const untangledConnections = connections.filter(c => !c.isIntersecting).length;
    const percentage = totalConnections > 0 ? Math.round((untangledConnections / totalConnections) * 100) : 0;
    
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`INTEGRITY: ${percentage}%`, 10, 25);
    ctx.fillText(`MOVES: ${moveCount}`, 10, 45);
    if (gameComplete) {
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('RESTORED!', canvas.width / 2, canvas.height / 2 - 20);
    }
  }, [nodes, connections, getDifficultyConfig, moveCount, gameComplete]);

  // Handle mouse events
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameComplete) return;
    
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
    }
  }, [nodes, gameComplete]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedNode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - dragOffset.x;
    const y = event.clientY - rect.top - dragOffset.y;
    
    const config = getDifficultyConfig();
    const clampedX = Math.max(15, Math.min(config.canvasWidth - 15, x));
    const clampedY = Math.max(15, Math.min(config.canvasHeight - 15, y));
    
    setNodes(prev => prev.map(node => 
      node.id === draggedNode 
        ? { ...node, x: clampedX, y: clampedY }
        : node
    ));
  }, [draggedNode, dragOffset, getDifficultyConfig]);

  const handleMouseUp = useCallback(() => {
    if (draggedNode) {
      setMoveCount(prev => prev + 1);
      setNodes(prev => prev.map(node => 
        node.id === draggedNode 
          ? { ...node, isDragging: false }
          : node
      ));
      setDraggedNode(null);
    }
  }, [draggedNode]);

  // Initialize puzzle
  useEffect(() => {
    generatePuzzle();
  }, [generatePuzzle]);

  // Update intersections when nodes change
  useEffect(() => {
    updateIntersections();
  }, [nodes, updateIntersections]);

  // Draw network
  useEffect(() => {
    drawNetwork();
  }, [drawNetwork]);

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

      {/* Game Instructions */}
      <div className="p-4 border-b border-green-500">
        <h3 className="text-yellow-400 font-bold mb-2">UNTANGLE THE NETWORK</h3>
        <p className="text-sm mb-2">
          Drag the blue nodes so all lines turn green. Fewer nodes, fewer moves!
        </p>
        <div className="text-xs text-gray-400">
          <span className="text-red-400">RED LINES:</span> Tangled • <span className="text-green-400">GREEN LINES:</span> Untangled
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
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Game Stats */}
      <div className="px-4 py-2 border-t border-green-500 flex justify-between text-sm">
        <div>Difficulty: <span className="text-yellow-400">{GameDifficultyManager.getGlobalDifficulty().toUpperCase()}</span></div>
        <div>Nodes: <span className="text-cyan-400">{nodes.length}</span></div>
        <div>Connections: <span className="text-cyan-400">{connections.length}</span></div>
        {completionTime && (
          <div>Time: <span className="text-green-400">{(completionTime / 1000).toFixed(1)}s</span></div>
        )}
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-green-900 border-2 border-green-400 p-8 text-center max-w-md animate-pulse">
            <h2 className="text-2xl font-bold text-green-400 mb-4">INTELLIGENCE RESTORED!</h2>
            <div className="text-left text-sm text-green-300 mb-4 whitespace-pre-line">
              {revealedData}
            </div>
            <div className="text-yellow-400 text-sm">
              TARGET LOCATED! Proceeding to final security breach...
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
    </div>
  );
};

export default UntangleNeuralNetwork;
