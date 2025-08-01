"use client";

import { useState } from 'react';

export interface WindowPosition {
  x: number;
  y: number;
  width: number | string;
  height: number | string;
  isFullscreen: boolean;
  zIndex: number;
}

export interface WindowState {
  id: string;
  position: WindowPosition;
  isActive: boolean;
  isMinimized: boolean;
}

interface UseWindowManagerProps {
  defaultZIndex?: number;
  onWindowActivate?: (id: string) => void;
}

export default function useWindowManager({ defaultZIndex = 100, onWindowActivate }: UseWindowManagerProps = {}) {
  const [windows, setWindows] = useState<Record<string, WindowState>>({});
  const [highestZIndex, setHighestZIndex] = useState(defaultZIndex);
  
  // Initialize a window
  const registerWindow = (id: string, initialPosition?: Partial<WindowPosition>) => {
    setWindows(prev => {
      // Skip if already registered
      if (prev[id]) return prev;
      
      const newZIndex = highestZIndex + 1;
      setHighestZIndex(newZIndex);
      
      return {
        ...prev,
        [id]: {
          id,
          position: {
            x: 80 + (Object.keys(prev).length * 20),  // Cascade windows
            y: 40 + (Object.keys(prev).length * 20),
            width: '80vw',
            height: '80vh',
            isFullscreen: false,
            zIndex: newZIndex,
            ...initialPosition
          },
          isActive: true,
          isMinimized: false
        }
      };
    });
  };
  
  // Update window position
  const updateWindowPosition = (id: string, position: Partial<WindowPosition>) => {
    setWindows(prev => {
      if (!prev[id]) return prev;
      
      return {
        ...prev,
        [id]: {
          ...prev[id],
          position: {
            ...prev[id].position,
            ...position
          }
        }
      };
    });
  };
  
  // Toggle window fullscreen
  const toggleFullscreen = (id: string) => {
    setWindows(prev => {
      if (!prev[id]) return prev;
      
      // Get desktop element dimensions for proper fullscreen calculation
      const desktopEl = document.getElementById('desktop');
      const newIsFullscreen = !prev[id].position.isFullscreen;
      
      // Calculate position for fullscreen mode
      let newPosition = { ...prev[id].position };
      
      if (newIsFullscreen && desktopEl) {
        // For fullscreen, set x/y to 0 to align with the top-left corner of desktop
        newPosition = {
          ...newPosition,
          isFullscreen: true,
        };
      } else {
        newPosition = {
          ...newPosition,
          isFullscreen: false
        };
      }
      
      return {
        ...prev,
        [id]: {
          ...prev[id],
          position: newPosition
        }
      };
    });
    
    // Play sound for fullscreen toggle
    const event = new CustomEvent('win95sound', { 
      detail: windows[id]?.position.isFullscreen ? 'minimize' : 'maximize' 
    });
    window.dispatchEvent(event);
  };
  
  // Close window
  const closeWindow = (id: string) => {
    setWindows(prev => {
      const newWindows = { ...prev };
      delete newWindows[id];
      return newWindows;
    });
    
    // Play close sound
    const event = new CustomEvent('win95sound', { detail: 'close' });
    window.dispatchEvent(event);
  };
  
  // Activate window (bring to front)
  const activateWindow = (id: string) => {
    if (!windows[id]) return;
    
    const newZIndex = highestZIndex + 1;
    setHighestZIndex(newZIndex);
    
    setWindows(prev => {
      return Object.keys(prev).reduce((acc, windowId) => {
        // Only modify active state for the window being activated, 
        // leave other windows in their current active/inactive state
        const isTargetWindow = windowId === id;
        
        acc[windowId] = {
          ...prev[windowId],
          isActive: isTargetWindow ? true : prev[windowId].isActive,
          isMinimized: isTargetWindow ? false : prev[windowId].isMinimized, // Un-minimize if activating
          position: {
            ...prev[windowId].position,
            zIndex: isTargetWindow ? newZIndex : prev[windowId].position.zIndex
          }
        };
        return acc;
      }, {} as Record<string, WindowState>);
    });
    
    if (onWindowActivate) {
      onWindowActivate(id);
    }
  };
  
  // Minimize window
  const minimizeWindow = (id: string) => {
    setWindows(prev => {
      if (!prev[id]) return prev;
      
      return {
        ...prev,
        [id]: {
          ...prev[id],
          isActive: false,
          isMinimized: true // Mark the window as minimized
        }
      };
    });
    
    // Play minimize sound
    const event = new CustomEvent('win95sound', { detail: 'minimize' });
    window.dispatchEvent(event);
  };
  
  // Get active window
  const getActiveWindow = () => {
    return Object.values(windows).find(window => window.isActive)?.id || null;
  };
  
  // Get window state
  const getWindowState = (id: string) => {
    return windows[id] || null;
  };
  
  return {
    windows,
    registerWindow,
    updateWindowPosition,
    toggleFullscreen,
    closeWindow,
    activateWindow,
    minimizeWindow,
    getActiveWindow,
    getWindowState
  };
}
