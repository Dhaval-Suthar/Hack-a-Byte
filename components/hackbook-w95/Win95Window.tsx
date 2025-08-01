"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Rnd } from "react-rnd";
import clsx from "clsx";
import Image from "next/image";
import type { WindowPosition } from '@/components/hackbook-w95/hooks/useWindowManager';
import { SoundEvent } from '@/components/hackbook-w95/SystemSounds';

interface WindowProps {
  id?: string; // Optional as it's not actually used in the component
  title: string;
  icon: string;
  children: React.ReactNode;
  position: WindowPosition;
  isActive: boolean;
  visible?: boolean; // Add visible prop to control visibility
  onActivate: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleFullscreen: () => void;
  onPositionChange: (position: Partial<WindowPosition>) => void;
}

const Win95Window: React.FC<WindowProps> = ({
  // id is not used but kept for interface consistency
  title,
  icon,
  children,
  position,
  isActive,
  visible = true, // Default to visible
  onActivate,
  onClose,
  onMinimize,
  onToggleFullscreen,
  onPositionChange
}) => {
  const rndRef = useRef<Rnd>(null);
  const [isDragging, setIsDragging] = useState(false);
  const wasFullscreenRef = useRef(position.isFullscreen);
  
  // Function to play system sounds
  const playSound = useCallback((sound: SoundEvent) => {
    if (typeof window !== 'undefined' && (window as typeof window & { playWin95Sound?: (sound: SoundEvent) => void }).playWin95Sound) {
      (window as typeof window & { playWin95Sound: (sound: SoundEvent) => void }).playWin95Sound(sound);
    } else {
      // Fallback using AudioManager if the global function isn't available
      try {
        const audioManager = (globalThis as typeof globalThis & { audioManagerInstance?: { playSound: (src: string, volume: number) => void } }).audioManagerInstance;
        if (audioManager) {
          audioManager.playSound(`/hackbook-w95/sounds/${sound}.mp3`, 0.5);
        }
      } catch (error) {
        console.error("Sound playback error:", error);
      }
    }
  }, []);
  
  // Handle window resize/reposition
  const handleDragStop = (_e: any, d: { x: number; y: number }) => {
    setIsDragging(false);
    onPositionChange({ x: d.x, y: d.y });
    
    // Play window movement sound when dragging stops
    playSound('click');
  };
  
  const handleResizeStop = (
    _e: any,
    _direction: string,
    ref: HTMLElement,
    _delta: any,
    position: { x: number; y: number }
  ) => {
    // No longer using isResizing state
    onPositionChange({
      width: ref.style.width,
      height: ref.style.height,
      x: position.x,
      y: position.y,
    });
    
    // Play resize complete sound
    playSound('click');
  };
  
  // Store previous position before going fullscreen
  const [prevPosition, setPrevPosition] = useState<{x: number, y: number, width: number | string, height: number | string} | null>(null);
  
  // Removed automatic sound playback on mount/unmount to comply with browser autoplay policies

  // Handle fullscreen toggling
  useEffect(() => {
    if (position.isFullscreen && rndRef.current) {
      // Save current position before going fullscreen if not already saved
      if (!prevPosition) {
        setPrevPosition({
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height
        });
      }
      
      // Get the desktop element dimensions for proper fullscreen sizing
      const desktopEl = document.getElementById('desktop');
      const taskbarEl = document.getElementById('taskbar');
      
      if (desktopEl && taskbarEl) {
        const desktopRect = desktopEl.getBoundingClientRect();
        const taskbarRect = taskbarEl.getBoundingClientRect();
        
        // Calculate height to exclude the taskbar
        const adjustedHeight = desktopRect.height - taskbarRect.height;
        
        // Set window to match the desktop size but leave space for the taskbar
        rndRef.current.updatePosition({ x: 0, y: 0 });
        rndRef.current.updateSize({ 
          width: `${desktopRect.width}px`, 
          height: `${adjustedHeight}px` 
        });
      }
      
      // Play maximize sound if transitioning to fullscreen
      if (!wasFullscreenRef.current && position.isFullscreen) {
        playSound('maximize');
      }
    } else if (!position.isFullscreen && rndRef.current && prevPosition) {
      // Restore previous position when exiting fullscreen
      // Update our component's state first
      onPositionChange({
        x: prevPosition.x,
        y: prevPosition.y,
        width: prevPosition.width,
        height: prevPosition.height
      });
      
      // Then update the Rnd component directly for immediate visual effect
      rndRef.current.updatePosition({ x: prevPosition.x, y: prevPosition.y });
      
      // Restore size
      const width = typeof prevPosition.width === 'number' ? `${prevPosition.width}px` : prevPosition.width;
      const height = typeof prevPosition.height === 'number' ? `${prevPosition.height}px` : prevPosition.height;
      rndRef.current.updateSize({ width, height });
      
      // Clear the saved position to avoid weird behavior on next fullscreen toggle
      setPrevPosition(null);
      
      // Play restore sound if transitioning from fullscreen
      if (wasFullscreenRef.current && !position.isFullscreen) {
        playSound('minimize');
      }
    }
    
    // Update the ref with current fullscreen state
    wasFullscreenRef.current = position.isFullscreen;
  }, [position.isFullscreen, prevPosition, position.x, position.y, position.width, position.height, onPositionChange, playSound]);

  return (
    <Rnd
      ref={rndRef}
      style={{ 
        zIndex: position.zIndex,
        display: visible ? 'block' : 'none' // Control visibility using CSS display
      }}
      position={{ 
        x: position.isFullscreen ? 0 : position.x, 
        y: position.isFullscreen ? 0 : position.y 
      }}
      size={{ 
        width: position.isFullscreen ? '100%' : position.width, 
        height: position.isFullscreen ? '100%' : position.height 
      }}
      minWidth={350}
      minHeight={200}
      disableDragging={position.isFullscreen || isDragging}
      enableResizing={!position.isFullscreen}
      dragHandleClassName="win95-window-title-bar"
      bounds="window"
      onDragStart={() => setIsDragging(true)}
      onDragStop={handleDragStop}
      onResizeStart={() => {/* Handled by onResizeStop */}}
      onResizeStop={handleResizeStop}
      onMouseDown={onActivate}
    >
      <div 
        className={clsx(
          "w-full h-full flex flex-col rounded-sm overflow-hidden",
          "border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]",
          "bg-[#c0c0c0] shadow shadow-black",
          position.isFullscreen && "absolute top-0 left-0 right-0 bottom-0"
        )}
      >
        {/* Title bar */}
        <div 
          className={clsx(
            "h-7 px-1 flex items-center win95-window-title-bar",
            isActive ? "bg-[#000080] text-white" : "bg-[#808080] text-[#c0c0c0]"
          )}
        >
          <Image 
            src={icon} 
            alt={title} 
            width={16} 
            height={16} 
            className="h-4 w-4 mx-1" 
            priority
          />
          <h1 className="flex-1 text-left text-sm font-bold truncate">{title}</h1>
          
          {/* Window controls */}
          <div className="flex justify-end">
            {/* Minimize button */}
            <button
              className={clsx("h-5 w-5 mx-0.5 flex justify-center items-center bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]", {
                "hover:bg-[#dcdcdc]": isActive
              })}
              onClick={(e) => {
                e.stopPropagation(); // Prevent window activation when clicking on button
                playSound('minimize');
                onMinimize();
              }}
              aria-label="Minimize"
            >
              <div className="w-3 border-b-2 border-black"></div>
            </button>
            
            {/* Maximize/Restore button */}
            <button
              className={clsx("h-5 w-5 mx-0.5 flex justify-center items-center bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]", {
                "hover:bg-[#dcdcdc]": isActive
              })}
              onClick={(e) => {
                e.stopPropagation(); // Prevent window activation when clicking on button
                playSound(position.isFullscreen ? 'minimize' : 'maximize');
                onToggleFullscreen();
              }}
              aria-label={position.isFullscreen ? "Restore" : "Maximize"}
            >
              {position.isFullscreen ? (
                <div className="relative w-3 h-3">
                  <div className="absolute top-0 left-0 w-2 h-2 border border-black"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border border-black bg-[#c0c0c0]"></div>
                </div>
              ) : (
                <div className="w-3 h-3 border border-black"></div>
              )}
            </button>
            
            {/* Close button */}
            <button
              className={clsx("h-5 w-5 mx-0.5 flex justify-center items-center bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]", {
                "hover:bg-[#dcdcdc]": isActive
              })}
              onClick={(e) => {
                e.stopPropagation(); // Prevent window activation when clicking on button
                playSound('close');
                onClose();
              }}
              aria-label="Close"
            >
              <span className="text-xs font-bold">×</span>
            </button>
          </div>
        </div>
        
        {/* Window content */}
        <div className={clsx("flex-1 overflow-hidden flex flex-col", 
             position.isFullscreen ? "h-full w-full" : "")}>
          {children}
        </div>
      </div>
    </Rnd>
  );
};

export default Win95Window;
