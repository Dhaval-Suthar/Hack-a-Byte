"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

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
  onSuccess: (data: string) => void;
  onClose: () => void;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

const UntangleNeuralNetwork: React.FC<UntangleNeuralNetworkProps> = ({
  onSuccess,
  onClose,
  difficulty = 'beginner'
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

  // Configuration based on difficulty
  const getDifficultyConfig = useCallback(() => {
    switch (difficulty) {
      case 'beginner':
        return { nodeCount: 6, connectionDensity: 0.4, canvasWidth: 500, canvasHeight: 400 };
      case 'intermediate':
        return { nodeCount: 10, connectionDensity: 0.5, canvasWidth: 600, canvasHeight: 450 };
      case 'advanced':
        return { nodeCount: 15, connectionDensity: 0.6, canvasWidth: 700, canvasHeight: 500 };
      default:
        return { nodeCount: 6, connectionDensity: 0.4, canvasWidth: 500, canvasHeight: 400 };
    }
  }, [difficulty]);

  // Generate initial puzzle configuration
  const generatePuzzle = useCallback(() => {
    const config = getDifficultyConfig();
    const { nodeCount, connectionDensity, canvasWidth, canvasHeight } = config;
    
    // Create nodes in a deliberately tangled configuration
    const newNodes: Node[] = [];
    const margin = 50;
    
    // Generate nodes with some clustering to create tangles
    for (let i = 0; i < nodeCount; i++) {
      let x: number, y: number;
      let attempts = 0;
      
      do {
        // Create clusters for more interesting tangles
        if (i < nodeCount / 2) {
          // First cluster
          x = margin + Math.random() * (canvasWidth / 2 - margin * 2);
          y = margin + Math.random() * (canvasHeight / 2 - margin * 2);
        } else {
          // Second cluster
          x = canvasWidth / 2 + Math.random() * (canvasWidth / 2 - margin * 2);
          y = canvasHeight / 2 + Math.random() * (canvasHeight / 2 - margin * 2);
        }
        attempts++;
      } while (attempts < 50 && newNodes.some(node => 
        Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2) < 40
      ));
      
      newNodes.push({
        id: `node-${i}`,
        x,
        y,
        isFixed: i === 0 || i === nodeCount - 1 // Fix first and last nodes as anchors
      });
    }

    // Generate connections based on density
    const newConnections: Connection[] = [];
    const maxConnections = Math.floor(nodeCount * (nodeCount - 1) * connectionDensity / 2);
    
    // Ensure each node has at least one connection
    for (let i = 0; i < nodeCount - 1; i++) {
      newConnections.push({
        from: newNodes[i].id,
        to: newNodes[i + 1].id,
        isIntersecting: false
      });
    }
    
    // Add additional random connections
    while (newConnections.length < maxConnections) {
      const from = Math.floor(Math.random() * nodeCount);
      const to = Math.floor(Math.random() * nodeCount);
      
      if (from !== to && !newConnections.some(conn => 
        (conn.from === newNodes[from].id && conn.to === newNodes[to].id) ||
        (conn.from === newNodes[to].id && conn.to === newNodes[from].id)
      )) {
        newConnections.push({
          from: newNodes[from].id,
          to: newNodes[to].id,
          isIntersecting: false
        });
      }
    }

    setNodes(newNodes);
    setConnections(newConnections);
  }, [getDifficultyConfig]);

  // Generate revealed data based on completion
  const generateRevealedData = useCallback((): string => {
    const baseData = [
      "TARGET IDENTITY: ShadowByte_User_7734",
      "LOCATION: Remote Server Cluster Delta-7",
      "ACCESS PATTERN: Encrypted VPN through proxy chain",
      "SECURITY LEVEL: Maximum - Requires multi-factor breach",
      "NEXT OBJECTIVE: Breach final security vault",
      "INTELLIGENCE RATING: Critical Priority"
    ];
    
    switch (difficulty) {
      case 'advanced':
        return baseData.join('\n') + '\n\nBONUS INTEL: Backup server location identified\nVault password hint: "The year everything changed"';
      case 'intermediate':
        return baseData.slice(0, 5).join('\n') + '\n\nBONUS: Alternative access route discovered';
      default:
        return baseData.slice(0, 4).join('\n');
    }
  }, [difficulty]);

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
        setCompletionTime(Date.now() - startTime);
        setShowCelebration(true);
        
        // Generate revealed data based on difficulty
        const dataRevealed = generateRevealedData();
        setRevealedData(dataRevealed);
        
        // Play success sound
        try {
          const audio = new Audio("/hackbook-w95/sounds/ding.mp3");
          audio.volume = 0.7;
          audio.play().catch(e => console.log("Audio play failed:", e));
        } catch (error) {
          console.error("Sound error:", error);
        }
        
        setTimeout(() => {
          onSuccess(dataRevealed);
        }, 3000);
      }
      
      return updatedConnections;
    });
  }, [nodes, doLinesIntersect, gameComplete, startTime, onSuccess, generateRevealedData, connections.length]);

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
    
    // Draw grid background
    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
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
      ctx.arc(node.x, node.y, node.isFixed ? 12 : 10, 0, 2 * Math.PI);
      
      if (node.isFixed) {
        ctx.fillStyle = '#FFD700'; // Gold for fixed nodes
      } else if (node.isDragging) {
        ctx.fillStyle = '#FFFFFF';
      } else {
        ctx.fillStyle = '#00CCFF';
      }
      
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add node ID for debugging (optional)
      if (difficulty === 'advanced') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.id.split('-')[1], node.x, node.y + 20);
      }
    });
    
    // Draw completion percentage
    const totalConnections = connections.length;
    const untangledConnections = connections.filter(c => !c.isIntersecting).length;
    const percentage = totalConnections > 0 ? Math.round((untangledConnections / totalConnections) * 100) : 0;
    
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`NEURAL INTEGRITY: ${percentage}%`, 10, 25);
    ctx.fillText(`MOVES: ${moveCount}`, 10, 45);
    
    if (gameComplete) {
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NEURAL NETWORK RESTORED', canvas.width / 2, canvas.height / 2 - 50);
      ctx.fillText('DATA FLOW STABILIZED', canvas.width / 2, canvas.height / 2 - 20);
    }
  }, [nodes, connections, getDifficultyConfig, moveCount, gameComplete, difficulty]);

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
        <h3 className="text-yellow-400 font-bold mb-2">MISSION: RESTORE FRAGMENTED INTELLIGENCE</h3>
        <p className="text-sm mb-2">
          Drag nodes to untangle the neural network. All connections must be GREEN (untangled) to complete restoration.
        </p>
        <div className="text-xs text-gray-400">
          <span className="text-yellow-400">GOLD NODES:</span> Fixed anchor points • 
          <span className="text-red-400"> RED LINES:</span> Tangled connections • 
          <span className="text-green-400"> GREEN LINES:</span> Clear data paths
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
        <div>Difficulty: <span className="text-yellow-400">{difficulty.toUpperCase()}</span></div>
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
