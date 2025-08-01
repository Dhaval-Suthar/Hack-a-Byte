"use client";

import { useEffect, useCallback } from 'react';
import audioManager from './hooks/useAudioManager';

interface SystemSoundsProps {
  enabled?: boolean;
}

export type SoundEvent = 
  | 'click' 
  | 'close' 
  | 'ding' 
  | 'error'
  | 'maximize'
  | 'minimize'
  | 'open'
  | 'shutdown';

const SystemSounds: React.FC<SystemSoundsProps> = ({ enabled = true }) => {
  // Create event handler to play sounds using AudioManager
  useEffect(() => {
    if (!enabled) return;

    // Define the event handler
    const handleSystemSound = (event: CustomEvent<SoundEvent>) => {
      const soundType = event.detail;
      
      // Use audioManager to play sounds with proper browser policy handling
      switch (soundType) {
        case 'click':
          audioManager.playSound('/hackbook-w95/sounds/click.mp3', 0.5);
          break;
        case 'close':
          audioManager.playSound('/hackbook-w95/sounds/close.mp3', 0.5);
          break;
        case 'ding':
          audioManager.playSound('/hackbook-w95/sounds/ding.mp3', 0.7);
          break;
        case 'error':
          audioManager.playSound('/hackbook-w95/sounds/error.mp3', 0.6);
          break;
        case 'maximize':
          audioManager.playSound('/hackbook-w95/sounds/maximize.mp3', 0.5);
          break;
        case 'minimize':
          audioManager.playSound('/hackbook-w95/sounds/minimize.mp3', 0.5);
          break;
        case 'open':
          audioManager.playSound('/hackbook-w95/sounds/open.mp3', 0.5);
          break;
        case 'shutdown':
          audioManager.playSound('/hackbook-w95/sounds/shutdown.mp3', 0.7);
          break;
      }
    };

    // Register event listener
    window.addEventListener('win95sound', handleSystemSound as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('win95sound', handleSystemSound as EventListener);
    };
  }, [enabled]);

  // Helper function to play a system sound programmatically
  const playSystemSound = useCallback((sound: SoundEvent) => {
    if (!enabled) return;
    
    const event = new CustomEvent('win95sound', { detail: sound });
    window.dispatchEvent(event);
  }, [enabled]);

  // Expose the play function to the global window object
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as typeof window & { playWin95Sound: typeof playSystemSound }).playWin95Sound = playSystemSound;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as typeof window & { playWin95Sound?: typeof playSystemSound }).playWin95Sound;
      }
    };
  }, [playSystemSound]);

  // Preload sounds with AudioManager after component mounts
  useEffect(() => {
    if (enabled) {
      const soundPaths = [
        '/hackbook-w95/sounds/click.mp3',
        '/hackbook-w95/sounds/close.mp3',
        '/hackbook-w95/sounds/ding.mp3',
        '/hackbook-w95/sounds/error.mp3',
        '/hackbook-w95/sounds/maximize.mp3',
        '/hackbook-w95/sounds/minimize.mp3',
        '/hackbook-w95/sounds/open.mp3',
        '/hackbook-w95/sounds/shutdown.mp3'
      ];
      
      // Preload after a brief delay to ensure user interaction is detected
      setTimeout(() => {
        audioManager.preloadSounds(soundPaths);
      }, 1000);
    }
  }, [enabled]);

  // No need to render audio elements - AudioManager handles everything
  return null;
};

export default SystemSounds;
