"use client";

import { useEffect, useRef, useCallback } from 'react';

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
  // Create refs for all system sounds
  const clickSound = useRef<HTMLAudioElement | null>(null);
  const closeSound = useRef<HTMLAudioElement | null>(null);
  const dingSound = useRef<HTMLAudioElement | null>(null);
  const errorSound = useRef<HTMLAudioElement | null>(null);
  const maximizeSound = useRef<HTMLAudioElement | null>(null);
  const minimizeSound = useRef<HTMLAudioElement | null>(null);
  const openSound = useRef<HTMLAudioElement | null>(null);
  const shutdownSound = useRef<HTMLAudioElement | null>(null);

  // Create event handler to play sounds
  useEffect(() => {
    if (!enabled) return;

    // Define the event handler
    const handleSystemSound = (event: CustomEvent<SoundEvent>) => {
      const soundType = event.detail;
      
      switch (soundType) {
        case 'click':
          clickSound.current?.play();
          break;
        case 'close':
          closeSound.current?.play();
          break;
        case 'ding':
          dingSound.current?.play();
          break;
        case 'error':
          errorSound.current?.play();
          break;
        case 'maximize':
          maximizeSound.current?.play();
          break;
        case 'minimize':
          minimizeSound.current?.play();
          break;
        case 'open':
          openSound.current?.play();
          break;
        case 'shutdown':
          shutdownSound.current?.play();
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

  if (!enabled) return null;

  return (
    <>
      <audio ref={clickSound} src="/hackbook-w95/sounds/click.mp3" preload="auto" />
      <audio ref={closeSound} src="/hackbook-w95/sounds/close.mp3" preload="auto" />
      <audio ref={dingSound} src="/hackbook-w95/sounds/ding.mp3" preload="auto" />
      <audio ref={errorSound} src="/hackbook-w95/sounds/error.mp3" preload="auto" />
      <audio ref={maximizeSound} src="/hackbook-w95/sounds/maximize.mp3" preload="auto" />
      <audio ref={minimizeSound} src="/hackbook-w95/sounds/minimize.mp3" preload="auto" />
      <audio ref={openSound} src="/hackbook-w95/sounds/open.mp3" preload="auto" />
      <audio ref={shutdownSound} src="/hackbook-w95/sounds/shutdown.mp3" preload="auto" />
    </>
  );
};

export default SystemSounds;
