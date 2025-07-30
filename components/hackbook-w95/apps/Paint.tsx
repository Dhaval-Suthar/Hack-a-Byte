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

  // Initialize canvas only once
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
      // Fill with white background
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      contextRef.current = context;
    }
  }, []); // Empty dependency array - run once on mount

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
        const imageData = contextRef.current.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Get the color at clicked position
        const startPos = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
        const startR = pixels[startPos];
        const startG = pixels[startPos + 1];
        const startB = pixels[startPos + 2];
        
        // Convert selected color to RGB
        const fillColor = {
          r: parseInt(color.slice(1,3), 16),
          g: parseInt(color.slice(3,5), 16),
          b: parseInt(color.slice(5,7), 16)
        };

        // Flood fill algorithm
        const pixelsToCheck = [[x, y]];
        while (pixelsToCheck.length > 0) {
          const [px, py] = pixelsToCheck.pop()!;
          const pos = (Math.floor(py) * canvas.width + Math.floor(px)) * 4;
          
          if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue;
          if (pixels[pos] !== startR || pixels[pos + 1] !== startG || pixels[pos + 2] !== startB) continue;
          
          pixels[pos] = fillColor.r;
          pixels[pos + 1] = fillColor.g;
          pixels[pos + 2] = fillColor.b;
          pixels[pos + 3] = 255;
          
          pixelsToCheck.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
        }
        
        contextRef.current.putImageData(imageData, 0, 0);
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

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.download = 'drawing.png';  // Set filename
    link.href = canvas.toDataURL('image/png');  // Convert canvas to PNG
    document.body.appendChild(link);
    link.click();  // Trigger download
    document.body.removeChild(link);
  };

  const loadDrawing = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contextRef.current || !canvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Clear canvas
        contextRef.current!.fillStyle = "white";
        contextRef.current!.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        // Draw loaded image
        contextRef.current!.drawImage(img, 0, 0);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // Reset the input value to allow loading the same file again
    e.target.value = '';
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

        <button
          className="px-2 py-1 mx-1 text-xs border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={saveDrawing}
        >
          Save
        </button>

        <input
          type="file"
          id="loadDrawing"
          accept="image/png"
          onChange={loadDrawing}
          className="hidden"
        />
        <button
          className="px-2 py-1 mx-1 text-xs border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={() => document.getElementById('loadDrawing')?.click()}
        >
          Open
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
