"use client";

import React, { useEffect, useRef, useState } from "react";

interface PaintProps {
  onClose: () => void;
}

const Paint: React.FC<PaintProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [tool, setTool] = useState<"brush" | "eraser" | "fill">("brush");
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [previousPos, setPreviousPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions to match parent container
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const context = canvas.getContext("2d");
    if (context) {
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = color;
      context.lineWidth = brushSize;
      // Fill with white background
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      contextRef.current = context;
    }
  }, [color, brushSize]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = tool === "eraser" ? "white" : color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize, tool]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (tool === "fill") {
      if (contextRef.current) {
        contextRef.current.fillStyle = color;
        contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(x, y);
    setPreviousPos({ x, y });
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    contextRef.current?.lineTo(x, y);
    contextRef.current?.stroke();
    setPreviousPos({ x, y });
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = contextRef.current;
    if (context) {
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const toolButtons = [
    { name: "brush", label: "Brush" },
    { name: "eraser", label: "Eraser" },
    { name: "fill", label: "Fill" },
  ];

  const colors = [
    "#000000", "#808080", "#800000", "#808000", 
    "#008000", "#008080", "#000080", "#800080",
    "#ffffff", "#c0c0c0", "#ff0000", "#ffff00",
    "#00ff00", "#00ffff", "#0000ff", "#ff00ff"
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#c0c0c0] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center p-1 border-b border-b-[#808080]">
        <div className="flex items-center mr-4">
          <button 
            className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
            onClick={onClose}
          >
            <span className="text-xs">Close</span>
          </button>
          {toolButtons.map((btn) => (
            <button
              key={btn.name}
              className={`px-2 py-1 mx-1 text-xs border-2 ${
                tool === btn.name
                  ? "border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#dcdcdc]"
                  : "border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
              }`}
              onClick={() => setTool(btn.name as "brush" | "eraser" | "fill")}
            >
              {btn.label}
            </button>
          ))}
        </div>
        
        <button
          className="px-2 py-1 mx-1 text-xs border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={clearCanvas}
        >
          Clear
        </button>
        
        <div className="mx-2">
          <label className="text-xs mr-1">Size:</label>
          <select
            className="text-xs border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-white"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
          >
            <option value={1}>1px</option>
            <option value={2}>2px</option>
            <option value={3}>3px</option>
            <option value={5}>5px</option>
            <option value={8}>8px</option>
          </select>
        </div>
      </div>
      
      {/* Color palette */}
      <div className="flex flex-wrap p-1 border-b border-b-[#808080]">
        {colors.map((colorOption) => (
          <div
            key={colorOption}
            className={`w-6 h-6 m-0.5 cursor-pointer border ${
              color === colorOption ? "border-black border-2" : "border-[#808080]"
            }`}
            style={{ backgroundColor: colorOption }}
            onClick={() => setColor(colorOption)}
          />
        ))}
      </div>
      
      {/* Canvas */}
      <div className="flex-1 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      
      {/* Status bar */}
      <div className="p-1 text-xs border-t border-t-[#ffffff] flex">
        <span>
          {isDrawing
            ? `Drawing at ${previousPos.x}, ${previousPos.y}`
            : "Ready"}
        </span>
      </div>
    </div>
  );
};

export default Paint;
